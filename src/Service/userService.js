import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

import { generateAccessAndRefereshTokens } from '../dependencies/generateAccessAndRefreshToken.js';
import { logAudit } from '../utils/auditLogger.js';
import { taskResolvers } from '../graphql/resolvers/taskResolver.js';

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

	getRankedOfTeamMemberAndTeamLead = async (role) => {
		if (role !== 'team_member' && role !== 'team_lead') {
			throw new ApiError(400, 'Invalid role');
		}

		const pipeline = [
			{ $match: { role: role } },
			{
				$lookup: {
					from: 'tasks',
					localField: 'assignedTasks',
					foreignField: '_id',
					as: 'taskDetails',
				},
			},
		];

		const users = await User.aggregate(pipeline);
		let rankeHashMap = {};

		for (const user of users) {
			let points = 0;
			if (user.taskDetails.length > 0) {
				user.taskDetails.forEach((task) => {
					if (task.status.currentStatus === 'Done') {
						points += 3;
					} else if (task.status.currentStatus === 'In Progress') {
						points += 2;
					} else if (task.status.currentStatus === 'To Do') {
						points += 1;
					}
				});
			}
			rankeHashMap[user._id] = { user, points };
		}

		const rankedUsers = Object.values(rankeHashMap)
			.sort((a, b) => b.points - a.points)
			.map((item) => item.user);

		return rankedUsers;
	};
}

export const userService = new UserService();
