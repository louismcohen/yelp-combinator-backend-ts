import { Request, Response, NextFunction } from 'express';
import { asyncHandler, createError, isAppError } from '../../../src/utils/asyncHandler';

describe('asyncHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should pass the request to the handler function', async () => {
    const mockHandler = jest.fn().mockResolvedValue('success');
    const wrappedHandler = asyncHandler(mockHandler as any);

    await wrappedHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockHandler).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
      mockNext
    );
  });

  it('should call next with error when handler throws an error', async () => {
    const mockError = new Error('Test error');
    const mockHandler = jest.fn().mockRejectedValue(mockError);
    const wrappedHandler = asyncHandler(mockHandler as any);

    await wrappedHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(mockError);
  });

  it('should call next with error when handler synchronously throws an error', async () => {
    const mockError = new Error('Test error');
    const mockHandler = jest.fn().mockImplementation(() => {
      throw mockError;
    });
    const wrappedHandler = asyncHandler(mockHandler as any);

    await wrappedHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(mockError);
  });
});

describe('createError', () => {
  it('should create an error object with provided values', () => {
    const error = createError(404, 'Not Found');
    
    expect(error).toEqual({
      statusCode: 404,
      message: 'Not Found',
      isOperational: true,
    });
  });

  it('should allow overriding isOperational flag', () => {
    const error = createError(500, 'System Error', false);
    
    expect(error).toEqual({
      statusCode: 500,
      message: 'System Error',
      isOperational: false,
    });
  });
});

describe('isAppError', () => {
  it('should return true for valid AppError objects', () => {
    const error = {
      statusCode: 404,
      message: 'Not Found',
      isOperational: true,
    };
    
    expect(isAppError(error)).toBe(true);
  });

  it('should return false for non-objects', () => {
    expect(isAppError('string error')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError(42)).toBe(false);
  });

  it('should return false for objects missing required properties', () => {
    const missingStatusCode = {
      message: 'Error message',
      isOperational: true,
    };
    
    const missingMessage = {
      statusCode: 500,
      isOperational: true,
    };
    
    expect(isAppError(missingStatusCode)).toBe(false);
    expect(isAppError(missingMessage)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});