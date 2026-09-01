ORDER APIs

POST /orders
GET  /orders/:id

POST /orders/:id/items

POST /orders/:id/confirm
POST /orders/:id/prepare
POST /orders/:id/ready
POST /orders/:id/complete
POST /orders/:id/cancel


PAYMENT APIs

POST /payments/orders/:orderId
GET  /payments/orders/:orderId
GET  /payments/:id
POST /payments/:id/refund

payment flow
Order
  │
  │ POST /payments/orders/:orderId
  ▼
Check order
  │
  ├── CANCELLED → ❌
  ├── COMPLETED → ❌
  │
  ▼
Calculate:
order.total
    -
completed payments
    =
remaining amount
  │
  ▼
Validate payment <= remaining
  │
  ▼
Create COMPLETED payment


Create
├── new customer
├── existing customer
├── DINE_IN without table → 400
├── TAKEAWAY with table → 400
├── DELIVERY with table → 400
├── new dine-in order
├── existing active table order
├── different customer at same table → 409
├── fully paid active order → 409
└── duplicate Idempotency-Key

Add Items
├── active order → success
├── completed → reject
├── cancelled → reject
├── fully paid → reject
├── catalog item missing
└── modifier missing

Transitions
├── PENDING → CONFIRMED
├── CONFIRMED → PREPARING
├── PREPARING → READY
├── READY → COMPLETED
├── invalid transitions
└── nonexistent order

Complete
└── unpaid order → reject

Cancel
├── PENDING → CANCELLED
├── CONFIRMED → reject
├── PREPARING → reject
└── paid pending order → reject

payment service
Create
├── valid payment
├── overpayment
├── zero/negative
├── cancelled order
├── completed order
└── duplicate transaction

Refund
├── completed payment + PENDING order
├── already refunded
├── failed payment
├── confirmed order
├── preparing order
└── nonexistent payment