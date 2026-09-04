import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

// Validate Request Body
export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Kiểm tra dtoClass có tồn tại không
    if (!dtoClass) {
      console.error('[ValidationError] dtoClass truyền vào validateDto bị undefined! Hãy kiểm tra lại import/export của DTO.');
      return res.status(500).json({
        success: false,
        message: 'Lỗi cấu hình DTO trên Server',
        data: null,
      });
    }

    // 2. Chống crash khi req.body là undefined (fallback về {})
    const bodyData = req.body || {};
    const dtoInstance = plainToInstance(dtoClass, bodyData);

    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
  // In chi tiết lỗi ra Terminal VS Code để soi
  console.dir(errors, { depth: null });

  const firstError = errors[0];
  const constraints = firstError.constraints;
  
  // Trả về đúng tên thuộc tính và lý do lỗi cho Postman
  return res.status(400).json({
    success: false,
    message: constraints ? Object.values(constraints) : 'Dữ liệu không hợp lệ',
    data: null,
  });
}

    req.body = dtoInstance;
    next();
  };
}

// Validate Request Params
export function validateParamsDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!dtoClass) {
      console.error('[ValidationError] dtoClass truyền vào validateParamsDto bị undefined!');
      return res.status(500).json({
        success: false,
        message: 'Lỗi cấu hình DTO trên Server',
        data: null,
      });
    }

    const paramsData = req.params || {};
    const dtoInstance = plainToInstance(dtoClass, paramsData);
    const errors: ValidationError[] = await validate(dtoInstance as object);

    if (errors.length > 0) {
      const firstError = errors[0];
      const constraints = firstError.constraints;
      const message = constraints ? Object.values(constraints)[0] : 'Tham số đường dẫn không hợp lệ';

      return res.status(400).json({
        success: false,
        message: message,
        data: null,
      });
    }

    next();
  };
}