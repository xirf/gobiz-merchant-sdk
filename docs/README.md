# GoBiz Open API Documentation

> Complete guide and technical reference for integrating with **GoBiz Open API** (Gojek / GoTo Financial).

---

## 📑 Table of Contents

1. [Overview & Environments](./01_authentication_goauth.md)
2. [OAuth 2.0 GoAuth Authentication](./01_authentication_goauth.md#oauth2-token-endpoint)
3. [Payment Integration (Dynamic QRIS)](./02_payment_qris_transactions.md)
4. [Outlet Information & Linking](./03_outlet_management.md)
5. [GoFood Integration (Orders & Menus)](./04_gofood_integration.md)
6. [Moka POS Integration](./05_mokapos_integration.md)
7. [Webhooks & Event Subscriptions](./06_webhooks_and_events.md)
8. [Error Handling & Glossary](./07_error_glossary.md)

---

## 🌐 Environments & Base URLs

| Environment | Base API URL | GoAuth Token URL |
| :--- | :--- | :--- |
| **Sandbox** | `https://api.partner-sandbox.gobiz.co.id` | `https://integration-goauth.gojekapi.com` |
| **Production** | `https://api.gobiz.co.id` | `https://accounts.go-jek.com` |

---

## 🚀 Quick Start with TypeScript SDK

```typescript
import { GoBiz, GoBizScope } from '@gobiz/merchant-sdk';

const gobiz = new GoBiz({
  clientId: process.env.GOBIZ_CLIENT_ID!,
  clientSecret: process.env.GOBIZ_CLIENT_SECRET!,
  outletId: 'G000012345',
  isProductionMode: false, // false for Sandbox
});

// 1. Create Dynamic QRIS Payment Transaction
const payment = await gobiz.createPayment('G000012345', {
  payment_type: 'qris',
  transaction_details: {
    order_id: 'ORDER-2026-001',
    gross_amount: 50000,
    currency: 'IDR',
  },
  item_details: [
    {
      id: 'SKU-001',
      name: 'Nasi Goreng Spesial',
      price: 50000,
      quantity: 1,
    },
  ],
  customer_details: {
    first_name: 'Budi',
    email: 'budi@example.com',
    phone: '+6281234567890',
  },
});

console.log('Transaction ID:', payment.transaction.id);
console.log('QRIS String:', payment.transaction.qris_string);
```
