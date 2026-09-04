# FoodMatrix Inventory Service — Master Implementation Prompt

Build the **Inventory Service** for the FoodMatrix restaurant/franchise management platform using **NestJS, Prisma, PostgreSQL, Kafka, and TypeScript**.

The Inventory Service must be designed as a **business workflow and stock orchestration service**, NOT as a simple CRUD service.

## 1. Existing architecture

FoodMatrix uses microservices:

```text
Organization Service
HR / Workforce Service
Catalog Service
Order Service
Inventory Service
```

Each service owns its own PostgreSQL database.

The Inventory Service must NOT create database foreign keys to entities owned by other services.

Use **soft references** for:

```text
restaurantId
warehouseId
ingredientId
menuItemId
modifierId
orderId
userId
```

All inventory operations must remain inside the Inventory Service database.

---

# 2. Core inventory responsibilities

The Inventory Service is responsible for:

```text
Warehouse stock
Restaurant stock
Stock consumption
Stock requests
Warehouse approvals
Stock transfers
Shipment tracking
In-transit inventory
Restaurant receiving
Partial fulfillment
Receiving discrepancies
Waste
Stock movements / audit ledger
Low-stock detection
Kafka order consumption
Kafka inventory events
```

---

# 3. IMPORTANT: Do NOT build this as CRUD

Do NOT create generic APIs such as:

```text
PATCH /warehouse-stock/:id
PATCH /restaurant-stock/:id
PATCH /stock-transfer/:id
```

for arbitrary state or quantity changes.

Inventory changes must happen through controlled **business operations / commands**.

Examples:

```text
receiveWarehouseStock()
adjustWarehouseStock()
requestStock()
approveStockRequest()
rejectStockRequest()
startPicking()
markReadyToShip()
shipTransfer()
receiveTransfer()
consumeOrderIngredients()
recordWaste()
adjustRestaurantStock()
detectLowStock()
```

Every stock-changing operation must enforce business rules and use Prisma transactions where multiple records must change atomically.

---

# 4. Inventory database domain

The Inventory Service must contain these concepts:

```text
WarehouseStock
RestaurantStock
StockMovement
StockRequest
StockRequestItem
StockTransfer
StockTransferItem
Shipment
InventoryTransit
TransferDiscrepancy
WasteLog
```

---

# 5. WarehouseStock

Warehouse stock represents bulk inventory physically stored at a warehouse.

Fields:

```text
id
warehouseId
ingredientId
quantityOnHand
updatedAt
```

Unique:

```text
warehouseId + ingredientId
```

Warehouse quantity must NOT be directly edited through a generic update endpoint.

Warehouse stock changes through business operations such as:

```text
PURCHASE / receiving stock
TRANSFER_OUT
ADJUSTMENT
```

Example:

```text
Purchase 100 kg tomato
        ↓
WarehouseStock +100
        +
StockMovement PURCHASE +100
```

Both must happen atomically.

---

# 6. RestaurantStock

Restaurant stock represents ingredients currently available at a restaurant.

Fields:

```text
id
restaurantId
ingredientId
quantityOnHand
reorderLevel
reorderQuantity
updatedAt
```

Unique:

```text
restaurantId + ingredientId
```

The service must support:

```text
POS consumption
TRANSFER_IN
WASTE
ADJUSTMENT
low-stock detection
```

Example:

```text
Restaurant stock = 4 kg
Reorder level   = 10 kg

4 <= 10
   ↓
LOW_STOCK event
```

---

# 7. StockMovement

`StockMovement` is an **immutable append-only inventory audit ledger**.

Never edit or delete a movement after creation.

Possible movement types:

```text
POS_SALE
PURCHASE
TRANSFER_IN
TRANSFER_OUT
ADJUSTMENT
WASTE
```

Every stock quantity change must have a corresponding movement record.

Example:

```text
Warehouse:
+100 PURCHASE

Warehouse:
-35 TRANSFER_OUT

Restaurant:
+35 TRANSFER_IN

Restaurant:
-2 POS_SALE

Restaurant:
-1 WASTE
```

The movement ledger answers:

> Why did the stock quantity become this value?

---

# 8. Restaurant stock request workflow

A restaurant does NOT directly create a transfer.

