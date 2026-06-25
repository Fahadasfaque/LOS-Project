import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { prisma } from '../config/db';

export interface EmailPayload {
  to: string;
  subject: string;
  title: string;
  customerName: string;
  applicationNumber: string;
  status: string;
  actionTaken: string;
  userId?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private template: handlebars.TemplateDelegate;
  private queue: EmailPayload[] = [];
  private isProcessing = false;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const templatePath = path.join(__dirname, '../templates/notification.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    this.template = handlebars.compile(templateSource);
  }

  /**
   * Adds an email to the asynchronous dispatch queue.
   */
  async sendNotification(payload: EmailPayload) {
    this.queue.push(payload);
    
    // Log QUEUED audit log
    if (payload.userId) {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: 'EMAIL_QUEUED',
          details: `Queued email to ${payload.to} for application ${payload.applicationNumber}`,
        }
      });
    }

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      if (!payload) continue;

      try {
        const html = this.template({
          title: payload.title,
          customerName: payload.customerName,
          applicationNumber: payload.applicationNumber,
          status: payload.status,
          actionTaken: payload.actionTaken,
        });

        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Fortress Banking" <noreply@fortressbanking.com>',
          to: payload.to,
          subject: payload.subject,
          html,
        });

        if (payload.userId) {
          await prisma.auditLog.create({
            data: {
              userId: payload.userId,
              action: 'EMAIL_SENT',
              details: `Sent email to ${payload.to} for application ${payload.applicationNumber}`,
            }
          });
        }
      } catch (error) {
        console.error('Failed to send email:', error);
        if (payload.userId) {
          await prisma.auditLog.create({
            data: {
              userId: payload.userId,
              action: 'EMAIL_FAILED',
              details: `Failed to send email to ${payload.to} for application ${payload.applicationNumber}`,
            }
          });
        }
      }
    }

    this.isProcessing = false;
  }
}

export const emailService = new EmailService();
