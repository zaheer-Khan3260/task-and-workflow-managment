import rateLimit from 'express-rate-limit';

const createApiLimiter = () => {
	return rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 100,
		message:
			'Too many requests from this IP, please try again after 15 minutes',
		standardHeaders: true,
		legacyHeaders: false,
	});
};

export default createApiLimiter;
