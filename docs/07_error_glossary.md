# 07. Error Handling & Glossary

GoBiz uses standard HTTP status codes combined with structured JSON error responses.

---

## 🛑 Error Response Format

```json
{
  "success": false,
  "errors": [
    {
      "message_title": "UnregisteredOutlet",
      "message": "The outlet is not yet registered for integration. Please contact the support team.",
      "code": "HTTP_404",
      "message_severity": "error"
    }
  ]
}
```

---

## 📖 Error Glossary

| Error Title | HTTP Code | Cause & Solution |
| :--- | :--- | :--- |
| `UnsupportedAcceptType` | `415 / 406` | Invalid `Accept` header. Ensure `Accept: application/json` is sent. |
| `UnregisteredOutlet` | `404` | Outlet ID is not linked or registered in the Partner Integration system. |
| `Unauthorized` / `Session Expired` | `401` | Access token is missing, expired, or invalid. Request a new token via GoAuth. |
| `Forbidden` | `403` | Access token lacks the required scope for this endpoint. |
| `Conflict` | `409` | Conflict in resource state or duplicate idempotency key with different payload. |
| `UnprocessableEntity` | `422` | Syntax valid but request parameters failed validation. |
| `Server Error` | `500 / 502 / 503` | GoBiz internal system error. Implement exponential backoff retry. |

---

## 🛠️ TypeScript Error Handling Example

```typescript
import { GoBiz, GoBizError } from '@gobiz/merchant-sdk';

try {
  const result = await gobiz.createPayment('G000012345', {
    payment_type: 'qris',
    transaction_details: {
      order_id: 'ORD-001',
      gross_amount: 10000,
    },
  });
} catch (error) {
  if (error instanceof GoBizError) {
    console.error(`Status: ${error.status}`);
    console.error(`Errors:`, error.errors);
  } else {
    console.error('Unexpected error:', error);
  }
}
```
