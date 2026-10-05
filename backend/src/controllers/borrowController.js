import mongoose from 'mongoose';
import { Book } from '../models/Book.js';
import { Member } from '../models/Member.js';
import { BorrowRecord } from '../models/BorrowRecord.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * POST /api/borrow
 * Issue a book to a member (Authenticated)
 * Uses atomic conditional update ($inc: -1 where availableCopies > 0)
 * to prevent race conditions when multiple requests target the last copy.
 */
export const borrowBook = async (req, res, next) => {
  try {
    const { bookId, memberId } = req.body;

    // 1. Verify member exists
    const member = await Member.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // 2. Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    // 3. Atomic conditional decrement:
    // Only decrements if availableCopies > 0.
    // If availableCopies is 0, findOneAndUpdate returns null.
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      throw new ApiError(409, 'No available copies of this book to borrow');
    }

    // 4. Default borrowing period: 14 days
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    try {
      const record = await BorrowRecord.create({
        book: bookId,
        member: memberId,
        issueDate,
        dueDate,
        status: 'issued',
      });

      const populatedRecord = await BorrowRecord.findById(record._id)
        .populate('book', 'title author ISBN genre availableCopies totalCopies')
        .populate('member', 'name email membershipId');

      res.status(201).json({
        success: true,
        message: 'Book borrowed successfully',
        data: populatedRecord,
      });
    } catch (createError) {
      // Compensating action: restore copy if record creation fails
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      throw createError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/return/:borrowId or POST /api/return
 * Return a borrowed book (Authenticated)
 * Atomically marks the record as returned to prevent double returns
 * and increments availableCopies exactly once.
 */
export const returnBook = async (req, res, next) => {
  try {
    const recordId = req.params.borrowId || req.body.borrowId || req.body.borrowRecordId;

    if (!recordId) {
      throw new ApiError(400, 'Borrow record ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      throw new ApiError(400, 'Invalid BorrowRecord ID format');
    }

    const record = await BorrowRecord.findById(recordId);
    if (!record) {
      throw new ApiError(404, 'Borrow record not found');
    }

    if (record.status === 'returned' || record.returnDate !== null) {
      throw new ApiError(409, 'Book has already been returned for this borrow record');
    }

    // Atomic conditional update ensuring only one return call can transition the state
    const returnDate = new Date();
    const updatedRecord = await BorrowRecord.findOneAndUpdate(
      {
        _id: recordId,
        status: { $ne: 'returned' },
        returnDate: null,
      },
      {
        $set: {
          status: 'returned',
          returnDate,
        },
      },
      { new: true }
    );

    if (!updatedRecord) {
      throw new ApiError(409, 'Book has already been returned for this borrow record');
    }

    // Safely increment availableCopies of the book by 1
    const updatedBook = await Book.findByIdAndUpdate(
      updatedRecord.book,
      { $inc: { availableCopies: 1 } },
      { new: true }
    );

    const populatedRecord = await BorrowRecord.findById(updatedRecord._id)
      .populate('book', 'title author ISBN genre availableCopies totalCopies')
      .populate('member', 'name email membershipId');

    res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: {
        record: populatedRecord,
        availableCopies: updatedBook ? updatedBook.availableCopies : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
