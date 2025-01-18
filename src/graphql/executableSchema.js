import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from './schema/userSchema.js';
import { taskTypeDefs } from './schema/taskSchema.js';
import { userResolvers } from './resolvers/userResolver.js';
import { taskResolvers } from './resolvers/taskResolver.js';

export const schema = makeExecutableSchema({
	typeDefs: [userTypeDefs, taskTypeDefs],
	resolvers: [userResolvers, taskResolvers],
});
