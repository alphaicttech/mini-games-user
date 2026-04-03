import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import { ValidationError } from '../lib/errors';

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });

    if (!parsed.success) {
      throw new ValidationError('Request validation failed', parsed.error.flatten());
    }

    next();
  };
}
