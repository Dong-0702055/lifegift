import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationException } from '../exceptions/custom.errors';
import { ErrorResponse, ValidationErrorResponse } from '../responses/api.response';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.originalUrl;
  const timestamp = new Date().toISOString();

  // Xử lý Validation Exception (Tương đương MethodArgumentNotValidException)
  if (err instanceof ValidationException) {
    const response: ValidationErrorResponse = {
      success: false,
      message: err.message,
      errors: err.errors,
      path,
      timestamp,
    };
    return res.status(err.statusCode).json(response);
  }

  // Xử lý BadRequest, ResourceNotFound và các AppError custom khác
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      path,
      timestamp,
    };
    return res.status(err.statusCode).json(response);
  }

  // Xử lý uncaught System Exceptions (Tương đương Exception.class)
  console.error('System Error:', err);
  const response: ErrorResponse = {
    success: false,
    message: 'Đã xảy ra lỗi trong hệ thống',
    path,
    timestamp,
  };
  return res.status(500).json(response);
};