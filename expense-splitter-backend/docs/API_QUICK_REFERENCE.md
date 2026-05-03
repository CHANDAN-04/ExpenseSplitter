# 📋 API Quick Reference

**Base URL:** `http://localhost:5000/api` | **Auth:** `Authorization: Bearer {token}`

---

## Authentication

| Method | Endpoint         | Body                                | Response        | Status |
| ------ | ---------------- | ----------------------------------- | --------------- | ------ |
| POST   | `/auth/register` | `{email, password, name, username}` | `{token, user}` | 201    |
| POST   | `/auth/login`    | `{email, password}`                 | `{token, user}` | 200    |
| GET    | `/auth/me`       | -                                   | `{user}`        | 200    |

---

## Users

| Method | Endpoint                   | Params       | Auth | Status |
| ------ | -------------------------- | ------------ | ---- | ------ |
| GET    | `/users/search?q={query}`  | q            | ✓    | 200    |
| GET    | `/users/:username`         | -            | ✓    | 200    |
| PATCH  | `/users/profile`           | -            | ✓    | 200    |
| POST   | `/users/friends`           | `{username}` | ✓    | 200    |
| DELETE | `/users/friends/:username` | -            | ✓    | 200    |

---

## Groups

| Method | Endpoint                           | Body               | Auth | Status |
| ------ | ---------------------------------- | ------------------ | ---- | ------ |
| POST   | `/groups`                          | `{name, members?}` | ✓    | 201    |
| GET    | `/groups`                          | -                  | ✓    | 200    |
| GET    | `/groups/:groupId`                 | -                  | ✓    | 200    |
| PATCH  | `/groups/:id/members`              | `{userId}`         | ✓    | 200    |
| DELETE | `/groups/:groupId/members/:userId` | -                  | ✓    | 200    |
| DELETE | `/groups/:groupId/leave`           | -                  | ✓    | 200    |
| DELETE | `/groups/:groupId`                 | -                  | ✓    | 200    |
| POST   | `/groups/:groupId/request`         | -                  | ✓    | 200    |
| DELETE | `/groups/:groupId/request`         | -                  | ✓    | 200    |
| POST   | `/groups/:groupId/approve`         | `{userId}`         | ✓    | 200    |
| POST   | `/groups/:groupId/reject`          | `{userId}`         | ✓    | 200    |

---

## Expenses

| Method | Endpoint                   | Params                                  | Auth | Status |
| ------ | -------------------------- | --------------------------------------- | ---- | ------ |
| POST   | `/expenses`                | Form Data                               | ✓    | 201    |
| GET    | `/expenses/group/:groupId` | limit, skip, category, fromDate, toDate | ✓    | 200    |
| GET    | `/expenses/:expenseId`     | -                                       | ✓    | 200    |
| PUT    | `/expenses/:expenseId`     | Form Data                               | ✓    | 200    |
| DELETE | `/expenses/:expenseId`     | -                                       | ✓    | 200    |

**Create Expense Body:**

```json
{
  "title": "string",
  "amount": number,
  "groupId": "string",
  "paidBy": "string",
  "splitType": "equal|exact|percentage",
  "category": "string",
  "participants": [{"userId": "string", "share": number}],
  "billImage": "file (optional)"
}
```

---

## Balances

| Method | Endpoint                   | Auth | Status |
| ------ | -------------------------- | ---- | ------ |
| GET    | `/balances/group/:groupId` | ✓    | 200    |
| GET    | `/balances/user`           | ✓    | 200    |

---

## Payments

| Method | Endpoint           | Body                                                           | Auth | Status |
| ------ | ------------------ | -------------------------------------------------------------- | ---- | ------ |
| POST   | `/payments/order`  | `{groupId, fromUser, toUser, amount}`                          | ✓    | 201    |
| POST   | `/payments/verify` | `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` | ✓    | 200    |

---

## Notifications

| Method | Endpoint                  | Params      | Auth | Status |
| ------ | ------------------------- | ----------- | ---- | ------ |
| GET    | `/notifications`          | limit, skip | ✓    | 200    |
| PATCH  | `/notifications/:id/read` | -           | ✓    | 200    |
| PATCH  | `/notifications/read-all` | -           | ✓    | 200    |
| DELETE | `/notifications/:id`      | -           | ✓    | 200    |

---

## Activity

| Method | Endpoint                     | Params      | Auth | Status |
| ------ | ---------------------------- | ----------- | ---- | ------ |
| GET    | `/activities/group/:groupId` | limit, skip | ✓    | 200    |

---

## Health

| Method | Endpoint  | Status |
| ------ | --------- | ------ |
| GET    | `/health` | 200    |

---

## Error Codes

| Code                  | Status | Description             |
| --------------------- | ------ | ----------------------- |
| `VALIDATION_ERROR`    | 400    | Input validation failed |
| `INVALID_CREDENTIALS` | 401    | Wrong email or password |
| `INVALID_TOKEN`       | 401    | Invalid JWT token       |
| `TOKEN_EXPIRED`       | 401    | Token has expired       |
| `UNAUTHORIZED`        | 403    | Access denied           |
| `NOT_FOUND`           | 404    | Resource not found      |
| `DUPLICATE_ENTRY`     | 409    | Already exists          |
| `RATE_LIMIT_EXCEEDED` | 429    | Too many requests       |
| `INTERNAL_ERROR`      | 500    | Server error            |

---

## Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "data": { ...result... },
  "message": "description"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "error description",
  "errorCode": "ERROR_CODE"
}
```

---

## Rate Limits

| Endpoint      | Limit     |
| ------------- | --------- |
| `/auth/*`     | 5/15min   |
| `/payments/*` | 10/15min  |
| Others        | 100/15min |

---

## Testing

### cURL Examples

**Register:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John","username":"john"}'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

**Protected (with token):**

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Full Documentation:** See `API_ENDPOINTS.md` for detailed endpoint information
