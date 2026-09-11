# HR Service

The HR Service manages restaurant employees, wages, shift templates, shift scheduling, attendance, leave management, payroll processing, and payslips.

## Base URL

```text
http://localhost:3003
```

---

# HR Business Flow

```text
Staff
  ↓
Wage
  ↓
Shift Template
  ↓
Shift Schedule
  ↓
Attendance
  ↓
Leave
  ↓
Payroll Run
  ↓
Payslip
```

---

# 1. Staff

The Staff module manages employees working in a restaurant.

## APIs

| Method | URL                                       | Description            |
| ------ | ----------------------------------------- | ---------------------- |
| POST   | `/staff`                                  | Create employee        |
| GET    | `/staff?restaurantId=...&page=1&limit=10` | Get employees          |
| GET    | `/staff/:id`                              | Get employee           |
| PATCH  | `/staff/:id`                              | Update employee        |
| PATCH  | `/staff/:id/status`                       | Change employee status |
| DELETE | `/staff/:id`                              | Soft-delete employee   |

### Example

```http
POST http://localhost:3003/staff
```

An employee must exist before creating schedules, attendance, leave, or payroll records.

---

# 2. Wage

The Wage module manages wage history for employees.

An employee can be:

```text
HOURLY
  ├── hourlyWage
  └── overtimeRate

SALARY
  └── salaryAmount
```

## APIs

| Method | URL                                  | Description         |
| ------ | ------------------------------------ | ------------------- |
| POST   | `/wages`                             | Create wage history |
| GET    | `/wages?staffId=...&page=1&limit=10` | Get wage history    |
| GET    | `/wages/staff/:staffId/current`      | Get current wage    |
| GET    | `/wages/:id`                         | Get one wage        |
| PATCH  | `/wages/:id`                         | Update wage         |
| DELETE | `/wages/:id`                         | Delete wage         |

The current wage is used when calculating payroll and attendance pay.

---

# 3. Shift Template

A Shift Template is a reusable definition of a shift.

Example:

```text
Morning Shift
08:00 → 16:00
```

A template is configuration. It is not an employee's actual shift.

## APIs

| Method | URL                                               | Description              |
| ------ | ------------------------------------------------- | ------------------------ |
| POST   | `/shift-templates`                                | Create shift template    |
| GET    | `/shift-templates?restaurantId=...`               | Get restaurant templates |
| GET    | `/shift-templates?restaurantId=...&status=ACTIVE` | Get active templates     |
| GET    | `/shift-templates/:id`                            | Get template             |
| PATCH  | `/shift-templates/:id`                            | Update template          |
| DELETE | `/shift-templates/:id`                            | Delete template          |

---

# 4. Shift Schedule

A Shift Schedule assigns a Shift Template to a specific employee on a specific date/time.

Example:

```text
Employee: Rahul
Template: Morning Shift
Date: 15 September 2026
08:00 → 16:00
```

## APIs

| Method | URL                                             | Description                           |
| ------ | ----------------------------------------------- | ------------------------------------- |
| POST   | `/shift-schedules`                              | Create employee schedule              |
| GET    | `/shift-schedules`                              | Get all schedules                     |
| GET    | `/shift-schedules?restaurantId=...`             | Get restaurant schedules              |
| GET    | `/shift-schedules?staffId=...`                  | Get employee schedules                |
| GET    | `/shift-schedules?restaurantId=...&staffId=...` | Get employee schedules for restaurant |
| GET    | `/shift-schedules/:id`                          | Get one schedule                      |
| PATCH  | `/shift-schedules/:id`                          | Update schedule                       |
| DELETE | `/shift-schedules/:id`                          | Delete schedule                       |

### Business Rules

The service validates:

```text
Start < End
      ↓
Staff belongs to restaurant
      ↓
Staff is active
      ↓
Template belongs to restaurant
      ↓
Template is ACTIVE
      ↓
No overlapping schedule
```

Cancelled schedules do not block new schedules.

---

# 5. Attendance

Attendance records actual employee working time.

