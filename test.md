# FoodMatrix test report

Report prepared: **25 November 2026**, Asia/Kolkata.

This document preserves historical results and a fresh DevOps verification pass. The latest verification section below records tests actually rerun after the deployment/readiness changes; older sections remain historical. Results belong to the tested checkout at the time; they are not an assertion that every current uncommitted change or a production deployment has passed. Historical results and follow-up runs are separated to avoid double-counting.

## Latest verification: DevOps changes, 25 November 2026

Base commit: `70e56b1`, with uncommitted DevOps, health-check and documentation changes. These results do not identify a clean release commit.

All six backend Jest suites were rerun with coverage after adding database-aware readiness/liveness endpoints and tests for success, failure, timeout and coalesced concurrent probes. TypeScript checks and the exact non-mutating TypeScript lint globs used by CI passed for all six services.

| Service      | Unit tests passed | Unit suites passed | HTTP tests passed | Unit line coverage       |
| ------------ | ----------------- | ------------------ | ----------------- | ------------------------ |
| Organization | 15                | 8                  | 6                 | 25.78%                   |
| Catalog      | 219               | 19                 | 10                | 69.35%                   |
| Hr           | 30                | 13                 | 10                | 30.16%                   |
| Order        | 12                | 8                  | 12                | 18.62%                   |
| Inventory    | 22                | 17                 | 5                 | 16.40%                   |
| Notification | 13                | 5                  | 7                 | 18.18%                   |
| **Total**    | **311**           | **70**             | **50**            | Per-service values above |

Five services used disposable PostgreSQL databases for HTTP tests; all migrations applied and schema drift checks passed. HR used its existing mocked HTTP setup. Every service's HTTP pass checked anonymous `/health/live` and `/health/ready` routing. These are local verification results, not an executed Jenkins or AWS release.

Coverage is unit-only and remains limited in several services. It does not include the HTTP suite's exercised lines and is not a claim of comprehensive coverage. CI now archives JSON results and LCOV reports; the Sonar quality gate must remain enabled even if existing code fails its configured thresholds.

Configuration verification:

- Updated application Helm chart lint and AWS-example rendering passed; rendering contains six readiness/startup paths and six liveness paths.
- Root Compose syntax passed with `--no-env-resolution`; this intentionally does not validate private `.env.docker` files, which must be supplied before startup.
- Kafka, standalone Kong and SonarQube Compose syntax passed; Sonar validation used a disposable placeholder password, not a started database.
- Jenkinsfile Groovy syntax and all five changed/new CI/release Bash scripts passed syntax checks. This does not validate installed Jenkins plugins or execute the declarative pipeline.
- LCOV rebasing succeeded for all six services and linked source paths exist.
- Invalid publish image tags and non-HTTPS smoke origins were rejected before AWS/network actions.
- The final Compose structure includes all 13 expected services, three persistent broker volumes and a disabled root-stack Kong Admin API.
- Terraform formatting and read-only validation passed.
- The Inventory deployment image built successfully; a disposable container confirmed the compiled health controller exists and `/app/.env` and `/app/.env.docker` are absent. The Jenkins tools image also built successfully; a disposable container verified Node.js 22, npm, Compose, Buildx, Helm 3.19.0, Terraform 1.12.2, kubectl 1.34.0 and AWS CLI. Neither image verification started an application server or used AWS credentials.

Initial sandboxed Jest attempts hit Windows dependency-read restrictions and were interrupted. Tests were rerun successfully with permitted execution outside that sandbox. A verification command that linted the entire `test` directory also included non-TypeScript `.mjs` wrappers and failed ESLint project discovery; the actual CI TypeScript-only globs passed without changing or suppressing lint rules.

A local Inventory image dependency install reported existing npm advisories (including development dependencies). No automatic dependency upgrades or `npm audit fix --force` were performed as part of this infrastructure change.

## Historical result summary

