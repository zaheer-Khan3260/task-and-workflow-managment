import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 2, // Limit each IP to 10 login attempts per windowMs
	message: 'Too many login attempts, please try again later',
});

export default loginLimiter;
