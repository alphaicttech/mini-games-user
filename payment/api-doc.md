# Telebirr Verifier API Docs — UI Guide (Internal)

This file is for the **UI/backoffice team**. It includes complete request/response examples, screen mapping guidance, and error handling behavior.

---

## 1. API Basics

### Base URL
- Local: `http://localhost:3000`
- API Prefix: `/api`

### Content Type
- Request: `application/json`
- Response: `application/json`

### Standard Success Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email"]
    }
  },
  "requestId": "req_8Bym6j..."
}
```

### Common Headers
- `x-request-id`: client can send; server echoes/generates.
- `idempotency-key`: use for write endpoints to prevent accidental duplicates.

### Auth Modes
1. **Backoffice/super admin**: Bearer token in `Authorization` header.
2. **Public hosted payment token**: short-lived signed token (not admin auth).

---

## 2. Roles for UI Access Control
- `SUPER_ADMIN`
- `COMPANY_OWNER`
- `COMPANY_ADMIN`
- `COMPANY_FINANCE`
- `SUPPORT_READONLY`

UI must hide buttons/actions that role cannot use, even if server also enforces permissions.

---

## 3. Endpoint Catalog with Full Samples

## 3.1 Auth

### POST `/api/auth/login`
Logs in user and returns a session token (use as Bearer token).

#### Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@sportsbook.example",
  "password": "Admin12345!"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "5bd5ea0c-ff44-4d7a-9d37-57cd066c4fb5",
      "email": "owner@sportsbook.example",
      "role": "COMPANY_OWNER"
    },
    "token": "<jwt>"
  }
}
```

#### Failure Response (401)
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Invalid credentials",
  "requestId": "req_k3R..."
}
```

---

### POST `/api/auth/logout`
Destroys session for the provided Bearer token.

#### Request
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

---

## 3.2 Companies

### GET `/api/companies`
Get list of companies (session required). `page` is 1-based; `pageSize` default 20, max 100.

#### Request
```http
GET /api/companies?page=1&pageSize=20
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [
      {
      "id": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
      "name": "Sample Sportsbook",
      "slug": "sample-sportsbook",
      "status": "ACTIVE",
      "balanceAvailable": "10000.00",
      "balanceReserved": "0.00",
      "consumedFees": "0.00",
      "allowedReturnUrls": [
        "https://sportsbook.example/success",
        "https://sportsbook.example/fail"
      ],
      "allowedDomains": ["sportsbook.example"],
      "branding": {},
      "depositRules": {},
      "createdAt": "2026-03-31T05:00:00.000Z",
      "updatedAt": "2026-03-31T05:00:00.000Z",
      "deletedAt": null
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

---

### GET `/api/companies/:id`
Get one company detail.

#### Request
```http
GET /api/companies/cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
    "name": "Sample Sportsbook",
    "slug": "sample-sportsbook",
    "status": "ACTIVE",
    "balanceAvailable": "10000.00",
    "balanceReserved": "0.00",
    "consumedFees": "0.00",
    "lifetimeUsage": "0.00",
    "allowedReturnUrls": [
      "https://sportsbook.example/success",
      "https://sportsbook.example/fail"
    ],
    "allowedDomains": ["sportsbook.example"],
    "webhookUrl": "https://sportsbook.example/webhook",
    "branding": {
      "primaryColor": "#2563eb",
      "logoUrl": "https://.../logo.png"
    },
    "depositRules": {
      "requireAmount": true,
      "timeoutMinutes": 30,
      "strictNameMatch": false
    }
  }
}
```

---

## 3.3 Receiving Numbers

### GET `/api/receiving-numbers`
List tenant receiving numbers. `page` is 1-based; `pageSize` default 20, max 100.

#### Request
```http
GET /api/receiving-numbers?page=1&pageSize=20
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "f9222bb3-5ff1-4f63-bfc1-59f7032a7177",
        "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
        "phoneNumber": "251911111118",
        "accountHolderName": "Shemeles Kumessa Moreda",
        "label": "Primary",
        "status": "ACTIVE",
        "priorityWeight": 5,
        "maxConcurrentSessions": 5,
        "cooldownSeconds": 0,
        "dailyVolume": "0.00",
        "monthlyVolume": "0.00"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

---

### POST `/api/receiving-numbers`
Creates a receiving number.

#### Request
```http
POST /api/receiving-numbers
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "251911111118",
  "accountHolderName": "Shemeles Kumessa Moreda",
  "label": "Primary",
  "priorityWeight": 5,
  "maxConcurrentSessions": 5,
  "cooldownSeconds": 0,
  "status": "ACTIVE"
}
```

`SUPER_ADMIN` users can optionally pass `"companyId": "<uuid>"` to create for another company.

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "f9222bb3-5ff1-4f63-bfc1-59f7032a7177",
    "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
    "phoneNumber": "251911111118",
    "accountHolderName": "Shemeles Kumessa Moreda",
    "label": "Primary",
    "status": "ACTIVE"
  }
}
```

---

### POST `/api/receiving-numbers/:id/activate`
Activates number.

#### Request
```http
POST /api/receiving-numbers/f9222bb3-5ff1-4f63-bfc1-59f7032a7177/activate
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "activated": true
  }
}
```

---

## 3.4 Deposits

### POST `/api/deposits`
Creates hosted deposit session.

#### Request
```http
POST /api/deposits
Content-Type: application/json
Idempotency-Key: dep-create-EXT-9001

{
  "companySlug": "sample-sportsbook",
  "externalReference": "EXT-9001",
  "externalUserId": "player-01",
  "expectedAmount": 2000,
  "returnUrlSuccess": "https://sportsbook.example/success",
  "returnUrlFail": "https://sportsbook.example/fail",
  "metadata": {
    "username": "bettor_ethiopia",
    "brand": "sample"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "depositSession": {
      "id": "dc5f3b68-6e72-4d24-ad4a-0f97f1d1f7c3",
      "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
      "externalReference": "EXT-9001",
      "externalUserId": "player-01",
      "expectedAmount": "2000",
      "currency": "ETB",
      "assignedReceivingNumberId": "f9222bb3-5ff1-4f63-bfc1-59f7032a7177",
      "status": "WAITING_PAYMENT",
      "returnUrlSuccess": "https://sportsbook.example/success",
      "returnUrlFail": "https://sportsbook.example/fail",
      "metadata": {
        "username": "bettor_ethiopia",
        "brand": "sample"
      },
      "expiresAt": "2026-03-31T06:00:00.000Z"
    },
    "hostedToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "receivingNumber": "251911111118"
  }
}
```

#### Failure Response (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fieldErrors": {
      "externalReference": ["String must contain at least 1 character(s)"]
    }
  },
  "requestId": "req_12..."
}
```

---

### POST `/api/deposits/:id/submit`
Submits tx id for verification.

#### Request
```http
POST /api/deposits/dc5f3b68-6e72-4d24-ad4a-0f97f1d1f7c3/submit
Content-Type: application/json
Idempotency-Key: dep-submit-EXT-9001-1

