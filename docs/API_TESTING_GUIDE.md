# API Testing Guide

A fully scripted, step-by-step guide for testing the Reverse Marketplace API using Swagger UI at `http://localhost:3000/docs`. Every value you need to type is spelled out — no guessing.

---

## 1. Quick Start

```bash
cd backend
npm run dev
```

Open **http://localhost:3000/docs** in your browser.

If you haven't seeded the database yet:
```bash
cd backend
npx prisma db seed
```

---

## 2. Test Accounts (Seeded)

These accounts are pre-created when you run `npx prisma db seed`:

| Email | Password | Role | Use for |
|-------|----------|------|---------|
| `buyer@test.com` | `TestPassword123!` | Buyer | Creating posts, accepting offers, approving transactions, writing reviews |
| `seller@test.com` | `TestPassword123!` | Seller | Browsing feed, submitting offers, completing transactions |
| `both@test.com` | `TestPassword123!` | Both | Testing dual buyer/seller functionality |
| `admin@reversemarketplace.com` | `AdminSecure456!` | Admin | Dashboard, user management, moderation, audit logs |

---

## 3. Seeded Categories Reference

These categories are created by the seed script. The **slugs** are stable and you can use them to look up UUIDs. The **UUIDs are generated dynamically** — you must retrieve them from the API (shown in the walkthrough below).

### Top-Level Categories (MVP)

| Slug | Name | MVP Enabled |
|------|------|-------------|
| `products` | Products | Yes |
| `services` | Services | Yes |
| `jobs` | Jobs | Yes |

### Product Subcategories (8)

| Slug | Name |
|------|------|
| `electronics` | Electronics |
| `furniture` | Furniture |
| `vehicles` | Vehicles |
| `appliances` | Appliances |
| `clothing` | Clothing & Accessories |
| `sports_outdoors` | Sports & Outdoors |
| `tools_equipment` | Tools & Equipment |
| `other_products` | Other Products |

### Service Subcategories (20)

| Slug | Name |
|------|------|
| `plumbing` | Plumbing |
| `electrical` | Electrical |
| `hvac` | HVAC |
| `cleaning` | Cleaning |
| `landscaping` | Landscaping |
| `painting` | Painting |
| `roofing` | Roofing |
| `moving` | Moving & Hauling |
| `pest_control` | Pest Control |
| `handyman` | Handyman |
| `auto_repair` | Auto Repair |
| `childcare` | Childcare |
| `pet_care` | Pet Care |
| `tutoring` | Tutoring & Education |
| `personal_training` | Personal Training |
| `photography` | Photography & Video |
| `event_planning` | Event Planning |
| `other_services` | Other Services |
| `landscape_irrigation` | Irrigation & Sprinklers |
| `pesticide_application` | Pesticide & Lawn Treatment |

### Job Subcategories (7)

| Slug | Name |
|------|------|
| `entry_level` | Entry Level |
| `skilled_trade` | Skilled Trade |
| `professional` | Professional |
| `management` | Management |
| `part_time` | Part Time |
| `contract` | Contract / Freelance |
| `other_jobs` | Other Jobs |

### Phase 2+ Categories (not active in MVP)

| Slug | Name |
|------|------|
| `inventory_wholesale` | Inventory/Wholesale |
| `real_estate` | Real Estate |

---

## 4. Where Do I Get UUIDs?

UUIDs are generated dynamically by the database — they are **not hardcoded**. Here's exactly how to get each one:

| UUID You Need | How to Get It | Which Field to Copy |
|---------------|---------------|---------------------|
| `categoryId` | `GET /categories/services` (or `/categories/products` or `/categories/jobs`) | Copy the `id` field from the response |
| `subcategoryId` | `GET /categories/services` → look in the `children` array | Copy the `id` of the child you want (e.g., the one with `slug: "plumbing"`) |
| `postId` | `GET /posts/feed` or `GET /posts/my-posts` | Copy the `id` field of any post |
| `offerId` | `GET /offers/my-offers` (as seller) or `GET /offers/post/{postId}` (as buyer) | Copy the `id` field of any offer |
| `transactionId` | Response from `POST /offers/{offerId}/accept`, or `GET /transactions/my-transactions` | Copy the `id` field (or `transaction.id` from the accept response) |
| `sellerId` | `GET /sellers/me` (as seller) | Copy the `id` field of the seller profile |
| `userId` | `GET /users/me` or from the login response | Copy the `id` field |
| `conversationId` | `GET /messages/conversations` | Copy the `id` field of any conversation |
| `reviewId` | Response from `POST /reviews` | Copy the `id` field |

---

## 5. Categories Query Parameters Explained

When calling `GET /categories`, you can use these query parameters:

| Parameter | Default | What it does |
|-----------|---------|-------------|
| `activeOnly` | `true` | When `true`, only returns categories that are active (not deactivated). Leave as `true` for normal testing. |
| `mvpOnly` | `false` | When `true`, only returns the 3 MVP categories: Products, Services, Jobs. Set to `true` to hide Phase 2+ categories. |
| `parentId` | _(none)_ | Pass a parent category's UUID to get its subcategories. **Omit this entirely** to get top-level categories only. |

**Example combinations:**
- `GET /categories` — returns all 5 active top-level categories
- `GET /categories?mvpOnly=true` — returns only Products, Services, Jobs
- `GET /categories?parentId=YOUR_SERVICES_UUID` — returns the 20 service subcategories

---

## 6. Complete Testing Walkthrough

Follow these steps **in order**. Each step tells you exactly what to type and what to expect.

> **Tip:** Keep a text file open to save UUIDs as you go. You'll reuse them across steps.

---

### Step 1: Login as Buyer

1. Expand **POST /api/v1/auth/login**
2. Click **Try it out**
3. Paste this exact body:
```json
{
  "email": "buyer@test.com",
  "password": "TestPassword123!",
  "rememberMe": false
}
```
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "id": "some-uuid-here",
      "email": "buyer@test.com",
      "firstName": "Test",
      "lastName": "Buyer",
      "accountType": "buyer"
    }
  }
}
```

**What to save:**
- Copy the `accessToken` value (the long string starting with `eyJ...`)
- Save the `user.id` value — this is your **buyer userId**

**Now authorize Swagger:**
1. Scroll to the top of the page
2. Click the **Authorize** button (lock icon)
3. Paste the `accessToken` (without quotes, without "Bearer " prefix)
4. Click **Authorize**, then **Close**

All authenticated endpoints will now use your buyer token.

---

### Step 2: Get Top-Level Categories

1. Expand **GET /api/v1/categories**
2. Click **Try it out**
3. Set query parameters:
   - `activeOnly`: `true`
   - `mvpOnly`: `true`
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "slug": "products",
      "name": "Products",
      "description": "...",
      "icon": null,
      "parentCategoryId": null,
      "sortOrder": 1,
      "isActive": true,
      "enabledInMvp": true
    },
    {
      "id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
      "slug": "services",
      "name": "Services",
      "description": "...",
      "icon": null,
      "parentCategoryId": null,
      "sortOrder": 2,
      "isActive": true,
      "enabledInMvp": true
    },
    {
      "id": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
      "slug": "jobs",
      "name": "Jobs",
      "description": "...",
      "icon": null,
      "parentCategoryId": null,
      "sortOrder": 3,
      "isActive": true,
      "enabledInMvp": true
    }
  ]
}
```

**What to save:**
- Find the object where `slug` is `"services"`
- Copy its `id` value — this is your **services categoryId**

---

### Step 3: Get Subcategories (via Slug)

1. Expand **GET /api/v1/categories/{slug}**
2. Click **Try it out**
3. In the `slug` field, type: `services`
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "slug": "services",
    "name": "Services",
    "children": [
      {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "slug": "plumbing",
        "name": "Plumbing",
        "parentCategoryId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
        "isActive": true,
        "enabledInMvp": true
      },
      {
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "slug": "electrical",
        "name": "Electrical"
      },
      ...16 more subcategories...
    ]
  }
}
```

**What to save:**
- Find the child where `slug` is `"plumbing"`
- Copy its `id` value — this is your **plumbing subcategoryId**

You now have two UUIDs:
- **categoryId** = the `id` of "Services" (from Step 2 or the top-level `id` here)
- **subcategoryId** = the `id` of "Plumbing" (from the `children` array)

---

### Step 4: Create a Post (as Buyer)

1. Expand **POST /api/v1/posts**
2. Click **Try it out**
3. Paste this body, replacing the two UUIDs with the ones you saved:
```json
{
  "categoryId": "PASTE_YOUR_SERVICES_UUID_HERE",
  "subcategoryId": "PASTE_YOUR_PLUMBING_UUID_HERE",
  "title": "Need a plumber for kitchen sink repair",
  "description": "My kitchen sink is leaking from the pipe connection underneath. Need a licensed plumber to diagnose and fix the issue. The leak is coming from the P-trap area.",
  "budgetMin": 100,
  "budgetMax": 300,
  "budgetType": "range",
  "locationCity": "Dallas",
  "locationState": "TX",
  "locationZip": "75201",
  "urgency": "within_24_hours"
}
```

> **Important:** Replace `PASTE_YOUR_SERVICES_UUID_HERE` with the actual UUID you copied in Step 2, and `PASTE_YOUR_PLUMBING_UUID_HERE` with the UUID from Step 3. They look like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

4. Click **Execute**

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-post-uuid-here",
    "title": "Need a plumber for kitchen sink repair",
    "description": "My kitchen sink is leaking...",
    "status": "active",
    "budgetMin": 100,
    "budgetMax": 300,
    "budgetType": "range",
    "urgency": "within_24_hours",
    "locationCity": "Dallas",
    "locationState": "TX",
    "locationZip": "75201",
    "offerCount": 0,
    "viewCount": 0,
    "expiresAt": "2026-02-27T...",
    "createdAt": "2026-02-20T..."
  }
}
```

**What to save:**
- Copy the `id` value — this is your **postId**

**If you get a 400 error**, check:
- `categoryId` and `subcategoryId` are valid UUIDs from Steps 2-3
- `title` is at least 5 characters
- `description` is at least 20 characters
- `locationZip` is 5 digits (e.g., `75201`)

---

### Step 5: View Your Posts

1. Expand **GET /api/v1/posts/my-posts**
2. Click **Try it out**
3. Leave all query parameters empty (defaults are fine)
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "your-post-uuid",
      "title": "Need a plumber for kitchen sink repair",
      "status": "active",
      "offerCount": 0,
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

You should see the post you just created.

---

### Step 6: View the Public Feed

1. Expand **GET /api/v1/posts/feed**
2. Click **Try it out**
3. Leave all query parameters empty
4. Click **Execute**

**Expected response (200):** An array containing your post. This is the feed that sellers browse to find work.

---

### Step 7: Login as Seller

You need to switch to the seller account. The buyer token will stop working for seller-only endpoints.