| Category                                       | Recorded result                                        | Evidence and qualification                                                                     |
| ---------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Backend Jest baseline                          | 273 tests passed across 61 suites                      | Saved per-service unit logs from 24 November 2026                                              |
| Inventory / Notification reliability follow-up | 25 unit tests and 10 integration tests passed          | Earlier task execution results; separate from the saved baseline, not additional totals to sum |
| Manual desktop checks                          | 51 grouped checks passed; one confirmed display defect | Saved browser report, 24–25 November 2026                                                      |
| Application Helm chart                         | Lint and AWS-example rendering passed                  | Read-only deployment review on 25 November 2026                                                |
| Terraform                                      | Formatting and configuration validation passed         | Read-only deployment review on 25 November 2026                                                |
| Kafka / Kong / SonarQube Compose               | Configuration syntax checks passed                     | Does not establish runtime health or production suitability                                    |
| Production acceptance                          | Not established                                        | No cloud rollout, full load test or complete destructive business-flow pass in these results   |

A passed grouped manual check is not a Jest test case. These categories must not be combined into one total or described as complete code coverage.

## 1. Jest unit testing

### 1.1 Saved baseline results

The following counts come directly from the saved Jest output under `tmp/code-review-20261124/`.

| Backend service | Suites passed / total | Tests passed / total | Result     |
| --------------- | --------------------- | -------------------- | ---------- |
| Organization    | 7 / 7                 | 10 / 10              | Passed     |
| Catalog         | 18 / 18               | 214 / 214            | Passed     |
| Hr              | 12 / 12               | 25 / 25              | Passed     |
| Order           | 7 / 7                 | 7 / 7                | Passed     |
| Inventory       | 14 / 14               | 14 / 14              | Passed     |
| Notification    | 3 / 3                 | 3 / 3                | Passed     |
| **Total**       | **61 / 61**           | **273 / 273**        | **Passed** |

No snapshot tests were recorded in these logs. Coverage percentages were not captured; passing tests do not imply 100% line, branch or scenario coverage. Organization and Inventory output included Node's experimental VM Modules warning, which was not a failing test result.

### 1.2 Reliability follow-up runs

After the baseline, the Inventory and Notification reliability fixes were checked separately:

| Service                   | Unit tests    | Integration tests | Recorded result |
| ------------------------- | ------------- | ----------------- | --------------- |
| Inventory                 | 17 passed     | 4 passed          | Passed          |
| Notifications             | 8 passed      | 6 passed          | Passed          |
| **Follow-up scope total** | **25 passed** | **10 passed**     | **Passed**      |

These are later runs for the affected services. Do not add them to the 273-test baseline as if they were distinct tests in one all-service run. The counts are preserved from earlier execution results in this task; separate complete follow-up log files were not found in the saved report directory.

The follow-up scenarios included:

- Low-stock events persisted before contacting Kafka.
- Failed Kafka publishing retained an outbox row and retried with stable event identity.
- Notification persistence and socket-queue creation were atomic.
- Failed socket delivery retained recoverable queued work.
- Duplicate events did not create duplicate persisted notifications/queued deliveries.
- Worker startup drained previously queued work.
- Expired leases allowed interrupted work to be retried.
- Concurrent socket workers claimed queued work without the tested duplicate claim.
- Disposable-database migrations and schema checks for the affected integration suites.

### 1.3 How to rerun Jest

Run from each backend service directory:

```powershell
npm test -- --runInBand
```

For example:

```powershell
Set-Location C:\suraj\microservice\backend\inventory-service
npm test -- --runInBand
```

Use package scripts rather than replacing them with one raw Jest command across services: Organization and Inventory supply the ESM VM Modules options their tests require.

To generate fresh coverage from a service directory:

```powershell
npm run test:cov -- --runInBand
```

Inspect the resulting coverage report before stating coverage percentages. There is no recorded frontend Jest suite in this report; frontend lint/types/build and manual checks are different validation methods.

## 2. Backend HTTP integration / e2e testing

