# 05. Moka POS Integration

GoBiz integrates with Moka POS (GoTo Financial POS cloud solution) to synchronize inventories, libraries, transactions, and sales types.

---

## Moka POS Scopes & Operations

| Scope | Operations |
| :--- | :--- |
| `mokapos:library:read` | Query item library, categories, and modifier sets |
| `mokapos:transaction:read` | Query offline POS sales and transaction history |
| `mokapos:reporting:read` | Query sales reports and summaries |
| `mokapos:checkout:write` | Push checkout items and external transactions |
| `mokapos:salestype:read` | Query dine-in, takeaway, and delivery sales types |
