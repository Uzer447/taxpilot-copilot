import { Router } from 'express';
import { signup, login, me } from './authController.js';
import { requireAuth } from './authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me);

export default router;
