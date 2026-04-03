import { Response } from 'express';

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  res.status(200).json({ success: true, data, meta });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}
