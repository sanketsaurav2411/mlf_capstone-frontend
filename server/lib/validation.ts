import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errors';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err: any) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return next(new AppError('Validation failed', 400, messages));
  }
  return next();
}
