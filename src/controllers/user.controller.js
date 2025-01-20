import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiReponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateAccessAndRefereshTokens } from '../dependencies/generateAccessAndRefreshToken.js';
import { logAudit } from '../utils/auditLogger.js';

export const create_User = asyncHandler(async (req, res) => {
	const { name, email, password, role, status } = req.body;
	if ([name, email, role, password].some((field) => field?.trim() === '')) {
		throw new ApiError(400, 'All Feilds are required');
	}
	const existedUserName = await User.findOne({ email });
	if (existedUserName) throw new ApiError(409, 'user Is already exist');
	const user = await User.create({
		name,
		email,
		password,
		role,
		status: status ? status : 'active',
	});

	const createdUser = await User.findById(user._id).select(
		'-password -refreshToken'
	);

	if (!createdUser) throw new ApiError(500, 'Failed to create a new User');

	logAudit(
		`Tag: User created || user_id: ${createdUser._id} || user_name: ${createdUser.name} || role: ${createdUser.role}`
	);

	res.status(200).json(
		new ApiResponse(200, createdUser, 'User created successfully')
	);
});

export const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	if (!email) {
		throw new ApiError(400, 'Email required');
	}

	const user = await User.findOne({ email });

	if (!user) res.status(400).json(new ApiResponse(400, 'User Not found'));

	const correctPassword = await user.isPasswordCorrect(password);
	if (!correctPassword) throw new ApiError(400, 'Password is incorrect');

	const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
		user._id
	);

	const loggedInUser = await User.findById(user._id).select('-password');
	const option = {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
	};

	logAudit(
		`Tag: User logged in || user_id: ${loggedInUser._id} || user_name: ${loggedInUser.name} || role: ${loggedInUser.role}`
	);

	return res
		.status(200)
		.cookie('accessToken', accessToken, option)
		.cookie('refreshToken', refreshToken, option)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				'User logged in Successfully'
			)
		);
});

export const getAllUsers = asyncHandler(async (req, res) => {
	const users = await User.find()
		.select('-password -refreshToken')
		.populate('assignedTasks');
	if (!users) throw new ApiError(404, 'No users found');

	logAudit(`Tag: Fetched Users || user_count: ${users.length}`);

	res.status(200).json(
		new ApiResponse(200, users, 'All users fetched successfully')
	);
});
