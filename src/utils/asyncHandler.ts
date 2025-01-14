import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// utils/errors.ts
export type AppError = {
  statusCode: number;
  message: string;
  isOperational: boolean;
};

export const createError = (
  statusCode: number,
  message: string,
  isOperational = true,
): AppError => ({
  statusCode,
  message,
  isOperational,
});

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  );
};
