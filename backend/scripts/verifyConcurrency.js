import mongoose from 'mongoose';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Librarian } from '../src/models/Librarian.js';
import { Book } from '../src/models/Book.js';
import { Member } from '../src/models/Member.js';
import { BorrowRecord } from '../src/models/BorrowRecord.js';
import bcrypt from 'bcryptjs';

console.log('====================================================');
console.log('  SHELFLIFE CONCURRENCY & RACE-CONDITION TEST SUITE');
console.log('====================================================\n');

let mongoServer;

const runConcurrencyVerification = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] Connected to in-memory test database');

    // 1. Setup Librarian & Token
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await Librarian.create({
      name: 'Concurrency Tester',
      email: 'tester@shelflife.local',
      passwordHash,
    });

    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'tester@shelflife.local', password: 'Admin123!' });
    const token = loginRes.body.token;

    // 2. Setup Book with exactly 1 available copy
    const book = await Book.create({
      title: 'High Performance Browser Networking',
      author: 'Ilya Grigorik',
      ISBN: '9781449344047',
      genre: 'Technology',
      totalCopies: 1,
      availableCopies: 1,
    });
    console.log(`[Setup] Created Book '${book.title}' with totalCopies: 1, availableCopies: 1`);

    // 3. Create 10 distinct members competing for the 1 copy
    const memberCount = 10;
    const members = [];
    for (let i = 1; i <= memberCount; i++) {
      const m = await Member.create({
        name: `Member ${i}`,
        email: `member${i}@campus.edu`,
        membershipId: `CAMPUS-${1000 + i}`,
      });
      members.push(m);
    }
    console.log(`[Setup] Created ${memberCount} competing library members\n`);

    // 4. TEST 1: Simultaneous Borrow Requests (Last-Copy Race Condition)
    console.log(`[Test 1] Dispatching ${memberCount} simultaneous borrow requests for the single available copy...`);

    const borrowRequests = members.map((member) =>
      supertest(app)
        .post('/api/borrow')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookId: book._id.toString(),
          memberId: member._id.toString(),
        })
    );

    const borrowResponses = await Promise.all(borrowRequests);

    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;
    let successfulBorrowRecordId = null;

    borrowResponses.forEach((res) => {
      if (res.status === 201) {
        successCount++;
        successfulBorrowRecordId = res.body.data._id;
      } else if (res.status === 409) {
        conflictCount++;
      } else {
        otherCount++;
        console.error(`Unexpected response status: ${res.status}`, res.body);
      }
    });

    console.log(`  -> Successful Borrows (HTTP 201): ${successCount}`);
    console.log(`  -> Rejected Borrows (HTTP 409):   ${conflictCount}`);
    console.log(`  -> Other/Failed Responses:       ${otherCount}`);

    // Verify invariants
    if (successCount !== 1) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Expected exactly 1 successful borrow, but got ${successCount}`);
    }
    if (conflictCount !== memberCount - 1) {
      throw new Error(`Expected ${memberCount - 1} rejections with 409, but got ${conflictCount}`);
    }

    const bookAfterBorrows = await Book.findById(book._id);
    console.log(`  -> Book availableCopies in DB:    ${bookAfterBorrows.availableCopies}`);
    if (bookAfterBorrows.availableCopies !== 0) {
      throw new Error(`Expected availableCopies to be 0, but got ${bookAfterBorrows.availableCopies}`);
    }

    const borrowRecordsInDB = await BorrowRecord.countDocuments({ book: book._id });
    console.log(`  -> Total Borrow Records in DB:    ${borrowRecordsInDB}`);
    if (borrowRecordsInDB !== 1) {
      throw new Error(`Expected exactly 1 BorrowRecord in DB, but found ${borrowRecordsInDB}`);
    }

    console.log('✅ [Test 1 Passed] Last-copy concurrency protected! Exactly 1 requester acquired the copy.\n');

    // 5. TEST 2: Simultaneous Return Requests (Double-Return Race Condition)
    console.log(`[Test 2] Dispatching 5 simultaneous return requests for the same borrow record (${successfulBorrowRecordId})...`);

    const returnRequests = Array.from({ length: 5 }).map(() =>
      supertest(app)
        .post(`/api/return/${successfulBorrowRecordId}`)
        .set('Authorization', `Bearer ${token}`)
    );

    const returnResponses = await Promise.all(returnRequests);

    let returnSuccessCount = 0;
    let returnConflictCount = 0;

    returnResponses.forEach((res) => {
      if (res.status === 200) {
        returnSuccessCount++;
      } else if (res.status === 409) {
        returnConflictCount++;
      }
    });

    console.log(`  -> Successful Returns (HTTP 200): ${returnSuccessCount}`);
    console.log(`  -> Rejected Returns (HTTP 409):   ${returnConflictCount}`);

    if (returnSuccessCount !== 1) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Expected exactly 1 return to succeed, got ${returnSuccessCount}`);
    }
    if (returnConflictCount !== 4) {
      throw new Error(`Expected 4 rejections with 409, got ${returnConflictCount}`);
    }

    const bookAfterReturn = await Book.findById(book._id);
    console.log(`  -> Book availableCopies in DB:    ${bookAfterReturn.availableCopies}`);
    if (bookAfterReturn.availableCopies !== 1) {
      throw new Error(`Double-increment detected! Expected availableCopies to be 1, got ${bookAfterReturn.availableCopies}`);
    }

    const recordInDB = await BorrowRecord.findById(successfulBorrowRecordId);
    if (recordInDB.status !== 'returned' || !recordInDB.returnDate) {
      throw new Error('BorrowRecord was not properly marked as returned');
    }

    console.log('✅ [Test 2 Passed] Double-return concurrency protected! Inventory incremented exactly once.\n');

    console.log('====================================================');
    console.log('  ALL CONCURRENCY INVARIANTS VERIFIED SUCCESSFULLY! ');
    console.log('====================================================');

    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [Concurrency Test FAILED]:', err.message);
    if (mongoServer) await mongoServer.stop();
    process.exit(1);
  }
};

runConcurrencyVerification();
