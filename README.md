# Billing Application

A RESTful billing service built with **NestJS** and **TypeScript**. Uses in-memory storage — no database required.

## Solution Overview

### Billing Rules

| Rule | Implementation |
|------|---------------|
| **Monthly Base Fee** | Taken from the currency's `monthlyFeeGbp`, prorated by billing period days ÷ 30 |
| **Transaction Fees** | £0.10 per transaction exceeding the account's `transactionThreshold` |
| **Promotional Discount** | Percentage discount applied if billing period start falls within `discountDays` of account creation |

### Project Structure

```
src/
├── currencies/       # Currency management
├── accounts/         # Account management  
├── billing/          # Billing calculation logic
└── main.ts           # App entry point with global validation
```

---

## Getting Started

```bash
npm install
npm run start
```

Server runs on `http://localhost:3000`

---

## API Endpoints

### POST /currencies
Add a new currency with its monthly base fee.

```bash
curl -X POST http://localhost:3000/currencies \
  -H "Content-Type: application/json" \
  -d '{"currency":"GBP","monthlyFeeGbp":10}'
```

### GET /currencies
List all currencies.

```bash
curl http://localhost:3000/currencies
```

---

### POST /accounts
Create a new customer account.

```bash
curl -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc-001",
    "currency": "GBP",
    "transactionThreshold": 100,
    "discountDays": 30,
    "discountRate": 20
  }'
```

### GET /accounts
List all accounts.

```bash
curl http://localhost:3000/accounts
```

### GET /accounts/:accountId
Get a specific account.

```bash
curl http://localhost:3000/accounts/acc-001
```

---

### POST /accounts/:accountId/bill
Calculate the bill for an account.

```bash
curl -X POST http://localhost:3000/accounts/acc-001/bill \
  -H "Content-Type: application/json" \
  -d '{
    "billingPeriodStart": "2026-04-16",
    "billingPeriodEnd": "2026-05-16",
    "transactionCount": 150
  }'
```

**Response:**
```json
{
  "accountId": "acc-001",
  "currency": "GBP",
  "billingPeriodStart": "2026-04-16",
  "billingPeriodEnd": "2026-05-16",
  "baseFeeGbp": 10.0,
  "transactionFeeGbp": 5.0,
  "discountApplied": true,
  "discountRate": 20,
  "discountAmountGbp": 3.0,
  "totalGbp": 12.0
}
```

---

## Example Billing Calculation

Given:
- Currency: GBP, monthly fee £10
- Account: threshold 100 transactions, 30-day 20% discount
- Billing: 30-day period, 150 transactions

| Component | Calculation | Amount |
|-----------|-------------|--------|
| Base fee | £10/30 × 30 days | £10.00 |
| Transaction fee | 50 excess × £0.10 | £5.00 |
| Subtotal | | £15.00 |
| Discount (20%) | £15.00 × 20% | -£3.00 |
| **Total** | | **£12.00** |

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests and output JSON results
npm test -- --json --outputFile=test-results.json
```

**Test coverage:**
- Monthly base fee (charge, proration, currency-specific fee)
- Transaction fees (at threshold, over threshold, zero threshold)
- Promotional discount (within window, expired, applied to full subtotal)
- Error handling (unknown account, invalid dates, billing before account creation)

---

## Error Handling

| Scenario | HTTP Status |
|----------|-------------|
| Duplicate currency | `409 Conflict` |
| Duplicate account | `409 Conflict` |
| Unknown account | `404 Not Found` |
| Unknown currency | `404 Not Found` |
| Invalid date format | `400 Bad Request` |
| End date before start date | `400 Bad Request` |
| Billing period before account creation | `400 Bad Request` |
| Invalid payload | `400 Bad Request` |
