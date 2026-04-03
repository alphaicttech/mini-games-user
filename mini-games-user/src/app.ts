import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './env';
import userAuthRouter from './modules/auth/user/router';
import adminAuthRouter from './modules/auth/admin/router';
import usersRouter from './modules/users/router';
import walletRouter from './modules/wallets/router';
import depositsRouter from './modules/deposits/router';
import gamesRouter from './modules/games/router';
import adminRouter from './modules/admin/router';
import { notFound } from './middlewares/not-found';
import { errorHandler } from './middlewares/error-handler';
import { ok } from './utils/api-response';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(pinoHttp());

app.get('/health', (_req, res) => res.json(ok('Service healthy', { app: env.APP_NAME, env: env.NODE_ENV })));

app.use('/auth', userAuthRouter);
app.use('/admin/auth', adminAuthRouter);
app.use('/users', usersRouter);
app.use('/wallet', walletRouter);
app.use('/deposits', depositsRouter);
app.use('/games', gamesRouter);
app.use('/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);
