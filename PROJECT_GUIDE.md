# FoodMatrix: detailed project and technical guide

Reviewed against the repository on **25 November 2026**. This guide describes the implementation in this checkout, including deployment assets. It does not assert that every scenario or a production installation has been validated. Package manifests describe dependency ranges; lockfiles determine installed versions.

## Contents

1. [Purpose and business boundaries](#1-purpose-and-business-boundaries)
2. [Architecture and communication](#2-architecture-and-communication)
3. [Technology and repository structure](#3-technology-and-repository-structure)
4. [Identity, roles, and restaurant isolation](#4-identity-roles-and-restaurant-isolation)
5. [Service responsibilities and database ownership](#5-service-responsibilities-and-database-ownership)
6. [Menu, pricing, and modifiers](#6-menu-pricing-and-modifiers)
7. [Ordering, kitchen, payments, and stock consumption](#7-ordering-kitchen-payments-and-stock-consumption)
8. [Warehouse replenishment and stock audit](#8-warehouse-replenishment-and-stock-audit)
9. [Staff, attendance, leave, wages, and payroll](#9-staff-attendance-leave-wages-and-payroll)
10. [Notifications and delivery reliability](#10-notifications-and-delivery-reliability)
11. [Frontend structure and screens](#11-frontend-structure-and-screens)
12. [Local development setup](#12-local-development-setup)
13. [Testing and verification](#13-testing-and-verification)
14. [Cloud infrastructure, delivery, and observability](#14-cloud-infrastructure-delivery-and-observability)
15. [Troubleshooting and known limits](#15-troubleshooting-and-known-limits)
16. [Source reference map](#16-source-reference-map)
17. [Backend HTTP route index](#17-backend-http-route-index)

Mermaid diagrams render in GitHub and compatible Markdown viewers. A plain text viewer displays their definitions.

## 1. Purpose and business boundaries

FoodMatrix is a multi-location restaurant operations application connecting the restaurant floor, kitchen, cashier, local inventory, central warehouse, and workforce administration.

- **Operations workspace:** business overview, restaurant directory, central catalog and recipes, warehouse stock, request approval, shipments, stock audit, staff inspection, system logins and warehouse notifications.
- **Restaurant workspace:** waiter ordering, cashier POS, kitchen preparation, restaurant menu overrides, stock requests and receipt, attendance, staff administration, shifts, leave, wages, payroll, payslips and restaurant notifications.

An application login is an Organization `SystemUser`; an employee is an HR `Staff` record. Adding staff does not automatically create an application login. Employment status and application account access are separate administrative concerns.

Restaurant payment methods and payroll payment methods record financial activity. Selecting a method does not establish a bank, card capture or payout-provider integration. The current payroll feature records payments made externally.

## 2. Architecture and communication

### 2.1 Runtime topology

```mermaid
flowchart TB
    Browser[Operations or restaurant browser] -->|Same-origin HTTP| Web[Next.js pages and API handlers]
    Web --> Kong[Kong gateway]
    Kong --> Org[Organization]
    Kong --> Cat[Catalog]
    Kong --> HR[HR]
    Kong --> Orders[Orders]
    Kong --> Inv[Inventory]
    Kong --> Notice[Notifications]
    Cat -->|Scope check| Org
    HR -->|Scope check| Org
    Orders -->|Scope check| Org
    Inv -->|Scope check| Org
    Notice -->|Scope check| Org
    Orders -->|Internal pricing HTTP| Cat
    Inv -->|Internal recipes HTTP| Cat
    Org --> ODB[(Organization DB)]
    Cat --> CDB[(Catalog DB)]
    HR --> HDB[(HR DB)]
    Orders --> RDB[(Order DB)]
    Inv --> IDB[(Inventory DB)]
    Notice --> NDB[(Notification DB)]
    Orders -->|Outbox| Kafka[Kafka]
    HR -->|Outbox| Kafka
    Inv -->|Outbox| Kafka
    Kafka -->|Ready-item consumption| Inv
    Kafka -->|Inventory and HR events| Notice
    Notice -->|Authorized Socket.IO room| Browser
```

Each backend owns its database and migrations. The databases can share a PostgreSQL server, but domain tables are not joined across services and cross-service IDs are not cross-database foreign keys. HTTP handles immediate decisions; Kafka handles asynchronous work. This is not a distributed ACID transaction across all services.

| Communication                          | Purpose and boundary                                            |
| -------------------------------------- | --------------------------------------------------------------- |
| Browser → Next.js                      | Login, workspace hydration, typed application API calls         |
| Next.js → Kong → backend               | Forward requests and aggregate dashboard data                   |
| Domain service → Organization          | Verify bearer token and obtain allowed resource scope           |
| Orders → Catalog                       | Validate menu/modifier selections and resolve effective pricing |
| Inventory → Catalog                    | Resolve menu/modifier recipes and ingredient metadata           |
| Orders → Kafka → Inventory             | Consume stock after a kitchen item becomes ready                |
| HR / Inventory → Kafka → Notifications | Record operational alerts after source transactions             |
| Notifications → browser                | Signal new saved notifications; REST supplies inbox data        |

### 2.2 Native development addresses and gateway prefixes

| Component            | Local port           | Kong prefix                        |
| -------------------- | -------------------- | ---------------------------------- |
| Frontend             | 3000                 | Not a Kong upstream                |
| Organization         | 3001                 | `/api/organization`                |
| Better Auth          | Organization process | `/api/auth`                        |
| HR                   | 3002                 | `/api/hr`                          |
| Catalog              | 3004                 | `/api/catalog`                     |
| Orders               | 3005                 | `/api/order`                       |
| Inventory            | 3006                 | `/api/inventory`                   |
| Notifications        | 3007                 | `/api/notification`                |
| Kong proxy / admin   | 8000 / 8001          | Gateway / administrative interface |
| Kafka host listeners | 9094, 9095, 9096     | Not HTTP                           |

For example, gateway `/api/order/orders` forwards to backend `/orders`. Kong strips domain prefixes, but preserves `/api/auth` for Better Auth. Local Kong uses `host.docker.internal` to reach native Windows processes. Containers and Kubernetes require their own network addresses; `localhost` does not reach another container.

## 3. Technology and repository structure

| Area                            | Implementation                                                  |
| ------------------------------- | --------------------------------------------------------------- |
| Web framework                   | Next.js `16.2.11`, React / React DOM `19.2.4`, TypeScript       |
| Interface                       | Tailwind CSS 4, Lucide, Recharts, reusable application elements |
| State and HTTP                  | Zustand 5, Axios, Fetch                                         |
| Server framework                | NestJS 11, Express, RxJS                                        |
| Validation                      | `class-validator`, `class-transformer`, DTOs, UUID parsing      |
| Persistence                     | PostgreSQL, Prisma 7, `@prisma/adapter-pg`, `pg`                |
| Identity                        | Better Auth 1.7, sessions, JWT plugin, persisted JWKS           |
| Messaging                       | KafkaJS 2.2; local Kafka 4.3.1 KRaft cluster                    |
| Live alerts                     | Socket.IO 4 and NestJS WebSocket gateway                        |
| HR documents and PIN protection | PDFKit and bcrypt                                               |
| Gateway                         | Local Kong 3.9                                                  |
| Quality                         | Jest 30, ts-jest, Supertest, ESLint, Prettier, TypeScript       |
| Cloud                           | Terraform, Helm, AWS VPC/EKS/ECR/RDS and optional MSK           |
| Telemetry                       | OpenTelemetry, Prometheus, Loki, Tempo, Grafana                 |

Node.js 22 is used by deployment images. Applications have independent package manifests and lockfiles, not a root npm workspace. Organization and Inventory use ESM-aware test scripts. Organization also contains Prisma Next contract tooling; the active application persistence described here uses the Prisma client and PostgreSQL adapter.

```text
microservice/
├── README.md / PROJECT_GUIDE.md
├── frontend/
│   ├── src/app/                 Routes, layouts and API handlers
│   ├── src/components/          Screen composition and shared components
│   ├── src/elements/            Feature cards, tables, forms and dialogs
│   ├── src/lib/                 Domain API clients and server helpers
│   ├── src/store/               Organization, catalog and preferences
│   ├── src/providers/           Shared providers, including notifications
│   ├── src/utils/               Types and utilities
│   └── public/                  Branding and public assets
├── backend/
│   ├── organization-service/
│   ├── catalog-service/
│   ├── order-service/
│   ├── inventory-service/
│   ├── hr-service/
│   ├── notification-service/
│   ├── kong/                    Local gateway configuration
│   ├── kafka/                   Local broker cluster
│   └── testfile/                Legacy standalone socket diagnostic
├── deploy/
│   ├── README.md                AWS deployment runbook
│   ├── terraform/               Infrastructure
│   ├── helm/                    Application chart and deployer RBAC
│   ├── images/                  Deployment Dockerfiles
│   ├── observability/           Metrics, logs and tracing configuration
│   └── scripts/                 Build, rollout, database and topic setup
├── jenkins/ / sonarqube/        Additional CI/quality tooling
└── docker-compose.yml           Full opt-in container development stack
```

Most backend features live in `src/modules`; Order Service uses `src/module`. Each service owns `prisma/schema.prisma`, migrations, tests and scripts. A leftover scaffold or diagnostic file is not automatically an active route: module imports determine runtime registration.

## 4. Identity, roles, and restaurant isolation

### 4.1 Identity and access model

Organization owns Better Auth `User`, `Session`, `Account`, `Verification`, and `Jwks`, plus application `Franchise`, `Restaurant` and `SystemUser`. Better Auth `Organization`, `Member`, and `Invitation` schema models also exist; these are not interchangeable with FoodMatrix franchise scope.

`SystemUser.authUserId` connects the auth identity to its role and application assignments.

| Role               | Intended workspace and scope                                          |
| ------------------ | --------------------------------------------------------------------- |
| `SUPER_ADMIN`      | Operations; broad organizational administration                       |
| `FRANCHISE_ADMIN`  | Operations within assigned franchise                                  |
| `OPERATIONS`       | Operations within assigned franchise and permitted resources          |
| `RESTAURANT_ADMIN` | Assigned restaurant; management actions according to endpoint policy  |
| `STAFF`            | Assigned restaurant; operational actions according to endpoint policy |

Authorization combines role and resource scope. A supplied restaurant ID is a request target, not permission. Exact writes vary by feature; the table does not grant every action to every role.

### 4.2 Login and immediate workspace loading

```mermaid
sequenceDiagram
    actor Person
    participant UI as Login form
    participant BFF as Next.js sign-in handler
    participant Org as Organization and Better Auth
    participant Store as Zustand organization store
    Person->>UI: Email and password
    UI->>BFF: POST /api/sign-in
    BFF->>Org: POST /api/auth/sign-in/email through Kong
    Org->>Org: Verify credentials and active workspace access
    Org-->>BFF: Session Set-Cookie
    BFF->>Org: Load current user using new session
    BFF->>Org: Load allowed franchise or restaurant context
    alt Workspace available
        BFF-->>UI: Cookies, workspace, role and redirect
        UI->>Store: Hydrate organization state
        UI->>UI: Open authorized workspace
    else Dependency or access failure
        BFF-->>UI: 401, 403 or 503 response
    end
```

Workspace loading happens before the sign-in handler returns application success. Reload/direct navigation also resolves authorized server context. Zustand is a rendering cache; backend permissions never derive from a user-edited client store.

### 4.3 Domain access checks

| Consumer      | Organization resource endpoint                                  |
| ------------- | --------------------------------------------------------------- |
| HR            | `/hr-access`                                                    |
| Catalog       | `/catalog-access`                                               |
| Orders        | `/order-access`                                                 |
| Inventory     | `/inventory-access`                                             |
| Notifications | `/notification-access`, sharing the inventory access controller |

Better Auth's JWT plugin uses EdDSA / Ed25519 and short-lived tokens. Domain guards submit the bearer token to Organization and then check the actor's allowed resources. They do not own independent account directories merely because the guard is named `JwtAuthGuard`.

```mermaid
flowchart LR
    Request[Bearer request] --> Guard[Domain guard]
    Guard --> Org[Organization resource access endpoint]
    Org --> Check[Verify active account and assignment]
    Check --> Context[Actor and allowed location IDs]
    Context --> Policy[Role and target-resource checks]
    Policy -->|Allowed| Action[Domain operation]
    Policy -->|Denied| Reject[401 or 403]
    Org -->|Unavailable| Fail[503; fail closed]
```

**Warehouse identity:** the current model uses franchise IDs as warehouse IDs. Super admins receive all franchise IDs as `warehouseIds`; franchise-scoped actors receive their own franchise ID. There is no separate Organization `Warehouse` schema model. The selected warehouse, stock request/transfer owner and returned access context must agree. A hardcoded or stale UUID is not a valid substitute.

### 4.4 Other security boundaries

- Public email sign-up is disabled; initial admin creation is a controlled bootstrap command.
- Password reset delivery needs both the HTTPS webhook URL and its token. Reset revokes sessions. The reset screen does not itself provide mail infrastructure.
- Catalog internal bulk endpoints require `x-internal-key`; Catalog, Orders and Inventory share this private key.
- Frontend domain proxies allowlist routes/methods and perform mutation origin checks. Backend authorization still applies.
- Kong adds CORS, correlation IDs, local IP rate limiting and request-size controls. Local in-memory rate limits are not distributed quotas.
- Health and explicitly internal routes have different policies from interactive user routes.

## 5. Service responsibilities and database ownership

| Service       | Principal models and responsibility                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization  | `Franchise`, `Restaurant`, `SystemUser`, auth users/sessions/accounts/JWKS; identity and organizational scope                                                                                            |
| Catalog       | `MenuCategory`, `MenuItem`, `RestaurantMenuItem`, `ModifierGroup`, `Modifier`, `ItemModifierGroup`, `Ingredient`, `RecipeItem`; saleable catalog and recipes                                             |
| Orders        | `Customer`, `Order`, `OrderItem`, `OrderItemModifier`, `Payment`, `OrderCreateRequest`, `OrderInventoryEvent`; order snapshots, state and payments                                                       |
| Inventory     | `WarehouseStock`, `RestaurantStock`, `StockMovement`, requests/items, transfers/items, `Shipment`, `InventoryTransit`, `TransferDiscrepancy`, `WasteLog`, `InventoryOutbox`, `InventoryPendingDeduction` |
| HR            | `Staff`, `StaffAssignment`, `WageHistory`, `Shift`, templates/segments, `ShiftSchedule`, `Leave`, `PayrollRun`, `Payslip`, `HrEventOutbox`                                                               |
| Notifications | `Notification`, `NotificationSocketOutbox`; saved inbox and durable live-signal delivery                                                                                                                 |

```mermaid
flowchart TB
    subgraph Organization_DB
        F[Franchise] --> R[Restaurant]
        F --> SU[SystemUser]
        R --> SU
        U[Auth User] -. authUserId .-> SU
        U --> Session[Sessions and accounts]
    end
    subgraph Catalog_DB
        Category[Category] --> Item[MenuItem]
        Item --> Override[RestaurantMenuItem]
        Item --> Link[ItemModifierGroup]
        Group[ModifierGroup] --> Link
        Group --> Modifier[Modifier]
        Item --> Recipe[RecipeItem]
        Modifier --> Recipe
        Ingredient[Ingredient] --> Recipe
    end
    subgraph Order_DB
        Customer[Customer] --> Order[Order]
        Order --> Line[OrderItem snapshot]
        Line --> Option[Modifier snapshot]
        Order --> Payment[Payment]
        Line --> Event[OrderInventoryEvent]
    end
    R -. soft restaurantId reference .-> Override
    R -. soft restaurantId reference .-> Order
    Item -. soft menuItemId reference .-> Line
```

Cross-database dashed lines are logical IDs, not foreign keys. Similar IDs connect staff and stock to restaurants, and stock to Catalog ingredients. Ingredient metadata belongs to Catalog; quantities belong to Inventory. Monetary and quantity fields use database Decimal types; API amounts can be strings. Respect API types instead of assuming every amount is a JavaScript number.

## 6. Menu, pricing, and modifiers

Operations maintains categories, items/base prices, availability, modifier groups/options, ingredient definitions and recipes. Shared Catalog writes are restricted by the Catalog guard, including a super-admin requirement for shared mutations.

Restaurants override item price and availability using `RestaurantMenuItem`, unique on `(restaurantId, menuItemId)`. The schema has **no restaurant-specific modifier-price override model**: `Modifier.extraPrice` is shared. Changing a local item price does not create a local price for its modifiers.

```mermaid
flowchart LR
    Shared[Shared item and category] --> Resolve[Resolve restaurant menu]
    Override[Local item price and availability] --> Resolve
    Groups[Active modifier groups and selection limits] --> Resolve
    Resolve --> Select[Choose item, quantity and modifiers]
    Select --> Validate[Order Service obtains Catalog pricing]
    Validate --> Snapshot[Save names and price snapshots]
```

Groups enforce minimum/maximum selections. Optional groups permit no selection when the minimum is zero; required groups must satisfy their minimum. Recipes can belong to menu items and modifiers, so an option may change both sale price and stock consumption.

The server resolves prices and validates selections; a browser-supplied total is not authoritative. Existing order snapshots retain order-time prices after master prices change. Categories, status filters, counts and pagination must use the relevant endpoint's contract, rather than assuming the first fetched page is the whole catalog.

## 7. Ordering, kitchen, payments, and stock consumption

### 7.1 State and checkout

```mermaid
stateDiagram-v2
    [*] --> PENDING: Create
    PENDING --> CONFIRMED: Confirm
    CONFIRMED --> PREPARING: Prepare
    PREPARING --> READY: Ready requirements satisfied
    READY --> COMPLETED: Explicit completion and payment covered
    PENDING --> CANCELLED: Allowed cancellation
    CONFIRMED --> CANCELLED: Allowed cancellation
    PREPARING --> CANCELLED: Allowed cancellation and item checks
    COMPLETED --> [*]
    CANCELLED --> [*]
```

This is the principal path, not an exhaustive list of permitted/rejected replay and cancellation cases. Item states are independently `PENDING`, `PREPARING`, `READY`, and `CANCELLED`. Order types are `DINE_IN`, `TAKEAWAY`, and `DELIVERY`.

1. Waiter or cashier selects items, quantities and modifiers from the restaurant menu. Dine-in carries a table reference.
2. Creation requires an `Idempotency-Key` of 1–255 characters. The controller scopes the key to the restaurant, and the service stores a fingerprint/result. Retry the same logical request with the same key; use a new key for a new operation.
3. Orders validates Catalog pricing and snapshots names/prices. Dine-in logic can add work to an active table order subject to state rules.
4. Confirmation and preparation expose work to the kitchen; readiness is tracked per item.
5. Cashier records one or multiple/split payments. Methods include `CASH`, `CARD`, `UPI`, and `ONLINE`. These describe records, not proof of a configured provider capture.
6. Server-side total, transaction-reference and concurrency checks protect payment recording. Unresolved item-unavailability decisions can block payment actions.
7. **Completion is an explicit action requiring `READY` and sufficient completed payment. Payment alone does not complete a preparing order.**
8. Completed/cancelled orders remain in register history. Bill printing uses order details and restaurant branding through the browser print flow.

Kitchen upcoming lists exclude ready/completed work; POS open orders and history serve different purposes. A ready order can leave the preparation queue while still needing checkout.

### 7.2 Unavailable items

```mermaid
flowchart LR
    Chef[Chef identifies unavailable item] --> Report[Report item and reason]
    Report --> Review[Cashier or authorized manager decision]
    Review --> Remove[Approve allowed removal and recalculate]
    Review --> Dismiss[Dismiss request]
    Review --> Last[Last dish requires explicit whole-order decision]
    Last --> Cancel[Cancelled order retained in history]
```

Chef reporting is not silent deletion or refund of a paid order. The backend validates role, state, last-item handling and financial implications. UI state must not bypass those checks.

### 7.3 Stock consumption timing and recovery

The historical topic name **`order-complete` actually carries ready-item stock-consumption events in the current flow**. Do not interpret it as firing only when the bill is settled.

```mermaid
sequenceDiagram
    participant K as Kitchen
    participant O as Orders
    participant ODB as Order DB
    participant Bus as Kafka
    participant I as Inventory
    participant C as Catalog
    participant IDB as Inventory DB
    K->>O: Mark item READY
    O->>ODB: Transaction: update item and save inventory event
    O-->>K: Updated item state
    O->>Bus: Outbox publishes stable item event
    Bus-->>O: Publish acknowledgement
    O->>ODB: Remove published event
    Bus->>I: order-complete
    I->>C: Resolve menu and modifier recipes
    alt Required restaurant stock sufficient
        I->>IDB: Transaction: deduplicate, deduct, record POS_SALE movements
    else Stock shortage or handled Catalog failure
        I->>IDB: Save pending deduction and error
        I->>IDB: Retry when due after correction or recovery
    end
```

Inventory calculates consumption from item quantity and recipes, checks required stock atomically, and records movements. Order-item identity and database locking prevent legitimate replay from deducting the same item twice.

Shortages are deferred, not fixed by inventing stock or allowing a negative balance. Receive legitimate stock, make an audited correction, or repair recipe/key/ingredient data. The retry worker reattempts persisted deductions. This creates eventual consistency: ready food can temporarily precede its stock ledger update.

Malformed events are queued to `order-complete-invalid`; shortage review events use `order-complete-stock-shortage`. These diagnostic topics are not ordinary inbox topics consumed by the current Notification handlers.

## 8. Warehouse replenishment and stock audit

Warehouse/local balances are separate. Requests express demand; transfers and shipments represent fulfillment; movements record changes. Approval does not mean stock has arrived.

```mermaid
flowchart TB
    Need[Restaurant stock need] --> Request[Submit REQUESTED stock request]
    Request --> Reject[REJECTED]
    Request --> Cancel[CANCELLED where allowed]
    Request --> Approve[Warehouse APPROVED]
    Approve --> Transfer[Linked transfer]
    Transfer --> Pick[PICKING]
    Pick --> Packed[READY_TO_SHIP]
    Packed --> Ship[Shipment and SHIPPED]
    Ship --> Deduct[Warehouse deduction and TRANSFER_OUT]
    Deduct --> Transit[IN_TRANSIT]
    Transit --> Receive[Restaurant records received quantities]
    Receive --> Add[Add actual received stock and TRANSFER_IN]
    Add --> Check{Discrepancy?}
    Check -->|No| Complete[Transfer COMPLETED]
    Check -->|Yes| Dispute[DISPUTED]
    Dispute --> Resolve[Authorized resolution]
    Resolve --> Complete
    Complete --> Fulfilled[Request FULFILLED when fulfillment requirements met]
```

Services enforce intermediate received/completed state transitions. Record actual receipt rather than assuming shipped quantities arrived undamaged. Discrepancy resolution must preserve the difference. Source request/transfer IDs support audit and notifications.

Movement types are `PURCHASE`, `TRANSFER_IN`, `TRANSFER_OUT`, `POS_SALE`, `ADJUSTMENT`, and `WASTE`. Use documented adjustment/waste operations for corrections; direct row edits bypass the audit trail. Recipe and stock units must be consistent; ingredient `uom` does not provide arbitrary automatic unit conversion.

The low-stock scheduler runs at **08:00, 14:00 and 20:00 in the process timezone**, using `0 8,14,20 * * *`. It selects restaurant stock at/below reorder level with positive reorder quantity, resolves ingredients, groups by restaurant, and persists events to `InventoryOutbox` before Kafka publishing.

Persisted events survive Kafka outages. A failure before ingredient lookup or outbox persistence succeeds still needs recovery/a later scheduled check: an outbox cannot retry an event never saved. A low-stock notification is not itself an approved or received replenishment order.

## 9. Staff, attendance, leave, wages, and payroll

### 9.1 Model meanings

| Model                                    | Meaning                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `Staff`                                  | Employee identity/code, job role, PIN hash, employment status          |
| `StaffAssignment`                        | Dated restaurant assignment history                                    |
| `WageHistory`                            | Effective hourly/overtime or salary terms                              |
| `Shift`                                  | Actual clock-in/clock-out record                                       |
| `ShiftTemplate` / `ShiftTemplateSegment` | Reusable planned shift, including split segments                       |
| `ShiftSchedule`                          | Staff/date assignment to planned work                                  |
| `Leave`                                  | Requested period, decision, paid status and revocation fields          |
| `PayrollRun` / `Payslip`                 | Period processing, earnings, deductions, approval/payment and document |
| `HrEventOutbox`                          | Durable attendance and leave events                                    |

**Open punches** have no clock-out; **all punches** includes closed and open actual attendance. Neither is the list of planned shifts. Keeping plans and actual work separate supports lateness, early leaving, missed work and payroll calculations.

```mermaid
flowchart LR
    Staff[Maintain staff and assignment] --> Wage[Set dated wage terms]
    Staff --> Template[Maintain shift templates]
    Template --> Schedule[Schedule staff shifts]
    Schedule --> Punch[Clock in and out]
    Punch --> Report[Daily roster and monthly tracker]
    Wage --> Payroll[Process payroll draft]
    Report --> Payroll
    Leave[Approved paid or unpaid leave] --> Payroll
    Payroll --> Review[Review earnings and deductions]
    Review --> Approve[Approve payroll]
    Approve --> Payment[Record external payment]
    Payment --> Slip[Paid payroll and downloadable payslip]
```

Employees can be `ACTIVE`, `ON_LEAVE`, or `TERMINATED`. Termination and effective assignment/wage dates affect historical calculations. Employee status is not a substitute for disabling a login. PINs are hashed: administration can set/reset a PIN, not recover its original text.

### 9.2 Leave lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING: Apply
    PENDING --> APPROVED: Approve
    PENDING --> REJECTED: Reject
    PENDING --> REVOKED: Revoke where allowed
    APPROVED --> REVOKED: Revoke subject to date and payroll checks
```

The service checks dates, overlaps, assignment/employment scope, state and payroll effects. Approved leave is not freely editable display data once it has affected payroll. Use dedicated actions; apply/decision events use the HR outbox and the existing notification pipeline.

### 9.3 Payroll rules and integration boundaries

States are `DRAFT`, `APPROVED`, and `PAID`. Draft processing considers applicable wages, actual work, overtime, eligible paid leave, salary proration and deductions. Missing applicable wage data must be corrected. Exact rounding/calculation rules belong to the payroll service and its tests; the feature is not a statement of statutory tax compliance.

Draft deductions can be reviewed before approval. Approval and recording payment are separate. Methods include `DIRECT_DEPOSIT`, `CHECK`, and `CASH`, but no payout provider is invoked by this feature. Actor IDs such as `processedById` are derived from authenticated context in payroll controller operations. Reopen/delete and version-sensitive updates have business restrictions; do not casually rewrite paid records.

Payslip downloads use protected APIs and PDFKit. Employee self-service and a separate standalone PIN-verification product flow are outside the requested frontend scope; administrative workforce, scheduling, leave, attendance and payroll are the integrated workflows.

## 10. Notifications and delivery reliability

### 10.1 Topics and audience

| Producer  | Topics consumed by Notifications                                                    |
| --------- | ----------------------------------------------------------------------------------- |
| Inventory | `inventory.low-stock`                                                               |
| Inventory | `inventory.stock-request-created`, `inventory.stock-request-approved`               |
| Inventory | `inventory.stock-shipped`, `inventory.stock-in-transit`, `inventory.stock-received` |
| HR        | `hr.employee-signed-in`, `hr.employee-late`, `hr.employee-clocked-out-early`        |
| HR        | `hr.leave-applied`, `hr.leave-decision`                                             |

Notifications have `RESTAURANT` or `WAREHOUSE` scope, location IDs, type, priority, read status and timestamps. Read status is on the notification record, not in a separate per-user receipt table: do not assume independent unread histories for users sharing an inbox.

### 10.2 Durable storage and socket emission

```mermaid
sequenceDiagram
    participant Bus as Kafka
    participant H as Notification handler
    participant DB as Notification DB
    participant W as Socket outbox worker
    participant Room as Authorized socket room
    participant UI as Header, sidebar and inbox
    Bus->>H: Inventory or HR event
    H->>DB: Transaction: deduplicated Notification and socket outbox row
    H-->>Bus: Finish after durable save
    W->>DB: Claim due row with lease and row lock
    W->>Room: notification:new with ID and scope
    alt Emit succeeds
        W->>DB: Delete queue row
    else Emit fails or process stops
        W->>DB: Retain for retry after lease
    end
    Room->>UI: New notification signal
    UI->>H: Fetch saved location inbox through REST
    H-->>UI: Persisted authorized notifications
```

Deterministic notification identity suppresses duplicate persistence on Kafka replay. The atomic socket queue closes the save-before-emit crash gap. Delivery remains **at least once**, not exactly once or a user acknowledgement protocol: crashing after emit but before deleting the row can repeat a signal with the same ID. Offline clients must synchronize persisted data when reconnecting.

### 10.3 Socket contract

- Namespace: `/notifications`; public transport path: `/api/notification/socket.io`.
- Join: `join-restaurant` with `{ restaurantId }`, or `join-warehouse` with `{ warehouseId }`.
- Server event: `notification:new` with ID, scope and location ID.
- Cookie-based access is verified before location room joins, and joined rooms are periodically revalidated.
- The provider reloads saved notifications and synchronizes badges/inbox. This is not a generic live transport for every POS/kitchen state change.

| Worker                      | Durable record and recovery                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Order inventory publisher   | `OrderInventoryEvent`; approximately one-second polling, delete after publish, backlog logging |
| Inventory publisher         | `InventoryOutbox`; persisted publishes retried with stable identity                            |
| Deferred stock deduction    | `InventoryPendingDeduction`; five-second due-work polling and per-record retry timing          |
| HR publisher                | `HrEventOutbox`; leased publishing, event IDs and retry availability                           |
| Live notification publisher | `NotificationSocketOutbox`; leased row claiming, retry after interruption, delete after emit   |

These mechanisms require idempotent consumers. They cannot repair incorrect recipe/stock data or recover a source event that was never durably saved.

## 11. Frontend structure and screens

```mermaid
flowchart LR
    Page[App Router page and layout] --> Screen[Screen component]
    Screen --> Elements[Feature elements, tables and dialogs]
    Elements --> API[Typed src/lib clients]
    API --> BFF[Next.js API handler]
    BFF --> Backend[Kong and backend]
    Store[Organization and catalog stores] --> Screen
    Pref[Browser preferences] --> Elements
    Provider[Notification provider] --> Elements
```

Use page → screen component → feature elements. Keep detailed forms and tables in elements rather than putting all business/UI code into a route. Preserve actual folder/import spellings when navigating existing code.

Stores include `organization-store.ts`, `catalog-store.ts`, and `platform-preferences.ts`. They cache rendering context/preferences, not authoritative database state. Browser sound/time display settings do not change stored timestamps, backend cron timezone or restaurant organization data. Revenue labels that explicitly say UTC must not be assumed to use the restaurant-local calendar day.

| Restaurant route                | Function                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| `/restaurant/edge-dashboard`    | Overview, real service data, activity and actions                   |
| `/restaurant/pos`               | Cashier menu, current/open orders, checkout, history, bill printing |
| `/restaurant/waiter`            | Table-based ordering and submission                                 |
| `/restaurant/kitchen`           | Preparation queue, ready actions, unavailability reporting          |
| `/restaurant/menu`              | Item price/availability, category and status filtering              |
| `/restaurant/inventory`         | Local stock, requests, deliveries and movements                     |
| `/restaurant/punch-clock`       | Clock-in/clock-out station                                          |
| `/restaurant/attendancereports` | Daily roster, monthly tracker, schedules and templates              |
| `/restaurant/staff`             | Directory/profile, wages, leave, payroll and payslips               |
| `/restaurant/alerts`            | Scoped saved notifications and read-state actions                   |
| `/restaurant/settings`          | Account/restaurant settings and shared settings elements            |

| Operations route            | Function                                           |
| --------------------------- | -------------------------------------------------- |
| `/operations/info`          | Aggregated overview and source status              |
| `/operations/restaurants`   | Directory and restaurant details/integrations      |
| `/operations/staff`         | Directory and employee detail                      |
| `/operations/menu`          | Shared catalog, modifiers, ingredients and recipes |
| `/operations/inventory`     | Warehouse balances and stock actions               |
| `/operations/stockrequests` | Restaurant request review/approval                 |
| `/operations/fulfillment`   | Transfers and shipments                            |
| `/operations/stockaudit`    | Movement ledger                                    |
| `/operations/notifications` | Warehouse inbox                                    |
| `/operations/settings`      | Account, browser preferences and system logins     |

Workspace entry routes `/operations` and `/restaurant` also exist. `/operations/analytic` was removed and must not be linked as an active feature. Both workspaces share the dark zinc/emerald theme, compact controls, data tables, summary cards and modal forms.

## 12. Local development setup

### 12.1 Requirements and databases

Use Node.js 22, npm, PostgreSQL, and Docker Desktop with Linux containers. Organization's example specifies PostgreSQL 14+; the AWS design provisions PostgreSQL 17. Test migrations against the intended target version.

Create six databases and suitable owners. Names such as `fmx_organization`, `fmx_catalog`, `fmx_order`, `fmx_inventory`, `fmx_hr`, and `fmx_notification` are local conventions, not hardcoded requirements. Each backend's `DATABASE_URL` selects its own database.

The deployment [database initialization script](deploy/scripts/init-postgres.sql) instead creates `matrix_*` roles/databases and prompts for passwords. It is a one-time administrative script, not an idempotent reset. Do not run it against an existing server without checking the target.

### 12.2 Environment configuration

There is an Organization [environment example](backend/organization-service/.env.example); other applications do not all have equivalent examples. Create their local files explicitly. Do not copy sample database passwords as real credentials.

Backend `.env` baseline, adapted to the service:

```dotenv
DATABASE_URL="postgresql://APP_USER:URL_ENCODED_PASSWORD@localhost:5432/APP_DATABASE"
PORT=3005
ORGANIZATION_SERVICE_URL="http://localhost:3001"
```

| Variable                                                     | Consumer / purpose                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`                                               | Every backend; its own database and Prisma configuration    |
| `PORT`                                                       | Optional listener override; gateway must match              |
| `BETTER_AUTH_URL`                                            | Organization; local default `http://localhost:3001`         |
| `BETTER_AUTH_SECRET`                                         | Organization; strong private authentication secret          |
| `BETTER_AUTH_TRUSTED_ORIGINS`                                | Organization; comma-separated browser origins               |
| `PASSWORD_RESET_WEBHOOK_URL`, `PASSWORD_RESET_WEBHOOK_TOKEN` | Organization; configure both for HTTPS reset email delivery |
| `ORGANIZATION_SERVICE_URL`                                   | Domain services; access-check upstream                      |
| `CATALOG_SERVICE_URL`                                        | Orders and Inventory; default `http://localhost:3004`       |
| `INTERNAL_API_KEY`                                           | Same private value in Catalog, Orders and Inventory         |
| `KAFKA_BROKERS`                                              | HR, Orders, Inventory, Notifications                        |
| `KAFKA_SASL_USERNAME`, `KAFKA_SASL_PASSWORD`                 | Both or neither; SCRAM-SHA-512 with TLS                     |
| `KAFKA_SSL`                                                  | `true` for TLS-only Kafka when not using the SCRAM pair     |

Local broker value for the four Kafka applications:

```dotenv
KAFKA_BROKERS="localhost:9094,localhost:9095,localhost:9096"
```

The local cluster uses plaintext development listeners; do not expose these as a public production configuration.

Frontend `frontend/.env.local`:

```dotenv
FOODMATRIX_API_URL="http://localhost:8000"
FRONTEND_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_NOTIFICATION_SOCKET_URL="http://localhost:8000"
```

The first two are server configuration. The socket URL is compiled into browser code; restart/rebuild after changing it. Deployment builds use `/` for the same public origin. Never put credentials/internal keys in `NEXT_PUBLIC_*` variables.

### 12.3 Install, generate, migrate

After configuring all six databases and environment files, run from the repository root:

```powershell
$services = @(
  "organization-service", "catalog-service", "hr-service",
  "order-service", "inventory-service", "notification-service"
)
foreach ($service in $services) {
  Push-Location (Join-Path "backend" $service)
  try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Install failed: $service" }
    $prismaConfig = if ($service -in @("inventory-service", "notification-service")) {
      "prisma7.config.ts"
    } else {
      "prisma.config.ts"
    }
    npx prisma generate --config $prismaConfig
    if ($LASTEXITCODE -ne 0) { throw "Prisma generation failed: $service" }
    npx prisma migrate deploy --config $prismaConfig
    if ($LASTEXITCODE -ne 0) { throw "Migration failed: $service" }
  } finally {
    Pop-Location
  }
}
Push-Location frontend
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "Frontend install failed" }
} finally {
  Pop-Location
}
```

Inventory and Notifications use `prisma7.config.ts`; the others use `prisma.config.ts`. `migrate deploy` applies committed migration history. Do not replace release migrations with `db push`.

### 12.4 Start local infrastructure and processes

```powershell
docker compose -f backend/kafka/docker-compose.yml up -d
docker compose -f backend/kong/docker-compose.yml up -d
```

Start each application in a separate terminal using `npm run start:dev` from its directory. Start Organization first, then Catalog and remaining services. In `frontend`, run `npm run dev`.

```powershell
# Organization terminal
Set-Location C:\suraj\microservice\backend\organization-service
npm run start:dev

# Another terminal: repeat for each remaining backend directory
Set-Location C:\suraj\microservice\backend\catalog-service
npm run start:dev

# Frontend terminal
Set-Location C:\suraj\microservice\frontend
npm run dev
```

Kafka Compose supplies three combined KRaft broker/controller nodes and Kafka UI. Kong Compose supplies the DB-less gateway. Neither supplies PostgreSQL. A listening HTTP process does not prove its database, Kafka subscription and upstream calls are healthy; inspect logs.

For explicit topic provisioning, `deploy/scripts/kafka-topics.cjs` declares application and diagnostic topics. From an installed service directory, the following resolves KafkaJS from that directory:

```powershell
# Run from backend/order-service
$env:KAFKA_BROKERS = "localhost:9094,localhost:9095,localhost:9096"
$env:KAFKA_TOPIC_PARTITIONS = "3"
$env:KAFKA_TOPIC_REPLICAS = "3"
$topicBootstrap = Get-Content ..\..\deploy\scripts\kafka-topics.cjs -Raw
node -e $topicBootstrap
```

Replication factor must not exceed broker count. Helm provisions topics through its bootstrap job in deployment.

The root `docker-compose.yml` is an alternative complete application/container stack using the same deployment Dockerfiles, six services, frontend, Kong, NGINX and the included Kafka cluster. It requires existing PostgreSQL databases and service `.env.docker` files. See the [container setup](deploy/README.md#6-local-container-development). Native development and the container edge both default to port 3000, so do not start both on that port.

### 12.5 First administrator and initial business records

For a new installation, provide these temporary variables to Organization and run `npm run db:bootstrap`:

```dotenv
BOOTSTRAP_FRANCHISE_NAME="Your franchise"
BOOTSTRAP_ADMIN_NAME="Your administrator"
BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
BOOTSTRAP_ADMIN_PASSWORD="REPLACE_WITH_A_STRONG_PRIVATE_PASSWORD"
```

The command requires a 12–128 character password and refuses a second super admin. It creates the initial franchise, credential identity and application system user. Remove temporary password settings afterward.

Open `/login`, create restaurants with correct timezone/currency context, provision scoped logins, maintain Catalog items/modifiers/recipes, receive stock and configure reorder values, and add staff with wages/schedules. Empty lists on a fresh database are expected. Seed scripts are optional data-loading tools; inspect them rather than assuming they are safe production initialization.

## 13. Testing and verification

Frontend, from its directory:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

Backend, from each service directory:

```powershell
npm test -- --runInBand
npm run build
```

Catalog, HR, Organization and Notifications currently include `--fix` in lint scripts. Orders and Inventory use checking scripts. A non-mutating backend check is:

```powershell
npx eslint "src/**/*.ts" "test/**/*.ts"
```

Use package test scripts to retain ESM options. Compile success is not the same as HTTP or browser acceptance.

### 13.1 Integration tests

Organization, Catalog, Orders, Inventory and Notifications use `npm run test:e2e` wrappers that create a uniquely named disposable database, apply migrations, check schema drift, run HTTP tests and clean up that generated database.

| Service       | Test administration connection variable |
| ------------- | --------------------------------------- |
| Organization  | `ORGANIZATION_TEST_DATABASE_URL`        |
| Catalog       | `CATALOG_TEST_DATABASE_URL`             |
| Orders        | `ORDER_TEST_DATABASE_URL`               |
| Inventory     | `INVENTORY_TEST_DATABASE_URL`           |
| Notifications | `NOTIFICATION_TEST_DATABASE_URL`        |

Example, from Order Service, using a dedicated test PostgreSQL role/server with database creation permission:

```powershell
$env:ORDER_TEST_DATABASE_URL = "postgresql://TEST_ADMIN:URL_ENCODED_PASSWORD@localhost:5432/postgres"
npm run test:e2e
```

Use wrappers instead of pointing raw integration tests at live application databases. HR's e2e script uses its Jest HTTP configuration with mocked dependencies, not the same disposable-database strategy; it provides different evidence.

### 13.2 Manual acceptance coverage

Recommended acceptance includes scoped account reload/access checks, menu overrides/modifier rules, ordering and history, payments/refunds, ready-item stock consumption and replay, request/ship/receive/discrepancies, attendance/leave/payroll writes and payslips, Kafka/worker recovery, browser reconnect, keyboard/mobile layouts and print output. Persistent actions should use approved test records.

A prior desktop manual pass covered both workspaces, many read/filter/detail flows, notification connectivity, and one explicitly approved test order cancelled without payment or food preparation. It did not establish payment/refund execution, stock-consuming preparation, payroll writes, printer compatibility, mobile behavior or load capacity. Ignored `tmp/` reports are working artifacts, not guaranteed tracked documentation.

Updating this guide does not imply application tests were rerun. Release decisions require current test output and environment acceptance.

## 14. Cloud infrastructure, delivery, and observability

The step-by-step AWS procedure is [deploy/README.md](deploy/README.md).

```mermaid
flowchart TB
    Public[Public app domain] --> TLS[Network Load Balancer and ACM TLS]
    TLS --> Edge[NGINX edge in EKS]
    Edge --> Web[Next.js]
    Edge -->|Socket upgrade| Notice[Notification Service]
    Web --> Kong[Private Kong]
    Kong --> Apps[Six NestJS services]
    Apps --> RDS[Private RDS; six databases]
    Apps --> Kafka[Private Kafka or optional MSK]
    Build[Image build and publish scripts] --> ECR[ECR commit-SHA images]
    ECR --> Apps
    ECR --> Web
    Apps --> OTel[OpenTelemetry collectors]
    Web --> OTel
    OTel --> Prom[Prometheus metrics]
    OTel --> Tempo[Tempo traces]
    Logs[Pod stdout and stderr] --> Loki[Loki logs]
    Prom --> Grafana[Grafana]
    Tempo --> Grafana
    Loki --> Grafana
```

### 14.1 Infrastructure and configuration

Terraform provisions VPC/subnets/NAT, EKS Auto Mode configuration, private RDS PostgreSQL, ECR and optional MSK resources. Optional GitHub OIDC role support remains in Terraform but is not used by the current Jenkins pipeline. The documented first target is staging in `ap-south-1`.

RDS is encrypted/private, uses managed master credentials, and supports configurable multi-AZ and deletion protection. A shared remote state backend must be configured separately. Set Kubernetes API CIDRs deliberately.

The deployment Dockerfiles under `deploy/images` are distinct from older per-application Dockerfiles. The build script creates eight project images: frontend, Kong and six services. The NGINX edge uses its separately configured image. Helm supplies services/probes/resources, edge/gateway, migration jobs, topic setup, optional instrumentation and first-admin bootstrap.

Migrations and topic provisioning run before application rollout. Bootstrap is first-install only, then disabled and its temporary secret removed. The chart is not populated infrastructure: provide image SHA, origin, TLS, database secrets/certificates and Kafka authentication. RDS application and migration TLS connection settings are documented in the runbook.

### 14.2 CI/CD

GitHub Actions workflows remain removed. The Jenkins multibranch pipeline uses a trusted `foodmatrix-ci` agent and shared scripts for lint/types, all six Jest coverage runs, disposable PostgreSQL HTTP integration tests, frontend checks/build, Terraform/Helm validation and image builds. HR HTTP tests retain their mocked-dependency scope.

Main-branch analysis uses `sonar-project.properties`, followed by an enforced quality-gate wait. Publishing/deployment are disabled by default and restricted to trusted main builds. Publishing uses an AWS identity configured outside Git; staging deployment requires an explicit approval, Jenkins-bound environment values/locations, and public/private smoke checks. See [Jenkins setup](jenkins/README.md) for plugins, webhook, credentials and agent permissions. Source definitions alone do not prove a live Jenkins run.

### 14.3 Telemetry, scaling and rollback

The observability installer configures Prometheus/Grafana, Loki, Tempo, the OpenTelemetry operator, collectors and instrumentation. OTLP carries metrics/sampled traces; logs come from FoodMatrix pod output. Kong/collector scrape targets and deployment/restart alert rules exist. Configure external Alertmanager receivers separately.

The supplied layout is a staging baseline. Notifications use one replica because rooms/broadcasts are process-local; scaling requires cross-pod Socket.IO fan-out. Single-replica telemetry/storage choices and RDS availability need a production-specific HA design. Review background worker locking/idempotency before multiplying replicas.

Helm rollback restores application versions, not committed database migrations. Use compatible schema evolution, backups and a tested restore procedure. Infrastructure apply/deploy creates billable resources and must use the reviewed target environment.

## 15. Troubleshooting and known limits

| Symptom                           | What to check                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Organization access unavailable   | Organization process/database, exact upstream URL, network, resource access status/response; guards fail closed                |
| First login cannot load workspace | Gateway, cookie/origin, active system user, assignment and directory visibility                                                |
| Cannot GET orders                 | Correct running service/build, port, and `/api/order/orders` gateway path                                                      |
| Different warehouse error         | Request/transfer ownership must match current franchise-based warehouse scope                                                  |
| Only first ingredients visible    | Pagination/search must fetch later pages; ingredient dictionary differs from local stock                                       |
| Stock shortage                    | Actual restaurant balance, recipe/UOM/modifiers, internal key and pending deduction errors; receive or make audited correction |
| Paid order missing from history   | Readiness and explicit completion are still required                                                                           |
| Ready ticket disappears           | Upcoming preparation queue excludes ready; inspect POS checkout/open orders                                                    |
| Notifications empty               | Correct scope/location, source events, Kafka subscriptions, saved records and filters; connection does not create records      |
| Saved notice without live update  | Socket queue/lease, session, room join, proxy path and reconnect; REST inbox remains authoritative                             |
| Password reset delivery fails     | Both webhook settings, HTTPS delivery, token and allowed origin                                                                |
| Prisma type/model missing         | Correct service client generation, correct config filename, applied migrations                                                 |
| Invalid UTF-8 parsing error       | Save source as valid UTF-8 and remove accidental legacy encoding bytes                                                         |
| Kafka retry loop                  | Distinguish broker outage from malformed data/stock/recipe failures; inspect durable records                                   |

Known limits and open observations:

- A prior manual pass found hardcoded rupee rendering in some Operations menu/modifier and staff wage views while the active franchise/restaurant used USD. Starting points are `MenuTable.tsx`, `ModifierManagerModal.tsx`, and `StaffInformationView.tsx`. This documentation does not fix that display issue.
- The updated root Compose stack still requires explicit database/environment setup; it does not provision or migrate the application databases automatically.
- Stock and notifications are eventually consistent; outbox persistence is not instant cross-service completion.
- Socket emission is not an acknowledgement from a user; offline browsers must reload saved notifications.
- Browser timezone preferences do not change backend cron timezone. UTC revenue and restaurant-local attendance can have different day boundaries.
- Payment records are not provider settlement, and payroll features do not certify statutory compliance.
- Production acceptance still needs provisioning, secrets, runtime checks, backup/restore exercises, capacity testing and an availability plan.
- This guide is a snapshot. Controllers, DTOs, guards, service logic, migrations and current tests remain authoritative as code evolves.

## 16. Source reference map

| Topic                         | Starting point                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Auth configuration            | [Organization auth](backend/organization-service/src/auth/auths.ts)                                                             |
| Access scopes                 | [Organization auth directory](backend/organization-service/src/auth)                                                            |
| Warehouse identity            | [Inventory/notification access](backend/organization-service/src/modules/restaurant/inventory-access.controller.ts)             |
| Login and hydration           | [Sign-in handler](frontend/src/app/api/sign-in/route.ts), [workspace loader](frontend/src/lib/server/organization-workspace.ts) |
| Client organization state     | [Organization store](frontend/src/store/organization-store.ts)                                                                  |
| Domain clients                | [API library](frontend/src/lib)                                                                                                 |
| Order completion              | [Order service](backend/order-service/src/module/orders/orders.service.ts)                                                      |
| Consumption publisher         | [Order outbox](backend/order-service/src/kafka/order-inventory-outbox.service.ts)                                               |
| Stock consumption and retry   | [Order inventory module](backend/inventory-service/src/modules/order-inventory)                                                 |
| Low-stock schedule            | [Scheduler](backend/inventory-service/src/modules/schedule/schedule.service.ts)                                                 |
| Payroll rules                 | [Payroll module](backend/hr-service/src/modules/payroll)                                                                        |
| Durable notification delivery | [Delivery service](backend/notification-service/src/kafka/handlers/notification-delivery.service.ts)                            |
| Socket room authorization     | [Gateway](backend/notification-service/src/socket/notification.gateway.ts)                                                      |
| Browser notification sync     | [Provider](frontend/src/providers/NotificationProvider.tsx)                                                                     |
| Local routes                  | [Kong config](backend/kong/kong.yml)                                                                                            |
| Kafka topic list              | [Topic bootstrap](deploy/scripts/kafka-topics.cjs)                                                                              |
| Database definitions          | Each service's `prisma/schema.prisma` and `prisma/migrations/`                                                                  |
| Cloud deployment              | [AWS runbook](deploy/README.md), [Helm values](deploy/helm/foodmatrix/values.yaml), [Terraform](deploy/terraform)               |

## 17. Backend HTTP route index

The following index lists business controller routes extracted from `backend/*-service/src`. Paths are **backend-relative**; prepend the service's Kong prefix from section 2.2 for gateway calls. Browser code generally uses frontend same-origin API handlers.

This is a navigation index, not an OpenAPI payload specification. Consult each linked controller, DTO and policy for request fields, query/pagination rules and authorization. `:parameters` are path variables. Better Auth plugin routes and health/scaffold endpoints are not exhaustively listed. Runtime registration still depends on application module imports.

### organization-service

Controller: [auth.controller.ts](backend/organization-service/src/auth/authservice/auth.controller.ts)

| Method | Backend path            |
| ------ | ----------------------- |
| `POST` | `/auth/register`        |
| `POST` | `/auth/change-password` |
| `GET`  | `/auth/me`              |

Controller: [franchise.controller.ts](backend/organization-service/src/modules/franchise/franchise.controller.ts)

| Method  | Backend path         |
| ------- | -------------------- |
| `GET`   | `/franchise/options` |
| `GET`   | `/franchise`         |
| `PATCH` | `/franchise`         |

Controller: [catalog-access.controller.ts](backend/organization-service/src/modules/restaurant/catalog-access.controller.ts)

| Method | Backend path      |
| ------ | ----------------- |
| `GET`  | `/catalog-access` |

Controller: [hr-access.controller.ts](backend/organization-service/src/modules/restaurant/hr-access.controller.ts)

| Method | Backend path |
| ------ | ------------ |
| `GET`  | `/hr-access` |

Controller: [inventory-access.controller.ts](backend/organization-service/src/modules/restaurant/inventory-access.controller.ts)

| Method | Backend path           |
| ------ | ---------------------- |
| `GET`  | `/inventory-access`    |
| `GET`  | `/notification-access` |

Controller: [order-access.controller.ts](backend/organization-service/src/modules/restaurant/order-access.controller.ts)

| Method | Backend path    |
| ------ | --------------- |
| `GET`  | `/order-access` |

Controller: [restaurant.controller.ts](backend/organization-service/src/modules/restaurant/restaurant.controller.ts)

| Method   | Backend path       |
| -------- | ------------------ |
| `POST`   | `/restaurants`     |
| `GET`    | `/restaurants`     |
| `GET`    | `/restaurants/:id` |
| `PATCH`  | `/restaurants/:id` |
| `DELETE` | `/restaurants/:id` |

Controller: [system-user.controller.ts](backend/organization-service/src/modules/system-user/system-user.controller.ts)

| Method  | Backend path                     |
| ------- | -------------------------------- |
| `GET`   | `/system-users`                  |
| `PATCH` | `/system-users/:id/status`       |
| `PATCH` | `/system-users/:id/assignment`   |
| `GET`   | `/system-users/auth/:authUserId` |
| `GET`   | `/system-users/:id`              |

### catalog-service

Controller: [ingredient.controller.ts](backend/catalog-service/src/modules/ingredient/ingredient.controller.ts)

| Method   | Backend path       |
| -------- | ------------------ |
| `POST`   | `/ingredients`     |
| `GET`    | `/ingredients`     |
| `GET`    | `/ingredients/:id` |
| `PATCH`  | `/ingredients/:id` |
| `DELETE` | `/ingredients/:id` |

Controller: [internal-catalog.controller.ts](backend/catalog-service/src/modules/internal-catalog/internal-catalog.controller.ts)

| Method | Backend path                         |
| ------ | ------------------------------------ |
| `POST` | `/internal/catalog/bulk-pricing`     |
| `POST` | `/internal/catalog/bulk-recipes`     |
| `POST` | `/internal/catalog/bulk-ingredients` |

Controller: [item-modifier-group.controller.ts](backend/catalog-service/src/modules/item-modifier-group/item-modifier-group.controller.ts)

| Method   | Backend path                                 |
| -------- | -------------------------------------------- |
| `POST`   | `/item-modifier-groups`                      |
| `GET`    | `/item-modifier-groups`                      |
| `GET`    | `/item-modifier-groups/:menuItemId/:groupId` |
| `DELETE` | `/item-modifier-groups/:menuItemId/:groupId` |

Controller: [menu-category.controller.ts](backend/catalog-service/src/modules/menu-category/menu-category.controller.ts)

| Method   | Backend path           |
| -------- | ---------------------- |
| `POST`   | `/menu-categories`     |
| `GET`    | `/menu-categories`     |
| `GET`    | `/menu-categories/:id` |
| `PATCH`  | `/menu-categories/:id` |
| `DELETE` | `/menu-categories/:id` |

Controller: [menu-item.controller.ts](backend/catalog-service/src/modules/menu-item/menu-item.controller.ts)

| Method   | Backend path                          |
| -------- | ------------------------------------- |
| `POST`   | `/menu-items`                         |
| `GET`    | `/menu-items`                         |
| `GET`    | `/menu-items/:menuItemId/restaurants` |
| `GET`    | `/menu-items/:id`                     |
| `GET`    | `/menu-items/category/:categoryId`    |
| `PATCH`  | `/menu-items/:id`                     |
| `DELETE` | `/menu-items/:id`                     |

Controller: [modifier.controller.ts](backend/catalog-service/src/modules/modifier/modifier.controller.ts)

| Method   | Backend path     |
| -------- | ---------------- |
| `POST`   | `/modifiers`     |
| `GET`    | `/modifiers`     |
| `GET`    | `/modifiers/:id` |
| `PATCH`  | `/modifiers/:id` |
| `DELETE` | `/modifiers/:id` |

Controller: [modifier-group.controller.ts](backend/catalog-service/src/modules/modifier-group/modifier-group.controller.ts)

| Method   | Backend path          |
| -------- | --------------------- |
| `POST`   | `/modifier-group`     |
| `GET`    | `/modifier-group`     |
| `GET`    | `/modifier-group/:id` |
| `PATCH`  | `/modifier-group/:id` |
| `DELETE` | `/modifier-group/:id` |

Controller: [recipe-item.controller.ts](backend/catalog-service/src/modules/recipe-item/recipe-item.controller.ts)

| Method   | Backend path                           |
| -------- | -------------------------------------- |
| `POST`   | `/recipe-items`                        |
| `POST`   | `/recipe-items/bulk`                   |
| `GET`    | `/recipe-items/menu-items`             |
| `GET`    | `/recipe-items/modifiers`              |
| `GET`    | `/recipe-items/menu-items/:menuItemId` |
| `GET`    | `/recipe-items/modifiers/:modifierId`  |
| `GET`    | `/recipe-items/:id`                    |
| `PATCH`  | `/recipe-items/:id`                    |
| `DELETE` | `/recipe-items/:id`                    |

Controller: [restaurant-menu-item.controller.ts](backend/catalog-service/src/modules/restaurant-menu-item/restaurant-menu-item.controller.ts)

| Method   | Backend path                                             |
| -------- | -------------------------------------------------------- |
| `POST`   | `/restaurant-menu-item`                                  |
| `GET`    | `/restaurant-menu-item/restaurant/:restaurantId`         |
| `GET`    | `/restaurant-menu-item/restaurant/:restaurantId/changed` |
| `GET`    | `/restaurant-menu-item/changed`                          |
| `GET`    | `/restaurant-menu-item/:id`                              |
| `PATCH`  | `/restaurant-menu-item/:id`                              |
| `DELETE` | `/restaurant-menu-item/:id`                              |

### order-service

Controller: [customer.controller.ts](backend/order-service/src/module/customer/customer.controller.ts)

| Method   | Backend path            |
| -------- | ----------------------- |
| `POST`   | `/customers`            |
| `GET`    | `/customers`            |
| `GET`    | `/customers/:id/orders` |
| `GET`    | `/customers/:id`        |
| `PATCH`  | `/customers/:id`        |
| `DELETE` | `/customers/:id`        |

Controller: [orders.controller.ts](backend/order-service/src/module/orders/orders.controller.ts)

| Method   | Backend path                                      |
| -------- | ------------------------------------------------- |
| `POST`   | `/orders`                                         |
| `GET`    | `/orders/kitchen/upcoming`                        |
| `GET`    | `/orders`                                         |
| `GET`    | `/orders/dashboard`                               |
| `GET`    | `/orders/:id`                                     |
| `POST`   | `/orders/:id/items`                               |
| `PATCH`  | `/orders/:id/kitchen/items/:itemId/status`        |
| `POST`   | `/orders/:id/items/:itemId/unavailability`        |
| `PATCH`  | `/orders/:id/items/:itemId/unavailability`        |
| `DELETE` | `/orders/:id/items/:itemId`                       |
| `DELETE` | `/orders/:id/items/:itemId/modifiers/:modifierId` |
| `POST`   | `/orders/:id/confirm`                             |
| `POST`   | `/orders/:id/prepare`                             |
| `POST`   | `/orders/:id/ready`                               |
| `POST`   | `/orders/:id/complete`                            |
| `POST`   | `/orders/:id/cancel`                              |

Controller: [payment.controller.ts](backend/order-service/src/module/payment/payment.controller.ts)

| Method | Backend path                       |
| ------ | ---------------------------------- |
| `POST` | `/payments`                        |
| `GET`  | `/payments/:id`                    |
| `GET`  | `/payments/order/:orderId`         |
| `GET`  | `/payments/order/:orderId/summary` |
| `POST` | `/payments/:paymentId/refund`      |
| `POST` | `/payments/order/:orderId/refund`  |

### inventory-service

Controller: [restaurant-stock.controller.ts](backend/inventory-service/src/modules/restaurant-stock/restaurant-stock.controller.ts)

| Method | Backend path                                           |
| ------ | ------------------------------------------------------ |
| `GET`  | `/restaurant-stock/:restaurantId`                      |
| `GET`  | `/restaurant-stock/:restaurantId/low-stock`            |
| `GET`  | `/restaurant-stock/:restaurantId/:ingredientId`        |
| `POST` | `/restaurant-stock/:restaurantId/:ingredientId/adjust` |

Controller: [stock-movement.controller.ts](backend/inventory-service/src/modules/stock-movement/stock-movement.controller.ts)

| Method | Backend path                                |
| ------ | ------------------------------------------- |
| `GET`  | `/stock-movements`                          |
| `GET`  | `/stock-movements/restaurant/:restaurantId` |
| `GET`  | `/stock-movements/warehouse/:warehouseId`   |

Controller: [stock-request.controller.ts](backend/inventory-service/src/modules/stock-request/stock-request.controller.ts)

| Method   | Backend path                                              |
| -------- | --------------------------------------------------------- |
| `POST`   | `/stock-requests`                                         |
| `GET`    | `/stock-requests/restaurant/:restaurantId`                |
| `POST`   | `/stock-requests/:id/cancel`                              |
| `PATCH`  | `/stock-requests/:id`                                     |
| `DELETE` | `/stock-requests/:id/restaurant/:restaurantId`            |
| `GET`    | `/stock-requests/warehouse/:warehouseId`                  |
| `POST`   | `/stock-requests/:id/approve`                             |
| `POST`   | `/stock-requests/:id/reject`                              |
| `GET`    | `/stock-requests/:id`                                     |
| `GET`    | `/stock-requests`                                         |
| `POST`   | `/stock-requests/restaurant/:restaurantId/from-low-stock` |
| `GET`    | `/stock-requests/restaurant/:restaurantId/low-stock`      |

Controller: [stock-transfer.controller.ts](backend/inventory-service/src/modules/stock-transfer/stock-transfer.controller.ts)

| Method | Backend path                                |
| ------ | ------------------------------------------- |
| `GET`  | `/stock-transfers/warehouse/:warehouseId`   |
| `POST` | `/stock-transfers/:id/start-picking`        |
| `POST` | `/stock-transfers/:id/ready-to-ship`        |
| `POST` | `/stock-transfers/:id/shipment`             |
| `POST` | `/stock-transfers/:id/ship`                 |
| `POST` | `/stock-transfers/:id/in-transit`           |
| `GET`  | `/stock-transfers/restaurant/:restaurantId` |
| `POST` | `/stock-transfers/:id/receive`              |
| `GET`  | `/stock-transfers/:id`                      |
| `POST` | `/stock-transfers/:id/resolve-discrepancy`  |

Controller: [warehouse-stock.controller.ts](backend/inventory-service/src/modules/warehouse-stock/warehouse-stock.controller.ts)

| Method | Backend path                                                       |
| ------ | ------------------------------------------------------------------ |
| `POST` | `/warehouse-stock/receive`                                         |
| `POST` | `/warehouse-stock/receive/bulk`                                    |
| `GET`  | `/warehouse-stock/warehouse/:warehouseId`                          |
| `GET`  | `/warehouse-stock/warehouse/:warehouseId/ingredient/:ingredientId` |
| `POST` | `/warehouse-stock/:warehouseId/:ingredientId/adjust`               |

Controller: [waste-log.controller.ts](backend/inventory-service/src/modules/waste-log/waste-log.controller.ts)

| Method | Backend path                           |
| ------ | -------------------------------------- |
| `POST` | `/waste-logs`                          |
| `GET`  | `/waste-logs/restaurant/:restaurantId` |
| `GET`  | `/waste-logs/:id`                      |

### hr-service

Controller: [attendance.controller.ts](backend/hr-service/src/modules/attendance/attendance.controller.ts)

| Method | Backend path            |
| ------ | ----------------------- |
| `POST` | `/attendance/clock-in`  |
| `POST` | `/attendance/clock-out` |
| `GET`  | `/attendance`           |
| `GET`  | `/attendance/:id`       |

Controller: [leave.controller.ts](backend/hr-service/src/modules/leave/leave.controller.ts)

| Method   | Backend path          |
| -------- | --------------------- |
| `POST`   | `/leaves`             |
| `GET`    | `/leaves`             |
| `GET`    | `/leaves/:id`         |
| `PATCH`  | `/leaves/:id`         |
| `PATCH`  | `/leaves/:id/approve` |
| `PATCH`  | `/leaves/:id/reject`  |
| `PATCH`  | `/leaves/:id/revoke`  |
| `DELETE` | `/leaves/:id`         |

Controller: [payroll.controller.ts](backend/hr-service/src/modules/payroll/payroll.controller.ts)

| Method   | Backend path                                       |
| -------- | -------------------------------------------------- |
| `POST`   | `/payroll-runs`                                    |
| `GET`    | `/payroll-runs`                                    |
| `GET`    | `/payroll-runs/:id`                                |
| `POST`   | `/payroll-runs/:id/process`                        |
| `PATCH`  | `/payroll-runs/:id/approve`                        |
| `PATCH`  | `/payroll-runs/:id/pay`                            |
| `PATCH`  | `/payroll-runs/:id/reopen`                         |
| `PATCH`  | `/payroll-runs/:id/payslips/:payslipId/deductions` |
| `DELETE` | `/payroll-runs/:id`                                |

Controller: [payslip.controller.ts](backend/hr-service/src/modules/payslip/payslip.controller.ts)

| Method | Backend path               |
| ------ | -------------------------- |
| `GET`  | `/payslips`                |
| `GET`  | `/payslips/staff/:staffId` |
| `GET`  | `/payslips/:id`            |
| `GET`  | `/payslips/:id/download`   |

Controller: [shift-schedule.controller.ts](backend/hr-service/src/modules/shift-schedule/shift-schedule.controller.ts)

| Method   | Backend path           |
| -------- | ---------------------- |
| `POST`   | `/shift-schedules`     |
| `GET`    | `/shift-schedules`     |
| `GET`    | `/shift-schedules/:id` |
| `PATCH`  | `/shift-schedules/:id` |
| `DELETE` | `/shift-schedules/:id` |

Controller: [shift-template.controller.ts](backend/hr-service/src/modules/shift-template/shift-template.controller.ts)

| Method   | Backend path           |
| -------- | ---------------------- |
| `POST`   | `/shift-templates`     |
| `GET`    | `/shift-templates`     |
| `GET`    | `/shift-templates/:id` |
| `PATCH`  | `/shift-templates/:id` |
| `DELETE` | `/shift-templates/:id` |

Controller: [staff.controller.ts](backend/hr-service/src/modules/staff/staff.controller.ts)

| Method   | Backend path        |
| -------- | ------------------- |
| `POST`   | `/staff`            |
| `GET`    | `/staff`            |
| `GET`    | `/staff/:id`        |
| `PATCH`  | `/staff/:id`        |
| `PATCH`  | `/staff/:id/status` |
| `DELETE` | `/staff/:id`        |

Controller: [wage.controller.ts](backend/hr-service/src/modules/wage/wage.controller.ts)

| Method   | Backend path                    |
| -------- | ------------------------------- |
| `POST`   | `/wages`                        |
| `POST`   | `/wages/changes`                |
| `DELETE` | `/wages/changes/:id`            |
| `GET`    | `/wages`                        |
| `GET`    | `/wages/staff/:staffId/current` |
| `GET`    | `/wages/:id`                    |
| `PATCH`  | `/wages/:id`                    |
| `DELETE` | `/wages/:id`                    |

### notification-service

Controller: [notification.controller.ts](backend/notification-service/src/modules/notification/notification.controller.ts)

| Method  | Backend path                                       |
| ------- | -------------------------------------------------- |
| `GET`   | `/notifications/restaurant/:restaurantId`          |
| `GET`   | `/notifications/warehouse/:warehouseId`            |
| `GET`   | `/notifications/:id`                               |
| `PATCH` | `/notifications/:id/read`                          |
| `PATCH` | `/notifications/restaurant/:restaurantId/read-all` |
| `PATCH` | `/notifications/warehouse/:warehouseId/read-all`   |
