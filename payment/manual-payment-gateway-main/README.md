# Manual Payment Gateway (Telebirr Verifier)

Production-minded backend scaffold for a multi-tenant Telebirr payment transaction verifier platform.

## Stack
- Node.js + Express + TypeScript
- PostgreSQL + Drizzle ORM
- Redis + BullMQ
- Zod validation
- Cookie session auth + signed hosted tokens

See `docs/API.md` for phased architecture, endpoints, and setup.

## Withdrawal flow
- Companies can create withdrawal requests through `POST /api/withdrawals` (balance is deducted immediately).
- Admin users with approval access can upload payout proof via `POST /api/uploads` and approve/reject via `/api/withdrawals/:id/approve|reject`.
- Approved withdrawals trigger outbound `withdrawal.approved` webhooks and can be queried by id (including screenshot metadata/download path).


## Pagination
- List endpoints for companies, deposits, receiving numbers, and webhook logs now use 1-based `page` and `pageSize` query params.
- Defaults: `page=1`, `pageSize=20`; max `pageSize=100`.
- Responses include `items`, `page`, `pageSize`, `totalCount`, and `totalPages`.
