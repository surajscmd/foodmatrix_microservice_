import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  EmployeeStatus,
  LeaveStatus,
  PayType,
  PaymentMethod,
  PayrollStatus,
  Prisma,
  PrismaClient,
  ShiftScheduleStatus,
  ShiftTemplateStatus,
  ShiftType,
} from '@prisma/client';
import { hash } from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const INDIRANAGAR_ID = 'd1a7c4b0-1001-4a2b-8c3d-111111111111';
const WHITEFIELD_ID = 'd1a7c4b0-1002-4a2b-8c3d-222222222222';
const KORAMANGALA_ID = 'd1a7c4b0-1003-4a2b-8c3d-333333333333';

const ADMIN_USER_IDS = {
  [INDIRANAGAR_ID]: 'a0000000-0000-4000-8000-000000000004',
  [WHITEFIELD_ID]: 'a0000000-0000-4000-8000-000000000005',
  [KORAMANGALA_ID]: 'a0000000-0000-4000-8000-000000000006',
} as const;

const STAFF_IDS = {
  arjun: 'b0000000-0000-4000-8000-000000000001',
  kavya: 'b0000000-0000-4000-8000-000000000002',
  suresh: 'b0000000-0000-4000-8000-000000000003',
  deepika: 'b0000000-0000-4000-8000-000000000004',
  karthik: 'b0000000-0000-4000-8000-000000000005',
  rahul: 'b0000000-0000-4000-8000-000000000006',
  sneha: 'b0000000-0000-4000-8000-000000000007',
  manoj: 'b0000000-0000-4000-8000-000000000008',
  divya: 'b0000000-0000-4000-8000-000000000009',
  siddharth: 'b0000000-0000-4000-8000-000000000010',
  anjali: 'b0000000-0000-4000-8000-000000000011',
  nikhil: 'b0000000-0000-4000-8000-000000000012',
} as const;

interface StaffSeed {
  id: string;
  restaurantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  role: string;
  status: EmployeeStatus;
  payType: PayType;
  hourlyWage?: string;
  overtimeRate?: string;
  salaryAmount?: string;
}

const STAFF_MEMBERS: StaffSeed[] = [
  {
    id: STAFF_IDS.arjun,
    restaurantId: INDIRANAGAR_ID,
    employeeCode: 'IND-001',
    firstName: 'Arjun',
    lastName: 'Shetty',
    role: 'Waiter',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '185.00',
    overtimeRate: '260.00',
  },
  {
    id: STAFF_IDS.kavya,
    restaurantId: INDIRANAGAR_ID,
    employeeCode: 'IND-002',
    firstName: 'Kavya',
    lastName: 'Nair',
    role: 'Cashier',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '210.00',
    overtimeRate: '290.00',
  },
  {
    id: STAFF_IDS.suresh,
    restaurantId: INDIRANAGAR_ID,
    employeeCode: 'IND-003',
    firstName: 'Suresh',
    lastName: 'Gowda',
    role: 'Head Chef',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.SALARY,
    salaryAmount: '48000.00',
  },
  {
    id: STAFF_IDS.deepika,
    restaurantId: INDIRANAGAR_ID,
    employeeCode: 'IND-004',
    firstName: 'Deepika',
    lastName: 'Rao',
    role: 'Sous Chef',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '240.00',
    overtimeRate: '340.00',
  },
  {
    id: STAFF_IDS.karthik,
    restaurantId: INDIRANAGAR_ID,
    employeeCode: 'IND-005',
    firstName: 'Karthik',
    lastName: 'Verma',
    role: 'Kitchen Helper',
    status: EmployeeStatus.ON_LEAVE,
    payType: PayType.HOURLY,
    hourlyWage: '150.00',
    overtimeRate: '210.00',
  },
  {
    id: STAFF_IDS.rahul,
    restaurantId: WHITEFIELD_ID,
    employeeCode: 'WFD-001',
    firstName: 'Rahul',
    lastName: 'Deshmukh',
    role: 'Store Manager',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.SALARY,
    salaryAmount: '52000.00',
  },
  {
    id: STAFF_IDS.sneha,
    restaurantId: WHITEFIELD_ID,
    employeeCode: 'WFD-002',
    firstName: 'Sneha',
    lastName: 'Patel',
    role: 'Waiter',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '180.00',
    overtimeRate: '250.00',
  },
  {
    id: STAFF_IDS.manoj,
    restaurantId: WHITEFIELD_ID,
    employeeCode: 'WFD-003',
    firstName: 'Manoj',
    lastName: 'Kumar',
    role: 'Line Cook',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '215.00',
    overtimeRate: '300.00',
  },
  {
    id: STAFF_IDS.divya,
    restaurantId: WHITEFIELD_ID,
    employeeCode: 'WFD-004',
    firstName: 'Divya',
    lastName: 'Menon',
    role: 'Cashier',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '200.00',
    overtimeRate: '280.00',
  },
  {
    id: STAFF_IDS.siddharth,
    restaurantId: KORAMANGALA_ID,
    employeeCode: 'KRM-001',
    firstName: 'Siddharth',
    lastName: 'Joshi',
    role: 'Kitchen Lead',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.SALARY,
    salaryAmount: '46000.00',
  },
  {
    id: STAFF_IDS.anjali,
    restaurantId: KORAMANGALA_ID,
    employeeCode: 'KRM-002',
    firstName: 'Anjali',
    lastName: 'Sharma',
    role: 'Waiter',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '185.00',
    overtimeRate: '260.00',
  },
  {
    id: STAFF_IDS.nikhil,
    restaurantId: KORAMANGALA_ID,
    employeeCode: 'KRM-003',
    firstName: 'Nikhil',
    lastName: 'Hegde',
    role: 'Cashier',
    status: EmployeeStatus.ACTIVE,
    payType: PayType.HOURLY,
    hourlyWage: '205.00',
    overtimeRate: '285.00',
  },
];

