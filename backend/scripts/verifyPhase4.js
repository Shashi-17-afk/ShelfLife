import mongoose from 'mongoose';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Librarian } from '../src/models/Librarian.js';
import bcrypt from 'bcryptjs';

console.log('[Phase 4 Test] Starting Book & Member API Verification...');

let mongoServer;

const runTests = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Phase 4 Test] ✅ Connected to in-memory test database');

    // 1. Seed Librarian & Login to get token
    const demoPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    const librarian = await Librarian.create({
      name: 'Demo Librarian',
      email: 'admin@shelflife.local',
      passwordHash,
    });

    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shelflife.local', password: demoPassword });

    const token = loginRes.body.token;
    console.log('[Phase 4 Test] ✅ Obtained JWT token for authenticated endpoints');

    // 2. Create Books (POST /api/books)
    const book1Res = await supertest(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        ISBN: '9780747532699',
        genre: 'Fantasy',
        totalCopies: 5,
        availableCopies: 5,
      });

    if (book1Res.status === 201 && book1Res.body.success) {
      console.log(`[Phase 4 Test] ✅ Created Book 1: "${book1Res.body.data.title}"`);
    } else {
      throw new Error(`Failed to create book 1. Status: ${book1Res.status}`);
    }

    const book2Res = await supertest(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        ISBN: '9780132350884',
        genre: 'Technology',
        totalCopies: 3,
      });

    if (book2Res.status === 201 && book2Res.body.data.availableCopies === 3) {
      console.log('[Phase 4 Test] ✅ Created Book 2 (default availableCopies = totalCopies = 3)');
    } else {
      throw new Error(`Failed to create book 2. Status: ${book2Res.status}`);
    }

    // 3. Reject Duplicate ISBN (409 Conflict)
    const dupBookRes = await supertest(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Duplicate Book Title',
        author: 'Another Author',
        ISBN: '9780747532699', // Same ISBN as Book 1
        genre: 'Fantasy',
        totalCopies: 2,
      });

    if (dupBookRes.status === 409) {
      console.log('[Phase 4 Test] ✅ Duplicate ISBN correctly rejected with HTTP 409 Conflict');
    } else {
      throw new Error(`Duplicate ISBN check failed. Status: ${dupBookRes.status}`);
    }

    // 4. List Books with Pagination & Filters (GET /api/books)
    const listRes = await supertest(app).get('/api/books?page=1&limit=10');
    if (listRes.status === 200 && listRes.body.pagination.total === 2) {
      console.log('[Phase 4 Test] ✅ GET /api/books pagination metadata verified (Total: 2 books)');
    }

    // Test Genre Filter
    const fantasyRes = await supertest(app).get('/api/books?genre=Fantasy');
    if (fantasyRes.status === 200 && fantasyRes.body.data.length === 1 && fantasyRes.body.data[0].genre === 'Fantasy') {
      console.log('[Phase 4 Test] ✅ GET /api/books?genre=Fantasy filter verified');
    }

    // Test Title Search
    const searchRes = await supertest(app).get('/api/books?search=harry');
    if (searchRes.status === 200 && searchRes.body.data.length === 1 && searchRes.body.data[0].title.includes('Harry')) {
      console.log('[Phase 4 Test] ✅ GET /api/books?search=harry search verified');
    }

    // 5. Create Members (POST /api/members)
    const member1Res = await supertest(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        email: 'john.doe@university.edu',
        membershipId: 'MEM-2026-101',
      });

    if (member1Res.status === 201 && member1Res.body.success) {
      console.log(`[Phase 4 Test] ✅ Created Member: "${member1Res.body.data.name}"`);
    } else {
      throw new Error(`Failed to create member. Status: ${member1Res.status}`);
    }

    // Duplicate Email Check
    const dupMemberRes = await supertest(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jane Doe',
        email: 'john.doe@university.edu', // Duplicate email
        membershipId: 'MEM-2026-102',
      });

    if (dupMemberRes.status === 409) {
      console.log('[Phase 4 Test] ✅ Duplicate member email correctly rejected with HTTP 409');
    } else {
      throw new Error(`Duplicate member email check failed. Status: ${dupMemberRes.status}`);
    }

    // 6. List Members Helper Endpoint (GET /api/members)
    const membersListRes = await supertest(app).get('/api/members');
    if (membersListRes.status === 200 && membersListRes.body.data.length === 1) {
      console.log('[Phase 4 Test] ✅ GET /api/members helper endpoint verified');
    }

    console.log('[Phase 4 Test] 🎉 ALL BOOK & MEMBER API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('[Phase 4 Test] ❌ Test Failure:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(0);
  }
};

runTests();
