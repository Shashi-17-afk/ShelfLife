import { Member } from '../models/Member.js';
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
