import { ApiError } from './errorHandler.js';

/**
 * Reusable Zod validation middleware factory.
 * Validates req.body, req.query, and req.params against passed Zod schema.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const issueMessages = error.errors.map((e) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
      });
      return next(new ApiError(400, 'Validation Error', issueMessages));
    }
    next(error);
  }
};
