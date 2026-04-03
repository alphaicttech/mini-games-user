# Telebirr Verifier Integration Manual — External Clients

This manual is for sportsbook/operator engineering teams integrating their product with the verification platform.

---

## 1. End-to-End Integration Sequence

1. Your backend creates deposit session.
2. You redirect user to hosted payment page using returned token/session id.
3. User pays to assigned Telebirr receiving number.
4. User submits tx id (and screenshot ID if used).
5. Platform verifies against Telebirr parser and internal fraud rules.
6. Platform emits webhook for final status.
7. Your backend updates wallet/user balance using webhook event.

---

## 2. Endpoint Summary

| Endpoint | Purpose |
|---|---|
| `POST /api/deposits` | Create deposit session |
| `POST /api/deposits/:id/submit` | Submit tx id for verification |
| `POST /api/webhooks/resend` | Admin resend (internal ops) |

For operator integration, primary endpoints are create + submit + webhook receiver.

---

## 3. Security Requirements (Must Implement)

- Use HTTPS only.
- Generate unique idempotency keys for create/submit.
- Validate webhook HMAC signature.
- Enforce timestamp freshness on webhooks (e.g., ±5 minutes).
- Ensure your webhook endpoint is idempotent.
- Never trust OCR output as final truth.

---

## 4. Create Deposit Session

### Request
```http
POST /api/deposits
Content-Type: application/json
Idempotency-Key: create-EXT-2026-0001

{
  "companySlug": "sample-sportsbook",
  "externalReference": "EXT-2026-0001",
  "externalUserId": "player-8921",
  "expectedAmount": 2000,
  "returnUrlSuccess": "https://sportsbook.example/pay/success",
  "returnUrlFail": "https://sportsbook.example/pay/fail",
  "metadata": {
    "username": "bet_king",
    "market": "ET"
  }
}
```

### Success Response (201)
```json
{
  "success": true,
  "data": {
    "depositSession": {
      "id": "9de7f3f6-40ee-4f37-8ea5-c8d6e2a5ec83",
      "companyId": "cce2d6b9-af39-4a4f-80f9-7f5a3f6d96f4",
      "externalReference": "EXT-2026-0001",
      "externalUserId": "player-8921",
      "expectedAmount": "2000",
      "currency": "ETB",
      "assignedReceivingNumberId": "f9222bb3-5ff1-4f63-bfc1-59f7032a7177",
      "status": "WAITING_PAYMENT",
      "returnUrlSuccess": "https://sportsbook.example/pay/success",
      "returnUrlFail": "https://sportsbook.example/pay/fail",
      "callbackOverrideUrl": null,
      "metadata": {
        "username": "bet_king",
        "market": "ET"
      },
      "expiresAt": "2026-03-31T08:30:00.000Z",
      "createdAt": "2026-03-31T08:00:00.000Z",
      "updatedAt": "2026-03-31T08:00:00.000Z"
    },
    "hostedToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "receivingNumber": "251911111118"
  }
}
```

### Validation Error (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fieldErrors": {
      "returnUrlSuccess": ["Invalid url"]
    }
  },
  "requestId": "req_9H9..."
}
```

### Business Error (400/500 depending implementation)
```json
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "requestId": "req_Pw..."
}
```

---

## 5. Submit Transaction for Verification

### Request
```http
POST /api/deposits/9de7f3f6-40ee-4f37-8ea5-c8d6e2a5ec83/submit
Content-Type: application/json
Idempotency-Key: submit-EXT-2026-0001-1

