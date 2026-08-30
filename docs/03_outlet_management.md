# 03. Outlet Information & Management

Manage merchant outlet associations and query partner properties.

---

## 1. Get All Linked Outlets

`GET /integrations/partner/v1/linked-outlets`

### Required Scope:
`partner:outlet:read`

### Query Parameters:
- `page` (number): Current page (default 1)
- `page_size` (number): Number of outlets per page (default 10)

### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "outlets": [
      {
        "id": "G000012345",
        "name": "Warung Enak Jakarta Pusat",
        "brand_name": "Warung Enak",
        "address": {
          "address": "Jl. Sudirman No. 10",
          "city": "Jakarta",
          "postal_code": "10220"
        },
        "phone_number": "+6281234567890",
        "status": "ACTIVE"
      }
    ],
    "page_info": {
      "page": 1,
      "page_size": 10,
      "total_count": 1
    }
  }
}
```

---

## 2. Get Outlet Information

`GET /integrations/partner/outlets/{outlet_id}/v1`

### Required Scope:
`partner:outlet:read`

### Response:
```json
{
  "success": true,
  "data": {
    "id": "G000012345",
    "name": "Warung Enak Jakarta Pusat",
    "brand_name": "Warung Enak",
    "status": "ACTIVE",
    "pop_id": "fa6082ea-06da-4483-9c7e-eeb0447ed53e"
  }
}
```

---

## 3. Link Outlet

`PUT /integrations/partner/v1/outlet-link`

### Required Scope:
`partner:outlet:write`

### Request Body:
```json
{
  "outlet_id": "G000012345",
  "product": "payment"
}
```
