import { z } from 'zod';

export const createBookSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, 'Title is required'),
      author: z.string().trim().min(1, 'Author is required'),
      ISBN: z.string().trim().min(1, 'ISBN is required'),
      genre: z.string().trim().min(1, 'Genre is required'),
      totalCopies: z.number().int('Total copies must be an integer').min(0, 'Total copies cannot be negative'),
      availableCopies: z.number().int('Available copies must be an integer').min(0, 'Available copies cannot be negative').optional(),
    })
    .refine(
      (data) => {
        if (data.availableCopies !== undefined) {
          return data.availableCopies <= data.totalCopies;
        }
        return true;
      },
      {
        message: 'Available copies cannot exceed total copies',
        path: ['availableCopies'],
      }
    ),
});

export const bookQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    genre: z.string().optional(),
    search: z.string().optional(),
  }),
});
