import { ApiResponse } from '../utils/ApiReponse.js';
import { userService } from '../Service/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create_User = asyncHandler(async (req, res) => {
	const { name, email, password, role, status } = req.body;

	const user = await userService.createUser({
		name,
		email,
		password,
		role,
		status,
	});

	res.status(200).json(
		new ApiResponse(200, user, 'User created successfully')
	);
});

export const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	const user = await userService.loginUser({ email, password });
	const cookieOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
	};

	res.status(200)
		.cookie('accessToken', user.accessToken, cookieOptions)
		.cookie('refreshToken', user.refreshToken, cookieOptions)
		.json(new ApiResponse(200, user, 'User logged in successfully'));
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
	try {
		const users = await userService.getAllUsers();

		res.status(200).json(
			new ApiResponse(200, users, 'All users fetched successfully')
		);
	} catch (error) {
		console.log(error);
	}
});

export const getRankedOfTeamMemberAndTeamLead = asyncHandler(
	async (req, res, next) => {
		const { role } = req.params;

		const users = await userService.getRankedOfTeamMemberAndTeamLead(role);
		res.status(200).json(
			new ApiResponse(200, users, 'Ranked users fetched successfully')
		);
	}
);
