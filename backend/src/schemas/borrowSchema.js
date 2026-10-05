import { z } from 'zod';

export const borrowBookSchema = z.object({
  body: z.object({
    bookId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Book MongoDB ObjectId format'),
    memberId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Member MongoDB ObjectId format'),
  }),
});

export const returnBookSchema = z.object({
  params: z
    .object({
      borrowId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid BorrowRecord MongoDB ObjectId format').optional(),
    })
    .optional(),
  body: z
    .object({
      borrowRecordId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid BorrowRecord MongoDB ObjectId format').optional(),
      borrowId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid BorrowRecord MongoDB ObjectId format').optional(),
    })
    .optional(),
});