First it creates a **StockRequest**.

Example:

```text
Restaurant Manager
      ↓
Request 40 kg tomato
      ↓
StockRequest = REQUESTED
```

Stock request statuses:

```text
REQUESTED
APPROVED
REJECTED
FULFILLED
CANCELLED
```

StockRequest must contain:

```text
id
restaurantId
requestedBy
approvedBy
rejectedBy
status
reason
rejectionReason
requestedAt
approvedAt
rejectedAt
fulfilledAt
createdAt
updatedAt
```

StockRequestItem must contain:

```text
id
stockRequestId
ingredientId
requestedQty
approvedQty
```

---

# 9. IMPORTANT: Partial approval is supported

A restaurant may request more than the warehouse can provide.

Example:

```text
Restaurant requests = 40 kg
Warehouse approves  = 35 kg
```

This is valid.

The service must NOT overwrite 40 with 35.

Store:

```text
requestedQty = 40
approvedQty  = 35
```

The system can calculate:

```text
unfulfilledQty = requestedQty - approvedQty
               = 5 kg
```

Do not require the frontend to calculate this.

The backend owns the business calculation.

---

# 10. Warehouse approval

Warehouse Admin reviews the stock request.

Endpoint concept:

```text
POST /stock-requests/:id/approve
```

The approval request may contain approved quantities for each item.

Before approving:

```text
Validate request exists
Validate request status == REQUESTED
Validate approver permissions
Validate approvedQty >= 0
Validate approvedQty <= requestedQty
```

Partial approval is valid.

Example:

```text
Requested:

Tomato 40
Cheese  10
Rice    20

Approved:

Tomato 35
Cheese   8
Rice    20
```

The request remains historically accurate.

---

# 11. Warehouse rejection

Endpoint concept:

```text
POST /stock-requests/:id/reject
```

Requires:

```text
reason
```

Change status:

```text
REQUESTED → REJECTED
```

Store:

```text
rejectedBy
rejectedAt
rejectionReason
```

---

# 12. StockTransfer

A StockTransfer represents the physical fulfillment of an approved request.

The transfer may reference:

```text
stockRequestId
fromWarehouseId
toRestaurantId
```

Transfer status lifecycle:

```text
REQUESTED
APPROVED
PICKING
READY_TO_SHIP
SHIPPED
IN_TRANSIT
RECEIVED
DISPUTED
COMPLETED
REJECTED
CANCELLED
```

Transfer must store workflow actors:

```text
requestedBy
approvedBy
rejectedBy
shippedBy
receivedBy
```

and timestamps:

```text
requestedAt
approvedAt
rejectedAt
shippedAt
receivedAt
completedAt
```

---

# 13. StockTransferItem quantities

Each transfer item must preserve all stages:

```text
requestedQty
approvedQty
shippedQty
receivedQty
```

Example:

```text
requested = 40
approved  = 35
shipped   = 35
received  = 33
```

Never collapse these values into one quantity.

---

# 14. Warehouse stock deduction

Do NOT reduce warehouse stock when the request is merely approved.

Approval means:

> Warehouse agrees to fulfill the request.

Actual stock leaves the warehouse when it is shipped.

At shipment:

```text
WarehouseStock - shippedQty
        +
StockMovement TRANSFER_OUT
        +
InventoryTransit + shippedQty
```

This must happen atomically.

Prevent shipment when:

```text
shippedQty > available warehouse stock
```

---

# 15. InventoryTransit

InventoryTransit represents stock that has left the warehouse but has not yet been received by the restaurant.

Example:

```text
Warehouse = 100
Restaurant = 20

Ship 35

Warehouse = 65
Restaurant = 20
Transit = 35
```

Do not pretend the restaurant owns the 35 before receipt.

When the restaurant receives:

```text
Transit - receivedQty
RestaurantStock + receivedQty
StockMovement TRANSFER_IN
```

---

# 16. Shipment

Shipment is separate from StockTransfer because it represents the physical logistics operation.

Shipment must support:

```text
carrierName
trackingNumber

shipperName
shipperPhone

driverName
driverPhone

vehicleNumber
vehicleType

dispatchLocation
deliveryLocation

estimatedArrival
dispatchedAt
deliveredAt

notes

createdAt
updatedAt
```

