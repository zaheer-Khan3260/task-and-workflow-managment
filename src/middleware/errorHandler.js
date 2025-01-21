import { ApiError } from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
	// If it's an ApiError, use its properties
	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({
			success: err.success,
			message: err.message,
			errors: err.errors,
			stack:
				process.env.NODE_ENV === 'production' ? undefined : err.stack,
		});
	}

	// For other errors, return a generic 500 error response
	return res.status(500).json({
		success: false,
		message: 'Internal Server Error',
		errors: [],
		stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
	});
};

export default errorHandler;