Organization, Catalog, Orders, Inventory and Notifications have `npm run test:e2e` wrappers that create a disposable PostgreSQL database, apply migrations, check schema drift, run HTTP tests and clean up the generated database.

| Service       | Required test administration connection variable |
| ------------- | ------------------------------------------------ |
| Organization  | `ORGANIZATION_TEST_DATABASE_URL`                 |
| Catalog       | `CATALOG_TEST_DATABASE_URL`                      |
| Orders        | `ORDER_TEST_DATABASE_URL`                        |
| Inventory     | `INVENTORY_TEST_DATABASE_URL`                    |
| Notifications | `NOTIFICATION_TEST_DATABASE_URL`                 |

Example from Order Service, using a dedicated test role/server with database creation permission:

```powershell
$env:ORDER_TEST_DATABASE_URL = "postgresql://TEST_ADMIN:URL_ENCODED_PASSWORD@localhost:5432/postgres"
npm run test:e2e
```

Do not point raw destructive integration tests at a live application database. HR's current e2e command uses a Jest HTTP configuration with mocked dependencies; it does not provide the same disposable-database evidence.

The quantified follow-up integration results above apply to Inventory and Notifications. This report does not invent an all-service e2e total where corresponding saved results are unavailable.

## 3. Manual browser testing

- Application: `http://localhost:3000`.
- Test period: **24–25 November 2026**.
- Accounts: Restaurant Admin Test and Super Admin.
- Mode: desktop browser smoke checks and selected operational workflow checks.
- Result: **51 grouped checks passed**, with **one confirmed currency-display defect**.
- Operations data was inspected without approvals, shipment edits or permission changes.
- No application source code was changed during the browser testing itself.

### 3.1 Recorded checks

| ID     | Result | Scenario                                                                           |
| ------ | ------ | ---------------------------------------------------------------------------------- |
| MAN-01 | Passed | Restaurant sign-in and dashboard data loading                                      |
| MAN-02 | Passed | Menu availability and category filters                                             |
| MAN-03 | Passed | Menu edit dialog enables Save for changes and Cancel discards them                 |
| MAN-04 | Passed | POS modifier selection and quantity totals                                         |
| MAN-05 | Passed | POS required customer-phone validation                                             |
| MAN-06 | Passed | Approved QA order creation and confirmation                                        |
| MAN-07 | Passed | QA order appears in kitchen with modifiers                                         |
| MAN-08 | Passed | Kitchen unavailable-item request reaches cashier                                   |
| MAN-09 | Passed | Final-dish cancellation warning and manager confirmation                           |
| MAN-10 | Passed | Cancelled QA order appears in history at zero total                                |
| MAN-11 | Passed | Waiter table listing and kitchen-ticket details                                    |
| MAN-12 | Passed | Inventory balances, request history and completed deliveries                       |
| MAN-13 | Passed | Stock-request ingredient search and multi-line draft cancellation                  |
| MAN-14 | Passed | Stock-movement pagination reaches records 21 through 34                            |
| MAN-15 | Passed | Punch-clock empty state for no scheduled staff                                     |
| MAN-16 | Passed | Daily roster, monthly tracker and selected-day attendance                          |
| MAN-17 | Passed | Shift planner staff and template selectors                                         |
| MAN-18 | Passed | Shift-template listing, split-shift blocks and unsaved Cancel                      |
| MAN-19 | Passed | Staff directory, profile, wage history and staff shift schedule                    |
| MAN-20 | Passed | Leave-status filtering                                                             |
| MAN-21 | Passed | Payslip and payroll empty states                                                   |
| MAN-22 | Passed | Restaurant alerts show Connected with matching 12 unread counts                    |
| MAN-23 | Passed | Alert read-status filter and header notification dropdown                          |
| MAN-24 | Passed | Browser preference draft updates preview without saving                            |
| MAN-25 | Passed | Restaurant profile settings and account-security entry point                       |
| MAN-26 | Passed | Restaurant account is denied Operations access with a 403 page                     |
| MAN-27 | Passed | Operations sign-in and Super Admin workspace access                                |
| MAN-28 | Passed | Operations dashboard loads all four data sources and network metrics               |
| MAN-29 | Passed | Central-menu final-page pagination shows records 91 through 95                     |
| MAN-30 | Passed | Central-menu category selection returns seven Dosa Specials                        |
| MAN-31 | Passed | Modifier registry loads groups and their options                                   |
| MAN-32 | Passed | Restaurant directory lists all three locations                                     |
| MAN-33 | Passed | Restaurant detail loads all six connected data sources                             |
| MAN-34 | Passed | Operations staff registry loads six employees                                      |
| MAN-35 | Passed | Staff restaurant filter returns the two assigned employees                         |
| MAN-36 | Passed | Operations staff profile loads attendance, compensation and schedule records       |
| MAN-37 | Passed | Warehouse inventory loads 92 stock records                                         |
| MAN-38 | Passed | Warehouse out-of-stock filter returns one zero-balance ingredient                  |
| MAN-39 | Passed | Warehouse stock-request history loads six requests                                 |
| MAN-40 | Passed | Pending-request filter returns two requests                                        |
| MAN-41 | Passed | Request-review drawer loads ingredient quantities without changing the request     |
| MAN-42 | Passed | Fulfillment ledger loads four completed transfers                                  |
| MAN-43 | Passed | Completed-transfer detail shows matching approved, shipped and received quantities |
| MAN-44 | Passed | Warehouse stock-audit ledger loads 25 movements                                    |
| MAN-45 | Passed | Restaurant-scoped stock audit matches the restaurant view with 34 movements        |
| MAN-46 | Passed | Warehouse notification connection shows Connected with matching five-unread count  |
| MAN-47 | Passed | Warehouse unread filter returns five notifications                                 |
| MAN-48 | Passed | Operations platform settings and account-security entry point load                 |
| MAN-49 | Passed | System-login management lists the restaurant accounts                              |
| MAN-50 | Passed | System-login search narrows to the expected test account                           |
| MAN-51 | Passed | Operations browser console check returned no captured warnings or errors           |

