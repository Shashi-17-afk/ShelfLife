import mongoose from 'mongoose';
import { Member } from '../models/Member.js';
import { BorrowRecord } from '../models/BorrowRecord.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * POST /api/members
 * Create a new Member (Authenticated)
 */
export const createMember = async (req, res, next) => {
  try {
    const { name, email, membershipId } = req.body;

    const existingEmail = await Member.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      throw new ApiError(409, `Member with email '${email}' already exists.`);
    }

    const existingMembershipId = await Member.findOne({ membershipId: membershipId.trim() });
    if (existingMembershipId) {
      throw new ApiError(409, `Member with membership ID '${membershipId}' already exists.`);
    }

    const member = await Member.create({
      name,
      email,
      membershipId,
    });

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/members
 * List all members (Helper endpoint for frontend member dropdown selection)
 * Supports optional ?search= parameter
 */
export const getMembers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { membershipId: searchRegex },
      ];
    }

    const members = await Member.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/members/:memberId/history
 * Fetch borrowing history for a member.
 * Dynamically computes 'overdue' status when dueDate < now and returnDate is null
 * without corrupting previously returned records.
 */
export const getMemberHistory = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new ApiError(400, 'Invalid Member ID format');
    }

    const member = await Member.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    const records = await BorrowRecord.find({ member: member._id })
      .populate('book', 'title author ISBN genre availableCopies totalCopies')
      .sort({ issueDate: -1, createdAt: -1 });

    const now = new Date();
    const history = records.map((rec) => {
      const doc = rec.toObject();
      // Dynamically represent overdue status when due date is past and book is unreturned
      if (!doc.returnDate && doc.dueDate && new Date(doc.dueDate) < now) {
        doc.status = 'overdue';
      }
      return doc;
    });

    res.status(200).json({
      success: true,
      data: {
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          membershipId: member.membershipId,
          joinedDate: member.joinedDate,
        },
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};
