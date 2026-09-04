Restaurant Stock
├── View stock                 ✅
├── View low stock             ✅
└── Adjust stock               ✅

Stock Request
├── Create                     ✅
├── Update                     ✅
├── Delete                     ✅
├── Approve                    ✅
├── Reject                     ✅
├── Cancel                     ✅
└── Low-stock request          ✅

Stock Transfer
├── Picking                    ✅
├── Ready to ship              ✅
├── Shipment                   ✅
├── Ship                       ✅
├── In transit                 ✅
├── Receive                    ✅
├── Discrepancy                ✅
├── Resolve discrepancy        ✅
└── Fulfill request            ✅

Waste Log
├── Create                     ✅
├── Validation                 ✅
├── Restaurant logs            ✅
└── Single log                 ✅


Inventory Service
│
├── Warehouse Stock
│   ├── Receive purchase
│   ├── Adjust
│   └── Transfer out
│
├── Restaurant Stock
│   ├── Consume from order
│   ├── Waste
│   ├── Adjust
│   └── Low-stock detection
│
├── Stock Requests
│   ├── Restaurant request
│   ├── Warehouse approve
│   └── Warehouse reject
│
├── Stock Transfers
│   ├── Picking
│   ├── Shipment
│   ├── In transit
│   ├── Receiving
│   └── Discrepancy
│
├── Shipment
│   ├── Carrier
│   ├── Driver
│   ├── Vehicle
│   ├── Tracking
│   └── ETA
│
├── Stock Movement
│   └── Immutable audit ledger
│
└── Kafka
    ├── Consume ORDER_CONFIRMED
    ├── Publish LOW_STOCK
    ├── Publish TRANSFER events
    └── Publish inventory failures/discrepancies



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
│   │   ├── create-stock-request.dto.ts
│   │   └── approve-stock-request.dto.ts
│   ├── stock-request.service.ts
│   ├── stock-request.controller.ts
│   └── stock-request.module.ts
│
├── stock-transfer/
│   ├── dto/
│   │   ├── create-transfer.dto.ts
│   │   ├── approve-transfer.dto.ts
│   │   ├── ship-transfer.dto.ts
│   │   └── receive-transfer.dto.ts
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
├── auth/
├── prisma/
└── app.module.ts


StockRequestService
    │
    ├── createRequest()
    ├── approveRequest()
    ├── rejectRequest()
    └── cancelRequest()

StockTransferService
    │
    ├── createTransfer()
    ├── startPicking()
    ├── readyToShip()
    ├── ship()
    └── receive()

ShipmentService
    │
    ├── createShipment()
    ├── updateShipment()
    └── getTracking()

WarehouseStockService
    │
    ├── receivePurchase()
    ├── deductForTransfer()
    └── adjust()

RestaurantInventoryService
    │
    ├── consumeIngredients()
    ├── receiveTransfer()
    ├── recordWaste()
    └── adjust()

StockMovementService
    │
    └── record()

LowStockService
    │
    ├── check()
    └── publishLowStock()

OrderConsumptionService
    │
    └── consumeOrder()

    Exactly. I would **not** make one module per table. That would turn the service back into CRUD.

I’d organize the modules around **business capabilities/workflows**.

### Inventory Service modules

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
│   │   ├── create-stock-request.dto.ts
│   │   └── approve-stock-request.dto.ts
│   ├── stock-request.service.ts
│   ├── stock-request.controller.ts
│   └── stock-request.module.ts
│
├── stock-transfer/
│   ├── dto/
│   │   ├── create-transfer.dto.ts
│   │   ├── approve-transfer.dto.ts
│   │   ├── ship-transfer.dto.ts
│   │   └── receive-transfer.dto.ts
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

Then separately:

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
├── auth/
├── prisma/
└── app.module.ts
```

## APIs should represent commands

### Restaurant stock request

```http
POST /stock-requests
```

```json
{
  "restaurantId": "restaurant-1",
  "items": [
    {
      "ingredientId": "tomato-1",
      "quantity": 40
    }
  ],
  "reason": "Low stock"
}
```

This creates:

```text
StockRequest = REQUESTED
```

---

### Warehouse reviews it

```http
POST /stock-requests/:id/approve
```

```json
{
  "items": [
    {
      "ingredientId": "tomato-1",
      "approvedQty": 35
    }
  ]
}
```

Now:

```text
requested = 40
approved  = 35
```

The service automatically knows:

```text
unfulfilled = 5
```

No frontend needs to calculate that.

---

### Reject

```http
POST /stock-requests/:id/reject
```

```json
{
  "reason": "Insufficient warehouse stock"
}
```

---

# Transfer APIs

Once approved:

```http
POST /stock-transfers
```

or internally create the transfer as part of the approval transaction.

Then:

```http
POST /stock-transfers/:id/start-picking
POST /stock-transfers/:id/ready-to-ship
POST /stock-transfers/:id/ship
POST /stock-transfers/:id/receive
```

These are **state transitions**, not generic updates.

---

# Shipment API

When warehouse ships:

```http
POST /stock-transfers/:id/shipment
```

```json
{
  "carrierName": "ABC Logistics",
  "trackingNumber": "TRK-123456",
  "shipperName": "Ravi Kumar",
  "shipperPhone": "9876543210",
  "driverName": "Raj",
  "driverPhone": "9876500000",
  "vehicleNumber": "KA01AB1234",
  "vehicleType": "TRUCK",
  "estimatedArrival": "2026-09-04T14:00:00Z"
}
```

Then:

```http
POST /stock-transfers/:id/ship
```

At this point the service transaction does:

```text
WarehouseStock - shippedQty
InventoryTransit + shippedQty
StockMovement TRANSFER_OUT
Shipment created
Transfer → SHIPPED
Kafka → TRANSFER_SHIPPED
```

---

# Restaurant receiving

This is where your partial shipment logic becomes important.

```http
POST /stock-transfers/:id/receive
```

```json
{
  "items": [
    {
      "transferItemId": "item-1",
      "receivedQty": 33,
      "reason": "2 kg missing from shipment"
    }
  ]
}
```

The service calculates:

```text
shipped = 35
received = 33

