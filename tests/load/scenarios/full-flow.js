// Phase 4 SC#1 — k6 load test full-flow scenario.
// Ramps to 1,000 concurrent VUs over 5 min, holds 15 min, ramps down 2 min.
// Thresholds match NFR-performance + NFR-throughput exactly:
//   api p95 < 500ms, search p95 < 500ms, payment p95 < 3000ms, error rate < 1%
// Each request tagged by type so per-type thresholds resolve correctly.
// T-S-07 mitigation: STAGING_URL must point to staging (never prod).
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  scenarios: {
    transaction_loop: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 1000 },
        { duration: '15m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{type:api}': ['p(95)<500'],
    'http_req_duration{type:search}': ['p(95)<500'],
    'http_req_duration{type:payment}': ['p(95)<3000'],
    'http_req_failed': ['rate<0.01'],
    'iteration_duration': ['p(95)<5000'],
  },
};

// T-S-07: STAGING_URL must be set to staging (never production).
const STAGING_URL = __ENV.STAGING_URL || 'https://staging.sorcyn.com';

// Seed users pre-created by seed-users.ts; loaded once at startup (SharedArray).
const users = new SharedArray('users', () => JSON.parse(open('../seed-users.json')));

export default function () {
  const u = users[Math.floor(Math.random() * users.length)];

  const authHeaders = { Authorization: `Bearer ${u.token}` };
  const apiParams = { tags: { type: 'api' }, headers: { ...authHeaders, 'Content-Type': 'application/json' } };
  const searchParams = { tags: { type: 'search' }, headers: authHeaders };
  const paymentParams = { tags: { type: 'payment' }, headers: authHeaders };

  // 1. Fetch posts feed (search-tagged)
  let r = http.get(`${STAGING_URL}/api/v1/posts?limit=20`, searchParams);
  check(r, { 'feed 200': (res) => res.status === 200 });
  sleep(1);

  // 2. Create post (api-tagged)
  r = http.post(
    `${STAGING_URL}/api/v1/posts`,
    JSON.stringify({
      title: `loadtest_post_${Date.now()}_${u.id}`,
      description: 'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
      categoryId: u.categoryId,
      transactionType: 'service',
      budgetMin: 50,
      budgetMax: 200,
      budgetType: 'range',
      urgency: 'within_1_week',
      locationCity: 'Dallas',
      locationState: 'TX',
    }),
    apiParams,
  );
  check(r, { 'post 201': (res) => res.status === 201 });
  const postId = r.json('data.id');
  sleep(1);

  // 3. Submit offer (api-tagged) — only if user is a seller
  if (u.role === 'seller' && postId) {
    r = http.post(
      `${STAGING_URL}/api/v1/offers`,
      JSON.stringify({
        postId,
        offerType: 'service',
        quoteAmount: 100,
        pricingType: 'flat_rate',
        message: 'loadtest_offer_message lorem ipsum dolor sit amet consectetur adipiscing elit.',
      }),
      apiParams,
    );
    check(r, { 'offer 201': (res) => res.status === 201 });
    sleep(1);
  }

  // 4. Payment intent simulation (payment-tagged) — list payment info
  r = http.get(`${STAGING_URL}/api/v1/transactions/my-transactions?role=buyer&limit=5`, paymentParams);
  check(r, { 'tx list 200': (res) => res.status === 200 });

  sleep(2);
}
