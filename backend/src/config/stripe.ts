import Stripe from 'stripe';
import { env } from './env.js';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export function verifyWebhookSignature(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );
}
