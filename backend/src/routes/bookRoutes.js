import { Router } from 'express';
import { createBook, getBooks } from '../controllers/bookController.js';
import { validate } from '../middleware/validate.js';
import { createBookSchema, bookQuerySchema } from '../schemas/bookSchema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/books (Public or Authenticated reading of catalog)
router.get('/', validate(bookQuerySchema), getBooks);

// POST /api/books (Authenticated librarian endpoint)
router.post('/', requireAuth, validate(createBookSchema), createBook);

export default router;
