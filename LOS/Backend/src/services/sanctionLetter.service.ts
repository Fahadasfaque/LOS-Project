/**
 * @file sanctionLetter.service.ts
 * @description Generates a server-side PDF Sanction Letter using pdf-creator-node
 * and a Handlebars HTML template.
 *
 * USAGE:
 *   const pdf = await sanctionLetterService.generatePdf(applicationId, customerId);
 *   res.setHeader('Content-Type', 'application/pdf');
 *   res.setHeader('Content-Disposition', 'attachment; filename="sanction-letter.pdf"');
 *   res.send(pdf);
 */

import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';

interface SanctionLetterData {
  referenceNumber: string;
  issueDate: string;
  applicationNumber: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantAddress: string | null;
  applicantCity: string | null;
  applicantState: string | null;
  applicantPostalCode: string | null;
  loanTypeDisplay: string;
  loanAmount: string;
  interestRate: number;
  tenureMonths: number;
  emiAmount: string;
  acceptedDate: string;
  offerValidDays: number;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLoanType(loanType: string): string {
  const map: Record<string, string> = {
    PERSONAL: 'Personal Loan',
    HOME: 'Home Loan',
    AUTO: 'Auto Loan',
    BUSINESS: 'Business Loan',
    EDUCATION: 'Education Loan',
  };
  return map[loanType] || loanType;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export class SanctionLetterService {
  private templatePath = path.join(__dirname, '../templates/sanctionLetter.hbs');

  async generatePdf(applicationId: string, customerId: string): Promise<Buffer> {
    // 1. Fetch application — ensure it belongs to this customer
    const app = await prisma.loanApplication.findFirst({
      where: {
        id: applicationId,
        customerUserId: customerId,
      },
      include: {
        offer: true,
        customerUser: {
          include: {
            customerProfile: true,
          },
        },
      },
    });

    if (!app) {
      throw new AppError('Application not found or you do not have access.', 404);
    }

    if (!app.offer) {
      throw new AppError('No offer found for this application.', 404);
    }

    if (app.offer.offerStatus !== 'ACCEPTED') {
      throw new AppError('Sanction letter is only available after the offer is accepted.', 400);
    }

    const profile = (app.customerUser as any)?.customerProfile;

    const data: SanctionLetterData = {
      referenceNumber: `SL-${app.applicationNumber}-${new Date().getFullYear()}`,
      issueDate: formatDate(new Date()),
      applicationNumber: app.applicationNumber,
      applicantName: app.applicantName,
      applicantEmail: app.customerUser?.email || '',
      applicantPhone: profile?.phone || app.phone || 'Not Provided',
      applicantAddress: profile?.address || null,
      applicantCity: profile?.city || null,
      applicantState: profile?.state || null,
      applicantPostalCode: profile?.postalCode || null,
      loanTypeDisplay: formatLoanType(app.loanType),
      loanAmount: formatINR(app.offer.loanAmount),
      interestRate: app.offer.interestRate,
      tenureMonths: app.offer.tenureMonths,
      emiAmount: formatINR(app.offer.emiAmount),
      acceptedDate: app.offer.acceptedAt ? formatDate(app.offer.acceptedAt) : formatDate(new Date()),
      offerValidDays: 30,
    };

    // 2. Read and compile template
    const templateHtml = fs.readFileSync(this.templatePath, 'utf-8');
    const compiledHtml = this.compileTemplate(templateHtml, data);

    // 3. Generate PDF using pdf-creator-node
    try {
      const pdf = require('pdf-creator-node');
      const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
        footer: {
          height: '5mm',
        },
      };

      const document = {
        html: compiledHtml,
        data: {},
        type: 'buffer',
      };

      const result = await pdf.create(document, options);
      return result as Buffer;
    } catch (err: any) {
      // Fallback: return HTML as text/plain if wkhtmltopdf isn't installed
      console.error('[SanctionLetter] pdf-creator-node failed, falling back to HTML:', err.message);
      throw new AppError(
        'PDF generation requires wkhtmltopdf to be installed on the server. Please contact your administrator.',
        500
      );
    }
  }

  /**
   * Simple Handlebars-style template compiler.
   * Handles {{variable}}, {{#if condition}}...{{/if}} blocks.
   */
  private compileTemplate(template: string, data: Record<string, any>): string {
    // Replace {{#if key}}...{{/if}} blocks
    let result = template.replace(
      /\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, key, content) => {
        const value = data[key.trim()];
        return value ? content : '';
      }
    );

    // Replace {{key}} placeholders
    result = result.replace(/\{\{([^#\/][^}]*)\}\}/g, (_, key) => {
      const value = data[key.trim()];
      return value !== undefined && value !== null ? String(value) : '';
    });

    return result;
  }
}

export const sanctionLetterService = new SanctionLetterService();