One transfer can have one shipment.

Example:

```text
Transfer
   ↓
Shipment
   ├── Carrier
   ├── Tracking number
   ├── Shipper
   ├── Driver
   ├── Vehicle
   ├── ETA
   └── Delivery information
```

Do not put all shipment logistics directly into StockTransfer.

---

# 17. Shipment creation

Conceptual endpoint:

```text
POST /stock-transfers/:id/shipment
```

Example payload:

```json
{
  "carrierName": "ABC Logistics",
  "trackingNumber": "TRK-12345",
  "shipperName": "Ravi Kumar",
  "shipperPhone": "9876543210",
  "driverName": "Raj",
  "driverPhone": "9876500000",
  "vehicleNumber": "KA01AB1234",
  "vehicleType": "TRUCK",
  "estimatedArrival": "2026-09-04T14:00:00Z"
}
```

---

# 18. Ship transfer

Conceptual endpoint:

```text
POST /stock-transfers/:id/ship
```

Validate:

```text
Transfer exists
Transfer status == READY_TO_SHIP
Shipment exists
Shipment information is valid
Shipped quantities <= approved quantities
Shipped quantities <= warehouse stock
```

Then inside ONE Prisma transaction:

```text
WarehouseStock decreases
InventoryTransit increases
StockMovement TRANSFER_OUT created
Shipment.dispatchedAt set
Transfer.shippedAt set
Transfer.status = SHIPPED
```

After successful commit, publish:

```text
INVENTORY.TRANSFER_SHIPPED
```

to Kafka.

---

# 19. Restaurant receiving

Restaurant Manager receives the shipment.

Conceptual endpoint:

```text
POST /stock-transfers/:id/receive
```

The manager provides the **actual received quantity**.

Example:

```json
{
  "items": [
    {
      "transferItemId": "item-1",
      "receivedQty": 33,
      "reason": "2 kg missing"
    }
  ]
}
```

The frontend must NOT submit a calculated discrepancy quantity.

The backend calculates:

```text
discrepancyQty = shippedQty - receivedQty
```

Example:

```text
shipped = 35
received = 33

discrepancy = 2
```

---

# 20. Receiving transaction

On receipt, use ONE Prisma transaction:

```text
Validate transfer state
Validate receivedQty >= 0
Validate receivedQty <= shippedQty

Update StockTransferItem.receivedQty

InventoryTransit decreases

RestaurantStock increases by receivedQty

Create StockMovement TRANSFER_IN

If receivedQty < shippedQty:
    create TransferDiscrepancy

Update transfer status

Update received timestamps
```

Do not add the entire shipped amount if the restaurant receives less.

Example:

```text
Shipped = 35
Received = 33

RestaurantStock +33
NOT +35
```

---

# 21. Transfer discrepancies

Discrepancies are **derived by the backend**.

Types:

```text
SHORT_RECEIPT
DAMAGED
MISSING
WRONG_ITEM
OTHER
```

A discrepancy should contain:

```text
transferId
transferItemId
type
expectedQty
actualQty
reason
reportedBy
resolvedBy
resolution
createdAt
resolvedAt
```

Do not accept:

```text
discrepancyQty
```

as trusted client input.

Calculate it from:

```text
expectedQty
actualQty
```

For example:

```text
expected = shippedQty = 35
actual   = receivedQty = 33

difference = 2
```

---

# 22. Important distinction between shortage types

There are two separate concepts.

### Warehouse short fulfillment

```text
requestedQty > approvedQty
```

Example:

```text
Requested = 40
Approved  = 35

Unfulfilled = 5
```

This happens during warehouse approval.

### Shipment/receiving discrepancy

```text
shippedQty > receivedQty
```

Example:

```text
Shipped  = 35
Received = 33

Discrepancy = 2
```

This happens during restaurant receiving.

Do not mix these two.

---

# 23. Order consumption through Kafka

Normal restaurant stock consumption from a POS order must NOT use a public CRUD endpoint.

Order Service publishes:

```text
ORDER_CONFIRMED
```

to Kafka.

Example event:

```json
{
  "event": "ORDER_CONFIRMED",
  "orderId": "order-123",
  "restaurantId": "restaurant-1",
  "items": [
    {
      "menuItemId": "burger-1",
      "quantity": 2,
      "modifierIds": [
        "cheese-1"
      ]
    }
  ]
}
```