{
  "txId": "DCU3DMUN4L",
  "uploadedFileId": "d433de85-38ce-4370-a2c9-e4fcb9f6ebf0"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "decision": "SUCCESS",
    "reasons": []
  }
}
```

#### Failure Response (200 business fail)
```json
{
  "success": true,
  "data": {
    "decision": "FAILED",
    "reasons": [
      "AMOUNT_MISMATCH",
      "RECEIVER_LAST_DIGITS_MISMATCH"
    ]
  }
}
```

#### Failure Response (409 idempotency replay)
```json
{
  "success": false,
  "code": "IDEMPOTENCY_REPLAY",
  "message": "Request already processed"
}
```

---


### GET `/api/deposits`
List company deposit sessions with offset pagination.

- `page` is **1-based** (default `1`)
- `pageSize` default `20`, max `100`
- Optional filter: `status`

#### Request
```http
GET /api/deposits?page=1&pageSize=20&status=WAITING_PAYMENT
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "totalCount": 0,
    "totalPages": 0
  }
}
```

---

### GET `/api/webhooks/logs`
Alias of `GET /api/webhooks` with the same pagination response.

- `page` is **1-based** (default `1`)
- `pageSize` default `20`, max `100`
- `SUPER_ADMIN` may pass `companyId`

#### Request
```http
GET /api/webhooks/logs?page=1&pageSize=20
Authorization: Bearer <token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "totalCount": 0,
    "totalPages": 0
  }
}
```

---
## 3.5 Webhooks (Admin resend)

### POST `/api/webhooks/resend`
Creates webhook event and queues dispatch.

#### Request
```http
POST /api/webhooks/resend
Content-Type: application/json
Authorization: Bearer <token>

