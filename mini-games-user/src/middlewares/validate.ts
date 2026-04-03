import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { fail } from '../utils/api-response';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()));
  }
  req.body = parsed.data.body;
  req.params = parsed.data.params as Request['params'];
  req.query = parsed.data.query as Request['query'];
  next();
};
