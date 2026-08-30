# 04. GoFood Integration (Orders & Menus)

Connect restaurant POS systems directly to GoFood for menu synchronization, order processing, and kitchen status updates.

---

## 1. Sync Menu Catalog

`PUT /integrations/gofood/outlets/{outlet_id}/v1/catalogs`

### Required Scope:
`gofood:catalog:write`

### Request Body:
```json
{
  "categories": [
    {
      "id": "CAT-001",
      "name": "Makanan Utama",
      "items": [
        {
          "id": "SKU-001",
          "name": "Nasi Goreng Spesial",
          "price": 35000,
          "description": "Nasi goreng ayam dengan telur mata sapi",
          "in_stock": true
        }
      ]
    }
  ]
}
```

---

## 2. Mark Food Ready

`POST /integrations/gofood/outlets/{outlet_id}/v1/orders/{order_id}/ready`

### Required Scope:
`gofood:order:write`

Notifies the Gojek driver and consumer that the order preparation is complete and ready for pickup.

---

## 3. Accept / Reject Order

`POST /integrations/gofood/outlets/{outlet_id}/v1/orders/{order_id}/accept`

### Required Scope:
`gofood:order:write`

Acknowledge order receipt from GoFood.
