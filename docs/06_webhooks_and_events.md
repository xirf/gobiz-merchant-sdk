# 06. Webhooks & Event Subscriptions

Receive real-time notifications for payment settlements, GoFood order state changes, and catalog updates.

---

## 🔔 Subscribing to Webhooks

Webhooks can be configured in the GoBiz Developer Portal or registered via the Notification Subscriptions API.

---

## 📦 Event Payload Structure

```json
{
  "event_type": "payment.settlement",
  "event_id": "evt-9472-uuid",
  "timestamp": "2026-08-30T16:05:00Z",
  "data": {
    "outlet_id": "G000012345",
    "transaction_id": "71839e9c-944b-40ce-bd31-8a76db666f36",
    "order_id": "ORDER-2026-001",
    "payment_type": "qris",
    "status": "settlement",
    "gross_amount": 50000,
    "currency": "IDR",
    "settlement_at": "2026-08-30T16:05:00Z"
  }
}
```

---

## 🛡️ Best Practices

1. **Verify Idempotency**: Always verify if the `event_id` or `order_id` was already processed.
2. **Respond with HTTP 200 OK**: Return a 200 OK status immediately upon receiving the event to acknowledge receipt.
