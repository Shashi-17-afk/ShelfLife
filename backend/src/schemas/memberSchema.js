import { z } from 'zod';

export const createMemberSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Member name is required'),
    email: z.string().trim().email('Invalid email address format'),
    membershipId: z.string().trim().min(1, 'Membership ID is required'),
  }),
});
