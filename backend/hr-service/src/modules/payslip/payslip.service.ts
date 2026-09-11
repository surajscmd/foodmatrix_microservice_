import { Injectable, NotFoundException } from '@nestjs/common';

import type { Response } from 'express';

import PDFDocument from 'pdfkit';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class PayslipService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // FIND ALL
  // ============================================================

  /**
   * Get payslips with optional filters.
   *
   * restaurantId is filtered through PayrollRun because
   * Payslip does not directly contain restaurantId.
   */
  async findAll(
    restaurantId?: string,
    staffId?: string,
    payrollRunId?: string,
  ) {
    const payslips = await this.prisma.payslip.findMany({
      where: {
        ...(staffId
          ? {
              staffId,
            }
          : {}),

        ...(payrollRunId
          ? {
              payrollRunId,
            }
          : {}),

        ...(restaurantId
          ? {
              payrollRun: {
                restaurantId,
              },
            }
          : {}),
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },

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
  // FIND ONE
  // ============================================================

  /**
   * Get a single payslip.
   */
  async findOne(id: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: {
        id,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },

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
  // FIND STAFF PAYSLIPS
  // ============================================================

  /**
   * Get all payslips belonging to a staff member.
   */
  async findByStaff(staffId: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: {
        staffId,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },

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

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  /**
   * Generate a PDF payslip and stream it to the client.
   */
  async download(id: string, res: Response): Promise<void> {
    // ----------------------------------------------------------
    // Get payslip
    // ----------------------------------------------------------

    const payslip = await this.prisma.payslip.findUnique({
      where: {
        id,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        payrollRun: {
          select: {
            id: true,
            restaurantId: true,
            periodStartDate: true,
            periodEndDate: true,
          },
        },
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    // ----------------------------------------------------------
    // Create PDF
    // ----------------------------------------------------------

    const document = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const filename = `payslip-${payslip.id}.pdf`;

    // ----------------------------------------------------------
    // Configure HTTP response
    // ----------------------------------------------------------

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream generated PDF directly to response.
    document.pipe(res);

    // ==========================================================
    // HEADER
    // ==========================================================

    document.fontSize(24).font('Helvetica-Bold').text('PAYSLIP', {
      align: 'center',
    });

    document.moveDown();

    document.fontSize(10).font('Helvetica').text('Employee Payroll Statement', {
      align: 'center',
    });

    document.moveDown(2);

    // ==========================================================
    // EMPLOYEE INFORMATION
    // ==========================================================

    document.fontSize(15).font('Helvetica-Bold').text('Employee Information');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Employee: ${payslip.staff.firstName} ${payslip.staff.lastName}`);

    document.text(`Employee Code: ${payslip.staff.employeeCode}`);

    document.text(`Role: ${payslip.staff.role}`);

    document.moveDown();

    // ==========================================================
    // PAYROLL PERIOD
    // ==========================================================

    document.fontSize(15).font('Helvetica-Bold').text('Payroll Period');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Start Date: ${formatDate(payslip.payrollRun.periodStartDate)}`);

    document.text(`End Date: ${formatDate(payslip.payrollRun.periodEndDate)}`);

    document.moveDown();

    // ==========================================================
    // WORKING HOURS
    // ==========================================================

    document.fontSize(15).font('Helvetica-Bold').text('Working Hours');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Regular Hours: ${formatDecimal(payslip.regularHours)}`);

    document.text(`Overtime Hours: ${formatDecimal(payslip.overtimeHours)}`);

    document.text(`Paid Leave Hours: ${formatDecimal(payslip.paidLeaveHours)}`);

    document.moveDown();

    // ==========================================================
    // EARNINGS
    // ==========================================================

    document.fontSize(15).font('Helvetica-Bold').text('Earnings');

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font('Helvetica')
      .text(`Regular Pay: INR ${formatMoney(payslip.regularPay)}`);

    document.text(`Overtime Pay: INR ${formatMoney(payslip.overtimePay)}`);

    document.text(`Gross Pay: INR ${formatMoney(payslip.grossPay)}`);

    document.moveDown();

    // ==========================================================
    // DEDUCTIONS
    // ==========================================================

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

    // ==========================================================
    // NET PAY
    // ==========================================================

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

    // ==========================================================
    // FOOTER
    // ==========================================================

    document
      .fontSize(9)
      .font('Helvetica')
      .text('This is a system-generated payslip.', {
        align: 'center',
      });

    // Finish the PDF stream.
    document.end();
  }
}

// ============================================================
// PDF FORMAT HELPERS
// ============================================================

/**
 * Format a date for the payslip.
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format decimal values to two decimal places.
 */
function formatDecimal(value: unknown): string {
  return Number(value).toFixed(2);
}

/**
 * Format monetary values to two decimal places.
 */
function formatMoney(value: unknown): string {
  return Number(value).toFixed(2);
}