1. Expand **POST /api/v1/auth/login**
2. Click **Try it out**
3. Paste this body:
```json
{
  "email": "seller@test.com",
  "password": "TestPassword123!",
  "rememberMe": false
}
```
4. Click **Execute**
5. Copy the new `accessToken` from the response

**Re-authorize Swagger:**
1. Click the **Authorize** button (lock icon) at the top
2. Click **Logout** first (to clear the buyer token)
3. Paste the new seller `accessToken`
4. Click **Authorize**, then **Close**

---

### Step 8: View Seller Profile

The seed script already created a seller profile for `seller@test.com`.

1. Expand **GET /api/v1/sellers/me**
2. Click **Try it out**
3. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "seller-profile-uuid-here",
    "userId": "seller-user-uuid-here",
    "businessName": "Test Seller Services",
    "bio": "Experienced handyman and plumber serving the DFW area.",
    "serviceRadiusMiles": 30,
    "yearsExperience": 10,
    "averageRating": 0,
    "totalReviews": 0,
    "totalCompleted": 0,
    ...
  }
}
```

**What to save:**
- Copy the `id` value — this is the **seller profile ID** (you'll need it for viewing reviews later in Step 22)

---

### Step 9: Browse the Feed as Seller

1. Expand **GET /api/v1/posts/feed**
2. Click **Try it out**
3. Leave all parameters empty
4. Click **Execute**

**Expected response (200):** You should see the buyer's post from Step 4 in the feed.

**What to save:**
- Confirm the `id` matches the postId you saved in Step 4 (you'll use it next)

---

### Step 10: Submit an Offer (as Seller)

1. Expand **POST /api/v1/offers**
2. Click **Try it out**
3. Paste this body, replacing the postId:
```json
{
  "postId": "PASTE_YOUR_POST_UUID_HERE",
  "offerType": "service",
  "quoteAmount": 175,
  "pricingType": "flat_rate",
  "canStart": "Within 2 hours",
  "completionTime": "Same day",
  "message": "I'm a licensed plumber with 10 years experience in the DFW area. I can fix your kitchen sink leak today. Price includes parts and labor with a 90-day warranty on all work performed."
}
```

> **Important:** Replace `PASTE_YOUR_POST_UUID_HERE` with the post UUID from Step 4.
>
> The `message` field must be **at least 50 characters**. The example above is 171 characters. If you write your own, make sure it's long enough.
>
> The `quoteAmount` must be **at least $10**.

4. Click **Execute**

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-offer-uuid-here",
    "postId": "your-post-uuid",
    "sellerId": "seller-profile-uuid",
    "offerType": "service",
    "quoteAmount": 175,
    "pricingType": "flat_rate",
    "status": "pending",
    "canStart": "Within 2 hours",
    "completionTime": "Same day",
    "message": "I'm a licensed plumber...",
    "createdAt": "2026-02-20T..."
  }
}
```

**What to save:**
- Copy the `id` value — this is your **offerId**

**If you get a 400 error**, check:
- `postId` is a valid UUID from Step 4
- `message` is at least 50 characters long
- `quoteAmount` is at least 10
- `offerType` is one of: `service`, `product`, `job_application`, `inventory`

---

### Step 11: View Your Offers (as Seller)

1. Expand **GET /api/v1/offers/my-offers**
2. Click **Try it out**
3. Leave parameters empty
4. Click **Execute**

**Expected response (200):** An array containing the offer you just submitted with `status: "pending"`.

---

### Step 12: Login as Buyer Again

1. Expand **POST /api/v1/auth/login**
2. Paste:
```json
{
  "email": "buyer@test.com",
  "password": "TestPassword123!",
  "rememberMe": false
}
```
3. Click **Execute**
4. Copy the new `accessToken`
5. Click **Authorize** → **Logout** → paste new token → **Authorize**

---

### Step 13: View Offers on Your Post (as Buyer)

1. Expand **GET /api/v1/offers/post/{postId}**
2. Click **Try it out**
3. In the `postId` field, paste your **postId** from Step 4
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "the-offer-uuid",
      "quoteAmount": 175,
      "status": "pending",
      "message": "I'm a licensed plumber...",
      ...
    }
  ],
  "meta": { ... }
}
```

**What to save:**
- Confirm the `id` matches the offerId from Step 10

---

### Step 14: Accept the Offer (as Buyer)

1. Expand **POST /api/v1/offers/{offerId}/accept**
2. Click **Try it out**
3. In the `offerId` field, paste your **offerId** from Step 10
4. Click **Execute** (no request body needed)

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "offer": {
      "id": "the-offer-uuid",
      "status": "accepted",
      ...
    },
    "transaction": {
      "id": "new-transaction-uuid-here",
      "postId": "your-post-uuid",
      "offerId": "your-offer-uuid",
      "buyerId": "buyer-user-uuid",
      "sellerId": "seller-profile-uuid",
      "quoteAmount": 175,
      "status": "in_progress",
      "transactionType": "service",
      ...
    }
  }
}
```

**What to save:**
- Copy `transaction.id` — this is your **transactionId**

---

### Step 15: View Your Transactions (as Buyer)

1. Expand **GET /api/v1/transactions/my-transactions**
2. Click **Try it out**
3. Set `role` to: `buyer`
4. Click **Execute**

**Expected response (200):** An array containing the transaction with `status: "in_progress"`.

---

### Step 16: Login as Seller Again

1. Login with `seller@test.com` / `TestPassword123!` (same as Step 7)
2. Re-authorize Swagger with the new seller token

---

### Step 17: Update Transaction Status (as Seller)

The seller progresses the transaction through status updates. Do these **one at a time**, in order:

**17a. Schedule the work:**
1. Expand **PUT /api/v1/transactions/{transactionId}/status**
2. Click **Try it out**
3. In the `transactionId` field, paste your **transactionId** from Step 14
4. Paste this body:
```json
{
  "status": "scheduled",
  "scheduledDate": "2026-03-01",
  "scheduledTime": "9:00 AM - 12:00 PM",
  "note": "Confirmed appointment for Saturday morning"
}
```
5. Click **Execute**
6. Expected: 200, transaction status is now `"scheduled"`

**17b. On the way:**
1. Same endpoint, same transactionId
2. Paste this body:
```json
{
  "status": "on_the_way"
}
```
3. Click **Execute**
4. Expected: 200, status is now `"on_the_way"`

**17c. Work started:**
1. Same endpoint, same transactionId
2. Paste this body:
```json
{
  "status": "started"
}
```
3. Click **Execute**
4. Expected: 200, status is now `"started"`

---

### Step 18: Mark Transaction Complete (as Seller)

1. Expand **POST /api/v1/transactions/{transactionId}/mark-complete**
2. Click **Try it out**
3. In the `transactionId` field, paste your **transactionId**
4. Paste this body:
```json
{
  "afterPhotos": [
    "https://example.com/photos/after-sink-repair-1.jpg",
    "https://example.com/photos/after-sink-repair-2.jpg"
  ],
  "beforePhotos": [
    "https://example.com/photos/before-sink-leak.jpg"
  ],
  "workSummary": "Fixed the kitchen sink leak. Replaced the faulty P-trap and tightened all pipe connections. Tested for 15 minutes with no leaks detected."
}
```

> `afterPhotos` is **required** — you must provide at least 1 URL. These are placeholder URLs for testing.
>
> `workSummary` must be at least 10 characters if provided.

5. Click **Execute**

**Expected response (200):** Transaction with `status: "awaiting_approval"` and an `autoReleaseAt` timestamp set 7 days from now.

---

### Step 19: Login as Buyer Again

1. Login with `buyer@test.com` / `TestPassword123!`
2. Re-authorize Swagger with the buyer token

---

### Step 20: Approve the Transaction (as Buyer)

1. Expand **POST /api/v1/transactions/{transactionId}/approve**
2. Click **Try it out**
3. In the `transactionId` field, paste your **transactionId**
4. Paste this body:
```json
{
  "note": "Great work, the sink is no longer leaking. Thank you!"
}
```
5. Click **Execute**

**Expected response (200):** Transaction with `status: "completed"` and `escrowStatus: "released"`.

---

### Step 21: Submit a Review (as Buyer)

1. Expand **POST /api/v1/reviews**
2. Click **Try it out**
3. Paste this body, replacing the transactionId:
```json
{
  "transactionId": "PASTE_YOUR_TRANSACTION_UUID_HERE",
  "overallRating": 5,
  "categoryRatings": {
    "quality": 5,
    "communication": 5,
    "timeliness": 4,
    "professionalism": 5,
    "value": 4
  },
  "writtenReview": "Excellent plumber! Arrived on time, diagnosed the issue quickly, and had it fixed within an hour. Very professional and cleaned up after the work. Highly recommend.",
  "wouldRecommend": true,
  "completionPhotos": []
}
```

> Replace `PASTE_YOUR_TRANSACTION_UUID_HERE` with the transaction UUID from Step 14.
>
> `overallRating` is required (integer 1-5). `wouldRecommend` is required (true/false). `writtenReview` must be at least 10 characters if provided. Each `categoryRatings` sub-field is optional (integer 1-5).

4. Click **Execute**

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-review-uuid",
    "transactionId": "your-transaction-uuid",
    "overallRating": 5,
    "writtenReview": "Excellent plumber!...",
    "wouldRecommend": true,
    "createdAt": "2026-02-20T..."
  }
}
```

---

### Step 22: View Seller Reviews (Public)

This endpoint does NOT require authentication.

1. Expand **GET /api/v1/reviews/sellers/{sellerId}**
2. Click **Try it out**
3. In the `sellerId` field, paste the **seller profile ID** you saved in Step 8
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "review-uuid",
      "overallRating": 5,
      "writtenReview": "Excellent plumber!...",
      "wouldRecommend": true,
      ...
    }
  ],
  "meta": { ... },
  "summary": {
    "averageRating": 5,
    "totalReviews": 1,
    "ratingDistribution": {
      "5": 1,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0
    }
  }
}
```

**Congratulations!** You've completed the full buyer-seller flow: post → offer → accept → transaction → complete → review.

---

## 7. Messaging Walkthrough

Conversations are created automatically when an offer is accepted. If you completed Steps 1-14 above, a conversation already exists between the buyer and seller.

### Step M1: View Conversations (as Buyer)

Make sure you're logged in as `buyer@test.com`.

