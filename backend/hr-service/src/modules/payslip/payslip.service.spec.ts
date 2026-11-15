import { Writable } from 'node:stream';
import { finished } from 'node:stream/promises';
import type { Response } from 'express';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { PayslipService } from './payslip.service.js';

it('streams a downloadable PDF for the selected payslip', async () => {
  const prisma = {
    payslip: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'slip',
        staff: {
          firstName: 'Test',
          lastName: 'Staff',
          employeeCode: '01',
          role: 'Cook',
        },
        payrollRun: {
          periodStartDate: new Date('2026-11-01'),
          periodEndDate: new Date('2026-11-30'),
        },
        regularHours: 8,
        overtimeHours: 0,
        paidLeaveHours: 0,
        regularPay: 4000,
        overtimePay: 0,
        grossPay: 4000,
        taxDeductions: 100,
        otherDeductions: 0,
        netPay: 3900,
        status: 'PAID',
      }),
    },
  } as unknown as PrismaService;
  const chunks: Buffer[] = [];
  const response = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });
  const setHeader = jest.fn();
  const completed = finished(response);

  await new PayslipService(prisma).download(
    'slip',
    Object.assign(response, { setHeader }) as unknown as Response,
    'FoodMatrix',
  );
  await completed;
  expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
  expect(setHeader).toHaveBeenCalledWith(
    'Content-Disposition',
    'attachment; filename="payslip-slip.pdf"',
  );
  const pdf = Buffer.concat(chunks);
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.subarray(-6).toString().trim()).toBe('%%EOF');
});
