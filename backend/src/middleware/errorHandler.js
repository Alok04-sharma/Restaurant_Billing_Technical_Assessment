/**
 * Path: backend/src/middleware/errorHandler.js
 * Responsibility: Convert validation, database and application failures into safe JSON responses.
 * Integration: All REST controllers and the last Express middleware in app.js.
 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `No API route matches ${req.method} ${req.path}`));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
  if (error.name === 'ValidationError') {
    const first = Object.values(error.errors)[0];
    return res.status(400).json({ message: first?.message || 'Invalid data' });
  }
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid resource ID' });
  if (error.name === 'VersionError') return res.status(409).json({ message: 'This order was changed elsewhere. Reload it and try again.' });
  if (error.code === 11000) return res.status(409).json({ message: 'A matching record already exists.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON request body' });
  console.error('[api-error]', error);
  return res.status(500).json({ message: 'Server error. Please try again.' });
}
