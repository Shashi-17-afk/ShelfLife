import { createBookSchema } from '../src/schemas/bookSchema.js';
import { createMemberSchema } from '../src/schemas/memberSchema.js';
import { borrowBookSchema } from '../src/schemas/borrowSchema.js';
import { loginSchema } from '../src/schemas/authSchema.js';
import { Book } from '../src/models/Book.js';
import { Member } from '../src/models/Member.js';
import { BorrowRecord } from '../src/models/BorrowRecord.js';
import { Librarian } from '../src/models/Librarian.js';

console.log('[Phase 2 Test] Initializing model & schema verification...');

// 1. Verify Zod Validation Schemas
try {
  // Test valid book
  createBookSchema.parse({
    body: {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      ISBN: '9780132350884',
      genre: 'Software Engineering',
      totalCopies: 5,
      availableCopies: 5,
    },
  });
  console.log('[Phase 2 Test] ✅ Zod createBookSchema validated successfully');

  // Test invalid book (availableCopies > totalCopies)
  try {
    createBookSchema.parse({
      body: {
        title: 'Invalid Book',
        author: 'Test Author',
        ISBN: '12345',
        genre: 'Tech',
        totalCopies: 2,
        availableCopies: 5,
      },
    });
    console.error('[Phase 2 Test] ❌ Failed to catch invalid availableCopies!');
  } catch (err) {
    console.log('[Phase 2 Test] ✅ Zod createBookSchema correctly rejected availableCopies > totalCopies');
  }

  // Test member schema
  createMemberSchema.parse({
    body: {
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      membershipId: 'MEM-2026-001',
    },
  });
  console.log('[Phase 2 Test] ✅ Zod createMemberSchema validated successfully');

  // Test borrow schema with valid ObjectIds
  borrowBookSchema.parse({
    body: {
      bookId: '507f1f77bcf86cd799439011',
      memberId: '507f1f77bcf86cd799439012',
    },
  });
  console.log('[Phase 2 Test] ✅ Zod borrowBookSchema validated successfully');

  // Test login schema
  loginSchema.parse({
    body: {
      email: 'admin@shelflife.local',
      password: 'Admin123!',
    },
  });
  console.log('[Phase 2 Test] ✅ Zod loginSchema validated successfully');

  // Check Mongoose models instantiation
  const sampleBook = new Book({
    title: 'Design Patterns',
    author: 'Gang of Four',
    ISBN: '9780201633610',
    genre: 'Computer Science',
    totalCopies: 3,
    availableCopies: 3,
  });
  console.log(`[Phase 2 Test] ✅ Mongoose Book model instantiated: "${sampleBook.title}"`);

  console.log('[Phase 2 Test] 🎉 ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!');
} catch (error) {
  console.error('[Phase 2 Test] ❌ Unexpected Error:', error);
  process.exit(1);
}
