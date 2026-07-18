import admin from 'firebase-admin';
import { env } from '../../config/env.js';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  if (!env.FCM_PROJECT_ID || !env.FCM_PRIVATE_KEY || !env.FCM_CLIENT_EMAIL) {
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FCM_PROJECT_ID,
      privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FCM_CLIENT_EMAIL,
    }),
  });
  initialized = true;
}

export interface PushOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  sent: boolean;
  invalidToken?: boolean;
}

export async function sendPush(options: PushOptions): Promise<PushResult> {
  ensureInit();

  if (!initialized) {
    console.log(`[PUSH STUB] To: ${options.token.substring(0, 20)}... | ${options.title}: ${options.body}`);
    return { sent: false };
  }

  try {
    await admin.messaging().send({
      token: options.token,
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data,
    });
    return { sent: true };
  } catch (err: any) {
    const code = err?.code ?? err?.errorInfo?.code ?? '';
    const isInvalidToken =
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument';
    if (isInvalidToken) {
      console.warn(`[PUSH] Invalid FCM token detected: ${options.token.substring(0, 20)}...`);
    } else {
      console.error('[PUSH ERROR]', err);
    }
    return { sent: false, invalidToken: isInvalidToken };
  }
}
