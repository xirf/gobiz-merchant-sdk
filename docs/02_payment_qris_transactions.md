# 02. Payment Integration (Dynamic QRIS)

GoBiz allows merchant partners to generate dynamic **QRIS** (Quick Response Code Indonesian Standard) transactions. Customers can pay using the Gojek / GoPay app or **any QRIS-compliant banking/e-wallet application in Indonesia** (BCA, Mandiri, BRI, BNI, DANA, OVO, ShopeePay, LinkAja).

---

## 1. Create Payment Transaction

`POST /integrations/payment/outlets/{outlet_id}/v2/transactions`

### Required Scope:
`payment:transaction:write`

### Headers:
- `Authorization: Bearer {access_token}`
- `Idempotency-Key: {unique_string_max_32_chars}`
- `Content-Type: application/json`

### Request Body:
```json
{
  "payment_type": "qris",
  "transaction_details": {
    "order_id": "ORDER-2026-001",
    "gross_amount": 50000,
    "currency": "IDR"
  },
  "item_details": [
    {
      "id": "SKU-001",
      "name": "Nasi Goreng Spesial",
      "price": 35000,
      "quantity": 1,
      "brand": "Warung Enak",
      "category": "Food"
    },
    {
      "id": "SKU-002",
      "name": "Es Teh Manis",
      "price": 15000,
      "quantity": 1,
      "brand": "Warung Enak",
      "category": "Beverage"
    }
  ],
  "customer_details": {
    "first_name": "Budi",
    "last_name": "Santoso",
    "email": "budi.santoso@example.com",
    "phone": "+6281234567890"
  },
  "metadata": {}
}
```

### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "outlet": {
      "id": "G000012345",
      "pop_id": "fa6082ea-06da-4483-9c7e-eeb0447ed53e"
    },
    "transaction": {
      "id": "71839e9c-944b-40ce-bd31-8a76db666f36",
      "payment_type": "qris",
      "status": "pending",
      "qris_string": "00020101021226610014COM.GO-JEK.WWW01189360091430438058080210G7641517890303UMI51440014ID.CO.QRIS.WWW0215ID10190450190010303UMI5204581253033605802ID5907Circlek6015Bandung deket r61054025762470703A015036c98a2234-f6d1-46f6-91d3-2597ee7863bc5406122.0063044447",
      "order_id": "ORDER-2026-001",
      "gross_amount": 50000,
      "currency": "IDR",
      "created_at": "2026-08-30T11:33:08Z",
      "settlement_at": null
    },
    "actions": [
      {
        "name": "generate-qr-code",
        "method": "GET",
        "url": "https://api.partner-sandbox.gobiz.co.id/transactions/71839e9c-944b-40ce-bd31-8a76db666f36/qr-code"
      }
    ]
  }
}
```

---

## 2. Get Transaction Detail & Status

`GET /integrations/payment/outlets/{outlet_id}/v1/transactions/{id}`

### Required Scope:
`payment:transaction:read`

### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "outlet": {
      "id": "G000012345",
      "pop_id": "fa6082ea-06da-4483-9c7e-eeb0447ed53e"
    },
    "transaction": {
      "id": "71839e9c-944b-40ce-bd31-8a76db666f36",
      "payment_type": "qris",
      "status": "settlement",
      "qris_string": "00020101021226610014COM.GO-JEK.WWW...",
      "order_id": "ORDER-2026-001",
      "gross_amount": 50000,
      "currency": "IDR",
      "created_at": "2026-08-30T11:33:08Z",
      "settlement_at": "2026-08-30T11:35:12Z"
    },
    "actions": []
  }
}
```

### Transaction Statuses:
- `pending`: Awaiting customer scan and payment.
- `settlement`: Successfully paid by customer.
- `expire`: Transaction expired without payment.
- `cancel`: Transaction cancelled.
- `refund`: Transaction refunded.