discrepancy = 2
```

Then in **one transaction**:

```text
RestaurantStock +33
InventoryTransit -33
StockMovement TRANSFER_IN +33
TransferDiscrepancy created for 2
Transfer → DISPUTED / RECEIVED
Kafka event published
```

The manager never sends:

```json
"discrepancyQty": 2
```

because that is derived data.

---

# Order consumption has no public CRUD API

This is important.

Order consumption happens from Kafka.

```text
Order Service
     │
     │ ORDER_CONFIRMED
     ▼
Kafka
     │
     ▼
order-confirmed.consumer
     │
     ▼
OrderConsumptionService
     │
     ▼
Catalog Service
     │
     ├── MenuItem recipe
     └── Modifier recipes
     │
     ▼
Calculate ingredient requirements
     │
     ▼
RestaurantInventoryService
     │
     ▼
Prisma transaction
```

So we don't need:

```http
POST /restaurant-stock/deduct
```

for normal POS orders.

---

# Example order event

```json
{
  "event": "ORDER_CONFIRMED",
  "orderId": "order-100",
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

Consumer calls:

```ts
await orderConsumptionService.consumeOrder(event);
```

Inside:

```text
MenuItem recipe
        +
Modifier recipe
        ↓
Ingredient requirements
        ↓
Check stock
        ↓
Deduct stock
        ↓
Create StockMovement
        ↓
Check reorder threshold
        ↓
Publish LOW_STOCK
```

---

# Warehouse APIs

Don't expose:

```http
PATCH /warehouse-stock/:id
```

for normal business operations.

Instead:

```http
POST /warehouse/stock/receive
POST /warehouse/stock/adjust
GET  /warehouse/:warehouseId/stock
GET  /warehouse/:warehouseId/stock/:ingredientId
```

For receiving purchased stock:

```json
{
  "warehouseId": "warehouse-1",
  "ingredientId": "tomato-1",
  "quantity": 100,
  "referenceId": "purchase-100"
}
```

Service:

```text
WarehouseStock +100
StockMovement PURCHASE +100
```

in one transaction.

---

# Restaurant APIs

For restaurant inventory:

```http
GET /restaurants/:restaurantId/stock
GET /restaurants/:restaurantId/stock/low
GET /restaurants/:restaurantId/stock/:ingredientId
```

And workflow APIs:

```http
POST /stock-requests
POST /stock-requests/:id/cancel
```

Normal stock deduction is event-driven from orders.

Waste is explicit:

```http
POST /restaurants/:restaurantId/waste
```

```json
{
  "ingredientId": "tomato-1",
  "quantity": 2,
  "reason": "Spoilage"
}
```

Then:

```text
RestaurantStock -2
StockMovement WASTE -2
WasteLog created
```

---

# Most important: service responsibilities

I would make the services roughly this way.

```text
StockRequestService
    │
    ├── createRequest()
    ├── approveRequest()
    ├── rejectRequest()
    └── cancelRequest()

StockTransferService
    │
    ├── createTransfer()
    ├── startPicking()
    ├── readyToShip()
    ├── ship()
    └── receive()

ShipmentService
    │
    ├── createShipment()
    ├── updateShipment()
    └── getTracking()

WarehouseStockService
    │
    ├── receivePurchase()
    ├── deductForTransfer()
    └── adjust()

RestaurantInventoryService
    │
    ├── consumeIngredients()
    ├── receiveTransfer()
    ├── recordWaste()
    └── adjust()

StockMovementService
    │
    └── record()

LowStockService
    │
    ├── check()
    └── publishLowStock()

OrderConsumptionService
    │
    └── consumeOrder()
```

The key is that **controllers initiate business commands; services enforce state transitions and transactions**.

For example:

```text
POST /stock-transfers/:id/ship
              ↓
StockTransferController
              ↓
StockTransferService.ship()
              ↓
Prisma $transaction()
              ↓
├── validate transfer state
├── validate shipped quantities
├── deduct WarehouseStock
├── create InventoryTransit
├── create StockMovement
├── update Shipment
├── update Transfer
└── publish TRANSFER_SHIPPED
```

That is the architecture I'd implement for FoodMatrix.
