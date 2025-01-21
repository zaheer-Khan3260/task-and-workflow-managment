import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

import { generateAccessAndRefereshTokens } from '../dependencies/generateAccessAndRefreshToken.js';
import { logAudit } from '../utils/auditLogger.js';

class UserService {
	createUser = async (userData) => {
		const { name, email, password, role, status } = userData;

		if ([name, email, role, password].some((field) => !field?.trim())) {
			throw new ApiError(400, 'All fields are required');
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) throw new ApiError(409, 'User already exists');

		const user = await User.create({
			name,
			email,
			password,
			role,
			status: status || 'active',
		});

		const createdUser = await User.findById(user._id).select(
			'-password -refreshToken'
		);

		if (!createdUser)
			throw new ApiError(500, 'Failed to create a new user');

		logAudit(
			`Tag: User created || user_id: ${createdUser._id} || user_name: ${createdUser.name} || role: ${createdUser.role}`
		);

		return createdUser;
	};

	loginUser = async (userData) => {
		const { email, password } = userData;

		if (!email || !password) {
			throw new ApiError(400, 'Email and password are required');
		}

		const user = await User.findOne({ email });
		if (!user) throw new ApiError(404, 'User not found');

		const correctPassword = await user.isPasswordCorrect(password);
		if (!correctPassword) throw new ApiError(400, 'Password is incorrect');

		const { accessToken, refreshToken } =
			await generateAccessAndRefereshTokens(user._id);

		const loggedInUser = await User.findById(user._id).select('-password');

		logAudit(
			`Tag: User logged in || user_id: ${loggedInUser._id} || user_name: ${loggedInUser.name} || role: ${loggedInUser.role}`
		);

		return { loggedInUser, accessToken, refreshToken };
	};

	getAllUsers = async () => {
		const users = await User.find()
			.select('-password -refreshToken')
			.populate('assignedTasks');

		if (!users || users.length === 0)
			throw new ApiError(404, 'No users found');

		logAudit(`Tag: Fetched Users || user_count: ${users.length}`);

		return users;
	};
}

export const userService = new UserService();