## APIs

| Method | URL                                        | Description                       |
| ------ | ------------------------------------------ | --------------------------------- |
| POST   | `/attendance/clock-in`                     | Clock employee in                 |
| POST   | `/attendance/clock-out`                    | Clock employee out                |
| GET    | `/attendance`                              | Get all attendance                |
| GET    | `/attendance?restaurantId=...`             | Restaurant attendance             |
| GET    | `/attendance?staffId=...`                  | Employee attendance               |
| GET    | `/attendance?restaurantId=...&staffId=...` | Employee attendance in restaurant |
| GET    | `/attendance/:id`                          | Get one attendance record         |

## Clock-In Flow

```text
Shift Schedule
      ↓
Employee clocks in
      ↓
Validate staff
      ↓
Validate schedule
      ↓
Check active shift
      ↓
Get current wage
      ↓
Create Shift record
```

Example:

```http
POST http://localhost:3003/attendance/clock-in
```

```json
{
  "restaurantId": "RESTAURANT_UUID",
  "staffId": "STAFF_UUID",
  "shiftScheduleId": "SHIFT_SCHEDULE_UUID"
}
```

## Clock-Out Flow

```text
Active Shift
     ↓
Employee clocks out
     ↓
Calculate total hours
     ↓
Calculate regular hours
     ↓
Calculate overtime
     ↓
Update Shift
```

Example:

```http
POST http://localhost:3003/attendance/clock-out
```

```json
{
  "shiftId": "SHIFT_UUID"
}
```

### Attendance Example

```text
Scheduled Start: 08:00
Actual Clock-In: 08:12

Later:
EMPLOYEE_LATE
```

```text
Scheduled End: 16:00
Actual Clock-Out: 15:45

Later:
EMPLOYEE_CLOCKED_OUT_EARLY
```

---

# 6. Leave

The Leave module manages employee leave requests.

## Leave Workflow

```text
Create Leave
     ↓
   PENDING
   /     \
  /       \
APPROVED  REJECTED
```

## APIs

| Method | URL                                       | Description                   |
| ------ | ----------------------------------------- | ----------------------------- |
| POST   | `/leaves`                                 | Create leave request          |
| GET    | `/leaves`                                 | Get all leaves                |
| GET    | `/leaves?restaurantId=...`                | Get restaurant leaves         |
| GET    | `/leaves?staffId=...`                     | Get employee leaves           |
| GET    | `/leaves?status=PENDING`                  | Get pending leaves            |
| GET    | `/leaves?restaurantId=...&status=PENDING` | Get restaurant pending leaves |
| GET    | `/leaves/:id`                             | Get one leave                 |
| PATCH  | `/leaves/:id`                             | Update pending leave          |
| PATCH  | `/leaves/:id/approve`                     | Approve leave                 |
| PATCH  | `/leaves/:id/reject`                      | Reject leave                  |
| DELETE | `/leaves/:id`                             | Delete pending leave          |

### Business Rules

```text
Only PENDING leave can be:
  ├── Updated
  ├── Deleted
  ├── Approved
  └── Rejected
```

The system also prevents overlapping pending or approved leave for the same employee.

Approved paid leave is later used during payroll calculation.

---

# 7. Payroll Run

Payroll Run represents the payroll period for a restaurant.

Example:

```text
September Payroll
01 September → 30 September
```

## APIs

| Method | URL                              | Description                   |
| ------ | -------------------------------- | ----------------------------- |
| POST   | `/payroll-runs`                  | Create payroll run            |
| GET    | `/payroll-runs`                  | Get all payroll runs          |
| GET    | `/payroll-runs?restaurantId=...` | Get restaurant payroll runs   |
| GET    | `/payroll-runs/:id`              | Get payroll run with payslips |
| POST   | `/payroll-runs/:id/process`      | Process payroll               |
| PATCH  | `/payroll-runs/:id/approve`      | Approve payroll               |
| PATCH  | `/payroll-runs/:id/pay`          | Mark payroll as paid          |

## Payroll Status

