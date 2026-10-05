import { Router } from 'express';
import { createMember, getMembers, getMemberHistory } from '../controllers/memberController.js';
import { validate } from '../middleware/validate.js';
import { createMemberSchema } from '../schemas/memberSchema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/members (Helper endpoint for frontend member dropdown selection)
router.get('/', getMembers);

// POST /api/members (Authenticated librarian endpoint)
router.post('/', requireAuth, validate(createMemberSchema), createMember);

// GET /api/members/:memberId/history (Member borrowing history with dynamic overdue computation)
router.get('/:memberId/history', getMemberHistory);

export default router;
