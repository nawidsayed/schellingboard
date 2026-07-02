import nodemailer, { type Transporter } from "nodemailer";

type MailerState =
  | { configured: true; transport: Transporter; from: string }
  | { configured: false };

// Singletons need to be assigned to globalThis, not simply module-level
// variables. See https://github.com/vercel/next.js/discussions/68572.
const g = globalThis as typeof globalThis & { __mailerState?: MailerState };

// Called on server startup so a half-configured mailer fails the boot instead
// of the first send.
export function initMailer(): void {
  const smtpUrl = process.env.SMTP_URL;
  if (!smtpUrl) {
    g.__mailerState = { configured: false };
    return;
  }
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new Error("SMTP_FROM must be set when SMTP_URL is set");
  }
  g.__mailerState = {
    configured: true,
    transport: nodemailer.createTransport(smtpUrl),
    from,
  };
}

/** For tests only. */
export function resetMailer(): void {
  delete g.__mailerState;
}

function getTransport(): { transport: Transporter; from: string } {
  const state = g.__mailerState;
  if (!state) {
    throw new Error("Mailer has not been initialized");
  }
  if (!state.configured) {
    throw new Error("SMTP_URL is not set");
  }
  return state;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { transport, from } = getTransport();
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
  });
}
