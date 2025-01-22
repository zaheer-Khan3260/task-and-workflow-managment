import { ApiError } from './ApiError.js';
import { hasPermission } from '../dependencies/hasPermission.js';

const authorizationHandler = (resolver, middlewares = [], permission) => {
	return async (parent, args, context, info) => {
		try {
			const { user } = context;
			if (!user) {
				throw new ApiError(401, 'Unauthorized: Please log in');
			}
			if (permission) {
				hasPermission(user.role, permission);
			}

			for (const middleware of middlewares) {
				await middleware(parent, args, context, info);
			}
			return resolver(parent, args, context, info);
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			} else {
				throw new ApiError(500, 'An unexpected error occurred');
			}
		}
	};
};

export default authorizationHandler;
