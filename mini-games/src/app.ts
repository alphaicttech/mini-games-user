import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './env';
import { logger } from './lib/logger';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './modules/auth/router';
import { companyRouter } from './modules/company/router';
import { receivingNumberRouter } from './modules/receiving-number/router';
import { depositRouter } from './modules/deposit/router';
import { webhookRouter } from './modules/webhook/router';
import { superAdminRouter } from './modules/super-admin/router';
import { uploadRouter } from './modules/upload/router';
import { withdrawalRouter } from './modules/withdrawal/router';

//Access-Control-Allow-Credentials: true
//Access-Control-Allow-Origin: http://localhost:5174

export const app = express();
app.use(helmet());
app.use(cors({ origin: [
    env.CORS_ORIGIN, 
    "https://gateway-admin-updated.vercel.app", 
    "https://gateway-user.vercel.app",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",
    "http://localhost:5181",
    "http://localhost:5182",
    "http://localhost:5183",
    "http://localhost:5184",
    "http://localhost:5185",
    "http://localhost:5186",
    "http://localhost:5177",
    "http://localhost:5176",
    "http://localhost:5175",
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5172",
    "http://localhost:5171",
    "http://localhost:5170",
    
], credentials: true, }));
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestIdMiddleware);
//app.use(pinoHttp({ logger }));

app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/health/ready', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/companies', companyRouter);
app.use('/api/receiving-numbers', receivingNumberRouter);
app.use('/api/deposits', depositRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/withdrawals', withdrawalRouter);

// Backward-compatible prefixed routes used behind certain reverse proxies.
app.use('/telebirr-verify/api/auth', authRouter);
app.use('/telebirr-verify/api/companies', companyRouter);
app.use('/telebirr-verify/api/receiving-numbers', receivingNumberRouter);
app.use('/telebirr-verify/api/deposits', depositRouter);
app.use('/telebirr-verify/api/webhooks', webhookRouter);
app.use('/telebirr-verify/api/super-admin', superAdminRouter);
app.use('/telebirr-verify/api/uploads', uploadRouter);
app.use('/telebirr-verify/api/withdrawals', withdrawalRouter);

// health check
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not Found' });
});

app.use(errorMiddleware);
