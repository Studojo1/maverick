import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  return cachedTransporter;
}

export interface RejectionEmailParams {
  to: string;
  name: string;
  role: string;
  company: string;
}

export async function sendRejectionEmail(params: RejectionEmailParams): Promise<void> {
  const { to, name, role, company } = params;

  if (process.env.REJECTION_EMAIL_ENABLED !== "true") {
    console.log(
      `[rejection-email] kill switch off — would have sent to ${to} re "${role}" at "${company}"`
    );
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[rejection-email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping send to ${to}`
    );
    return;
  }

  const subject = `Update on your application for ${role} at ${company}`;
  const text = `Hi ${name},

Thank you for your interest in the ${role} internship opportunity at ${company}, and for taking the time to apply through Studojo.

After reviewing your application, the hiring team has decided not to move forward with your application for this role.

We appreciate the time and effort you invested in applying, and we encourage you to continue exploring other opportunities that match your background and interests.

We wish you all the best in your internship search and future career journey.

Best regards,
Studojo Internships`;

  const fromEmail = process.env.GMAIL_USER!.trim();

  await transporter.sendMail({
    from: `"Studojo Internships" <${fromEmail}>`,
    to,
    subject,
    text,
  });

  console.log(`[rejection-email] sent to ${to} re "${role}" at "${company}"`);
}
