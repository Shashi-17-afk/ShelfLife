/**
 * Request Logger Middleware
 * Logs HTTP method, URL, status code, and response duration.
 * Ensures sensitive header information (like JWT tokens or passwords) is never logged.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    console.log(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};
