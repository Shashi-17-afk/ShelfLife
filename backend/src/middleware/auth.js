import { verifyToken } from '../utils/jwt.js';
import { ApiError } from './errorHandler.js';
import { Librarian } from '../models/Librarian.js';

/**
 * Authentication Middleware
 * Validates 'Authorization: Bearer <token>' header.
 * Attaches authenticated librarian info to req.librarian.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = verifyToken(token);

    // Verify librarian still exists in database
    const librarian = await Librarian.findById(decoded.id).select('-passwordHash');
    if (!librarian) {
      throw new ApiError(401, 'Authenticated librarian no longer exists');
    }

    req.librarian = librarian;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }
};
