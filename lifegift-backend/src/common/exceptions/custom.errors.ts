export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ResourceNotFoundException extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class BadRequestException extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ValidationException extends AppError {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message, 400);
    this.errors = errors;
  }
}