Inventory Service consumes this event.

Flow:

```text
Kafka
  ↓
ORDER_CONFIRMED
  ↓
Inventory Consumer
  ↓
OrderConsumptionService
  ↓
Catalog Service
  ↓
Menu item recipe
+
Modifier recipe
  ↓
Calculate ingredient requirements
  ↓
Check RestaurantStock
  ↓
Deduct ingredients
  ↓
Create StockMovement POS_SALE
  ↓
Check low-stock thresholds
  ↓
Publish inventory events
```

---

# 24. Recipe calculation

Example menu item:

```text
Burger

Patty   = 1 unit
Bun     = 1 unit
Tomato  = 50 g
Lettuce = 20 g
```

Order:

```text
quantity = 2
```

Required:

```text
Patty   = 2
Bun     = 2
Tomato  = 100 g
Lettuce = 40 g
```

Modifier:

```text
Cheese = 20 g
```

For two burgers:

```text
Cheese = 40 g
```

Combine menu item recipe + modifier recipe before deducting stock.

---

# 25. Order consumption transaction

For one confirmed order:

```text
BEGIN TRANSACTION

For each required ingredient:

    Fetch RestaurantStock

    Validate quantityOnHand >= requiredQty

    Deduct requiredQty

    Create StockMovement POS_SALE

    Check reorder threshold

COMMIT
```

If one ingredient is insufficient:

```text
Do NOT partially deduct the order.
Rollback the transaction.
```

This must be atomic.

---

# 26. Low-stock detection

RestaurantStock contains:

```text
quantityOnHand
reorderLevel
reorderQuantity
```

After stock changes:

```text
if quantityOnHand <= reorderLevel
    publish LOW_STOCK
```

Example:

```json
{
  "event": "INVENTORY.LOW_STOCK",
  "restaurantId": "restaurant-1",
  "ingredientId": "tomato-1",
  "quantityOnHand": 4,
  "reorderLevel": 10,
  "suggestedQuantity": 20
}
```

Notification handling should be event-driven.

Inventory should publish the event rather than tightly coupling itself to email/SMS/push implementations.

---

# 27. Recommended replenishment calculation

For a simple v1:

```text
suggestedRequestQty =
targetStock - quantityOnHand - quantityInTransit
```

Example:

```text
Target = 50
Current = 12
In Transit = 10

Suggested = 50 - 12 - 10
          = 28
```

This prevents duplicate replenishment requests.

Later the service can support:

```text
average daily usage
lead time
safety stock
forecasting
```

---

# 28. Waste

Conceptual endpoint:

```text
POST /restaurants/:restaurantId/waste
```

Payload:

```json
{
  "ingredientId": "tomato-1",
  "quantity": 2,
  "reason": "Spoilage"
}
```

Transaction:

```text
RestaurantStock -2
StockMovement WASTE -2
WasteLog created
```

---

# 29. Warehouse stock receiving

Conceptual endpoint:

```text
POST /warehouse/stock/receive
```

Payload:

```json
{
  "warehouseId": "warehouse-1",
  "ingredientId": "tomato-1",
  "quantity": 100,
  "referenceId": "purchase-123"
}
```

Transaction:

```text
WarehouseStock +100
StockMovement PURCHASE +100
```

---

# 30. Kafka events

Inventory should consume:

```text
ORDER_CONFIRMED
```

Inventory should publish events such as:

```text
INVENTORY.LOW_STOCK
INVENTORY.STOCK_DEPLETED

INVENTORY.TRANSFER_REQUESTED
INVENTORY.TRANSFER_APPROVED
INVENTORY.TRANSFER_REJECTED
INVENTORY.TRANSFER_SHIPPED
INVENTORY.TRANSFER_RECEIVED
INVENTORY.TRANSFER_COMPLETED
INVENTORY.TRANSFER_DISPUTED

INVENTORY.CONSUMPTION_FAILED
```

Use consistent event naming and include:

```text
eventId
eventType
timestamp
source
correlationId
payload
```

Design consumers to be idempotent.

Do not process the same Kafka order event twice and deduct stock twice.

