# 01. GoAuth Authentication (OAuth 2.0)

GoBiz uses the standard **OAuth 2.0 Client Credentials Grant** for Machine-to-Machine (M2M) API authentication.

---

## 🔑 GoAuth Token Endpoint

### Endpoint URLs:
- **Sandbox:** `POST https://integration-goauth.gojekapi.com/oauth2/token`
- **Production:** `POST https://accounts.go-jek.com/oauth2/token`

### Request Headers:
- `Authorization: Basic base64(client_id:client_secret)`
- `Content-Type: application/x-www-form-urlencoded`
- `Accept: application/json`

### Request Parameters:
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `grant_type` | string | Yes | Must be `client_credentials` |
| `scope` | string | Yes | Space-separated list of scopes required for your API operations |

---

## 🛡️ Available Scopes

| Scope | Description |
| :--- | :--- |
| `payment:transaction:write` | Create QRIS payment transactions |
| `payment:transaction:read` | Read QRIS payment transaction status and details |
| `payment:pop:read` | Read payment Point of Payment (PoP) data |
| `partner:outlet:read` | Retrieve merchant outlet lists and details |
| `partner:outlet:write` | Link and unlink merchant outlets |
| `gofood:catalog:read` | Read GoFood menu catalogs and properties |
| `gofood:catalog:write` | Update and sync GoFood menu catalogs |
| `gofood:order:read` | Read incoming GoFood orders |
| `gofood:order:write` | Accept/reject orders or mark orders ready in the kitchen |
| `promo:food_promo:read` | Query GoFood active promotions |
| `mokapos:transaction:read` | Read Moka POS transactions |
| `mokapos:checkout:write` | Update Moka POS checkout records |

---

## 📥 Token Response

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "payment:transaction:write payment:transaction:read"
}
```

---

## ⚡ Using Bearer Token in API Requests

Send the retrieved `access_token` in the `Authorization` header:

```http
GET /integrations/payment/outlets/G000012345/v1/transactions/71839e9c... HTTP/1.1
Host: api.partner-sandbox.gobiz.co.id
Authorization: Bearer eyJhbGciOi...
Accept: application/json
```
