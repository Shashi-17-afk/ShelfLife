import { Router } from 'express';
import { returnBook } from '../controllers/borrowController.js';
import { validate } from '../middleware/validate.js';
import { returnBookSchema } from '../schemas/borrowSchema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/return/:borrowId or POST /api/return (Authenticated librarian endpoint)
router.post('/:borrowId?', requireAuth, validate(returnBookSchema), returnBook);

export default router;