### 3.2 Approved test order and cleanup state

| Field                                    | Recorded value                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Order                                    | `#17`                                                                                                     |
| Table                                    | `QA-MANUAL-2411`                                                                                          |
| Item                                     | One Crispy Corn with Spicy modifier                                                                       |
| Authorization                            | User explicitly approved creating and cancelling this test order                                          |
| Verified path                            | POS create/confirm → kitchen visibility → unavailability report → cashier review → last-dish cancellation |
| Final state                              | `CANCELLED`                                                                                               |
| Final total                              | `$0.00`                                                                                                   |
| Payment taken                            | No                                                                                                        |
| Kitchen-ready action / stock consumption | Not performed                                                                                             |
| Remaining data                           | Cancelled order retained in history for traceability                                                      |

The retained cancelled order is intentional audit history, not an unclosed paid order.

### 3.3 Confirmed defect: MANUAL-01

**Severity:** P2. **Status:** observed and not fixed during that test pass; not rechecked while preparing this report.

Operations money displays hardcode INR/₹ in some screens although the tested franchise/restaurant context reported USD.

| Evidence           | Observed mismatch                                               |
| ------------------ | --------------------------------------------------------------- |
| Ghee Roast Dosa    | Restaurant menu `$169.00`; Operations Central Menu `₹169.00`    |
| Same employee wage | Restaurant profile `$234.00/hour`; Operations profile `₹234.00` |
| Modifier registry  | Extra prices rendered with `₹`                                  |

Source starting points recorded during testing:

- [Menu table](frontend/src/elements/menu/MenuTable.tsx).
- [Modifier manager](frontend/src/elements/menu/ModifierManagerModal.tsx).
- [Operations staff details](frontend/src/elements/workforcecomand/StaffInformationView.tsx).

Recommendation: format values using the applicable franchise/restaurant currency. Currency formatting must not falsely imply exchange-rate conversion.

### 3.4 Additional observation

