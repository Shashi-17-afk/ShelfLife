import mongoose from 'mongoose';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Librarian } from '../src/models/Librarian.js';
import { Book } from '../src/models/Book.js';
import { Member } from '../src/models/Member.js';
import { BorrowRecord } from '../src/models/BorrowRecord.js';
import bcrypt from 'bcryptjs';

console.log('[Phase 5 Test] Starting Borrow / Return / History API Verification...');

let mongoServer;

const runTests = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Phase 5 Test] Connected to in-memory test database');

    // 1. Seed Librarian & Login to get token
    const demoPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    await Librarian.create({
      name: 'Demo Librarian',
      email: 'admin@shelflife.local',
      passwordHash,
    });

    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shelflife.local', password: demoPassword });

    const token = loginRes.body.token;
    console.log('[Phase 5 Test] Logged in and obtained JWT token');

    // 2. Create Book with totalCopies: 1, availableCopies: 1
    const bookRes = await supertest(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        ISBN: '9780743273565',
        genre: 'Fiction',
        totalCopies: 1,
        availableCopies: 1,
      });

    const book = bookRes.body.data;
    console.log(`[Phase 5 Test] Created book '${book.title}' with totalCopies: 1, availableCopies: ${book.availableCopies}`);

    // 3. Create Member
    const memberRes = await supertest(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        membershipId: 'MEM-2026-001',
      });

    const member = memberRes.body.data;
    console.log(`[Phase 5 Test] Created member '${member.name}' with ID: ${member._id}`);

    // 4. Issue Book (POST /api/borrow)
    const borrowRes = await supertest(app)
      .post('/api/borrow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookId: book._id,
        memberId: member._id,
      });

    if (borrowRes.status !== 201) {
      throw new Error(`Failed to borrow book: ${JSON.stringify(borrowRes.body)}`);
    }

    const borrowRecord = borrowRes.body.data;
    console.log(`[Phase 5 Test] Successfully issued book. Borrow record ID: ${borrowRecord._id}, status: ${borrowRecord.status}`);

    // Verify book's available copies is now 0
    const bookAfterBorrow = await Book.findById(book._id);
    if (bookAfterBorrow.availableCopies !== 0) {
      throw new Error(`Expected availableCopies to be 0, but got ${bookAfterBorrow.availableCopies}`);
    }
    console.log('[Phase 5 Test] Verified availableCopies atomically decremented to 0');

    // 5. Try issuing again when availableCopies is 0 -> MUST FAIL
    const borrowAgainRes = await supertest(app)
      .post('/api/borrow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookId: book._id,
        memberId: member._id,
      });

    if (borrowAgainRes.status !== 409) {
      throw new Error(`Expected 409 Conflict when borrowing with 0 copies, got ${borrowAgainRes.status}`);
    }
    console.log('[Phase 5 Test] Confirmed second borrow failed with 409: ', borrowAgainRes.body.message);

    // Verify availableCopies is still 0
    const bookStillZero = await Book.findById(book._id);
    if (bookStillZero.availableCopies !== 0) {
      throw new Error(`Expected availableCopies to remain 0, got ${bookStillZero.availableCopies}`);
    }

    // 6. Fetch Member History (GET /api/members/:memberId/history)
    const historyRes = await supertest(app)
      .get(`/api/members/${member._id}/history`);

    if (historyRes.status !== 200 || historyRes.body.data.history.length !== 1) {
      throw new Error(`Expected 1 history record, got ${JSON.stringify(historyRes.body)}`);
    }
    console.log('[Phase 5 Test] Member history verified: 1 active record found');

    // 7. Return the book (POST /api/return/:borrowId)
    const returnRes = await supertest(app)
      .post(`/api/return/${borrowRecord._id}`)
      .set('Authorization', `Bearer ${token}`);

    if (returnRes.status !== 200) {
      throw new Error(`Failed to return book: ${JSON.stringify(returnRes.body)}`);
    }

    console.log('[Phase 5 Test] Successfully returned book');

    // Verify book's available copies is now 1
    const bookAfterReturn = await Book.findById(book._id);
    if (bookAfterReturn.availableCopies !== 1) {
      throw new Error(`Expected availableCopies to be restored to 1, but got ${bookAfterReturn.availableCopies}`);
    }
    console.log('[Phase 5 Test] Verified availableCopies incremented back to 1');

    // 8. Attempt double return -> MUST FAIL with 409
    const returnAgainRes = await supertest(app)
      .post(`/api/return/${borrowRecord._id}`)
      .set('Authorization', `Bearer ${token}`);

    if (returnAgainRes.status !== 409) {
      throw new Error(`Expected 409 on duplicate return attempt, got ${returnAgainRes.status}`);
    }
    console.log('[Phase 5 Test] Confirmed double return prevented with 409: ', returnAgainRes.body.message);

    // Verify book available copies is STILL 1 (not double-incremented to 2)
    const bookStillOne = await Book.findById(book._id);
    if (bookStillOne.availableCopies !== 1) {
      throw new Error(`Expected availableCopies to remain 1, but got ${bookStillOne.availableCopies}`);
    }
    console.log('[Phase 5 Test] Verified double-increment was prevented: availableCopies is exactly 1');

    // 9. Verify Overdue representation
    // Create an artificial past borrow record that is unreturned
    const pastDueDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const pastIssueDate = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000); // 21 days ago
    await BorrowRecord.create({
      book: book._id,
      member: member._id,
      issueDate: pastIssueDate,
      dueDate: pastDueDate,
      returnDate: null,
      status: 'issued', // stored in DB as issued
    });

    const overdueHistoryRes = await supertest(app)
      .get(`/api/members/${member._id}/history`);

    const overdueRecord = overdueHistoryRes.body.data.history.find(
      (r) => r.dueDate === pastDueDate.toISOString() || !r.returnDate
    );

    if (!overdueRecord || overdueRecord.status !== 'overdue') {
      throw new Error(`Expected unreturned past due record to be computed as 'overdue', got: ${JSON.stringify(overdueRecord)}`);
    }
    console.log('[Phase 5 Test] Verified unreturned past-due record dynamically represented as overdue');

    // 10. Test unauthorized access
    const unauthBorrow = await supertest(app)
      .post('/api/borrow')
      .send({ bookId: book._id, memberId: member._id });
    if (unauthBorrow.status !== 401) {
      throw new Error('Expected 401 for unauthorized borrow');
    }

    const unauthReturn = await supertest(app)
      .post(`/api/return/${borrowRecord._id}`);
    if (unauthReturn.status !== 401) {
      throw new Error('Expected 401 for unauthorized return');
    }
    console.log('[Phase 5 Test] Confirmed authentication required for borrow and return endpoints');

    console.log('\n[Phase 5 Test] ALL TESTS PASSED SUCCESSFULLY! ✅');
    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(0);
  } catch (error) {
    console.error('\n[Phase 5 Test ERROR]:', error.message);
    if (mongoServer) await mongoServer.stop();
    process.exit(1);
  }
};

runTests();