1. Expand **GET /api/v1/messages/conversations**
2. Click **Try it out**
3. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conversation-uuid-here",
      "participants": [...],
      "lastMessage": null,
      ...
    }
  ],
  "meta": { ... }
}
```

**What to save:**
- Copy the `id` — this is your **conversationId**

### Step M2: Send a Message (as Buyer)

1. Expand **POST /api/v1/messages/conversations/{conversationId}/messages**
2. Click **Try it out**
3. In the `conversationId` field, paste your **conversationId**
4. Paste this body:
```json
{
  "messageText": "Hi, just wanted to confirm the appointment for Saturday. Is 9 AM still good?",
  "attachments": []
}
```

> `messageText` must be at least 1 character and at most 2000 characters.

5. Click **Execute**

**Expected response (201):** The created message object.

### Step M3: View the Conversation (as Seller)

1. Login as `seller@test.com` and re-authorize
2. Expand **GET /api/v1/messages/conversations/{conversationId}**
3. Paste the same **conversationId**
4. Click **Execute**

**Expected response (200):** The conversation with the buyer's message in the `messages` array.

### Step M4: Reply (as Seller)

1. Expand **POST /api/v1/messages/conversations/{conversationId}/messages**
2. Paste the same **conversationId**
3. Paste this body:
```json
{
  "messageText": "Yes, 9 AM works perfectly. I'll bring all the necessary tools and parts. See you Saturday!",
  "attachments": []
}
```
4. Click **Execute**

---

## 8. Admin Walkthrough

### Step A1: Login as Admin

1. Expand **POST /api/v1/auth/login**
2. Paste:
```json
{
  "email": "admin@reversemarketplace.com",
  "password": "AdminSecure456!",
  "rememberMe": false
}
```
3. Click **Execute**
4. Copy the `accessToken` and re-authorize Swagger

### Step A2: View Dashboard Stats

1. Expand **GET /api/v1/admin/stats**
2. Click **Try it out** → **Execute**

**Expected response (200):** An object with counts like `totalUsers`, `totalPosts`, `totalTransactions`, etc.

### Step A3: List All Users

1. Expand **GET /api/v1/admin/users**
2. Click **Try it out**
3. You can optionally filter:
   - `status`: `active`, `suspended`, `banned`, or `deleted`
   - `accountType`: `buyer`, `seller`, or `both`
   - `search`: type a name or email to search
4. Click **Execute**

**Expected response (200):** Paginated list of all users in the system (should include the 4 seeded accounts).

### Step A4: View Audit Logs

1. Expand **GET /api/v1/admin/audit-logs**
2. Click **Try it out**
3. Click **Execute**

**Expected response (200):** Paginated list of all system actions (logins, post creations, offer submissions, etc.).

### Step A5: View Verification Requests

1. Expand **GET /api/v1/admin/verifications**
2. Click **Try it out**
3. You can filter by:
   - `status`: `pending`, `under_review`, `approved`, `rejected`, `expired`
   - `type`: `id`, `ein`, `license`, `insurance`, `background_check`
4. Click **Execute**

**Expected response (200):** Paginated list of verification requests (may be empty if no sellers have submitted verification documents).

---

## 9. Auth Extras

### Register a New Account

1. Expand **POST /api/v1/auth/register**
2. Click **Try it out**
3. Paste:
```json
{
  "email": "newuser@example.com",
  "password": "MySecure456!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "214-555-0199",
  "accountType": "buyer",
  "locationZip": "75201",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}
```

> **Required fields:** `email`, `password`, `firstName`, `lastName`, `agreeToTerms` (must be `true`), `agreeToPrivacy` (must be `true`)
>
> **Optional fields:** `phone`, `accountType` (defaults to `buyer`), `locationZip`
>
> **`accountType` valid values:** `buyer`, `seller`, `both`

4. Click **Execute**

**Expected response (201):** User object with tokens. You're automatically logged in.

**If you get 400:** Check password requirements (see Section 13) and make sure both `agreeToTerms` and `agreeToPrivacy` are `true`.

**If you get 429:** You've hit the rate limit (3 registrations per hour). Wait and try again.

### Refresh a Token

1. Expand **POST /api/v1/auth/refresh**
2. Paste:
```json
{
  "refreshToken": "PASTE_YOUR_REFRESH_TOKEN_HERE"
}
```

> Use the `refreshToken` from any login response. This gives you a new `accessToken` without re-entering credentials.

3. Click **Execute**

**Expected response (200):** New `accessToken` and `refreshToken`.

### Logout

1. Make sure you're authorized (have a token set)
2. Expand **POST /api/v1/auth/logout**
3. Click **Try it out** → **Execute**

**Expected response (200):** Success message. Your tokens are now invalidated.

---

## 10. Valid Enum Values Reference

Use this table when filling in enum fields across any endpoint.

### Post Enums

| Field | Valid Values |
|-------|-------------|
| `budgetType` | `range`, `open`, `fixed` |
| `urgency` | `asap`, `within_24_hours`, `within_3_days`, `within_1_week`, `flexible`, `specific_date` |
| `status` | `draft`, `active`, `filled`, `expired`, `cancelled` |

### Offer Enums

| Field | Valid Values |
|-------|-------------|
| `offerType` | `service`, `product`, `job_application`, `inventory` |
| `pricingType` | `flat_rate`, `hourly`, `quote`, `fixed` |
| `status` | `pending`, `accepted`, `declined`, `withdrawn`, `expired` |

### Transaction Enums

| Field | Valid Values |
|-------|-------------|
| `status` (all) | `in_progress`, `scheduled`, `on_the_way`, `started`, `awaiting_approval`, `changes_requested`, `approved`, `cancelled`, `disputed`, `completed` |
| `status` (service/job updates) | `scheduled`, `on_the_way`, `started` |
| `status` (shipped product updates) | `preparing_shipment`, `shipped`, `in_transit` |
| `status` (local meetup updates) | `pending_meetup`, `meetup_scheduled` |
| `escrowStatus` | `held`, `released`, `refunded`, `frozen` |
| `transactionType` | `service`, `product_shipped`, `product_local_cash`, `product_local_platform`, `job_milestone` |

### User/Account Enums

| Field | Valid Values |
|-------|-------------|
| `accountType` | `buyer`, `seller`, `both` |
| `userStatus` | `active`, `suspended`, `banned`, `deleted` |

### Verification Enums

| Field | Valid Values |
|-------|-------------|
| `verificationType` | `id`, `ein`, `license`, `insurance`, `background_check` |
| `verificationStatus` | `pending`, `under_review`, `approved`, `rejected`, `expired` |

### Admin Enums

| Field | Valid Values |
|-------|-------------|
| Dispute `outcome` | `full_refund`, `partial_refund`, `no_refund`, `custom` |
| Dispute `status` | `open`, `under_review`, `resolved`, `appealed`, `closed` |
| Moderation `action` | `approve`, `reject` |
| Verification review `action` | `approve`, `reject` |

### Conversation/Message Enums

| Field | Valid Values |
|-------|-------------|
| `conversationStatus` | `active`, `archived`, `closed` |

---

## 11. Field Requirements Reference

Minimum and maximum lengths/values for fields you'll commonly fill in.

### Posts

| Field | Type | Constraints |
|-------|------|------------|
| `title` | string | 5 - 200 characters |
| `description` | string | 20 - 5,000 characters |
| `budgetMin` | number | >= 0 |
| `budgetMax` | number | >= 0 |
| `locationZip` | string | 5 digits (`75201`) or 5+4 (`75201-1234`) |
| `expiresInHours` | integer | 1 - 720 (default: 168 = 7 days) |
| `photos` | array | max 10 URLs |
| `videos` | array | max 3 URLs |

### Offers

| Field | Type | Constraints |
|-------|------|------------|
| `quoteAmount` | number | $10 - $1,000,000 |
| `message` | string | **50 - 1,000 characters** (this is the most common gotcha!) |
| `estimatedHours` | number | 0.5 - 10,000 |
| `canStart` | string | max 100 characters |
| `completionTime` | string | max 100 characters |
| `terms` | string | max 2,000 characters |
| `warranty` | string | max 1,000 characters |
| `attachments` | array | max 10 URLs |

### Reviews

| Field | Type | Constraints |
|-------|------|------------|
| `overallRating` | integer | **1 - 5** (required) |
| `categoryRatings.*` | integer | 1 - 5 each (all optional) |
| `writtenReview` | string | 10 - 2,000 characters |
| `wouldRecommend` | boolean | **required** (`true` or `false`) |
| `completionPhotos` | array | max 10 URLs |

### Transactions

| Field | Type | Constraints |
|-------|------|------------|
| `afterPhotos` | array | **1 - 20 URLs** (required for mark-complete) |
| `beforePhotos` | array | max 20 URLs |
| `workSummary` | string | 10 - 2,000 characters |
| `cancelReason` | string | 10 - 500 characters |
| `changeRequestReason` | string | 20 - 1,000 characters |
| `note` | string | max 500 characters |

### Messages

| Field | Type | Constraints |
|-------|------|------------|
| `messageText` | string | 1 - 2,000 characters |
| `attachments` | array | max 5 URLs |

### Seller Profile

| Field | Type | Constraints |
|-------|------|------------|
| `businessName` | string | max 255 characters |
| `bio` | string | max 2,000 characters |
| `serviceRadiusMiles` | integer | 1 - 500 |
| `yearsExperience` | integer | 0 - 100 |
| `portfolioPhotos` | array | max 20 URLs |
| `businessHours` time format | string | `HH:MM` (e.g., `"08:00"`, `"17:00"`) |

### Auth

| Field | Type | Constraints |
|-------|------|------------|
| `email` | string | max 255 characters, valid email format |
| `firstName` | string | 1 - 100 characters |
| `lastName` | string | 1 - 100 characters |
| `phone` | string | max 20 characters |

---

## 12. Common Errors

### 400 Bad Request — Validation Failed
Your request body has invalid data. Check the `errors` array in the response for specific field issues.

**Most common causes:**
- Password doesn't meet requirements (see Section 13)
- Missing required fields (`agreeToTerms`, `agreeToPrivacy` for registration)
- Invalid UUID format (must be like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- ZIP code must be 5 digits (e.g., `75001`) or 5+4 (e.g., `75001-1234`)
- Offer `message` is too short (needs at least **50 characters**)
- Offer `quoteAmount` is below **$10**
- Post `description` is too short (needs at least **20 characters**)

### 401 Unauthorized — Missing or Invalid Token
You need to login and authorize first (see Step 1). Tokens expire after **15 minutes** — login again to get a new one.

### 403 Forbidden — Wrong Role
Your account doesn't have permission for this endpoint.
- **Admin endpoints** need `admin@reversemarketplace.com`
- **Seller endpoints** (create offer, my-offers, mark-complete) need `seller@test.com` or `both@test.com`
- **Buyer endpoints** (create post, accept offer, approve transaction) need `buyer@test.com` or `both@test.com`
- **Owner-only actions** — you can't edit someone else's post, withdraw someone else's offer, etc.

### 404 Not Found — Invalid UUID
The UUID you provided doesn't match any record. Double-check you copied the right value.

### 409 Conflict — Business Logic Error
Something about the current state prevents your action:
- Trying to accept an offer that's already accepted/declined
- Trying to update a transaction that's already completed/cancelled
- Trying to submit a second offer on the same post (one offer per seller per post)
- Trying to review a transaction that's not yet completed
- Exceeded the 2-change-request limit on a transaction

### 429 Too Many Requests — Rate Limited
You've hit the rate limit. Key limits:
- Register: **3 per hour**
- Login: **10 per minute**
- AI endpoints: **20 per hour**
- Messages: **50 per hour**
- General: **1000 per hour**

Wait for the `x-ratelimit-reset` header value (seconds) before retrying.

---

## 13. Password Requirements

When registering or changing passwords, the password must have:
- At least **8 characters**
- At least **1 uppercase** letter (A-Z)
- At least **1 lowercase** letter (a-z)
- At least **1 number** (0-9)
- At least **1 special character** (!@#$%^&* etc.)

Example valid passwords: `TestPassword123!`, `MySecure456#`, `Hello@World1`

