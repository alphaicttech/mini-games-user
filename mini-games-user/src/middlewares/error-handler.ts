import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/api-response';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json(fail(err.message || 'Internal server error'));
};
