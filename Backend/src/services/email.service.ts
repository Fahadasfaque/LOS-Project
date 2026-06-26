import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { prisma } from '../config/db';

export interface EmailPayload {
  to: string;
  subject: string;
  type?: 'NOTIFICATION' | 'OTP';
  title?: string;
  customerName?: string;
  applicationNumber?: string;
  status?: string;
  transactionId?: string;
  actionTaken?: string;
  otpCode?: string;
  firstName?: string;
  userId?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private notificationTemplate: handlebars.TemplateDelegate;
  private otpTemplate: handlebars.TemplateDelegate;
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

    const notifPath = path.join(__dirname, '../templates/notification.hbs');
    this.notificationTemplate = handlebars.compile(fs.readFileSync(notifPath, 'utf8'));

    const otpPath = path.join(__dirname, '../templates/otp.hbs');
    this.otpTemplate = handlebars.compile(fs.readFileSync(otpPath, 'utf8'));
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
        let html = '';
        if (payload.type === 'OTP') {
          html = this.otpTemplate({
            firstName: payload.firstName,
            otpCode: payload.otpCode,
            year: new Date().getFullYear(),
          });
        } else {
          html = this.notificationTemplate({
            title: payload.title,
            customerName: payload.customerName,
            applicationNumber: payload.applicationNumber,
            status: payload.status,
            actionTaken: payload.actionTaken,
            transactionId: payload.transactionId,
          });
        }

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
