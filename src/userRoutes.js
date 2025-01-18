import { Router } from 'express';
import {
	loginUser,
	create_User,
	getAllUsers,
} from './controllers/user.controller.js';

const router = Router();

router.post('/login', loginUser);
router.post('/create', create_User);
router.get('/', getAllUsers);

export default router;
