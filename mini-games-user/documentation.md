# API Documentation - mini-games-user

Base URL: `http://localhost:4000`

## Response format
```json
{
  "success": true,
  "message": "Readable message",
  "data": {},
  "pagination": { "page": 1, "limit": 20 }
}
```

## Health
### GET /health
Response:
```json
{
  "success": true,
  "message": "Service healthy",
  "data": { "app": "mini-games-user", "env": "development" }
}
```

## User Auth
### POST /auth/telegram/login
Request:
```json
{
  "id": "1234567",
  "username": "mini_player",
  "first_name": "Mini",
  "last_name": "Player",
  "photo_url": "https://...",
  "auth_date": "1711111111",
  "hash": "telegram_hash"
}
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "session_id": "generated_sid",
    "user": { "id": "uuid", "telegram_id": "1234567", "status": "ACTIVE" }
  }
}
```

### POST /auth/logout
Response: `success=true`

### GET /auth/me
Response:
```json
{ "success": true, "message": "Current user", "data": { "id": "uuid", "username": "mini_player" } }
```

### GET /auth/sessions
Returns active user sessions.

### DELETE /auth/sessions/:sessionId
Deletes selected session.

### DELETE /auth/sessions
Logs out all other sessions.

## User Profile
### GET /users/me
### PATCH /users/me
Request:
```json
{ "display_name": "Mini Pro", "language_code": "en" }
```

## Wallet
### GET /wallet
### GET /wallet/transactions?page=1&limit=20

## Deposits
### POST /deposits
Request:
```json
{ "amount": "100.000000", "payment_reference": "TEL-REF-001" }
```

### GET /deposits
### GET /deposits/:id

### POST /deposits/:id/verify
Request:
```json
{ "payload": { "amount": "100.000000", "currency": "ETB" } }
```
Response includes updated status and wallet credit if verified.

## Games
### GET /games
### GET /games/:code
### POST /games/:code/start
Request:
```json
{ "bet_amount": "2.000000" }
```

### POST /games/:code/play
Request:
```json
{
  "session_id": "game_session_uuid",
  "action": { "choice": "roll" }
}
```

### GET /games/sessions
### GET /games/sessions/:id

## Admin Auth
### POST /admin/auth/login
Request:
```json
{ "username": "superadmin", "password": "change_me" }
```

### GET /admin/auth/me

## Admin Dashboard
### GET /admin/dashboard/summary

## Admin - Admins
- GET `/admin/admins`
- POST `/admin/admins`
- GET `/admin/admins/:id`
- PATCH `/admin/admins/:id`
- PATCH `/admin/admins/:id/status`
- PATCH `/admin/admins/:id/password`

## Admin - Users
- GET `/admin/users`
- GET `/admin/users/:id`
- PATCH `/admin/users/:id/status`
- PATCH `/admin/users/:id/balance`
- GET `/admin/users/:id/transactions`
- GET `/admin/users/:id/deposits`
- GET `/admin/users/:id/game-sessions`

## Admin - Deposits
- GET `/admin/deposits`
- GET `/admin/deposits/:id`
- POST `/admin/deposits/:id/verify`
- POST `/admin/deposits/:id/retry`
- PATCH `/admin/deposits/:id/status`

## Admin - Transactions
- GET `/admin/transactions`
- GET `/admin/transactions/:id`
- POST `/admin/transactions/adjust`
- POST `/admin/transactions/refund`

## Admin - Games
- GET `/admin/games`
- POST `/admin/games`
- GET `/admin/games/:id`
- PATCH `/admin/games/:id`
- PATCH `/admin/games/:id/status`
- GET `/admin/game-sessions`
- GET `/admin/game-sessions/:id`

## Admin - Settings / Audit
- GET `/admin/settings`
- PATCH `/admin/settings/:key`
- GET `/admin/audit-logs`

## Example cURL
```bash
curl -X POST http://localhost:4000/auth/telegram/login \
  -H 'content-type: application/json' \
  -d '{"id":"123","auth_date":"1711111111","hash":"hash"}'
```
