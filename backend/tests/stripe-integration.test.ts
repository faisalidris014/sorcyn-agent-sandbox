/**
 * Stripe Test-Mode Integration Tests
 *
 * These tests hit the real Stripe API in test mode. They are skipped in CI
 * unless a Stripe test key is available (via STRIPE_TEST_KEY or STRIPE_SECRET_KEY).
 *
 * Run manually: npm run test:stripe  (picks up keys from .env)
 * Or override:  STRIPE_TEST_KEY=sk_test_... STRIPE_TEST_WEBHOOK_SECRET=whsec_... npm run test:stripe
 */
import Stripe from 'stripe';

const STRIPE_TEST_KEY = process.env.STRIPE_TEST_KEY || process.env.STRIPE_SECRET_KEY;
const STRIPE_TEST_WEBHOOK_SECRET = process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

if (STRIPE_TEST_KEY && !STRIPE_TEST_KEY.startsWith('sk_test_')) {
  throw new Error(
    `Stripe key must start with "sk_test_". Got "${STRIPE_TEST_KEY.slice(0, 10)}..." — refusing to run against live Stripe.`,
  );
}

const describeStripe = STRIPE_TEST_KEY ? describe : describe.skip;

describeStripe('Stripe Integration (test mode)', () => {
  let stripe: Stripe;

  beforeAll(() => {
    stripe = new Stripe(STRIPE_TEST_KEY!, { typescript: true });
  });

  it('should create a payment intent', async () => {
    const intent = await stripe.paymentIntents.create({
      amount: 5000, // $50.00
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { test: 'true', source: 'integration-test' },
    });

    expect(intent.id).toMatch(/^pi_/);
    expect(intent.amount).toBe(5000);
    expect(intent.currency).toBe('usd');
    expect(intent.status).toBe('requires_payment_method');
  });

  it('should create a payment intent with transfer_group (escrow pattern)', async () => {
    const transferGroup = `test_txn_${Date.now()}`;
    const intent = await stripe.paymentIntents.create({
      amount: 10000, // $100.00
      currency: 'usd',
      payment_method_types: ['card'],
      transfer_group: transferGroup,
      metadata: { test: 'true', source: 'escrow-integration-test' },
    });

    expect(intent.id).toMatch(/^pi_/);
    expect(intent.transfer_group).toBe(transferGroup);
  });

  it('should retrieve a payment intent by ID', async () => {
    const created = await stripe.paymentIntents.create({
      amount: 2500,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { test: 'true' },
    });

    const retrieved = await stripe.paymentIntents.retrieve(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.amount).toBe(2500);
  });

  it('should cancel a payment intent', async () => {
    const intent = await stripe.paymentIntents.create({
      amount: 3000,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { test: 'true' },
    });

    const cancelled = await stripe.paymentIntents.cancel(intent.id);
    expect(cancelled.status).toBe('canceled');
  });

  it('should handle idempotency keys', async () => {
    const idempotencyKey = `test_idem_${Date.now()}`;

    const first = await stripe.paymentIntents.create(
      {
        amount: 7500,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: { test: 'true' },
      },
      { idempotencyKey },
    );

    const second = await stripe.paymentIntents.create(
      {
        amount: 7500,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: { test: 'true' },
      },
      { idempotencyKey },
    );

    // Same idempotency key should return the same object
    expect(second.id).toBe(first.id);
  });

  it('should reject invalid payment intent retrieval', async () => {
    await expect(
      stripe.paymentIntents.retrieve('pi_nonexistent_12345'),
    ).rejects.toThrow();
  });

  // Connect account tests
  describe('Stripe Connect', () => {
    it('should create a connected account', { timeout: 15_000 }, async () => {
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: { test: 'true', source: 'integration-test' },
      }, {
        idempotencyKey: `acct_test_${Date.now()}`,
      });

      expect(account.id).toMatch(/^acct_/);
      expect(account.type).toBe('standard');

      // Cleanup
      await stripe.accounts.del(account.id);
    });

    it('should create an account link for onboarding', { timeout: 15_000 }, async () => {
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: { test: 'true' },
      });

      const link = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'https://example.com/refresh',
        return_url: 'https://example.com/return',
        type: 'account_onboarding',
      });

      expect(link.url).toContain('stripe.com');

      // Cleanup
      await stripe.accounts.del(account.id);
    });
  });

  // Refund tests
  describe('Refunds', () => {
    it('should create and cancel a payment intent for refund testing', async () => {
      const intent = await stripe.paymentIntents.create({
        amount: 4000,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: { test: 'true', source: 'refund-test' },
      });

      // Can't refund without confirming, but can cancel
      const cancelled = await stripe.paymentIntents.cancel(intent.id);
      expect(cancelled.status).toBe('canceled');
    });
  });

  // Webhook signature verification
  const describeWebhook = STRIPE_TEST_WEBHOOK_SECRET ? describe : describe.skip;

  describeWebhook('Webhook signature verification', () => {
    it('should verify a valid webhook signature', () => {
      const payload = JSON.stringify({
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
      });
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;
      const signature = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: STRIPE_TEST_WEBHOOK_SECRET!,
        timestamp,
      });

      const event = Stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_TEST_WEBHOOK_SECRET!,
      );

      expect(event.type).toBe('payment_intent.succeeded');
    });

    it('should reject an invalid webhook signature', () => {
      const payload = JSON.stringify({
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
      });

      expect(() =>
        Stripe.webhooks.constructEvent(
          payload,
          'invalid_signature',
          STRIPE_TEST_WEBHOOK_SECRET!,
        ),
      ).toThrow();
    });
  });
});
