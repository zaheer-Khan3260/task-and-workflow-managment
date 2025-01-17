import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from './userSchema/userSchema.js';
import { userResolvers } from './userResolver/userResolver.js';

export const schema = makeExecutableSchema({
	typeDefs: [userTypeDefs],
	resolvers: [userResolvers],
});