---

## 14. Endpoints That Cannot Be Tested from Swagger

### Stripe Webhook
**POST `/payments/webhook`** — This endpoint is called by Stripe's servers with a cryptographic signature header. You cannot test it manually.

To test webhooks locally, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
stripe trigger payment_intent.succeeded
```

### File Uploads
Swagger UI may not handle multipart file uploads well. Use curl:
```bash
curl -X POST http://localhost:3000/api/v1/users/me/profile-photo \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@photo.jpg"
```

---

## 15. Resetting Test Data

If you need a fresh start:
```bash
cd backend
npx prisma migrate reset --force
```
This drops and recreates the database, runs migrations, and re-seeds all test data (users + categories).

---

## 16. Not Yet Tested — Remaining Endpoints

The sections below cover every backend endpoint **not** covered in the walkthroughs above. Work through them in order after completing Steps 1-22 so you have the UUIDs you need.

> **Prerequisite:** Complete the main walkthrough (Steps 1-22) first. You'll reuse `userId`, `postId`, `offerId`, `transactionId`, `conversationId`, `reviewId`, and `seller profile ID` from those steps.

---

### 16.1 User Profile Management

Make sure you're logged in as **`buyer@test.com`**.

#### Step U1: Get Current User Profile

1. Expand **GET /api/v1/users/me**
2. Click **Try it out** → **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "buyer-user-uuid",
    "email": "buyer@test.com",
    "firstName": "Test",
    "lastName": "Buyer",
    "accountType": "buyer",
    "phone": null,
    "phoneVerified": false,
    "emailVerified": true,
    "profilePhotoUrl": null,
    "locationCity": null,
    "locationState": null,
    "locationZip": null,
    "locationCountry": "US",
    "bio": null,
    "notificationPreferences": {},
    "rating": null,
    "totalReviews": 0,
    "totalTransactions": 0,
    "status": "active",
    "lastLoginAt": "2026-02-22T...",
    "createdAt": "2026-02-22T...",
    "updatedAt": "2026-02-22T..."
  }
}
```

---

#### Step U2: Update User Profile

1. Expand **PATCH /api/v1/users/me**
2. Click **Try it out**
3. Paste this body:
```json
{
  "firstName": "TestUpdated",
  "lastName": "BuyerUpdated",
  "phone": "214-555-0100",
  "bio": "I'm a test buyer in Dallas looking for home services.",
  "locationCity": "Dallas",
  "locationState": "TX",
  "locationZip": "75201"
}
```
4. Click **Execute**

**Expected response (200):** Updated user profile with the new values.

**Field constraints:**
- `firstName` / `lastName`: 1-100 characters
- `phone`: max 20 characters
- `bio`: max 2,000 characters
- `locationZip`: 5 digits (`75201`) or 5+4 (`75201-1234`)

---

#### Step U3: Update Profile Photo URL

1. Expand **PATCH /api/v1/users/me/photo**
2. Click **Try it out**
3. Paste this body:
```json
{
  "photoUrl": "https://example.com/photos/my-profile.jpg"
}
```
4. Click **Execute**

**Expected response (200):** Updated profile with `profilePhotoUrl` set to the URL.

---

#### Step U4: Change Password

1. Expand **POST /api/v1/users/me/change-password**
2. Click **Try it out**
3. Paste this body:
```json
{
  "currentPassword": "TestPassword123!",
  "newPassword": "NewPassword456!"
}
```
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": { "message": "Password changed successfully" }
}
```

> **Important:** After this, `buyer@test.com` will use `NewPassword456!` to login. Change it back if you want to keep using the original:
```json
{
  "currentPassword": "NewPassword456!",
  "newPassword": "TestPassword123!"
}
```

---

#### Step U5: Switch Account Type

1. Expand **PATCH /api/v1/users/me/account-type**
2. Click **Try it out**
3. Paste this body:
```json
{
  "accountType": "both"
}
```
4. Click **Execute**

**Expected response (200):** Updated profile with `accountType: "both"`.

> Valid values: `buyer`, `seller`, `both`. Switch it back to `buyer` when done.

---

#### Step U6: Update FCM Push Token

1. Expand **PUT /api/v1/users/me/fcm-token**
2. Click **Try it out**
3. Paste this body:
```json
{
  "fcmToken": "test-fcm-device-token-abc123"
}
```
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": { "message": "FCM token updated" }
}
```

---

#### Step U7: Get Public User Profile

This endpoint does **NOT** require authentication.

1. Expand **GET /api/v1/users/{userId}**
2. Click **Try it out**
3. In the `userId` field, paste the **buyer userId** you saved in Step 1
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "buyer-user-uuid",
    "firstName": "TestUpdated",
    "lastName": "BuyerUpdated",
    "accountType": "both",
    "profilePhotoUrl": "https://example.com/photos/my-profile.jpg",
    "locationCity": "Dallas",
    "locationState": "TX",
    "bio": "I'm a test buyer...",
    "rating": null,
    "totalReviews": 0,
    "totalTransactions": 0,
    "createdAt": "..."
  }
}
```

> Note: This returns a **limited** public profile — no email, phone, or sensitive fields.

---

#### Step U8: Delete Account

> **Warning:** This soft-deletes the account. **Test with a throwaway account**, not the seeded ones.

1. First, register a throwaway account (see Section 9) using email `throwaway@example.com`
2. Login as that throwaway account and authorize Swagger
3. Expand **DELETE /api/v1/users/me**
4. Click **Try it out**
5. Paste this body:
```json
{
  "password": "MySecure456!"
}
```
6. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": { "message": "Account deleted successfully" }
}
```

> After deletion, the account can no longer login. Re-login as `buyer@test.com` to continue testing.

---

### 16.2 Auth Extras

#### Step AE1: Resend Verification Email

1. Expand **POST /api/v1/auth/resend-verification**
2. Click **Try it out**
3. Paste this body:
```json
{
  "email": "buyer@test.com"
}
```
4. Click **Execute**

**Expected response (200):** Success message. If SendGrid is not configured, check server console logs for the verification URL.

> Rate limit: 1 per 5 minutes.

---

#### Step AE2: Forgot Password

1. Expand **POST /api/v1/auth/forgot-password**
2. Click **Try it out**
3. Paste this body:
```json
{
  "email": "buyer@test.com"
}
```
4. Click **Execute**

