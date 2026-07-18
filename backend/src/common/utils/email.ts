import { Resend } from 'resend';
import { env } from '../../config/env.js';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const resend = getClient();

  if (!resend) {
    console.log(`[EMAIL STUB] To: ${options.to} | Subject: ${options.subject}`);
    console.log(`[EMAIL STUB] Body: ${options.text.substring(0, 200)}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html ?? options.text,
    });

    if (error) {
      console.error('[EMAIL ERROR]', error);
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
  }
}