The first cold navigation to the unauthorized page briefly displayed blank content. Reload and the next redirect displayed the correct 403 screen. This was not reproduced as a persistent defect; it remains an observation rather than a confirmed second failure.

### 3.5 Manual scenarios not tested

- Actual payments and refunds.
- Marking kitchen items ready and consuming stock manually.
- Submitting stock requests or delivery receipts.
- Clock-in/out because no shifts were scheduled for the current day.
- Saving employee, wage, leave or payroll changes.
- Payslip download because this staff member has no payslips.
- Password or PIN reset.
- Other role combinations beyond Restaurant Admin and Super Admin.
- Mobile viewport, load testing, and browser/network interruption recovery.

Read-only checks of leave, payroll and stock history do not prove the corresponding submission/payment/receipt workflows. Automated retry tests do not establish browser recovery under a real interrupted connection.

## 4. Static checks and historical log qualifications

The cleanup directory contains frontend/backend lint and TypeScript logs and post-cleanup TypeScript logs. Many files are empty, so their contents alone do not preserve command exit status and cannot independently prove a successful run.

The saved initial Organization lint log contains one Prettier formatting failure in `test/organization.e2e-spec.ts`. A correction was made during the earlier work, but this report does not relabel the initial failing log as a clean final result or claim a new lint run.

For a fresh frontend check, from `frontend`:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

For each backend:

```powershell
npx eslint "src/**/*.ts" "test/**/*.ts"
npm run build
```

Several backend `npm run lint` scripts include `--fix`; the explicit ESLint command above is suitable when a non-mutating check is intended.

## 5. Deployment configuration validation

Recorded during the 25 November 2026 read-only deployment review:

| Check                                        | Result | Scope                                                                                                                           |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Helm lint: `deploy/helm/foodmatrix`          | Passed | Chart lint; only the recommended chart-icon informational message                                                               |
| Helm template with `values-eks.example.yaml` | Passed | Application manifest rendering with placeholder image/broker values                                                             |
| Terraform `fmt -check`                       | Passed | Configuration formatting                                                                                                        |
| Terraform `validate`                         | Passed | Configuration/provider schema validation; initial sandbox provider startup failed, then the permitted read-only retry succeeded |
| Kafka Compose `config --quiet`               | Passed | Compose syntax and interpolation                                                                                                |
| Kong Compose `config --quiet`                | Passed | Compose syntax and interpolation                                                                                                |
| SonarQube Compose `config --quiet`           | Passed | Compose syntax and interpolation                                                                                                |

These checks did not apply Terraform, install Helm releases, create AWS resources, execute an image build, or prove live Kafka/Kong/SonarQube health. GitHub Actions workflows were subsequently removed at the user's request; the recorded local validation is not a GitHub Actions run.

Deployment review identified separate open configuration gaps: incomplete Jenkins service/test/release stages, no enforced Sonar quality gate, local Kafka without declared persistent volumes, locally exposed Kong Admin API, an evaluation-oriented SonarQube database setup, and an incomplete older root Compose stack. Passing syntax checks does not close those findings.

## 6. Evidence and report maintenance

Primary saved evidence used for this report:

- `tmp/manual-testing-2026-11-24/report.json` and `report.txt`.
- Six `tmp/code-review-20261124/backend-*-service-unit.log` files.
- Historical lint/type logs in the same cleanup directory, with the qualifications above.
- Earlier task execution output for the reliability follow-up and deployment validation.

`tmp/` is ignored by Git and can be deleted. The important results are reproduced here so this tracked report does not depend on those local files remaining available. No credentials or session tokens are included.

For future runs, record date/time, tested commit and dirty-worktree status, command, exit code, suite/test counts, coverage if collected, environment, failures, and the exact follow-up scope. Preserve old results as historical evidence rather than presenting them as fresh validation after code changes.

Overall conclusion: recorded unit and selected manual/configuration checks passed within their stated scope, with a known display defect and substantial untested acceptance scenarios. This is not a production-readiness sign-off.
