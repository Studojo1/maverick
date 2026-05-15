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

Thank you for applying to the ${role} internship at ${company} through Studojo.

After reviewing applications, the team has decided not to move forward with your application for this position.

We appreciate the time you took to apply and wish you the best with your internship search.

Best,
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
