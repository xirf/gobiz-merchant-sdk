# @xirf/gobiz-merchant-sdk

TypeScript library for interacting with GoBiz (GoTo Financial / Gojek) Open APIs and GoBiz Merchant Web Portal.

> **WARNING: UNOFFICIAL SOFTWARE & ACCOUNT RISK DISCLAIMER**
> 
> This is an **independent, unofficial** community library. It is **not** affiliated, associated, authorized, endorsed by, or in any way officially connected with PT GoTo Gojek Tokopedia Tbk, GoBiz, GoPay, or any of their subsidiaries or affiliates.
> 
> **Account Suspension Risk:** The portal integration features (`GoBizPortal`) interact directly with the merchant web dashboard. Automated access, credential-based authentication, and transaction polling may violate the GoBiz Terms of Service and could result in account rate-limiting, temporary suspension, or permanent termination by GoTo Financial. Use this library at your own discretion and risk.

---

## Features

- **Official Open API Client (`GoBiz`)**: OAuth2 client credentials flow, QRIS payment creation, outlet listing, and GoFood menu catalog synchronization.
- **Unofficial Merchant Portal Client (`GoBizPortal`)**: Direct portal authentication (via email/password or session cookie token), transaction mutation fetching, and settlement matching.
- **Dynamic QRIS Generation**: Converts standard static QRIS payload (`010211`) to dynamic QRIS payload (`010212`) by inserting transaction amount (Tag 54) and recomputing the EMVCo CRC16 checksum.
- **3-Digit Unique Code Allocator**: Generates 3-digit unique codes (`100`–`999`) for distinguishing concurrent payments with identical base amounts, supporting both rounding up (`+kode`) and rounding down (`-kode`).
- **Singleton Poller & Request Deduplication**: In-flight request deduplication and configurable randomized polling interval (30s–240s default) to prevent concurrent flood requests.

---

## Installation

```bash
# Using Bun
bun add @xirf/gobiz-merchant-sdk

# Using NPM
npm install @xirf/gobiz-merchant-sdk

# Direct from GitHub
npm install github:xirf/gobiz-merchant-sdk
```

---

## Usage

### 1. Dynamic QRIS Generation & Portal Settlement Matching

```typescript
import { GoBizPortal } from '@xirf/gobiz-merchant-sdk'

const portal = new GoBizPortal({
  authMethod: 'password', // or 'cookie'
  email: 'merchant@example.com',
  password: 'your_password',
  // token: 'cookie_access_token_here', // required if authMethod is 'cookie'
  staticQris: '00020101021126610014COM.GO-JEK.WWW...',
  roundingMode: 'up', // 'up' adds unique code (+), 'down' subtracts (-)
  uniqueCodeDigits: 3, // allocates 100..999
  pollIntervalMinMs: 30000,  // 30 seconds
  pollIntervalMaxMs: 240000, // 240 seconds
})

// Generate a dynamic QRIS string for an order
const order = portal.createDynamicPayment({
  amount: 50000,
  trxId: 'ORDER-1001',
  roundingMode: 'up',
  expireMinutes: 15,
})

console.log('Customer must pay:', order.amountToPay) // e.g. 50421
console.log('Dynamic QRIS payload:', order.qrisString)

// Check settlement status manually
const settlement = await portal.checkSettlement(order.amountToPay)
if (settlement.paid) {
  console.log('Payment confirmed at:', settlement.paidAt)
}

// Or listen for real-time settlement events
portal.onPaymentPaid((tx) => {
  console.log(`Payment received for nominal Rp ${tx.amount}`)
})

portal.startPoller()
```

---

### 2. Standalone Dynamic QRIS Converter

If you only need to convert a static QRIS string into a dynamic QRIS string with an amount:

```typescript
import { generateDynamicQris, appendUniqueCode } from '@xirf/gobiz-merchant-sdk'

const staticQris = '00020101021126610014COM.GO-JEK.WWW...'
const baseAmount = 75000

// Generate unique code (100-999) and compute final amount
const { amountToPay, uniqueCode } = appendUniqueCode(baseAmount, {
  digits: 3,
  mode: 'up',
})

// Generate valid EMVCo dynamic QRIS string
const dynamicQris = generateDynamicQris(staticQris, amountToPay)
console.log(dynamicQris)
```

---

### 3. Official GoBiz Open API Client

For merchants using the official GoBiz Developer Portal with Client ID and Client Secret:

```typescript
import { GoBiz } from '@xirf/gobiz-merchant-sdk'

const client = new GoBiz({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  environment: 'production', // or 'sandbox'
})

// Create QRIS payment
const payment = await client.payment.createQrisPayment({
  outletId: 'outlet_123',
  amount: 50000,
  orderId: 'ORDER-2001',
})

// Check status
const status = await client.payment.getPaymentStatus('ORDER-2001')
console.log(status.transactionStatus)
```

---

## Configuration Reference

### `GoBizPortalConfig`

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `authMethod` | `'password' \| 'cookie'` | `'password'` | Authentication strategy for GoBiz portal. |
| `email` | `string` | `undefined` | GoBiz portal account email (required for `'password'`). |
| `password` | `string` | `undefined` | GoBiz portal account password (required for `'password'`). |
| `token` | `string` | `undefined` | Session cookie token (required for `'cookie'`). |
| `staticQris` | `string` | `undefined` | Merchant static QRIS string used as template for dynamic QRIS. |
| `roundingMode` | `'up' \| 'down'` | `'up'` | Direction of 3-digit unique code allocation. |
| `uniqueCodeDigits` | `2 \| 3` | `3` | Number of digits for unique code allocation. |
| `pollIntervalMinMs` | `number` | `30000` | Minimum jitter interval for background settlement poller (ms). |
| `pollIntervalMaxMs` | `number` | `240000` | Maximum jitter interval for background settlement poller (ms). |
| `cacheTtlMs` | `number` | `15000` | In-memory cache duration for recent mutation responses (ms). |

---

## Security and Operational Guidelines

1. **Avoid Aggressive Polling:** Do not configure polling intervals below 30 seconds. Excessive requests increase the likelihood of IP rate-limiting or account suspension.
2. **Credential Storage:** Store credentials in environment variables or encrypted secrets management. Never commit raw passwords or tokens into version control.
3. **Session Expiry:** Portal authentication tokens expire periodically. When using password authentication, the SDK handles re-login automatically upon encountering 401 responses.

---

## License

This project is licensed under the [MIT License](LICENSE).
