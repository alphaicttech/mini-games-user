import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'user' };
      admin?: { id: string; role: string };
      session_id?: string;
    }
  }
}

export {};
