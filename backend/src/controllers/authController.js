import bcrypt from 'bcryptjs';
import { Librarian } from '../models/Librarian.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * POST /api/auth/login
 * Librarian Authentication
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const librarian = await Librarian.findOne({ email: email.toLowerCase() });
    if (!librarian) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, librarian.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(librarian);

    res.status(200).json({
      success: true,
      token,
      librarian: {
        id: librarian._id.toString(),
        name: librarian.name,
        email: librarian.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Protected Route to verify token
 */
export const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      librarian: {
        id: req.librarian._id.toString(),
        name: req.librarian.name,
        email: req.librarian.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