{
  "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
  "depositSessionId": "dc5f3b68-6e72-4d24-ad4a-0f97f1d1f7c3",
  "eventType": "deposit.success",
  "payload": {
    "depositId": "dc5f3b68-6e72-4d24-ad4a-0f97f1d1f7c3",
    "externalReference": "EXT-9001",
    "txId": "DCU3DMUN4L",
    "amount": 2000
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "03e9aa0f-4d6c-43e6-8f92-7158de20f6cb",
    "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
    "depositSessionId": "dc5f3b68-6e72-4d24-ad4a-0f97f1d1f7c3",
    "eventType": "deposit.success",
    "idempotencyKey": "af53c...",
    "status": "PENDING"
  }
}
```

---

## 3.6 Super Admin

### GET `/api/super-admin/reports/global`
Scaffold endpoint.

#### Request
```http
GET /api/super-admin/reports/global
Authorization: Bearer <token>
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "message": "global reports endpoint scaffolded"
  }
}
```

---

### POST `/api/super-admin/deposits`
Creates a deposit session for a target company (`SUPER_ADMIN` only).

#### Request
```http
POST /api/super-admin/deposits
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
  "externalReference": "EXT-9002",
  "externalUserId": "player-01",
  "expectedAmount": 2000,
  "returnUrlSuccess": "https://sportsbook.example/success",
  "returnUrlFail": "https://sportsbook.example/fail",
  "metadata": {
    "source": "admin-panel"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "depositSession": {
      "id": "dc5f3b68-6e72-4d24-ad4a-0f97f1d1f7c3",
      "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
      "externalReference": "EXT-9002",
      "status": "WAITING_PAYMENT"
    },
    "hostedToken": "<jwt>",
    "receivingNumber": "251911111118"
  }
}
```

---

### POST `/api/super-admin/companies/:companyId/charge`
Debits company wallet balance (`SUPER_ADMIN` only).

#### Request
```http
POST /api/super-admin/companies/cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4/charge
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150,
  "reason": "Monthly platform fee"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "debited": 150,
    "beforeBalance": 1000,
    "afterBalance": 850
  }
}
```

---

## 4. UI Screen Mapping Guide

## 4.1 Login Page
- Submit `/api/auth/login`
- On success, redirect dashboard.
- On 401 show inline “Invalid credentials”.

## 4.2 Company Dashboard
- Fetch `/api/companies/:id`
- Display wallet tiles (`balanceAvailable`, `consumedFees`) and status chips.
- Show maintenance/suspended banner if `status != ACTIVE`.

## 4.3 Receiving Numbers Screen
- List via `/api/receiving-numbers`
- Columns: phone, holder, label, status, weight, limits.
- Action: activate number.

## 4.4 Deposits Monitoring Screen
- Create session manually for testing from backoffice.
- Submit tx id from support workflow.
- Present decision reasons as badges.
- Show idempotency warnings as non-fatal toasts.

## 4.5 Webhook Operations
- Provide resend action bound to `/api/webhooks/resend`.
- Show queued/sent/failed status from webhook logs (future endpoint).

---

## 5. UI Error Handling Matrix

| HTTP | code                | UI Action |
|------|---------------------|-----------|
| 401  | `UNAUTHORIZED`      | redirect login |
| 403  | `FORBIDDEN`         | show no-access state |
| 409  | `IDEMPOTENCY_REPLAY`| show duplicate warning; refresh status |
| 422  | `VALIDATION_ERROR`  | mark invalid form fields |
| 500  | `INTERNAL_SERVER_ERROR` | generic retry + support contact |

Always display `requestId` in error modal for support/debug.

---

## 6. TypeScript Models for Frontend

```ts
export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export type DepositDecision = 'SUCCESS' | 'FAILED' | 'MANUAL_REVIEW';

export type DepositSubmitResponse = ApiSuccess<{
  decision: DepositDecision;
  reasons: string[];
}>;
```

---

## 7. Notes for UI Team
- Use UTC for date rendering internally; convert for display.
- Mask phone numbers in user-facing lists where required by policy.
- Preserve `x-request-id` in logs/tracing panel.

---

## 3.8 Withdrawals (New)

### POST `/api/withdrawals`
Create a company withdrawal request. The system immediately deducts amount from company wallet and sets status to `PENDING_APPROVAL`.

```http
POST /api/withdrawals
Authorization: Bearer <token>
Content-Type: application/json

{
  "externalReference": "WD-90001",
  "amount": 500,
  "currency": "ETB",
  "metadata": {
    "beneficiary": "Acme Finance",
    "bank": "CBE"
  }
}
```

### POST `/api/uploads`
Upload payout proof screenshot before approval (`multipart/form-data`, field name: `file`).

### POST `/api/withdrawals/:id/approve`
Approve a withdrawal request using uploaded screenshot id. On success, system emits `withdrawal.approved` webhook to company callback URL.

```http
POST /api/withdrawals/1a2b3c.../approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "proofUploadedFileId": "f8fd2e77-2ed8-4a63-9ef8-9546720ef9e3",
  "adminNote": "Transferred via bank app"
}
```

### GET `/api/withdrawals/:id`
Company can poll this endpoint using withdrawal id to see latest status and proof file metadata (`downloadPath` is included when approved).

### GET `/api/uploads/:id/download`
Download/uploaded screenshot file (same tenant access rules apply).

### Withdrawal statuses
- `PENDING_APPROVAL`
- `APPROVED`
- `REJECTED` (includes automatic wallet refund)

### Withdrawal webhook event
```json
{
  "event": "withdrawal.approved",
  "withdrawalId": "uuid",
  "externalReference": "WD-90001",
  "amount": "500.00",
  "currency": "ETB",
  "status": "APPROVED",
  "approvedAt": "2026-04-03T10:20:00.000Z",
  "proofUploadedFileId": "uuid",
  "adminNote": "Transferred via bank app"
}
```