{
  "txId": "DCU3DMUN4L",
  "uploadedFileId": "d433de85-38ce-4370-a2c9-e4fcb9f6ebf0"
}
```

### Success (verified)
```json
{
  "success": true,
  "data": {
    "decision": "SUCCESS",
    "reasons": []
  }
}
```

### Success (business failed verification)
```json
{
  "success": true,
  "data": {
    "decision": "FAILED",
    "reasons": [
      "RECEIVER_NAME_MISMATCH",
      "AMOUNT_MISMATCH"
    ]
  }
}
```

### Duplicate/idempotent replay
```json
{
  "success": false,
  "code": "IDEMPOTENCY_REPLAY",
  "message": "Request already processed"
}
```

---

## 6. Verification Rules Applied by Platform

The backend verifies:
- tx id uniqueness globally
- invoice uniqueness where reliable
- transaction status equals `Completed`
- credited account last digits match assigned receiving number
- credited party name fuzzy matches configured account owner
- amount matches expected amount when provided
- payment mode equals telebirr (if parser exposes it)

Common reason codes:
- `TX_ID_ALREADY_USED`
- `TRANSACTION_NOT_COMPLETED`
- `RECEIVER_LAST_DIGITS_MISMATCH`
- `RECEIVER_NAME_MISMATCH`
- `PAYMENT_MODE_INVALID`
- `AMOUNT_MISMATCH`

---

## 7. Webhook Contract (Full Sample)

### Event Types
- `deposit.success`
- `deposit.failed`
- `deposit.manual_review`
- `deposit.expired`

### Webhook Request Example
```http
POST https://sportsbook.example/hooks/telebirr
Content-Type: application/json
X-Webhook-Signature: 4a2bc... (hex)
X-Webhook-Timestamp: 2026-03-31T08:15:10.100Z
X-Idempotency-Key: 89cd18...

{
  "event": "deposit.success",
  "depositId": "9de7f3f6-40ee-4f37-8ea5-c8d6e2a5ec83",
  "externalReference": "EXT-2026-0001",
  "externalUserId": "player-8921",
  "txId": "DCU3DMUN4L",
  "amount": 2000,
  "currency": "ETB",
  "receivingNumber": "2519***1118",
  "decision": "SUCCESS",
  "reasons": [],
  "verifiedAt": "2026-03-31T08:15:09.991Z",
  "signatureTimestamp": "2026-03-31T08:15:10.100Z"
}
```

### Webhook Verification Pseudocode
```ts
const signedPayload = `${timestamp}.${rawBody}`;
const expected = hmacSha256(process.env.WEBHOOK_SECRET, signedPayload);
if (expected !== headers['x-webhook-signature']) {
  return res.status(401).send('invalid signature');
}
```

### Your Endpoint Response
- Return `2xx` quickly.
- If non-2xx, platform retries with exponential backoff.

---

## 8. Client-Side Idempotency Strategy

- Create: `create-${externalReference}`
- Submit: `submit-${externalReference}-${attemptNo}`
- Reuse same key only for retrying exact same request payload.

---

## 9. Recommended Internal Data Mapping

Map platform payloads to your records:
- `externalReference` -> your deposit/order table unique key
- `depositId` -> partner transaction id
- `txId` -> Telebirr transaction ID column
- `decision` + `reasons` -> fraud/ops reason columns

---

## 10. Operator Error Handling Guide

| Scenario | What to do |
|---|---|
| 422 validation | fix payload and retry with new idempotency key |
| 409 idempotency replay | poll or fetch local state; avoid new submit unless needed |
| 500 server error | retry with same idempotency key |
| webhook signature invalid | reject and alert immediately |

---

## 11. Go-Live Checklist

- [ ] allowlist return URLs registered with platform team
- [ ] webhook URL reachable over public HTTPS
- [ ] webhook signature verification implemented
- [ ] idempotency keys implemented on create/submit
- [ ] reconciliation job scheduled (every 5–15 min)
- [ ] support dashboard includes requestId and externalReference
- [ ] sandbox/uat test transactions completed

---

## 12. Required Fields to Share for Support Cases

Provide these values in tickets:
- `requestId`
- `externalReference`
- `depositSessionId`
- `txId`
- request timestamp UTC
- webhook timestamp UTC
- your webhook response status/body
