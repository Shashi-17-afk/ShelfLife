import { Router } from 'express';
import { borrowBook } from '../controllers/borrowController.js';
import { validate } from '../middleware/validate.js';
import { borrowBookSchema } from '../schemas/borrowSchema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/borrow (Authenticated librarian endpoint)
router.post('/', requireAuth, validate(borrowBookSchema), borrowBook);

export default router;
