import { Router } from 'express';
import {
	loginUser,
	create_User,
	getAllUsers,
	getRankedOfTeamMemberAndTeamLead,
} from './controllers/user.controller.js';
import loginLimiter from './middleware/loginLimiter.js';
import authMiddleware from './middleware/auth.middleware.js';
import errorHandler from './middleware/errorHandler.js';
const router = Router();

router.post('/login', loginLimiter, loginUser);
router.post('/create', create_User);
router.get('/', authMiddleware(), getAllUsers);
router.get('/ranked/:role', authMiddleware(), getRankedOfTeamMemberAndTeamLead);
router.use(errorHandler);

export default router;
