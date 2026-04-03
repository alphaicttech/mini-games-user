import { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details,
      requestId: req.header('x-request-id')
    });
    return;
  }

  res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    requestId: req.header('x-request-id')
  });
}