```text
DRAFT
  ↓
APPROVED
  ↓
PAID
```

---

# 8. Payroll Processing

When this endpoint is called:

```http
POST /payroll-runs/:id/process
```

the system calculates payroll for the active employees.

```text
                    Payroll Run
                         ↓
                  Active Employees
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
      Shifts        Paid Leave       Wage History
        ↓                ↓                ↓
        └────────────────┼────────────────┘
                         ↓
              PayrollCalculationService
                         ↓
                      Payslip
```

---

# 9. Hourly Employee Calculation

For hourly employees:

```text
Regular Hours × Hourly Wage
        +
Overtime Hours × Overtime Rate
        +
Paid Leave Hours × Hourly Wage
        =
Gross Pay
```

Then:

```text
Gross Pay
    -
Tax Deductions
    -
Other Deductions
    =
Net Pay
```

The current system keeps tax and other deductions at `0` because deduction rules are not currently defined in the HR schema.

---

# 10. Salary Employee Calculation

Salary employees use `salaryAmount`.

The current implementation treats this as a monthly salary.

```text
Monthly Salary
      ↓
Payroll Period
      ↓
Prorated Salary
      ↓
Gross Pay
```

For example:

```text
Monthly Salary = ₹30,000
Payroll Period = 15 days
      ↓
Salary is prorated for the applicable calendar days
```

---

# 11. Processed Attendance Protection

Attendance shifts contain:

```text
isProcessedForPay
```

A payroll calculation only selects completed, unprocessed shifts.

```text
Shift
  ↓
isProcessedForPay = false
  ↓
Payroll Processing
  ↓
Calculate Shift
  ↓
Create Payslip
  ↓
Mark Shift
isProcessedForPay = true
```

This prevents the same attendance shift from being included in another payroll run.

The payslip creation and shift processing update occur in the same database transaction.

```text
Create Payslip
      +
Mark Shift Processed
      ↓
   COMMIT
```

If the transaction fails, both operations are rolled back.

---

# 12. Payslip

Payslips are generated by Payroll Processing.

They are **not manually created** through the Payslip API.

## APIs

| Method | URL                          | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| GET    | `/payslips`                  | Get all payslips             |
| GET    | `/payslips?restaurantId=...` | Get restaurant payslips      |
| GET    | `/payslips?staffId=...`      | Get employee payslips        |
| GET    | `/payslips?payrollRunId=...` | Get payslips for payroll run |
| GET    | `/payslips/staff/:staffId`   | Get employee payslip history |
| GET    | `/payslips/:id`              | Get one payslip              |
| GET    | `/payslips/:id/download`     | Download payslip PDF         |

---

# 13. Payslip PDF

Example:

```http
GET /payslips/:id/download
```

The service generates a PDF containing:

```text
Employee Information
--------------------
Employee
Employee Code
Role

Payroll Period
--------------
Start Date
End Date

Working Hours
-------------
Regular Hours
Overtime Hours
Paid Leave Hours

Earnings
--------
Regular Pay
Overtime Pay
Gross Pay

Deductions
----------
Tax Deductions
Other Deductions

Net Pay
-------
Payment Method
Status
```

---

# Complete Real-World Flow

Suppose:

```text
Restaurant: Restaurant A

Employee: Rahul

Wage:
₹30,000 monthly salary

Shift:
Morning
08:00 → 16:00
```

## Step 1 — Create Employee

```http
POST /staff
```

Employee is created.

---

## Step 2 — Configure Wage

```http
POST /wages
```

Employee receives wage configuration.

```text
SALARY
₹30,000/month
```

---

## Step 3 — Create Shift Template

```http
POST /shift-templates
```

```text
Morning Shift
08:00 → 16:00
```

---

## Step 4 — Schedule Employee

```http
POST /shift-schedules
```

```text
Rahul
15 September 2026
08:00 → 16:00
```

---

## Step 5 — Employee Clocks In

```http
POST /attendance/clock-in
```

Actual:

```text
08:10
```

This attendance record is created.

Later, the system can determine:

