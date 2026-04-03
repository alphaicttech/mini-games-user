# mini-games-user backend

Production-ready TypeScript backend for Telegram-authenticated mini games platform.

## Stack
- Node.js + Express
- TypeScript
- PostgreSQL + Drizzle ORM
- Redis (sessions, idempotency, rate limiting)
- Telegram Login verification
- PM2 deployment ready

## Setup
1. Copy env
```bash
cp .env.example .env
```
2. Install
```bash
npm install
```
3. Generate and run migration
```bash
npm run drizzle:generate
npm run drizzle:migrate
```
4. Start dev
```bash
npm run dev
```

## Production
```bash
npm run build
pm2 start ecosystem.config.cjs
```

## Integration notes
- `src/integrations/payment/telebirr.adapter.ts` contains adapter for wiring logic from sibling `../payment`.
- `src/integrations/mini-games/game-engine.adapter.ts` contains adapter for wiring logic from sibling `../mini-games`.

## API overview
- User Auth: `/auth/*`
- Admin Auth: `/admin/auth/*`
- Profile: `/users/*`
- Wallet: `/wallet/*`
- Deposits: `/deposits/*`
- Games: `/games/*`
- Admin management: `/admin/*`

See `documentation.md` for full request/response examples.
