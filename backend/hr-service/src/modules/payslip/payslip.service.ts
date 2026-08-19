import { Injectable, NotFoundException } from '@nestjs/common';
import * as express from 'express';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class PayslipService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // GET ALL PAYSLIPS
  // ============================================================

  async findAll(
    restaurantId?: string,
    staffId?: string,
    payrollRunId?: string,
  ) {
    const payslips = await this.prisma.payslip.findMany({
      where: {
        ...(staffId && {
          staffId,
        }),

        ...(payrollRunId && {
          payrollRunId,
        }),

        ...(restaurantId && {
          payrollRun: {
            restaurantId,
          },
        }),
      },

      include: {
        payrollRun: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Payslips fetched successfully',
      data: payslips,
    };
  }

  // ============================================================
  // GET SINGLE PAYSLIP
  // ============================================================

  async findOne(id: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: {
        id,
      },

      include: {
        payrollRun: true,
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return {
      message: 'Payslip fetched successfully',
      data: payslip,
    };
  }

  // ============================================================
  // GET STAFF PAYSLIPS
  // ============================================================

  async findByStaff(staffId: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: {
        staffId,
      },

      include: {
        payrollRun: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Staff payslips fetched successfully',
      data: payslips,
    };
  }
  async download(id: string, res: express.Response) {
    const payslip = await this.prisma.payslip.findUnique({
      where: {
        id,
      },
      include: {
        staff: true,
        payrollRun: true,
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    const document = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const filename = `payslip-${payslip.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    document.pipe(res);

    // Header
    document.fontSize(24).font('Helvetica-Bold').text('PAYSLIP', {
      align: 'center',
    });

    document.moveDown();

    document.fontSize(10).font('Helvetica').text('Employee Payroll Statement', {
      align: 'center',
    });

    document.moveDown(2);

    // Employee
    document.fontSize(15).font('Helvetica-Bold').text('Employee Information');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Employee: ${payslip.staff.firstName} ${payslip.staff.lastName}`);

    document.text(`Employee Code: ${payslip.staff.employeeCode}`);

    document.text(`Role: ${payslip.staff.role}`);

    document.moveDown();

    // Payroll period
    document.fontSize(15).font('Helvetica-Bold').text('Payroll Period');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Start Date: ${formatDate(payslip.payrollRun.periodStartDate)}`);

    document.text(`End Date: ${formatDate(payslip.payrollRun.periodEndDate)}`);

    document.moveDown();

    // Hours
    document.fontSize(15).font('Helvetica-Bold').text('Working Hours');

    document.moveDown(0.5);

    document.text(`Regular Hours: ${formatDecimal(payslip.regularHours)}`);

    document.text(`Overtime Hours: ${formatDecimal(payslip.overtimeHours)}`);

    document.text(`Paid Leave Hours: ${formatDecimal(payslip.paidLeaveHours)}`);

    document.moveDown();

    // Earnings
    document.fontSize(15).font('Helvetica-Bold').text('Earnings');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Regular Pay: INR ${formatMoney(payslip.regularPay)}`);

    document.text(`Overtime Pay: INR ${formatMoney(payslip.overtimePay)}`);

    document.text(`Gross Pay: INR ${formatMoney(payslip.grossPay)}`);

    document.moveDown();

    // Deductions
    document.fontSize(15).font('Helvetica-Bold').text('Deductions');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Tax Deductions: INR ${formatMoney(payslip.taxDeductions)}`);

    document.text(
      `Other Deductions: INR ${formatMoney(payslip.otherDeductions)}`,
    );

    document.moveDown();

    // Net pay
    document
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(`NET PAY: INR ${formatMoney(payslip.netPay)}`);

    document.moveDown();

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Payment Method: ${payslip.paymentMethod}`);

    document.text(`Status: ${payslip.status}`);

    document.moveDown(3);

    document.fontSize(9).text('This is a system-generated payslip.', {
      align: 'center',
    });

    document.end();
  }
}
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDecimal(value: unknown): string {
  return Number(value).toFixed(2);
}

function formatMoney(value: unknown): string {
  return Number(value).toFixed(2);
}
