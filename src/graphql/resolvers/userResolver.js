import { User } from '../../models/user.model.js';
import { Task } from '../../models/task.model.js';

export const userResolvers = {
	Query: {
		users: async () => {
			return await User.find();
		},
	},

	Mutation: {
		createUser: async (_, { name, email, password, role, status }) => {
			if (
				[name, email, role, password].some(
					(field) => field?.trim() === ''
				)
			) {
				throw new ApiError(400, 'All Feilds are required');
			}
			const existedUserName = await User.findOne({ username });
			if (existedUserName)
				throw new ApiError(409, 'user Is already exist');
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

			if (!createdUser)
				throw new ApiError(500, 'Failed to create a new User');

			return createdUser;
		},
	},

	User: {
		assignedTasks: async (parent) => {
			try {
				const tasks = await Task.find({ assignedUsers: parent.id });
				return tasks;
			} catch (error) {
				console.error('Error fetching assigned tasks:', error);
				throw new Error('Failed to fetch assigned tasks.');
			}
		},
	},
};