Use an appropriate idempotency/event-processing strategy.

---

# 31. Suggested modules

Organize by business capability, NOT one module per Prisma table.

```text
src/
├── modules/
│
├── warehouse/
│   ├── warehouse-stock.service.ts
│   ├── warehouse.controller.ts
│   └── warehouse.module.ts
│
├── restaurant-inventory/
│   ├── restaurant-inventory.service.ts
│   ├── restaurant-inventory.controller.ts
│   └── restaurant-inventory.module.ts
│
├── stock-request/
│   ├── dto/
│   ├── stock-request.service.ts
│   ├── stock-request.controller.ts
│   └── stock-request.module.ts
│
├── stock-transfer/
│   ├── dto/
│   ├── stock-transfer.service.ts
│   ├── stock-transfer.controller.ts
│   └── stock-transfer.module.ts
│
├── shipment/
│   ├── shipment.service.ts
│   ├── shipment.controller.ts
│   └── shipment.module.ts
│
├── consumption/
│   ├── order-consumption.service.ts
│   └── consumption.module.ts
│
├── stock-movement/
│   ├── stock-movement.service.ts
│   └── stock-movement.module.ts
│
├── waste/
│   ├── waste.service.ts
│   ├── waste.controller.ts
│   └── waste.module.ts
│
└── low-stock/
    ├── low-stock.service.ts
    └── low-stock.module.ts
```

Infrastructure:

```text
src/
├── kafka/
│   ├── consumers/
│   │   └── order-confirmed.consumer.ts
│   ├── producers/
│   │   └── inventory-events.producer.ts
│   └── kafka.module.ts
│
├── integrations/
│   └── catalog/
│       ├── catalog.client.ts
│       └── catalog.module.ts
│
├── prisma/
├── auth/
└── app.module.ts
```

---

# 32. API design

Use command-oriented endpoints.

### Stock requests

```text
POST /stock-requests
GET  /stock-requests/:id
GET  /restaurants/:restaurantId/stock-requests
POST /stock-requests/:id/approve
POST /stock-requests/:id/reject
POST /stock-requests/:id/cancel
```

### Transfers

```text
GET  /stock-transfers/:id
GET  /warehouses/:warehouseId/transfers
GET  /restaurants/:restaurantId/transfers

POST /stock-transfers/:id/start-picking
POST /stock-transfers/:id/ready-to-ship
POST /stock-transfers/:id/shipment
POST /stock-transfers/:id/ship
POST /stock-transfers/:id/receive
```

### Restaurant inventory

```text
GET /restaurants/:restaurantId/stock
GET /restaurants/:restaurantId/stock/low
GET /restaurants/:restaurantId/stock/:ingredientId
POST /restaurants/:restaurantId/waste
POST /restaurants/:restaurantId/stock/adjust
```

### Warehouse inventory

```text
GET  /warehouses/:warehouseId/stock
GET  /warehouses/:warehouseId/stock/:ingredientId
POST /warehouse/stock/receive
POST /warehouse/stock/adjust
```

### Audit

```text
GET /stock-movements
GET /stock-movements/:id
GET /restaurants/:restaurantId/stock-movements
GET /warehouses/:warehouseId/stock-movements
```

---

# 33. Authorization

Use role-based authorization.

Conceptually:

```text
Restaurant Manager
    → create stock requests
    → view own restaurant inventory
    → receive shipments
    → report discrepancies
    → record waste

Warehouse Admin
    → view warehouse stock
    → approve/reject stock requests
    → prepare transfers
    → ship transfers
    → receive warehouse purchases
    → adjust warehouse stock

System / Kafka consumer
    → consume order events
    → consume ingredients
    → deduct restaurant stock
    → create movement records
```

Do not trust `restaurantId` from arbitrary clients without verifying that the authenticated user has access to that restaurant.

---

# 34. Transaction and consistency requirements

Whenever multiple inventory records change because of one business operation, use:

```ts
prisma.$transaction(...)
```

Examples:

### Warehouse shipment

```text
WarehouseStock -
InventoryTransit +
StockMovement TRANSFER_OUT
Transfer status update
Shipment status update
```

### Restaurant receipt

```text
InventoryTransit -
RestaurantStock +
StockMovement TRANSFER_IN
TransferItem.receivedQty update
Possible discrepancy creation
Transfer status update
```

