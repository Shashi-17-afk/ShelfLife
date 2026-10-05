import { Book } from '../models/Book.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * POST /api/books
 * Create a new Book (Authenticated)
 */
export const createBook = async (req, res, next) => {
  try {
    const { title, author, ISBN, genre, totalCopies, availableCopies } = req.body;

    // Check if book with same ISBN already exists
    const existingBook = await Book.findOne({ ISBN: ISBN.trim() });
    if (existingBook) {
      throw new ApiError(409, `Book with ISBN '${ISBN}' already exists.`);
    }

    const newAvailableCopies = availableCopies !== undefined ? availableCopies : totalCopies;

    const book = await Book.create({
      title,
      author,
      ISBN,
      genre,
      totalCopies,
      availableCopies: newAvailableCopies,
    });

    res.status(201).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books
 * List books with pagination, genre filter, and title/author search
 */
export const getBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const genre = req.query.genre;
    const search = req.query.search;

    const skip = (page - 1) * limit;

    const filter = {};

    if (genre && genre.trim() !== '') {
      filter.genre = { $regex: new RegExp(`^${genre.trim()}$`, 'i') };
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { ISBN: searchRegex },
      ];
    }

    const [total, books] = await Promise.all([
      Book.countDocuments(filter),
      Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
};
