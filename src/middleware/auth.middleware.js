import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js'; // Ensure to import the User model
import { ApiError } from '../utils/ApiError.js';

const authMiddleware = () => {
	return async (req, res, next) => {
		const token =
			req.cookies?.accessToken ||
			req.header('Authorization')?.replace('Bearer ', '');

		if (!token) {
			return res
				.status(401)
				.json({ message: 'Unauthorized: Token is missing' });
		}

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			req.user = decoded;

			const existingUser = await User.findById(decoded._id);
			if (!existingUser) {
				throw new ApiError(401, 'Unauthorized: User not found');
			}

			next();
		} catch (err) {
			console.error('Token verification failed:', err);
			return res
				.status(401)
				.json({ message: 'Invalid or expired token' });
		}
	};
};

export default authMiddleware;
