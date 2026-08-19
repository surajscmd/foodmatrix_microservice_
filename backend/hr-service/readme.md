HR SERVICE
│
├── Staff
│   ├── CRUD
│   └── Wage History
│
├── Shift
│   └── Attendance
│
├── Leave
│
├── Shift Template
│
├── Shift Schedule
│
├── Payroll
│   ├── Create Payroll Run
│   ├── Process Payroll
│   ├── Approve
│   └── Mark Paid
│
├── Payroll Calculation
│   ├── Regular Hours
│   ├── Overtime
│   ├── Paid Leave
│   ├── Gross Pay
│   ├── Deductions
│   └── Net Pay
│
└── Payslip
    ├── Generate
    ├── View
    └── PDF Download
Next: Payroll final validation

We should test this complete flow:

Staff
↓
Wage History
↓
Shift Template
↓
Shift Schedule
↓
Attendance
↓
Leave
↓
Payroll Calculation
↓
Payslip
↓
Payroll Run
↓
Approve
↓
Paid

Then test important cases:

Normal 8-hour shift
Overtime shift
Night shift crossing midnight
Employee with approved leave
Employee with no shifts
Employee with changed wage
Duplicate payroll period
Processing payroll twice
Approving unprocessed payroll
Paying unapproved payroll



//endpoit for payroll run

POST /payroll-runs
GET /payroll-runs
GET /payroll-runs/:id

POST /payroll-runs/:id/process
PATCH /payroll-runs/:id/approve
PATCH /payroll-runs/:id/pay
