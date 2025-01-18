import { Router } from 'express';
import { loginUser, create_User } from './controllers/user.controller.js';

const router = Router();

router.post('/login', loginUser);
router.post('/create', create_User);

export default router;
