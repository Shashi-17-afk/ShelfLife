import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';
import { Librarian } from '../src/models/Librarian.js';

// Configure DNS resolver for Atlas SRV lookup on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore if not supported
}

dotenv.config();

const seedLibrarian = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelflife';
    const name = process.env.LIBRARIAN_NAME || 'Demo Librarian';
    const email = (process.env.LIBRARIAN_EMAIL || 'admin@shelflife.local').toLowerCase();
    const password = process.env.LIBRARIAN_PASSWORD || 'Admin123!';

    console.log(`[Seed Script] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let librarian = await Librarian.findOne({ email });

    if (librarian) {
      librarian.name = name;
      librarian.passwordHash = passwordHash;
      await librarian.save();
      console.log(`[Seed Script] Updated existing demo librarian: ${name} (${email})`);
    } else {
      librarian = await Librarian.create({
        name,
        email,
        passwordHash,
      });
      console.log(`[Seed Script] Successfully created demo librarian: ${name} (${email})`);
    }

    console.log(`[Seed Script] ID: ${librarian._id}`);
    await mongoose.disconnect();
    console.log('[Seed Script] Disconnected from MongoDB. Seeding finished!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Script Error]:', error);
    process.exit(1);
  }
};

seedLibrarian();