**Expected response (200):** Success message (always returns 200 even if email doesn't exist, to prevent enumeration).

> Rate limit: 3 per hour.
>
> To actually test the full flow, check server logs or the database for the reset token, then use it with `POST /auth/reset-password`.

---

#### Step AE3: Verify Email (Token Required)

1. Expand **GET /api/v1/auth/verify-email**
2. Click **Try it out**
3. In the `token` query parameter, paste a verification token

> **How to get the token:** When `resend-verification` is called, the token is either:
> - Printed in the server console log (development mode)
> - Sent via email (if SendGrid is configured)
> - Stored in the database — query the `email_verification_tokens` or equivalent table

**Expected response (200):** `{ "success": true, "data": { "message": "Email verified successfully" } }`

---

#### Step AE4: Reset Password (Token Required)

1. Expand **POST /api/v1/auth/reset-password**
2. Click **Try it out**
3. Paste this body (using the token from `forgot-password`):
```json
{
  "token": "PASTE_RESET_TOKEN_HERE",
  "newPassword": "ResetPassword789!"
}
```
4. Click **Execute**

> Same token retrieval methods as AE3 above.

**Expected response (200):** Success message. The user can now login with the new password.

---

### 16.3 Seller Profile & Verification

#### Step S1: Create Seller Profile

Login as **`buyer@test.com`** (after switching account type to `both` in U5, or use a fresh account).

> If you're using `seller@test.com`, the seed script already created a seller profile — you'll get a 409 Conflict. Use `both@test.com` or a newly registered account instead.

1. Expand **POST /api/v1/sellers**
2. Click **Try it out**
3. Paste this body:
```json
{
  "businessName": "Buyer's Side Hustle Services",
  "bio": "Part-time handyman and home repair specialist in the Dallas area.",
  "serviceRadiusMiles": 20,
  "yearsExperience": 3,
  "businessWebsite": "https://example.com/my-services",
  "businessHours": {
    "mon": { "open": "09:00", "close": "17:00" },
    "tue": { "open": "09:00", "close": "17:00" },
    "wed": { "open": "09:00", "close": "17:00" },
    "thu": { "open": "09:00", "close": "17:00" },
    "fri": { "open": "09:00", "close": "17:00" },
    "sat": { "open": "10:00", "close": "14:00" },
    "sun": { "open": "00:00", "close": "00:00", "closed": true }
  }
}
```
4. Click **Execute**

**Expected response (201):** New seller profile object with `id`, `profileStrength`, `verificationTier`, etc.

**What to save:**
- Copy the `id` — this is a new **seller profile ID**

**Field constraints:**
- `businessName`: max 255 characters
- `bio`: max 2,000 characters
- `serviceRadiusMiles`: 1-500 (default 25)
- `yearsExperience`: 0-100
- `businessHours` times: `HH:MM` format (e.g., `"09:00"`, `"17:00"`)

---

#### Step S2: Update Seller Profile

Login as **`seller@test.com`** and authorize.

1. Expand **PATCH /api/v1/sellers/me**
2. Click **Try it out**
3. Paste this body:
```json
{
  "businessName": "Updated Seller Services DFW",
  "bio": "Licensed and insured plumber with 12 years serving the Dallas-Fort Worth metroplex. Specializing in residential plumbing, water heaters, and drain cleaning.",
  "serviceRadiusMiles": 40,
  "yearsExperience": 12,
  "portfolioPhotos": [
    "https://example.com/portfolio/job1.jpg",
    "https://example.com/portfolio/job2.jpg",
    "https://example.com/portfolio/job3.jpg"
  ]
}
```
4. Click **Execute**

**Expected response (200):** Updated seller profile with new values and recalculated `profileStrength`.

---

#### Step S3: Submit Verification Request

Still logged in as **`seller@test.com`**.

1. Expand **POST /api/v1/sellers/me/verification**
2. Click **Try it out**
3. Paste this body:
```json
{
  "verificationType": "license",
  "documents": [
    "https://example.com/docs/plumbing-license.pdf"
  ],
  "licenseNumber": "PLB-2024-TX-12345",
  "licenseState": "TX",
  "licenseExpiry": "2027-12-31T00:00:00.000Z"
}
```
4. Click **Execute**

**Expected response (201):** Verification request object with `status: "pending"`.

**What to save:**
- Copy the `id` — this is your **verificationId** (needed for admin review in Step AD6)

**Verification types:** `id`, `ein`, `license`, `insurance`, `background_check`

> For insurance verification, use these fields instead:
> `insuranceProvider`, `insurancePolicyNumber`, `insuranceExpiry`

---

#### Step S4: View My Verification Requests

1. Expand **GET /api/v1/sellers/me/verification**
2. Click **Try it out** → **Execute**

**Expected response (200):** Array containing the verification request from S3 with `status: "pending"`.

---

#### Step S5: Get Seller Profile by User ID

This endpoint does **NOT** require authentication.

1. Expand **GET /api/v1/sellers/user/{userId}**
2. Click **Try it out**
3. In the `userId` field, paste the **seller's user ID** (from the seller login response, field `user.id`)
4. Click **Execute**

**Expected response (200):** Public seller profile (same format as `GET /sellers/:sellerId` but looked up by user ID).

---

### 16.4 Category Tree

#### Step CT1: Get Full Category Tree

No authentication required.

1. Expand **GET /api/v1/categories/tree**
2. Click **Try it out** → **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "products",
      "name": "Products",
      "children": [
        { "id": "...", "slug": "electronics", "name": "Electronics", "children": [] },
        { "id": "...", "slug": "furniture", "name": "Furniture", "children": [] },
        ...
      ]
    },
    {
      "id": "...",
      "slug": "services",
      "name": "Services",
      "children": [ ...20 subcategories... ]
    },
    {
      "id": "...",
      "slug": "jobs",
      "name": "Jobs",
      "children": [ ...7 subcategories... ]
    }
  ]
}
```

> Unlike `GET /categories`, the tree endpoint returns the full hierarchy with `children` nested inside each parent.

---

### 16.5 Post Management

Login as **`buyer@test.com`** and authorize. You need a **postId** from Step 4.

#### Step P1: Get Single Post

1. Expand **GET /api/v1/posts/{postId}**
2. Click **Try it out**
3. Paste your **postId** from Step 4
4. Click **Execute**

**Expected response (200):** Full post details including `category`, `subcategory`, `buyer` info, `offerCount`, `viewCount`.

---

#### Step P2: Update Post

> **Important:** The post from Step 4 already has offers (from Step 10), so it cannot be edited. You need a fresh post with zero offers.

1. First, **create a new post** (repeat Step 4) and save the new **postId**
2. Expand **PUT /api/v1/posts/{postId}**
3. Click **Try it out**
4. Paste your **new postId** (the one you just created)
5. Paste this body:
```json
{
  "title": "Updated: Need a plumber for kitchen sink repair ASAP",
  "description": "My kitchen sink is leaking badly from the pipe connection underneath. Need a licensed plumber to diagnose and fix the issue urgently. The leak is coming from the P-trap area and is getting worse.",
  "budgetMax": 400,
  "urgency": "asap"
}
```
6. Click **Execute**

**Expected response (200):** Updated post with new values.

> All fields are optional — only send the ones you want to change.
> Constraints: `title` 5-200 chars, `description` 20-5,000 chars.
> If you get a **409 ConflictError** ("Cannot edit a post that has received offers"), it means the post already has offers — create a fresh post and try again.

---

#### Step P3: Extend Post Duration

> Only works on **active** posts. Max 3 extensions per post.

1. Expand **POST /api/v1/posts/{postId}/extend**
2. Click **Try it out**
3. Paste your **postId**
4. Click **Execute** (no request body needed)

**Expected response (200):** Post with updated `expiresAt` (extended by 7 more days) and `extensionsRemaining` count.

---

#### Step P4: Mark Post as Filled

> This marks the post as `filled` so it no longer appears in the feed. Only works on **active** posts.

1. First, **create a new post** (repeat Step 4) so you have a fresh post to mark filled
2. Expand **POST /api/v1/posts/{postId}/mark-filled**
3. Click **Try it out**
4. Paste the **new postId**
5. Click **Execute** (no request body needed)

**Expected response (200):** Post with `status: "filled"`.

---

#### Step P5: Repost

> Creates a new post with the same details as an existing one. Works on any post you own regardless of status.

1. Expand **POST /api/v1/posts/{postId}/repost**
2. Click **Try it out**
3. Paste any of your **postId** values
4. Click **Execute** (no request body needed)

**Expected response (201):** A brand new post object with a new `id`, `status: "active"`, and fresh `expiresAt`.

---

#### Step P6: Delete/Cancel Post

1. Use the reposted post's `id` from P5 (so you don't lose your main test post)
2. Expand **DELETE /api/v1/posts/{postId}**
3. Click **Try it out**
4. Paste the **postId** to delete
5. Click **Execute**

**Expected response (204):** No content (empty body). The post is now cancelled.

---

### 16.6 Post Search

#### Step PS1: Search Posts

No authentication required.

1. Expand **GET /api/v1/posts/search**
2. Click **Try it out**
3. Set the `q` parameter to: `plumber`
4. Optionally set `city` to `Dallas` and `state` to `TX`
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [ ...matching posts... ],
  "meta": { "page": 1, "limit": 20, "total": ..., "totalPages": ... }
}
```

**Query parameters:**
- `q` (required): 1-200 characters
- `categoryId`, `minBudget`, `maxBudget`, `city`, `state`, `page`, `limit` — all optional

---

### 16.7 AI-Assisted Post Creation

> **Requires:** `GEMINI_API_KEY` set in your `.env` file. If not configured, these endpoints will return a 500 error.
>
> **Rate limit:** 20 AI requests per hour per user.

Login as **`buyer@test.com`** and authorize.

#### Step AI1: Parse Natural Language into Post

1. Expand **POST /api/v1/posts/ai/parse**
2. Click **Try it out**
3. Paste this body:
```json
{
  "text": "I need someone to fix my leaking kitchen sink in Dallas. It's the P-trap under the sink. Budget is around $200 and I need it done this week.",
  "location": {
    "city": "Dallas",
    "state": "TX",
    "zip": "75201"
  }
}
```
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": { 
    "title": "Kitchen Sink P-Trap Repair",
    "description": "Need a plumber to fix a leaking P-trap...",
    "categorySlug": "services",
    "subcategorySlug": "plumbing",
    "budgetMin": 150,
    "budgetMax": 250,
    "budgetType": "range",
    "urgency": "within_3_days",
    "categorySpecific": {},
    "requirements": {}
  }
}
```

> The AI response will vary. The key thing is that it returns a structured post you could use with `POST /posts`.
>
> `text` must be 20-2,000 characters. `location` is optional.

---

#### Step AI2: Suggest Product Images

1. Expand **POST /api/v1/posts/ai/suggest-images**
2. Click **Try it out**
3. Paste this body:
```json
{
  "productName": "Samsung 65-inch 4K Smart TV",
  "categorySlug": "electronics"
}
```
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://images.unsplash.com/...",
        "description": "65-inch smart TV in living room",
        "searchQuery": "samsung 4k tv"
      }
    ]
  }
}
```

> `productName`: 2-200 characters. `categorySlug` is optional but helps the AI.

---

#### Step AI3: Generate Job Profile

1. Expand **POST /api/v1/posts/ai/generate-job-profile**
2. Click **Try it out**
3. Paste this body:
```json
{
  "text": "Looking for an experienced React developer for a 3-month contract to rebuild our customer dashboard. Must know TypeScript and have experience with data visualization.",
  "profileType": "employer"
}
```
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "title": "Senior React/TypeScript Developer — Dashboard Rebuild",
    "description": "Seeking an experienced React developer...",
    "categorySpecific": { ... },
    "suggestedBudget": {
      "min": 8000,
      "max": 15000
    }
  }
}
```

> `profileType`: `job_seeker` or `employer`. `text`: 20-2,000 characters.

---

### 16.8 Search Module

#### Step SR1: Full-Text Search (Dedicated Search Endpoint)

No authentication required.

1. Expand **GET /api/v1/search/posts**
2. Click **Try it out**
3. Set query parameters as needed (same as `GET /posts/search`)
4. Click **Execute**

**Expected response (200):** Same format as `GET /posts/search`. This is a separate module endpoint that wraps the same search logic.

---

### 16.9 Offer Management

Login as **`seller@test.com`** and authorize.

#### Step O1: Get Single Offer

1. Expand **GET /api/v1/offers/{offerId}**
2. Click **Try it out**
3. Paste your **offerId** from Step 10
4. Click **Execute**

**Expected response (200):** Full offer details including `seller` info and `post` summary.

---

#### Step O2: Edit a Pending Offer

> Only works on offers with `status: "pending"`. If your offer was already accepted in Step 14, create a new post and offer first.

To test this, you'll need a pending offer. Either:
- Create a new post as buyer, switch to seller, submit an offer, then edit it.
- Or use the existing one if you haven't accepted it yet.

1. Expand **PUT /api/v1/offers/{offerId}**
2. Click **Try it out**
3. Paste the **offerId** of a pending offer
4. Paste this body:
```json
{
  "quoteAmount": 200,
  "message": "Updated: I'm a licensed plumber with 12 years experience in the DFW area. I can fix your kitchen sink leak today. Price includes all parts and labor with a 90-day warranty on all work."
}
```
5. Click **Execute**

**Expected response (200):** Updated offer with new `quoteAmount` and `message`.

> Constraints: `quoteAmount` ≥ $10, `message` ≥ 50 characters.

---

#### Step O3: Withdraw Offer

> This soft-deletes/withdraws the offer. Test with a disposable offer.

1. Create a new offer on a different post (or use a pending offer you don't need)
2. Expand **DELETE /api/v1/offers/{offerId}**
3. Click **Try it out**
4. Paste the **offerId**
5. Click **Execute**

**Expected response (204):** No content. The offer is now withdrawn.

---

### 16.10 Transaction Extras

#### Step T1: Get Single Transaction

Login as **`buyer@test.com`** or **`seller@test.com`**.

1. Expand **GET /api/v1/transactions/{transactionId}**
2. Click **Try it out**
3. Paste your **transactionId** from Step 14
4. Click **Execute**

**Expected response (200):** Full transaction details including `post`, `offer`, `buyer`, `seller`, `timeline` array, `escrowStatus`, `photos`, etc.

---

#### Step T2: Request Changes (as Buyer)

> Only works when transaction status is `awaiting_approval`. Max **2 change requests** per transaction.
>
> To test: You need a transaction in `awaiting_approval` state (after seller marks complete but before buyer approves). You may need to run through a fresh post → offer → accept → mark-complete flow.

Login as **`buyer@test.com`** and authorize.

1. Expand **POST /api/v1/transactions/{transactionId}/request-changes**
2. Click **Try it out**
3. Paste the **transactionId**
4. Paste this body:
```json
{
  "reason": "The sink is still dripping slightly from the left side connection. Could you please re-check the P-trap fitting?"
}
```
5. Click **Execute**

**Expected response (200):** Transaction with `status: "changes_requested"`.

> `reason` must be **20-1,000 characters**.
>
> After this, the seller can update status back to `started` and re-complete the work.

---

#### Step T3: Cancel Transaction

> Works for buyer or seller. Triggers a refund if payment was made.

Login as **`buyer@test.com`** (or `seller@test.com`).

1. Expand **PUT /api/v1/transactions/{transactionId}/cancel**
2. Click **Try it out**
3. Paste a **transactionId** (use one from a fresh test flow you don't need)
4. Paste this body:
```json
{
  "reason": "Found another plumber who can do it sooner. Sorry for the inconvenience."
}
```
5. Click **Execute**

**Expected response (200):** Transaction with `status: "cancelled"`.

> `reason` must be **10-500 characters**.

---

### 16.11 Payments / Stripe

> **Requires:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` configured in your `.env` file. Without these, all payment endpoints will fail.
>
> Use [Stripe test mode keys](https://dashboard.stripe.com/test/apikeys) for development.

#### Step PAY1: Start Seller Stripe Onboarding

Login as **`seller@test.com`** and authorize.

1. Expand **POST /api/v1/payments/seller/onboard**
2. Click **Try it out**
3. Click **Execute** (no request body needed)

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://connect.stripe.com/setup/s/...",
    "accountId": "acct_..."
  }
}
```

> The `url` is a Stripe Connect onboarding link. In a real app, the seller would be redirected here to complete onboarding.

---

#### Step PAY2: Check Seller Stripe Status

Still logged in as **`seller@test.com`**.

1. Expand **GET /api/v1/payments/seller/status**
2. Click **Try it out** → **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "onboarded": false,
    "chargesEnabled": false,
    "payoutsEnabled": false,
    "accountId": "acct_..."
  }
}
```

