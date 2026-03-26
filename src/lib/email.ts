// Email Service - Singleton Pattern
import nodemailer, { Transporter } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private static instance: EmailService;
  private transporter: Transporter | null = null;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP not configured, skipping email:", options.subject);
        return false;
      }

      await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM || "AU Van <noreply@auvan.com>",
        ...options,
      });
      return true;
    } catch (error) {
      console.error("Email send failed:", error);
      return false;
    }
  }

  async sendBookingConfirmation(to: string, data: {
    name: string;
    route: string;
    date: string;
    time: string;
    seats: number;
    totalPrice: number;
    bookingId: string;
  }): Promise<boolean> {
    return this.send({
      to,
      subject: `Booking Confirmed - ${data.route}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#1a56db">AU Van - Booking Confirmation</h2>
          <p>Hi ${data.name},</p>
          <p>Your booking has been confirmed!</p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Route:</strong> ${data.route}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Seats:</strong> ${data.seats}</p>
            <p><strong>Total:</strong> ฿${data.totalPrice}</p>
          </div>
          <p>Thank you for choosing AU Van!</p>
        </div>
      `,
    });
  }

  async sendBookingCancellation(to: string, data: {
    name: string;
    route: string;
    date: string;
    time: string;
    bookingId: string;
  }): Promise<boolean> {
    return this.send({
      to,
      subject: "Booking Cancelled",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#dc2626">AU Van - Booking Cancelled</h2>
          <p>Hi ${data.name},</p>
          <p>Your booking has been cancelled.</p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Route:</strong> ${data.route}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
          </div>
          <p>If you did not request this, please contact support.</p>
        </div>
      `,
    });
  }

  async sendPaymentConfirmation(to: string, data: {
    name: string;
    amount: number;
    method: string;
    transactionId?: string;
  }): Promise<boolean> {
    return this.send({
      to,
      subject: "Payment Received",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#16a34a">AU Van - Payment Received</h2>
          <p>Hi ${data.name},</p>
          <p>Your payment has been received.</p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
            <p><strong>Amount:</strong> ฿${data.amount}</p>
            <p><strong>Method:</strong> ${data.method}</p>
            ${data.transactionId ? `<p><strong>Transaction ID:</strong> ${data.transactionId}</p>` : ""}
          </div>
        </div>
      `,
    });
  }
}

export const emailService = EmailService.getInstance();
