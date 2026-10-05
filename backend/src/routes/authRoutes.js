import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schemas/authSchema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me (Protected route verification)
router.get('/me', requireAuth, getProfile);

export default router;