> `onboarded` will be `false` until the seller completes the Stripe Connect onboarding flow.

---

#### Step PAY3: Create Payment Intent

Login as **`buyer@test.com`** and authorize.

> Requires: A transaction where the seller has completed Stripe onboarding.

1. Expand **POST /api/v1/payments/create-intent**
2. Click **Try it out**
3. Paste this body:
```json
{
  "transactionId": "PASTE_YOUR_TRANSACTION_UUID_HERE"
}
```
4. Click **Execute**

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_..."
  }
}
```

> If the seller hasn't completed Stripe onboarding, you'll get a 400 error. The `clientSecret` is used by the frontend to complete the payment via Stripe.js.

---

#### Step PAY4: Refund Payment

> **Important:** The transaction from Step 14 **cannot** be refunded — it was approved in Step 20 and its `escrowStatus` is `"released"`. A refund requires `escrowStatus: "held"` (payment captured but not yet released to seller). You need a **fresh transaction** with a successful payment.

**PAY4a. Create a fresh refundable transaction:**

Follow these sub-steps to set up a transaction in the correct state. If you already have a transaction with `escrowStatus: "held"`, skip to PAY4b.

1. **Login as buyer** (`buyer@test.com` / `TestPassword123!`) and authorize Swagger
2. **Create a new post** — expand **POST /api/v1/posts**, paste:
```json
{
  "categoryId": "cc54ad0b-ea94-4920-ae73-6c085c4d6d39",
  "subcategoryId": "7cce0b86-993d-4595-8843-11248b4980ca",
  "title": "Refund test: bathroom faucet replacement",
  "description": "Need a plumber to replace an old bathroom faucet with a new one I already purchased. Standard single-handle faucet, straightforward swap.",
  "budgetMin": 80,
  "budgetMax": 150,
  "budgetType": "range",
  "locationCity": "Dallas",
  "locationState": "TX",
  "locationZip": "75201",
  "urgency": "within_3_days"
}
```
> Use the same `categoryId` and `subcategoryId` from Steps 2-3. Save the new **postId** from the response.

3. **Login as seller** (`seller@test.com` / `TestPassword123!`) and re-authorize Swagger
4. **Submit an offer** — expand **POST /api/v1/offers**, paste:
```json
{
  "postId": "85fe70c2-17ae-4c42-97e5-58467ba81376",
  "offerType": "service",
  "quoteAmount": 120,
  "pricingType": "flat_rate",
  "canStart": "Tomorrow morning",
  "completionTime": "2-3 hours",
  "message": "I can handle this faucet replacement easily. I have all the tools needed and can do it tomorrow. Price includes labor and basic supply fittings."
}
```
> Save the new **offerId** from the response.

5. **Login as buyer** again and re-authorize Swagger
6. **Accept the offer** — expand **POST /api/v1/offers/{offerId}/accept**, paste the new **offerId**, click Execute
> Save the **transactionId** from the `transaction.id` field in the response.

7. **Create a payment intent** — expand **POST /api/v1/payments/create-intent**, paste:
```json
{
  "transactionId": "46f1ff28-d8a6-490a-859c-aed9bf5d8ad5"
}
```
> Save the `paymentIntentId` from the response. In dev/test mode, Stripe onboarding checks are skipped.

8. **Simulate successful payment via Stripe CLI** — in a terminal, run:
```bash
stripe trigger payment_intent.succeeded
```
> This sends a webhook to your server that sets `escrowStatus: "held"` on the transaction. Make sure you have the Stripe CLI listening:
> ```bash
> stripe listen --forward-to localhost:3000/api/v1/payments/webhook
> ```
> After the webhook fires, verify the transaction now has `escrowStatus: "held"` by calling **GET /api/v1/transactions/{transactionId}**.

---

**PAY4b. Request the refund:**

Make sure you're logged in as **`buyer@test.com`** (only the buyer can request a refund).

1. Expand **POST /api/v1/payments/refund**
2. Click **Try it out**
3. Paste this body, replacing the transactionId:
```json
{
  "transactionId": "PASTE_YOUR_NEW_TRANSACTION_UUID_HERE",
  "reason": "Need to cancel this job due to scheduling conflict. Found another plumber closer to my area."
}
```

> **Field rules:**
> - `transactionId` (required): UUID of the transaction to refund
> - `reason` (optional): 10-500 characters. If omitted, defaults to "Buyer requested refund"

4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "your-transaction-uuid",
    "escrowStatus": "refunded",
    "stripeRefundId": "re_1234567890abcdef",
    "refundAmount": 120
  }
}
```

> The full payment amount is refunded. The transaction status is now `"cancelled"` with `cancelledBy: "buyer"`.

**If you get an error:**
- **403 Forbidden** — You're not logged in as the buyer. Only the buyer who owns the transaction can request a refund.
- **409 Conflict: "No payment to refund"** — The transaction doesn't have a `stripePaymentIntentId`. You need to create a payment intent first (PAY3) and have it succeed via webhook.
- **409 Conflict: "Escrow is not in held status"** — The escrow was already released (buyer approved) or already refunded. You need a transaction where the payment succeeded but the buyer has NOT yet approved completion. Check `escrowStatus` via **GET /api/v1/transactions/{transactionId}**.
- **404 Not Found** — Invalid transactionId. Double-check you copied the right UUID.

---

### 16.12 Message Extras

Login as **`buyer@test.com`** and authorize. You need a **conversationId** from Step M1.

> **Prerequisite:** Complete the Messaging Walkthrough (Steps M1-M4) first so you have an active conversation with messages.

#### Step ME1: Mark Conversation as Read

1. Expand **PUT /api/v1/messages/conversations/{conversationId}/mark-read**
2. Click **Try it out**
3. In the `conversationId` field, paste your **conversationId** from Step M1
4. Click **Execute** (no request body needed)

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Messages marked as read"
  }
}
```

> This marks all messages sent by the **other** participant as read, and resets your unread count for this conversation to 0. It does NOT affect messages you sent.

**If you get an error:**
- **404 Not Found** — Invalid conversationId, or you're not a participant in this conversation.
- **401 Unauthorized** — Token expired. Login again.

---

#### Step ME2: Report Conversation

> **Important:** This flags the conversation for admin moderation. You'll need this for Steps AD10 and AD12 later.

1. Expand **POST /api/v1/messages/conversations/{conversationId}/report**
2. Click **Try it out**
3. In the `conversationId` field, paste your **conversationId** from Step M1
4. Paste this body:
```json
{
  "reason": "This user is sending spam messages and unsolicited promotions."
}
```

> `reason` is required: **10-500 characters**.

5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Conversation reported for review"
  }
}
```

> This flags **ALL messages** in the conversation (not just individual ones). Each message gets `flagged: true` and `moderationStatus: "pending"`, which makes them visible in the admin flagged content list (Step AD10).

**What to remember:**
- This conversationId has flagged messages — you'll need it for **Step AD10** (list flagged content) and **Step AD12** (moderate a message)

---

### 16.13 Review Extras

Login as any authenticated user (e.g., **`seller@test.com`** — reporting a review left about you). You need a **reviewId** from Step 21.

> **Prerequisite:** Complete Step 21 (Submit a Review) first so you have a reviewId.

#### Step RE1: Report a Review

> **Important:** This flags the review for admin moderation. You'll need this for Steps AD10 and AD11 later.

1. Login as **`seller@test.com`** / `TestPassword123!` and authorize Swagger
2. Expand **PUT /api/v1/reviews/{reviewId}/report**
3. Click **Try it out**
4. In the `reviewId` field, paste the **reviewId** from Step 21
5. Paste this body:
```json
{
  "reason": "This review contains false information about the service provided."
}
```

> `reason` is required: **10-500 characters**.

6. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Review reported for moderation"
  }
}
```

> Any authenticated user can report any review — you don't have to be the buyer or seller involved in the transaction. The review gets `flagged: true`, `moderationStatus: "pending"`, and `flaggedAt` is set to the current timestamp.

**What to remember:**
- This reviewId is now flagged — you'll need it for **Step AD10** (list flagged content) and **Step AD11** (moderate a review)

**If you get an error:**
- **404 Not Found** — Invalid reviewId. Double-check you copied the right UUID from Step 21.
- **401 Unauthorized** — Token expired. Login again.

---

### 16.14 Notifications

Login as **`buyer@test.com`** and authorize. Notifications are created automatically when events happen (offer received, message received, review received, transaction updates, etc.).

> **Prerequisite:** Complete the main walkthrough (Steps 1-22) and messaging walkthrough (Steps M1-M4) first. These actions generate notifications automatically. If the list is empty, those steps weren't completed or notifications weren't created for some reason.

**Notification types you should see after completing the walkthroughs:**

| Type | Triggered By | Generated For |
|------|-------------|---------------|
| `offer_received` | Seller submits offer (Step 10) | Buyer |
| `message_received` | Someone sends a message (Steps M2, M4) | Recipient |
| `review_received` | Buyer submits review (Step 21) | Seller |
| `review_reminder` | System (7/30/60 days after transaction) | Buyer |
| `transaction_updated` | Status changes (Steps 17-20) | Both parties |

#### Step N1: List Notifications

1. Expand **GET /api/v1/notifications**
2. Click **Try it out**
3. Set query parameters (all optional):
   - `unreadOnly`: `true` (to see only unread notifications)
   - `type`: `offer_received` (to filter by notification type — use any type from the table above)
   - `page`: `1` (default)
   - `limit`: `20` (default, max 50)
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-uuid-here",
      "userId": "buyer-user-uuid",
      "type": "offer_received",
      "title": "New Offer Received",
      "message": "You received a new offer on your post...",
      "data": {
        "offerId": "offer-uuid",
        "postId": "post-uuid"
      },
      "channels": ["push", "in_app"],
      "actionUrl": "/posts/post-uuid",
      "read": false,
      "readAt": null,
      "pushSent": false,
      "pushSentAt": null,
      "emailSent": false,
      "emailSentAt": null,
      "createdAt": "2026-02-27T..."
    },
    {
      "id": "another-notification-uuid",
      "userId": "buyer-user-uuid",
      "type": "message_received",
      "title": "New Message",
      "message": "Test: Yes, 9 AM works perfectly. I'll bring all the necessary...",
      "data": {
        "conversationId": "conversation-uuid",
        "messageId": "message-uuid"
      },
      "channels": ["push", "in_app"],
      "actionUrl": "/conversations/conversation-uuid",
      "read": false,
      "readAt": null,
      "pushSent": false,
      "pushSentAt": null,
      "emailSent": false,
      "emailSentAt": null,
      "createdAt": "2026-02-27T..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**What to save:**
- Copy the `id` of any notification — this is your **notificationId** (needed for N2, N4)

> If the list is empty, go back and complete Steps 10, M2, M4, and 21 — these actions generate notifications. Also check: are you logged in as the right user? Notifications are per-user.

---

#### Step N2: Mark Single Notification as Read

1. Expand **PUT /api/v1/notifications/{notificationId}/read**
2. Click **Try it out**
3. In the `notificationId` field, paste a **notificationId** from N1
4. Click **Execute** (no request body needed)

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Notification marked as read"
  }
}
```

> The notification now has `read: true` and `readAt` set to the current timestamp. You can verify by calling N1 again with `unreadOnly: true` — this notification should no longer appear.

**If you get an error:**
- **404 Not Found** — Invalid notificationId, or the notification belongs to a different user.

---

#### Step N3: Mark All Notifications as Read

1. Expand **PUT /api/v1/notifications/read-all**
2. Click **Try it out** → **Execute** (no request body needed)

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

> Returns the number of notifications that were marked as read. If all notifications were already read, `count` will be `0`.

---

#### Step N4: Delete Notification

1. Expand **DELETE /api/v1/notifications/{notificationId}**
2. Click **Try it out**
3. In the `notificationId` field, paste a **notificationId** from N1
4. Click **Execute**

**Expected response (204):** No content (empty body). The notification is soft-deleted.

**If you get an error:**
- **404 Not Found** — Invalid notificationId, or the notification belongs to a different user, or it was already deleted.

---

### 16.15 Admin Extended

Login as **`admin@reversemarketplace.com`** / `AdminSecure456!` and authorize.

> **Prerequisite:** You must be logged in as the admin account for ALL steps in this section. Non-admin accounts will get 403 Forbidden.

**Admin login:**
1. Expand **POST /api/v1/auth/login**
2. Paste:
```json
{
  "email": "admin@reversemarketplace.com",
  "password": "AdminSecure456!",
  "rememberMe": false
}
```
3. Click **Execute**
4. Copy the `accessToken` and authorize Swagger (click lock icon → Logout → paste token → Authorize)

---

#### Step AD1: View User Details

1. Expand **GET /api/v1/admin/users/{userId}**
2. Click **Try it out**
3. In the `userId` field, paste the **buyer userId** from Step 1
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "buyer-user-uuid",
    "email": "buyer@test.com",
    "firstName": "Test",
    "lastName": "Buyer",
    "accountType": "buyer",
    "status": "active",
    "isAdmin": false,
    "emailVerified": true,
    "phone": null,
    "locationCity": null,
    "locationState": null,
    "locationZip": null,
    "lastLoginAt": "2026-02-27T...",
    "createdAt": "2026-02-27T...",
    "sellerProfile": null,
    "transactionsAsBuyer": [
      {
        "id": "transaction-uuid",
        "transactionType": "service",
        "quoteAmount": 175,
        "status": "completed",
        "escrowStatus": "released",
        "createdAt": "2026-02-27T..."
      }
    ]
  }
}
```

> This returns **much more data** than the public `GET /users/:userId` endpoint — including email, admin status, seller profile with verification requests, and recent transactions. The `passwordHash` is excluded.

**If you get an error:**
- **403 Forbidden** — You're not logged in as admin. Re-login with `admin@reversemarketplace.com`.
- **404 Not Found** — Invalid userId.

---

#### Step AD2: Suspend User

> **Warning:** This suspends the user — they can no longer login until reactivated. Also immediately invalidates all their active sessions.

**AD2a. First, register a throwaway user** (so you don't break your test accounts):

1. Expand **POST /api/v1/auth/register**
2. Click **Try it out**
3. Paste:
```json
{
  "email": "suspend-test@example.com",
  "password": "TestPassword123!",
  "firstName": "Suspend",
  "lastName": "TestUser",
  "accountType": "buyer",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}
```
4. Click **Execute**
5. Copy the `user.id` from the response — this is the **throwaway userId**

> Now re-login as admin and re-authorize Swagger (the register endpoint logged you in as the throwaway user).

**AD2b. Suspend the throwaway user:**

1. Login as **`admin@reversemarketplace.com`** / `AdminSecure456!` and re-authorize
2. Expand **POST /api/v1/admin/users/{userId}/suspend**
3. Click **Try it out**
4. In the `userId` field, paste the **throwaway userId** from AD2a
5. Paste this body:
```json
{
  "reason": "Testing suspension functionality — temporary for QA purposes."
}
```

> `reason` is required: **10-500 characters**.

6. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User suspended"
  }
}
```

> The user's status is now `"suspended"` and all their active sessions have been invalidated (force logout). They cannot login until reactivated.

**What to save:**
- Keep the throwaway **userId** — you'll use it for AD3 (reactivate) and AD4 (ban)

**If you get an error:**
- **409 Conflict** — User is already suspended. Use AD3 to reactivate first.
- **400 Bad Request** — You're trying to suspend an admin account. Admins cannot be suspended.
- **404 Not Found** — Invalid userId.

---

#### Step AD3: Reactivate User

> **Prerequisite:** The throwaway user from AD2 must be in `"suspended"` or `"banned"` status.

1. Expand **POST /api/v1/admin/users/{userId}/reactivate**
2. Click **Try it out**
3. In the `userId` field, paste the **throwaway userId** from AD2
4. Click **Execute** (no request body needed)

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User reactivated"
  }
}
```

> The user's status is now `"active"` and they can login again.

**If you get an error:**
- **409 Conflict** — User is already active. They must be suspended or banned first.
- **400 Bad Request: "Cannot reactivate a deleted account"** — The user was soft-deleted and cannot be reactivated.

---

#### Step AD4: Ban User

> **Prerequisite:** First reactivate the throwaway user (AD3) if they're still suspended, since testing the ban requires a non-banned user. Or you can ban a suspended user directly — both work.

1. Expand **POST /api/v1/admin/users/{userId}/ban**
2. Click **Try it out**
3. In the `userId` field, paste the **throwaway userId**
4. Paste this body:
```json
{
  "reason": "Testing ban functionality — user violated terms of service."
}
```

> `reason` is required: **10-500 characters**.

5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User banned"
  }
}
```

> The user's status is now `"banned"` and all their active sessions have been invalidated. Banning is permanent until an admin reactivates (AD3).

**If you get an error:**
- **409 Conflict** — User is already banned. Use AD3 to reactivate first, then ban again.
- **400 Bad Request** — You're trying to ban an admin account. Admins cannot be banned.

---

#### Step AD5: Force Logout User

This invalidates all of a user's active sessions without changing their account status. Useful for security incidents.

1. Expand **POST /api/v1/admin/users/{userId}/force-logout**
2. Click **Try it out**
3. In the `userId` field, paste any **userId** (e.g., the buyer userId from Step 1)
4. Click **Execute** (no request body needed)

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User sessions invalidated"
  }
}
```

> This deletes all Redis refresh token keys for the user (`auth:refresh:{userId}:*`). The user's account remains active but they must login again to get a new token. Any existing access tokens will still work until they expire (15 minutes).

**If you get an error:**
- **404 Not Found** — Invalid userId.

---

#### Step AD6: Review Verification Request

> **Prerequisite:** Complete Step S3 (Submit Verification Request) first. You need the **verificationId** from that step.
>
> If you haven't done S3 yet, you can also check for existing verification requests by calling **GET /api/v1/admin/verifications** with `status=pending`.

Make sure you're logged in as **`admin@reversemarketplace.com`**.

1. Expand **POST /api/v1/admin/verifications/{verificationId}/review**
2. Click **Try it out**
3. In the `verificationId` field, paste the **verificationId** from Step S3

**To approve the verification:**

4. Paste this body:
```json
{
  "action": "approve",
  "notes": "License verified against state database. Valid through 2027."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "verification-uuid",
    "sellerId": "seller-profile-uuid",
    "verificationType": "license",
    "status": "approved",
    "documents": ["https://example.com/docs/plumbing-license.pdf"],
    "licenseNumber": "PLB-2024-TX-12345",
    "licenseState": "TX",
    "licenseExpiry": "2027-12-31T00:00:00.000Z",
    "reviewedAt": "2026-02-27T...",
    "reviewedBy": "admin-user-uuid",
    "notes": "License verified against state database. Valid through 2027.",
    "createdAt": "2026-02-27T..."
  }
}
```

> After approval, the seller earns the "Licensed" badge on their profile.

---

**To reject the verification instead:**

4. Paste this body:
```json
{
  "action": "reject",
  "notes": "Document is unclear.",
  "rejectionReason": "The uploaded license document is too blurry to verify. Please upload a clearer scan."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "verification-uuid",
    "sellerId": "seller-profile-uuid",
    "verificationType": "license",
    "status": "rejected",
    "rejectionReason": "The uploaded license document is too blurry to verify. Please upload a clearer scan.",
    "notes": "Document is unclear.",
    "reviewedAt": "2026-02-27T...",
    "reviewedBy": "admin-user-uuid",
    "createdAt": "2026-02-27T..."
  }
}
```

**Field rules:**
- `action` (required): `"approve"` or `"reject"`
- `notes` (optional): max 1,000 characters — internal admin notes
- `rejectionReason` (required when rejecting): **10-500 characters** — sent to the seller explaining why

**If you get an error:**
- **404 Not Found** — Invalid verificationId. Check with `GET /admin/verifications`.
- **409 Conflict** — Verification was already reviewed.

---

#### Step AD7: List Disputes

> **Note:** There is currently no user-facing endpoint to file a dispute. Disputes may be empty unless they were seeded or created via a direct database insert. If you want to test AD8 and AD9, you can create a dispute manually:
>
> ```bash
> cd backend
> npx prisma studio
> ```
> In Prisma Studio, open the `Dispute` table and create a record with:
> - `transactionId`: any valid transaction UUID from your test data
> - `openedById`: the buyer's userId
> - `status`: `open`
> - `reason`: `"Work was not completed as described"`
> - `openedAt`: current timestamp

Make sure you're logged in as **`admin@reversemarketplace.com`**.

1. Expand **GET /api/v1/admin/disputes**
2. Click **Try it out**
3. Set query parameters (all optional):
   - `status`: `open` (or `under_review`, `resolved`, `appealed`, `closed`)
   - `page`: `1` (default)
   - `limit`: `20` (default, max 50)
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dispute-uuid-here",
      "status": "open",
      "reason": "Work was not completed as described",
      "outcome": null,
      "refundAmount": null,
      "openedAt": "2026-02-27T...",
      "transaction": {
        "id": "transaction-uuid",
        "transactionType": "service",
        "quoteAmount": 175,
        "status": "in_progress",
        "escrowStatus": "held"
      },
      "openedBy": {
        "id": "buyer-user-uuid",
        "email": "buyer@test.com",
        "firstName": "Test",
        "lastName": "Buyer"
      },
      "buyer": {
        "id": "buyer-user-uuid",
        "email": "buyer@test.com",
        "firstName": "Test",
        "lastName": "Buyer"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

> If the list is empty, no disputes have been filed. See the note above about creating one manually.

**What to save:**
- Copy the `id` — this is your **disputeId** (needed for AD8 and AD9)

---

#### Step AD8: View Dispute Details

> **Prerequisite:** You need a **disputeId** from AD7.

1. Expand **GET /api/v1/admin/disputes/{disputeId}**
2. Click **Try it out**
3. In the `disputeId` field, paste the **disputeId** from AD7
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "id": "dispute-uuid",
    "status": "open",
    "reason": "Work was not completed as described",
    "outcome": null,
    "refundAmount": null,
    "resolutionSummary": null,
    "openedAt": "2026-02-27T...",
    "resolvedAt": null,
    "transaction": {
      "id": "transaction-uuid",
      "transactionType": "service",
      "quoteAmount": 175,
      "totalCharged": 183.75,
      "status": "in_progress",
      "escrowStatus": "held"
    },
    "openedBy": {
      "id": "buyer-user-uuid",
      "email": "buyer@test.com",
      "firstName": "Test",
      "lastName": "Buyer"
    },
    "buyer": {
      "id": "buyer-user-uuid",
      "firstName": "Test",
      "lastName": "Buyer"
    }
  }
}
```

