import { Request, Response } from 'express';
import { fail } from '../utils/api-response';

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json(fail('Route not found'));
};