```text
08:00 scheduled
08:10 actual
    ↓
EMPLOYEE_LATE
```

---

## Step 6 — Employee Clocks Out

```http
POST /attendance/clock-out
```

Actual:

```text
16:30
```

The system calculates:

```text
Regular Hours
Overtime Hours
Total Hours
```

Later, early/late notification events can be published through Kafka.

---

## Step 7 — Employee Applies for Leave

```http
POST /leaves
```

Status:

```text
PENDING
```

---

## Step 8 — Manager Approves Leave

```http
PATCH /leaves/:id/approve
```

Status:

```text
APPROVED
```

---

## Step 9 — Create Payroll

```http
POST /payroll-runs
```

Example:

```text
01 September 2026
      →
30 September 2026
```

Status:

```text
DRAFT
```

---

## Step 10 — Process Payroll

```http
POST /payroll-runs/:id/process
```

The system reads:

```text
Attendance
    +
Wage
    +
Approved Paid Leave
    ↓
PayrollCalculationService
    ↓
Payslip
```

Completed attendance shifts used by the calculation are marked:

```text
isProcessedForPay = true
```

---

## Step 11 — Approve Payroll

```http
PATCH /payroll-runs/:id/approve
```

```text
DRAFT → APPROVED
```

The payslips also become:

```text
APPROVED
```

---

## Step 12 — Pay Payroll

```http
PATCH /payroll-runs/:id/pay
```

```text
APPROVED → PAID
```

Payslips become:

```text
PAID
```

---

## Step 13 — Download Payslip

```http
GET /payslips/:id/download
```

Result:

```text
PDF Payslip
```

---

# Complete Architecture

```text
                         HR SERVICE
                              │
                              ▼
                       ┌─────────────┐
                       │    STAFF    │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │    WAGE     │
                       └──────┬──────┘
                              │
                              ▼
                  ┌─────────────────────┐
                  │   SHIFT TEMPLATE    │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    SHIFT SCHEDULE   │
                  └──────────┬──────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
             ┌─────────────┐   ┌─────────────┐
             │ ATTENDANCE  │   │    LEAVE    │
             └──────┬──────┘   └──────┬──────┘
                    │                 │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │   PAYROLL RUN   │
                    └────────┬────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │      PAYSLIP        │
                  └──────────┬──────────┘
                             │
                             ▼
                       PDF DOWNLOAD
```

# API Flow Summary

| Module         | Main Purpose                         |
| -------------- | ------------------------------------ |
| Staff          | Manage employees                     |
| Wage           | Manage employee compensation         |
| Shift Template | Define reusable shifts               |
| Shift Schedule | Assign shifts to employees           |
| Attendance     | Record actual working time           |
| Leave          | Manage employee leave                |
| Payroll Run    | Process employee payroll             |
| Payslip        | View and download payroll statements |

# Payroll Status Flow

```text
CREATE
  ↓
DRAFT
  ↓
PROCESS
  ↓
Payslips Created
  ↓
APPROVE
  ↓
APPROVED
  ↓
PAY
  ↓
PAID
```

# Leave Status Flow

```text
PENDING
 ├── APPROVED
 └── REJECTED
```

# Attendance Flow

```text
Scheduled Shift
      ↓
Clock In
      ↓
Actual Shift
      ↓
Clock Out
      ↓
Hours Calculated
      ↓
Payroll
```

# Future Kafka Notifications

The HR service is designed to publish business events such as:

```text
hr.employee-signed-in
hr.employee-late
hr.employee-clocked-out-early
hr.leave-applied
```

These events can be consumed by the Notification Service.

---

## Summary

The HR Service follows this complete business chain:

```text
Employee
   ↓
Wage Configuration
   ↓
Shift Definition
   ↓
Shift Assignment
   ↓
Attendance + Leave
   ↓
Payroll Calculation
   ↓
Payslip
   ↓
Payment
```

This keeps configuration, attendance, leave, payroll, and payslip responsibilities separated into their respective modules while maintaining a complete employee lifecycle.
