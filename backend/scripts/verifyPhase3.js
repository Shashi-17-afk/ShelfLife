import mongoose from 'mongoose';
import express from 'express';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Librarian } from '../src/models/Librarian.js';
import bcrypt from 'bcryptjs';

console.log('[Phase 3 Test] Starting Authentication Verification...');

let mongoServer;

const runTests = async () => {
  try {
    // 1. Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Phase 3 Test] ✅ Connected to in-memory test database');

    // 2. Seed Demo Librarian
    const demoEmail = 'admin@shelflife.local';
    const demoPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const librarian = await Librarian.create({
      name: 'Demo Librarian',
      email: demoEmail,
      passwordHash,
    });
    console.log(`[Phase 3 Test] ✅ Demo Librarian created in DB (ID: ${librarian._id})`);

    // 3. Test Invalid Login
    const invalidRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: demoEmail, password: 'WrongPassword123' });
    
    if (invalidRes.status === 401 && invalidRes.body.success === false) {
      console.log('[Phase 3 Test] ✅ Invalid login correctly rejected with HTTP 401');
    } else {
      throw new Error(`Invalid login failed. Status: ${invalidRes.status}`);
    }

    // 4. Test Valid Login
    const validRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: demoEmail, password: demoPassword });

    if (validRes.status === 200 && validRes.body.success === true && validRes.body.token) {
      console.log('[Phase 3 Test] ✅ Valid login succeeded! JWT Token generated:');
      console.log(`               Token: ${validRes.body.token.substring(0, 30)}...`);
    } else {
      throw new Error(`Valid login failed. Status: ${validRes.status}`);
    }

    const token = validRes.body.token;

    // 5. Test Protected Route WITHOUT Token
    const noTokenRes = await supertest(app).get('/api/auth/me');
    if (noTokenRes.status === 401) {
      console.log('[Phase 3 Test] ✅ Protected route without token correctly returned HTTP 401');
    } else {
      throw new Error(`Protected route missing token check failed. Status: ${noTokenRes.status}`);
    }

    // 6. Test Protected Route WITH Valid Token
    const authRes = await supertest(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    if (authRes.status === 200 && authRes.body.librarian.email === demoEmail) {
      console.log('[Phase 3 Test] ✅ Protected route with valid token returned authenticated librarian info');
    } else {
      throw new Error(`Protected route with token failed. Status: ${authRes.status}`);
    }

    console.log('[Phase 3 Test] 🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('[Phase 3 Test] ❌ Test Failure:', err);
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