### Order consumption

```text
RestaurantStock -
StockMovement POS_SALE
```

All related changes must succeed or rollback together.

---

# 35. Idempotency

Kafka delivery can happen more than once.

For:

```text
ORDER_CONFIRMED
```

never deduct inventory twice.

Use an event processing/idempotency mechanism such as a dedicated processed-event record or another robust strategy.

The same principle applies to transfer events where appropriate.

---

# 36. Important business rules

Implement these validations:

```text
quantity must be > 0 where appropriate

approvedQty <= requestedQty

shippedQty <= approvedQty

shippedQty <= warehouse quantityOnHand

receivedQty <= shippedQty

cannot approve rejected/cancelled request

cannot ship an unapproved transfer

cannot receive an unshipped transfer

cannot complete a transfer without receipt

cannot deduct restaurant stock below zero

cannot transfer insufficient warehouse stock

cannot modify immutable StockMovement records

cannot consume the same Kafka order twice

restaurant manager can only operate on authorized restaurants

warehouse admin can only operate on authorized warehouses
```

---

# 37. Complete business example

Implement this exact scenario correctly:

```text
Restaurant requests:
Tomato = 40 kg
```

Warehouse has:

```text
Tomato = 100 kg
```

Warehouse Admin approves:

```text
35 kg
```

System stores:

```text
requested = 40
approved = 35
```

Create transfer.

Warehouse picks 35 kg.

Shipment:

```text
Carrier = ABC Logistics
Tracking = TRK-1001
Driver = Raj
Vehicle = KA01AB1234
```

At shipment:

```text
Warehouse = 65 kg
Transit = 35 kg
Restaurant = unchanged
```

Then restaurant receives only:

```text
33 kg
```

System calculates:

```text
35 shipped
33 received
2 discrepancy
```

At receipt:

```text
Warehouse = 65
Transit = 2
Restaurant += 33
```

Create:

```text
TRANSFER_IN +33
TransferDiscrepancy = 2 kg
```

Transfer becomes:

```text
DISPUTED
```

until the discrepancy is resolved.

The original request remains:

```text
Requested = 40
Approved = 35
```

Nothing is overwritten.

---

# 38. Required implementation quality

Build production-oriented NestJS code with:

```text
DTO validation
class-validator
proper HTTP exceptions
Prisma transactions
typed services
clean module boundaries
role-based authorization hooks
Kafka consumer error handling
Kafka producer abstraction
idempotency
structured logging
unit tests
integration tests where appropriate
```

Do not put large business workflows directly inside controllers.

Controllers should be thin.

Business logic belongs in services/use cases.

---

# 39. Implementation order

Build in this order:

```text
1. Final Prisma schema
2. Prisma migration
3. Prisma service
4. Warehouse stock operations
5. Restaurant stock operations
6. Stock Request workflow
7. Stock Transfer workflow
8. Shipment workflow
9. Inventory Transit
10. Restaurant receiving
11. Transfer discrepancies
12. Waste
13. Stock Movement audit
14. Low-stock detection
15. Catalog integration
16. Kafka ORDER_CONFIRMED consumer
17. Order ingredient consumption
18. Kafka inventory event producer
19. Idempotency
20. Authorization
21. Jest tests
22. Docker
23. Health/readiness endpoints
```

At every stage, preserve the workflow and do NOT replace business operations with generic CRUD.

## Final architectural principle

The Inventory Service must behave like this:

```text
                     INVENTORY SERVICE
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   STOCK DOMAIN         REPLENISHMENT       ORDER CONSUMPTION
        │                   │                   │
        │              Stock Request            │
        │                   ↓                   │
        │              Approval                │
        │                   ↓                   │
        │              Transfer                │
        │                   ↓                   │
        │               Shipment               │
        │                   ↓                   │
        │                Receipt                │
        │                                       │
        └───────────────┬───────────────────────┘
                        ↓
                 STOCK MOVEMENTS
                        │
                        ↓
                    AUDIT LEDGER
                        │
                        ↓
                  KAFKA EVENTS
```

The most important rule is:

> **Stock should change because a valid business event/command happened, never because someone arbitrarily edited a quantity field.**
