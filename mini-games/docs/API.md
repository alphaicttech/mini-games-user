# Telebirr Payment Transaction Verifier API

## Phase 1 — Architecture Summary
- **Multi-tenant boundary:** every mutable resource has `company_id`; admin APIs require session and tenant context.
- **Auth split:**
  - Backoffice & super admin => Redis-backed session token via Authorization header.
  - Public hosted deposit flow => short-lived signed token.
- **State machine:** `CREATED -> WAITING_PAYMENT -> SUBMITTED -> VERIFYING -> SUCCESS|FAILED|MANUAL_REVIEW -> WEBHOOK_PENDING -> WEBHOOK_SENT`.
- **Queue-backed webhooks:** BullMQ worker with exponential retries and idempotency keys.
- **Atomic billing:** fee deduction and ledger insertion happen in DB transaction.

## Phase 2 — Implemented Core Endpoints

> **Important:** Deposit creation is `POST /api/deposits`, and submission is `POST /api/deposits/:id/submit`.
>
> If your deployment is behind a path prefix, the same endpoints are also available under:
> - `/telebirr-verify/api/...`
> - Example: `POST /telebirr-verify/api/deposits`

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` returns current authenticated backoffice user profile

### Public Integration
- `POST /api/deposits` create deposit session
- `POST /api/deposits/:id/submit` submit tx id and trigger verification

### Backoffice Deposits
- `GET /api/deposits` list company deposit sessions (`page` is 1-based, `pageSize`, optional `status`; defaults: `page=1`, `pageSize=20`, max `pageSize=100`)
- `GET /api/deposits/:id` get one company deposit session by id

### Withdrawals
- `POST /api/withdrawals` create withdrawal request for authenticated company (deducts wallet immediately)
- `GET /api/withdrawals` list withdrawal requests (`page` is 1-based, `pageSize`, optional `status`; `SUPER_ADMIN` can pass `companyId`)
- `GET /api/withdrawals/:id` get one withdrawal request by id (`SUPER_ADMIN` can pass `companyId`)
- `POST /api/withdrawals/:id/approve` approve and attach payout screenshot (`proofUploadedFileId`) and trigger `withdrawal.approved` webhook
- `POST /api/withdrawals/:id/reject` reject request and refund company balance

### File Uploads (screenshots/proofs)
- `POST /api/uploads` multipart upload using field name `file` (optionally `companyId` for `SUPER_ADMIN`)
- `GET /api/uploads/:id/download` fetch uploaded file (for own company, or with `companyId` as `SUPER_ADMIN`)

### Backoffice
- `GET /api/companies` list companies with offset pagination (`page` 1-based, `pageSize`; defaults `1` and `20`)
- `GET /api/companies/:id`
- `GET /api/receiving-numbers` list receiving numbers with offset pagination (`page` 1-based, `pageSize`; defaults `1` and `20`)
- `POST /api/receiving-numbers` create a receiving number for the authenticated company (`SUPER_ADMIN` may pass `companyId` in body)
- `POST /api/receiving-numbers/:id/activate`

### Webhooks/Admin
- `GET /api/webhooks` list webhook events (`page` is 1-based, `pageSize`; defaults: `page=1`, `pageSize=20`, max `pageSize=100`)
- `GET /api/webhooks/logs` alias of `GET /api/webhooks` (same pagination; `SUPER_ADMIN` may pass `companyId` query param)
- `GET /api/webhooks/:id` get one webhook event
- `GET /api/webhooks/:id/deliveries` list delivery attempts for one webhook event
- `POST /api/webhooks/resend`
- `GET /api/super-admin/reports/global`
- `POST /api/super-admin/deposits` create a deposit session for a company (`SUPER_ADMIN` only, requires `companyId`)
- `POST /api/super-admin/companies/:companyId/charge` debit company wallet balance (`SUPER_ADMIN` only)

## Webhook Delivery Guide

Webhook events are **outbound** from this service to each company's configured `webhookUrl`. There is no `GET /api/webhooks` inbox endpoint in this API.
The new `GET /api/webhooks*` endpoints are for **backoffice monitoring**, not for receiving callbacks.

### Events
- `deposit.success`
- `deposit.failed`
- `deposit.manual_review`
- `deposit.expired`
- `withdrawal.approved`

### Headers sent to your webhook URL
- `x-webhook-signature`
- `x-webhook-timestamp`
- `x-idempotency-key`

### Signature verification (recommended)
1. Read raw request body as UTF-8 string.
2. Build payload: `${timestamp}.${rawBody}` where `timestamp` is `x-webhook-timestamp`.
3. Compute HMAC SHA-256 with your webhook secret.
4. Compare with `x-webhook-signature`.
5. Reject if timestamp is too old (for example, older than 5 minutes) to reduce replay risk.

### Retry behavior
- Delivery is queued and retried with exponential backoff.
- Use `x-idempotency-key` on your side to deduplicate repeated deliveries.

## Phase 3 — Example Payloads

### Create Deposit Session
`POST /api/deposits`
```json
{
  "companySlug": "sample-sportsbook",
  "externalReference": "EXT-9001",
  "externalUserId": "user-88",
  "expectedAmount": 2000,
  "returnUrlSuccess": "https://sportsbook.example/success",
  "returnUrlFail": "https://sportsbook.example/fail",
  "metadata": { "username": "bettor1" }
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "depositSession": { "id": "uuid", "status": "WAITING_PAYMENT" },
    "hostedToken": "jwt",
    "receivingNumber": "251911111118"
  }
}
```

### Submit Transaction
`POST /api/deposits/{depositSessionId}/submit`
```json
{
  "txId": "DCU3DMUN4L",
  "uploadedFileId": "uuid"
}
```

### Webhook Payload
```json
{
  "event": "deposit.success",
  "depositId": "uuid",
  "externalReference": "EXT-9001",
  "externalUserId": "user-88",
  "txId": "DCU3DMUN4L",
  "amount": 2000,
  "receivingNumber": "2519****1118",
  "verifiedAt": "2026-03-31T12:00:00Z"
}
```

Headers:
- `x-webhook-signature`
- `x-webhook-timestamp`
- `x-idempotency-key`

### Withdrawal Approved Webhook Payload
```json
{
  "event": "withdrawal.approved",
  "withdrawalId": "uuid",
  "externalReference": "WD-2001",
  "amount": "500.00",
  "currency": "ETB",
  "status": "APPROVED",
  "approvedAt": "2026-04-03T10:20:00.000Z",
  "proofUploadedFileId": "uuid",
  "adminNote": "Bank transfer completed"
}
```

## Setup
1. `cp .env.example .env`
2. `npm install`
3. `npm run db:generate`
4. `npm run db:migrate`
5. `npm run seed`
6. `npm run dev`

## Phase 4 — Next Improvements
1. Harden Authorization header-based admin auth (token rotation/revocation visibility).
2. Add S3 storage adapter and ClamAV scanning worker.
3. Add manual review assignment queues and SLA alerts.
4. Add pricing engine with tier windows and negotiated overrides.
5. Add per-company branded hosted page templates and maintenance switch.
6. Add advanced anomaly scoring with payer behavior clustering.
