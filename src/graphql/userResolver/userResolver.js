import { User } from '../../models/user.model.js';

export const userResolvers = {
	Query: {
		users: async () => {
			return await User.find();
		},
	},

	Mutation: {
		createUser: async (_, { name, email, password }) => {
			const newUser = new User({ name, email, password });
			await newUser.save();
			return newUser;
		},
	},
};
