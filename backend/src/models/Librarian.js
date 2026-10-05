import mongoose from 'mongoose';

const librarianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Librarian name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
  },
  {
    timestamps: true,
  }
);

export const Librarian = mongoose.model('Librarian', librarianSchema);
