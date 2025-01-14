// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isAppError } from '../utils/asyncHandler';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  // Log error for debugging
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.errors,
    });
    return;
  }

  // Handle custom app errors
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Handle Mongoose/MongoDB errors
  if (
    err instanceof Error &&
    (err.name === 'MongoError' || err.name === 'MongoServerError')
  ) {
    res.status(500).json({
      status: 'error',
      message: 'Database Error',
    });
    return;
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      detail: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
};