**If you get an error:**
- **404 Not Found** — Invalid disputeId.

---

#### Step AD9: Resolve Dispute

> **Prerequisite:** You need a **disputeId** from AD7 with status `"open"` or `"under_review"`. Disputes that are already `"resolved"` or `"closed"` cannot be resolved again.

1. Expand **POST /api/v1/admin/disputes/{disputeId}/resolve**
2. Click **Try it out**
3. In the `disputeId` field, paste the **disputeId**
4. Paste this body:
```json
{
  "outcome": "partial_refund",
  "refundAmount": 87.50,
  "resolutionSummary": "After reviewing the evidence from both parties, the work was partially completed. Issuing a 50% refund to the buyer while compensating the seller for work done."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Dispute resolved"
  }
}
```

> The dispute now has `status: "resolved"`, `outcome: "partial_refund"`, and `refundAmount: 87.50`.

**Field rules:**
- `outcome` (required): `"full_refund"`, `"partial_refund"`, `"no_refund"`, or `"custom"`
- `resolutionSummary` (required): **10-2,000 characters** — explanation of the decision
- `refundAmount` (required for `partial_refund` and `custom`): the dollar amount to refund (must be ≥ 0)

**Other outcome examples:**

Full refund (no `refundAmount` needed):
```json
{
  "outcome": "full_refund",
  "resolutionSummary": "Seller failed to show up for the scheduled appointment. Full refund issued to buyer."
}
```

No refund:
```json
{
  "outcome": "no_refund",
  "resolutionSummary": "Evidence shows work was completed as described. Buyer's complaint is not substantiated by the before/after photos."
}
```

**If you get an error:**
- **409 Conflict** — Dispute is already resolved or closed.
- **404 Not Found** — Invalid disputeId.

---

#### Step AD10: List Flagged Content

> **Prerequisite:** Complete **Step RE1** (report a review) and **Step ME2** (report a conversation) first. These flag content for admin moderation. Without them, this list will be empty.

Make sure you're logged in as **`admin@reversemarketplace.com`**.

1. Expand **GET /api/v1/admin/moderation/flagged**
2. Click **Try it out**
3. Set query parameters (all optional):
   - `contentType`: leave empty to see both, or set to `review` or `message` to filter
   - `page`: `1` (default)
   - `limit`: `20` (default, max 50)
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "review",
      "id": "review-uuid-from-step-21",
      "overallRating": 5,
      "writtenReview": "Excellent plumber! Arrived on time, diagnosed the issue quickly...",
      "flagReason": "This review contains false information about th",
      "flaggedAt": "2026-02-27T...",
      "createdAt": "2026-02-27T...",
      "buyer": {
        "id": "buyer-user-uuid",
        "firstName": "Test",
        "lastName": "Buyer"
      }
    },
    {
      "type": "message",
      "id": "message-uuid-here",
      "messageText": "Hi, just wanted to confirm the appointment for Saturday. Is 9 AM still good?",
      "flagReason": "This user is sending spam messages and unsolic",
      "moderationStatus": "pending",
      "createdAt": "2026-02-27T...",
      "sender": {
        "id": "buyer-user-uuid",
        "firstName": "Test",
        "lastName": "Buyer"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

> Note: `flagReason` is truncated to 50 characters from the original report reason. The `total` count combines both review and message flags.

**What to save:**
- Copy the `id` of a flagged **review** — needed for **Step AD11**
- Copy the `id` of a flagged **message** — needed for **Step AD12**

> If the list is empty, go back and complete Steps RE1 and ME2 first.

---

#### Step AD11: Moderate a Review

> **Prerequisite:** Complete **Step RE1** (report a review) first, and note the **reviewId** from Step 21. You can also get the reviewId from the AD10 flagged content list (look for items with `type: "review"`).

Make sure you're logged in as **`admin@reversemarketplace.com`**.

1. Expand **POST /api/v1/admin/moderation/reviews/{reviewId}**
2. Click **Try it out**
3. In the `reviewId` field, paste the **reviewId** from Step 21 (the one that was reported in RE1)

**To approve the review** (keep it visible):

4. Paste this body:
```json
{
  "action": "approve",
  "reason": "Review appears to be genuine and does not violate community guidelines."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Review approved"
  }
}
```

> The review's `moderationStatus` is now `"approved"` and it remains publicly visible.

---

**To reject the review instead** (hide it):

4. Paste this body:
```json
{
  "action": "reject",
  "reason": "Review contains personal attacks that violate community guidelines."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Review rejected"
  }
}
```

> The review's `moderationStatus` is now `"rejected"`. Rejected reviews are excluded from the public `GET /reviews/sellers/:sellerId` endpoint.

**Field rules:**
- `action` (required): `"approve"` or `"reject"`
- `reason` (optional): max 500 characters — internal admin note explaining the decision

**If you get an error:**
- **404 Not Found** — Invalid reviewId.

---

#### Step AD12: Moderate a Message

> **Prerequisite:** Complete **Step ME2** (report a conversation) first. Get the **messageId** from the AD10 flagged content list (look for items with `type: "message"`).

Make sure you're logged in as **`admin@reversemarketplace.com`**.

1. Expand **POST /api/v1/admin/moderation/messages/{messageId}**
2. Click **Try it out**
3. In the `messageId` field, paste a **messageId** from the AD10 flagged content list

> **How to get the messageId:** Call **GET /api/v1/admin/moderation/flagged** (AD10), find an entry with `"type": "message"`, and copy its `"id"` field.

**To reject the message** (mark as inappropriate):

4. Paste this body:
```json
{
  "action": "reject",
  "reason": "Message contains spam content and unsolicited promotions."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message rejected"
  }
}
```

---

**To approve the message** (mark as acceptable):

4. Paste this body:
```json
{
  "action": "approve",
  "reason": "Message content is normal conversation, not spam."
}
```
5. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message approved"
  }
}
```

**Field rules:**
- `action` (required): `"approve"` or `"reject"`
- `reason` (optional): max 500 characters — internal admin note

**If you get an error:**
- **404 Not Found** — Invalid messageId. Make sure you copied the `id` from a flagged message in AD10, not a conversation ID.

---

#### Step AD13: List All Transactions (System-Wide)

Make sure you're logged in as **`admin@reversemarketplace.com`**.

1. Expand **GET /api/v1/admin/transactions**
2. Click **Try it out**
3. Set query parameters (all optional):
   - `status`: any transaction status value (e.g., `completed`, `in_progress`, `cancelled` — see Section 10 for full list)
   - `escrowStatus`: `held`, `released`, `refunded`, or `frozen`
   - `page`: `1` (default)
   - `limit`: `20` (default, max 100)
4. Click **Execute**

**Expected response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction-uuid",
      "postId": "post-uuid",
      "offerId": "offer-uuid",
      "buyerId": "buyer-user-uuid",
      "sellerId": "seller-profile-uuid",
      "transactionType": "service",
      "quoteAmount": 175,
      "platformFee": 8.75,
      "totalCharged": 183.75,
      "status": "completed",
      "escrowStatus": "released",
      "stripePaymentIntentId": "pi_...",
      "stripeChargeId": "ch_...",
      "createdAt": "2026-02-27T...",
      "completedAt": "2026-02-27T...",
      "buyer": {
        "id": "buyer-user-uuid",
        "firstName": "Test",
        "lastName": "Buyer",
        "email": "buyer@test.com"
      },
      "seller": {
        "id": "seller-profile-uuid",
        "businessName": "Test Seller Services"
      },
      "post": {
        "id": "post-uuid",
        "title": "Need a plumber for kitchen sink repair"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

> Unlike **GET /transactions/my-transactions** (which only shows your own), this admin endpoint shows **every transaction in the system**. Useful for monitoring platform activity, revenue, and escrow status.

**Filter examples:**
- Show only held escrow: `escrowStatus=held`
- Show only cancelled: `status=cancelled`
- Combine filters: `status=completed&escrowStatus=released`

---

### 16.16 Endpoints That Cannot Be Tested from Swagger

These endpoints require external infrastructure or tokens that can't be obtained through Swagger UI:

| Endpoint | Why | How to Test Instead |
|----------|-----|---------------------|
| `GET /auth/verify-email?token=xxx` | Requires token from verification email | Check server console logs or query DB for token |
| `POST /auth/reset-password` | Requires token from password reset email | Check server console logs or query DB for token |
| `POST /payments/webhook` | Requires Stripe signature header | Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/v1/payments/webhook` |
| `GET /health` | System endpoint, not in Swagger | `curl http://localhost:3000/health` |
