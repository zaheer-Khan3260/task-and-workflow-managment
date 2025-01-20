import { Router } from 'express';
import {
	loginUser,
	create_User,
	getAllUsers,
} from './controllers/user.controller.js';
import loginLimiter from './middleware/loginLimiter.js';
import authMiddleware from './middleware/auth.middleware.js';

const router = Router();

router.post('/login', loginLimiter, loginUser);
router.post('/create', create_User);
router.get('/', authMiddleware(), getAllUsers);

export default router;
