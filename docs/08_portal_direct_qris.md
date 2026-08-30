# 08. Direct GoBiz Portal Integration (Self-Hosted QRIS)

Integrate dynamic QRIS payments directly using your existing GoBiz Merchant account (`portal.gofoodmerchant.co.id`) without waiting for Gojek's formal B2B Open API approval.

---

## 💡 How It Works

1. **Authentication (2 Options)**:
   - **Option A: Email & Password**:
     - Standard GoBiz accounts log in via phone SMS/OTP.
     - To enable email & password login, visit [portal.gofoodmerchant.co.id/id/account/profile](https://portal.gofoodmerchant.co.id/id/account/profile) and perform **Reset Password** / set up a password first.
     - Once set, use your merchant account email and the new password.
   - **Option B: Cookie Access Token**:
     - Log in to [portal.gofoodmerchant.co.id](https://portal.gofoodmerchant.co.id) on a **desktop/laptop browser** (mobile browsers cannot inspect cookies easily).
     - Open Developer Tools (`F12`), go to **Application** / **Storage** ➔ **Cookies** ➔ `https://portal.gofoodmerchant.co.id`.
     - Copy the cookie value named `access_token`.
2. **Dynamic QRIS Generation**:
   - Converts your store's static `QRIS_STRING` to dynamic QRIS (`010212`).
   - Injects Tag 54 with `amountToPay = baseAmount + fee + uniqueCode (2 or 3 digits)`.
   - Recalculates CRC16-CCITT checksum.
3. **Singleton Global Poller & Request Deduplication (Anti-Banned)**:
   - Built-in **Singleton Poller Engine** in the library.
   - Throttles upstream calls to a randomized **30s – 60s jitter window** to protect your merchant account from rate-limiting / ban.
   - **Request Deduplication**: If 100 concurrent customer checkout requests arrive simultaneously, only **1 HTTP request** reaches GoBiz; all 100 callers share the single response!

---

## 🚀 Backend Usage Examples (Express / NestJS / Bun)

### 1. Simple Dynamic QRIS Creation & Settlement Check

```typescript
import { GoBizPortal } from '@gobiz/merchant-sdk';

const portal = new GoBizPortal({
  token: process.env.GOPAY_ACCESS_TOKEN, // or email & password
  staticQris: process.env.QRIS_STRING,
  uniqueCodeDigits: 2, // 2 digits: 10..99 or 3 digits: 100..999
  pollIntervalMinMs: 30000, // 30s
  pollIntervalMaxMs: 60000, // 60s
});

// Create dynamic QRIS order
const order = portal.createDynamicPayment({
  amount: 50000,
  fee: 0,
  trxId: 'ORDER-1001',
});

console.log('Amount to Pay:', order.amountToPay); // e.g. Rp 50.012
console.log('QRIS String:', order.qrisString);
console.log('QR Image URL:', order.qrImageUrl);

// Check if customer has paid (auto-deduplicated & throttled)
const result = await portal.checkSettlement(order.amountToPay);
if (result.paid) {
  console.log('✅ Payment settled at:', result.paidAt);
}
```

---

### 2. Automatic Background Poller & Event Listener (Recommended for Backend Services)

You can run a background poller inside your backend server with a single method call:

```typescript
import { GoBizPortal } from '@gobiz/merchant-sdk';

const portal = new GoBizPortal({
  token: process.env.GOPAY_ACCESS_TOKEN,
  staticQris: process.env.QRIS_STRING,
});

// 1. Listen globally to any incoming paid transaction
portal.onPaymentPaid((tx) => {
  console.log(`[PAYMENT RECEIVED] Amount: Rp ${tx.amount}, Trx ID: ${tx.id}, Type: ${tx.payment_type}`);
  // Update your database, send webhook, or deliver goods
});

// 2. Start the background poller (runs with safe 30s-60s random jitter)
portal.startPoller();
```

---

### 3. Watch a Specific Transaction Until Paid

```typescript
// Watch a specific transaction (auto-starts background poller if needed)
const unwatch = portal.watchPayment(
  order.amountToPay,
  (tx) => {
    console.log(`Order ${order.trxId} has been paid! Mutation:`, tx);
  },
  () => {
    console.log(`Order ${order.trxId} expired before payment was received.`);
  },
  10 * 60 * 1000 // 10 minutes timeout
);

// Call unwatch() if customer cancels order manually
```