function utcDateOnly(daysOffset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysOffset),
  );
}

function atTime(daysOffset: number, hourUtc: number, minute = 0): Date {
  const d = utcDateOnly(daysOffset);
  d.setUTCHours(hourUtc, minute, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding hr-service...');
  const pinHash = await hash('1234', 10);
  const startHistoryDate = utcDateOnly(-60);

  for (const [index, member] of STAFF_MEMBERS.entries()) {
    const seq = String(index + 1).padStart(12, '0');
    await prisma.staff.upsert({
      where: { id: member.id },
      update: {
        restaurantId: member.restaurantId,
        employeeCode: member.employeeCode,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        status: member.status,
      },
      create: {
        id: member.id,
        restaurantId: member.restaurantId,
        employeeCode: member.employeeCode,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        pinHash,
        status: member.status,
      },
    });

    const assignmentId = `b7000000-0000-4000-8000-${seq}`;
    await prisma.staffAssignment.upsert({
      where: { id: assignmentId },
      update: { restaurantId: member.restaurantId, startsOn: startHistoryDate },
      create: {
        id: assignmentId,
        staffId: member.id,
        restaurantId: member.restaurantId,
        startsOn: startHistoryDate,
      },
    });

    const wageId = `b8000000-0000-4000-8000-${seq}`;
    await prisma.wageHistory.upsert({
      where: { id: wageId },
      update: {
        payType: member.payType,
        hourlyWage: member.hourlyWage ? new Prisma.Decimal(member.hourlyWage) : null,
        overtimeRate: member.overtimeRate
          ? new Prisma.Decimal(member.overtimeRate)
          : null,
        salaryAmount: member.salaryAmount
          ? new Prisma.Decimal(member.salaryAmount)
          : null,
      },
      create: {
        id: wageId,
        staffId: member.id,
        payType: member.payType,
        hourlyWage: member.hourlyWage ? new Prisma.Decimal(member.hourlyWage) : null,
        overtimeRate: member.overtimeRate
          ? new Prisma.Decimal(member.overtimeRate)
          : null,
        salaryAmount: member.salaryAmount
          ? new Prisma.Decimal(member.salaryAmount)
          : null,
        effectiveStartDate: startHistoryDate,
        approvedById:
          ADMIN_USER_IDS[member.restaurantId as keyof typeof ADMIN_USER_IDS],
      },
    });
  }

  // Shift templates for all 3 restaurants
  const restaurants = [
    { id: INDIRANAGAR_ID, code: '1' },
    { id: WHITEFIELD_ID, code: '2' },
    { id: KORAMANGALA_ID, code: '3' },
  ];

  const templateIds: Record<string, { morning: string; evening: string; split: string }> = {};

  for (const r of restaurants) {
    const morningId = `b1000000-0000-4000-8000-000000000${r.code}01`;
    const eveningId = `b1000000-0000-4000-8000-000000000${r.code}02`;
    const splitId = `b1000000-0000-4000-8000-000000000${r.code}03`;
    templateIds[r.id] = { morning: morningId, evening: eveningId, split: splitId };

    const templates = [
      {
        id: morningId,
        code: '1',
        name: 'Morning Breakfast & Lunch',
        type: ShiftType.MORNING,
        segments: [
          { sequence: 1, startTime: '07:00', endTime: '15:00', crossesMidnight: false },
        ],
      },
      {
        id: eveningId,
        code: '2',
        name: 'Evening Dinner Service',
        type: ShiftType.EVENING,
        segments: [
          { sequence: 1, startTime: '15:00', endTime: '23:00', crossesMidnight: false },
        ],
      },
      {
        id: splitId,
        code: '3',
        name: 'Split Peak Service',
        type: ShiftType.SPLIT,
        segments: [
          { sequence: 1, startTime: '11:00', endTime: '15:00', crossesMidnight: false },
          { sequence: 2, startTime: '18:30', endTime: '22:30', crossesMidnight: false },
        ],
      },
    ];

    for (const tpl of templates) {
      await prisma.shiftTemplate.upsert({
        where: { id: tpl.id },
        update: {
          name: tpl.name,
          type: tpl.type,
          status: ShiftTemplateStatus.ACTIVE,
        },
        create: {
          id: tpl.id,
          restaurantId: r.id,
          name: tpl.name,
          type: tpl.type,
          status: ShiftTemplateStatus.ACTIVE,
        },
      });

      for (const seg of tpl.segments) {
        const segId = `b9000000-0000-4000-8000-000000000${r.code}${tpl.code}${seg.sequence}`;
        await prisma.shiftTemplateSegment.upsert({
          where: { id: segId },
          update: {
            startTime: seg.startTime,
            endTime: seg.endTime,
            crossesMidnight: seg.crossesMidnight,
          },
          create: {
            id: segId,
            shiftTemplateId: tpl.id,
            ...seg,
          },
        });
      }
    }
  }

  // Payroll runs (1 PAID run for Indiranagar, 1 APPROVED run for Whitefield, 1 DRAFT for Koramangala)
  const indiranagarPaidRunId = 'b2000000-0000-4000-8000-000000000001';
  const whitefieldApprovedRunId = 'b2000000-0000-4000-8000-000000000002';
  const koramangalaDraftRunId = 'b2000000-0000-4000-8000-000000000003';

  await prisma.payrollRun.upsert({
    where: { id: indiranagarPaidRunId },
    update: {},
    create: {
      id: indiranagarPaidRunId,
      restaurantId: INDIRANAGAR_ID,
      restaurantName: 'FoodMatrix Indiranagar',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      periodStartDate: utcDateOnly(-21),
      periodEndDate: utcDateOnly(-8),
      status: PayrollStatus.PAID,
      processedById: ADMIN_USER_IDS[INDIRANAGAR_ID],
      paidAt: atTime(-6, 11, 0),
      paidById: ADMIN_USER_IDS[INDIRANAGAR_ID],
      paymentReference: 'NEFT-IND-202611-01',
      totalGrossPay: new Prisma.Decimal('48645.00'),
      totalTaxes: new Prisma.Decimal('4864.50'),
      totalNetPay: new Prisma.Decimal('43780.50'),
    },
  });

  await prisma.payrollRun.upsert({
    where: { id: whitefieldApprovedRunId },
    update: {},
    create: {
      id: whitefieldApprovedRunId,
      restaurantId: WHITEFIELD_ID,
      restaurantName: 'FoodMatrix Whitefield',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      periodStartDate: utcDateOnly(-21),
      periodEndDate: utcDateOnly(-8),
      status: PayrollStatus.APPROVED,
      processedById: ADMIN_USER_IDS[WHITEFIELD_ID],
      totalGrossPay: new Prisma.Decimal('43100.00'),
      totalTaxes: new Prisma.Decimal('4310.00'),
      totalNetPay: new Prisma.Decimal('38790.00'),
    },
  });

  await prisma.payrollRun.upsert({
    where: { id: koramangalaDraftRunId },
    update: {},
    create: {
      id: koramangalaDraftRunId,
      restaurantId: KORAMANGALA_ID,
      restaurantName: 'FoodMatrix Koramangala',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      periodStartDate: utcDateOnly(-21),
      periodEndDate: utcDateOnly(-8),
      status: PayrollStatus.DRAFT,
      processedById: ADMIN_USER_IDS[KORAMANGALA_ID],
      totalGrossPay: new Prisma.Decimal('37800.00'),
      totalTaxes: new Prisma.Decimal('3780.00'),
      totalNetPay: new Prisma.Decimal('34020.00'),
    },
  });

  const payslips = [
    {
      id: 'b3000000-0000-4000-8000-000000000001',
      payrollRunId: indiranagarPaidRunId,
      staffId: STAFF_IDS.arjun,
      regularHours: '64.00',
      overtimeHours: '4.50',
      paidLeaveHours: '0.00',
      regularPay: '11840.00',
      overtimePay: '1170.00',
      grossPay: '13010.00',
      taxDeductions: '1301.00',
      otherDeductions: '0.00',
      netPay: '11709.00',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.PAID,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000002',
      payrollRunId: indiranagarPaidRunId,
      staffId: STAFF_IDS.kavya,
      regularHours: '56.00',
      overtimeHours: '2.00',
      paidLeaveHours: '8.00',
      regularPay: '11760.00',
      overtimePay: '580.00',
      grossPay: '14020.00',
      taxDeductions: '1402.00',
      otherDeductions: '0.00',
      netPay: '12618.00',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.PAID,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000003',
      payrollRunId: indiranagarPaidRunId,
      staffId: STAFF_IDS.suresh,
      regularHours: '80.00',
      overtimeHours: '0.00',
      paidLeaveHours: '0.00',
      regularPay: '21615.00',
      overtimePay: '0.00',
      grossPay: '21615.00',
      taxDeductions: '2161.50',
      otherDeductions: '0.00',
      netPay: '19453.50',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.PAID,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000004',
      payrollRunId: whitefieldApprovedRunId,
      staffId: STAFF_IDS.rahul,
      regularHours: '80.00',
      overtimeHours: '0.00',
      paidLeaveHours: '0.00',
      regularPay: '24000.00',
      overtimePay: '0.00',
      grossPay: '24000.00',
      taxDeductions: '2400.00',
      otherDeductions: '0.00',
      netPay: '21600.00',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.APPROVED,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000005',
      payrollRunId: whitefieldApprovedRunId,
      staffId: STAFF_IDS.sneha,
      regularHours: '60.00',
      overtimeHours: '3.00',
      paidLeaveHours: '0.00',
      regularPay: '10800.00',
      overtimePay: '750.00',
      grossPay: '11550.00',
      taxDeductions: '1155.00',
      otherDeductions: '0.00',
      netPay: '10395.00',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.APPROVED,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000006',
      payrollRunId: whitefieldApprovedRunId,
      staffId: STAFF_IDS.manoj,
      regularHours: '35.00',
      overtimeHours: '0.00',
      paidLeaveHours: '0.00',
      regularPay: '7550.00',
      overtimePay: '0.00',
      grossPay: '7550.00',
      taxDeductions: '755.00',
      otherDeductions: '0.00',
      netPay: '6795.00',
      paymentMethod: PaymentMethod.CASH,
      status: PayrollStatus.APPROVED,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000007',
      payrollRunId: koramangalaDraftRunId,
      staffId: STAFF_IDS.siddharth,
      regularHours: '80.00',
      overtimeHours: '0.00',
      paidLeaveHours: '0.00',
      regularPay: '23000.00',
      overtimePay: '0.00',
      grossPay: '23000.00',
      taxDeductions: '2300.00',
      otherDeductions: '0.00',
      netPay: '20700.00',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.DRAFT,
    },
    {
      id: 'b3000000-0000-4000-8000-000000000008',
      payrollRunId: koramangalaDraftRunId,
      staffId: STAFF_IDS.anjali,
      regularHours: '80.00',
      overtimeHours: '0.00',
      paidLeaveHours: '0.00',
      regularPay: '14800.00',
      overtimePay: '0.00',
      grossPay: '14800.00',
      taxDeductions: '1480.00',
      otherDeductions: '0.00',
      netPay: '13320.00',
      paymentMethod: PaymentMethod.DIRECT_DEPOSIT,
      status: PayrollStatus.DRAFT,
    },
  ];

  for (const p of payslips) {
    await prisma.payslip.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        payrollRunId: p.payrollRunId,
        staffId: p.staffId,
        regularHours: new Prisma.Decimal(p.regularHours),
        overtimeHours: new Prisma.Decimal(p.overtimeHours),
        paidLeaveHours: new Prisma.Decimal(p.paidLeaveHours),
        regularPay: new Prisma.Decimal(p.regularPay),
        overtimePay: new Prisma.Decimal(p.overtimePay),
        grossPay: new Prisma.Decimal(p.grossPay),
        taxDeductions: new Prisma.Decimal(p.taxDeductions),
        otherDeductions: new Prisma.Decimal(p.otherDeductions),
        netPay: new Prisma.Decimal(p.netPay),
        paymentMethod: p.paymentMethod,
        status: p.status,
      },
    });
  }

  // ShiftSchedules + Shifts (past payroll shifts, recent open shifts, active clocked-in shifts, upcoming schedules)
  const schedulesAndShifts = [
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000001',
      shiftId: 'b5000000-0000-4000-8000-000000000001',
      staffId: STAFF_IDS.arjun,
      restaurantId: INDIRANAGAR_ID,
      templateId: templateIds[INDIRANAGAR_ID].morning,
      shiftType: ShiftType.MORNING,
      start: atTime(-12, 1, 30),
      end: atTime(-12, 9, 30),
      scheduleStatus: ShiftScheduleStatus.COMPLETED,
      clockInAt: atTime(-12, 1, 32),
      clockOutAt: atTime(-12, 10, 15),
      totalHours: '8.72',
      regularHours: '8.00',
      overtimeHours: '0.72',
      hourlyWageAtShift: '185.00',
      overtimeRateAtShift: '260.00',
      isProcessedForPay: true,
      payrollRunId: indiranagarPaidRunId,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000002',
      shiftId: 'b5000000-0000-4000-8000-000000000002',
      staffId: STAFF_IDS.kavya,
      restaurantId: INDIRANAGAR_ID,
      templateId: templateIds[INDIRANAGAR_ID].evening,
      shiftType: ShiftType.EVENING,
      start: atTime(-3, 9, 30),
      end: atTime(-3, 17, 30),
      scheduleStatus: ShiftScheduleStatus.COMPLETED,
      clockInAt: atTime(-3, 9, 28),
      clockOutAt: atTime(-3, 17, 35),
      totalHours: '8.12',
      regularHours: '8.00',
      overtimeHours: '0.12',
      hourlyWageAtShift: '210.00',
      overtimeRateAtShift: '290.00',
      isProcessedForPay: false,
      payrollRunId: null,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000003',
      shiftId: 'b5000000-0000-4000-8000-000000000003',
      staffId: STAFF_IDS.deepika,
      restaurantId: INDIRANAGAR_ID,
      templateId: templateIds[INDIRANAGAR_ID].morning,
      shiftType: ShiftType.MORNING,
      start: atTime(-1, 1, 30),
      end: atTime(-1, 9, 30),
      scheduleStatus: ShiftScheduleStatus.COMPLETED,
      clockInAt: atTime(-1, 1, 50),
      clockOutAt: atTime(-1, 10, 0),
      totalHours: '8.17',
      regularHours: '8.00',
      overtimeHours: '0.17',
      hourlyWageAtShift: '240.00',
      overtimeRateAtShift: '340.00',
      isProcessedForPay: false,
      payrollRunId: null,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000004',
      shiftId: 'b5000000-0000-4000-8000-000000000004',
      staffId: STAFF_IDS.arjun,
      restaurantId: INDIRANAGAR_ID,
      templateId: templateIds[INDIRANAGAR_ID].morning,
      shiftType: ShiftType.MORNING,
      start: atTime(0, 1, 30),
      end: atTime(0, 14, 30),
      scheduleStatus: ShiftScheduleStatus.SCHEDULED,
      clockInAt: atTime(0, 1, 35),
      clockOutAt: null,
      totalHours: null,
      regularHours: null,
      overtimeHours: '0.00',
      hourlyWageAtShift: '185.00',
      overtimeRateAtShift: '260.00',
      isProcessedForPay: false,
      payrollRunId: null,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000005',
      shiftId: 'b5000000-0000-4000-8000-000000000005',
      staffId: STAFF_IDS.sneha,
      restaurantId: WHITEFIELD_ID,
      templateId: templateIds[WHITEFIELD_ID].morning,
      shiftType: ShiftType.MORNING,
      start: atTime(0, 2, 0),
      end: atTime(0, 14, 0),
      scheduleStatus: ShiftScheduleStatus.SCHEDULED,
      clockInAt: atTime(0, 2, 10),
      clockOutAt: null,
      totalHours: null,
      regularHours: null,
      overtimeHours: '0.00',
      hourlyWageAtShift: '180.00',
      overtimeRateAtShift: '250.00',
      isProcessedForPay: false,
      payrollRunId: null,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000006',
      shiftId: 'b5000000-0000-4000-8000-000000000006',
      staffId: STAFF_IDS.anjali,
      restaurantId: KORAMANGALA_ID,
      templateId: templateIds[KORAMANGALA_ID].evening,
      shiftType: ShiftType.EVENING,
      start: atTime(0, 4, 0),
      end: atTime(0, 16, 0),
      scheduleStatus: ShiftScheduleStatus.SCHEDULED,
      clockInAt: atTime(0, 4, 0),
      clockOutAt: null,
      totalHours: null,
      regularHours: null,
      overtimeHours: '0.00',
      hourlyWageAtShift: '185.00',
      overtimeRateAtShift: '260.00',
      isProcessedForPay: false,
      payrollRunId: null,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000007',
      shiftId: null,
      staffId: STAFF_IDS.manoj,
      restaurantId: WHITEFIELD_ID,
      templateId: templateIds[WHITEFIELD_ID].evening,
      shiftType: ShiftType.EVENING,
      start: atTime(-2, 9, 30),
      end: atTime(-2, 17, 30),
      scheduleStatus: ShiftScheduleStatus.MISSED,
      clockInAt: null,
      clockOutAt: null,
      totalHours: null,
      regularHours: null,
      overtimeHours: null,
      hourlyWageAtShift: null,
      overtimeRateAtShift: null,
      isProcessedForPay: false,
      payrollRunId: null,
    },
    {
      scheduleId: 'b4000000-0000-4000-8000-000000000008',
      shiftId: null,
      staffId: STAFF_IDS.kavya,
      restaurantId: INDIRANAGAR_ID,
      templateId: templateIds[INDIRANAGAR_ID].evening,
      shiftType: ShiftType.EVENING,
      start: atTime(1, 9, 30),
      end: atTime(1, 17, 30),
      scheduleStatus: ShiftScheduleStatus.SCHEDULED,
      clockInAt: null,
      clockOutAt: null,
      totalHours: null,
      regularHours: null,
      overtimeHours: null,
      hourlyWageAtShift: null,
      overtimeRateAtShift: null,
      isProcessedForPay: false,
      payrollRunId: null,
    },
  ];

  for (const s of schedulesAndShifts) {
    await prisma.shiftSchedule.upsert({
      where: { id: s.scheduleId },
      update: {
        scheduledStart: s.start,
        scheduledEnd: s.end,
        status: s.scheduleStatus,
      },
      create: {
        id: s.scheduleId,
        restaurantId: s.restaurantId,
        staffId: s.staffId,
        shiftTemplateId: s.templateId,
        scheduledStart: s.start,
        scheduledEnd: s.end,
        status: s.scheduleStatus,
      },
    });

    if (s.shiftId && s.clockInAt) {
      await prisma.shift.upsert({
        where: { id: s.shiftId },
        update: {
          clockInAt: s.clockInAt,
          clockOutAt: s.clockOutAt,
        },
        create: {
          id: s.shiftId,
          staffId: s.staffId,
          restaurantId: s.restaurantId,
          shiftType: s.shiftType,
          clockInAt: s.clockInAt,
          clockOutAt: s.clockOutAt,
          shiftScheduleId: s.scheduleId,
          totalHours: s.totalHours ? new Prisma.Decimal(s.totalHours) : null,
          regularHours: s.regularHours ? new Prisma.Decimal(s.regularHours) : null,
          overtimeHours: s.overtimeHours
            ? new Prisma.Decimal(s.overtimeHours)
            : new Prisma.Decimal('0.00'),
          hourlyWageAtShift: s.hourlyWageAtShift
            ? new Prisma.Decimal(s.hourlyWageAtShift)
            : null,
          overtimeRateAtShift: s.overtimeRateAtShift
            ? new Prisma.Decimal(s.overtimeRateAtShift)
            : null,
          isProcessedForPay: s.isProcessedForPay,
          payrollRunId: s.payrollRunId,
        },
      });
    }
  }

  // Leaves
  const leaves = [
    {
      id: 'b6000000-0000-4000-8000-000000000001',
      staffId: STAFF_IDS.karthik,
      restaurantId: INDIRANAGAR_ID,
      type: 'SICK',
      isPaidLeave: true,
      startDate: utcDateOnly(-1),
      endDate: utcDateOnly(1),
      totalDays: '3.00',
      reason: 'Seasonal flu recovery',
      status: LeaveStatus.APPROVED,
      approvedById: ADMIN_USER_IDS[INDIRANAGAR_ID],
      approvedAt: atTime(-2, 10, 0),
    },
    {
      id: 'b6000000-0000-4000-8000-000000000002',
      staffId: STAFF_IDS.sneha,
      restaurantId: WHITEFIELD_ID,
      type: 'CASUAL',
      isPaidLeave: true,
      startDate: utcDateOnly(5),
      endDate: utcDateOnly(6),
      totalDays: '2.00',
      reason: 'Family wedding in Mysuru',
      status: LeaveStatus.PENDING,
      approvedById: null,
      approvedAt: null,
    },
    {
      id: 'b6000000-0000-4000-8000-000000000003',
      staffId: STAFF_IDS.manoj,
      restaurantId: WHITEFIELD_ID,
      type: 'CASUAL',
      isPaidLeave: false,
      startDate: utcDateOnly(-5),
      endDate: utcDateOnly(-5),
      totalDays: '1.00',
      reason: 'Weekend dinner rush — short staffed',
      status: LeaveStatus.REJECTED,
      approvedById: ADMIN_USER_IDS[WHITEFIELD_ID],
      approvedAt: atTime(-6, 12, 0),
    },
  ];

  for (const lv of leaves) {
    await prisma.leave.upsert({
      where: { id: lv.id },
      update: { status: lv.status },
      create: {
        id: lv.id,
        staffId: lv.staffId,
        restaurantId: lv.restaurantId,
        type: lv.type,
        isPaidLeave: lv.isPaidLeave,
        startDate: lv.startDate,
        endDate: lv.endDate,
        totalDays: new Prisma.Decimal(lv.totalDays),
        reason: lv.reason,
        status: lv.status,
        approvedById: lv.approvedById,
        approvedAt: lv.approvedAt,
      },
    });
  }

  console.log(
    `HR seed complete: ${STAFF_MEMBERS.length} staff, 9 shift templates, ${schedulesAndShifts.length} schedules, ${leaves.length} leaves, 3 payroll runs, ${payslips.length} payslips.`,
  );
}

main()
  .catch((error) => {
    console.error('HR seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
