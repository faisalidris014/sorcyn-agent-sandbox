# **📋 PRODUCT REQUIREMENTS DOCUMENT (PRD)**
# **SORCYN — REVERSE MARKETPLACE PLATFORM**

---

## **📌 DOCUMENT INFO**

| Field | Details |
|-------|---------|
| **Product Name** | Sorcyn |
| **Domain** | sorcyn.com |
| **Version** | 2.2 — MVP (Revised per Apr 14–16 Sessions) |
| **Document Owner** | Faisal + Partners |
| **Created Date** | February 9, 2026 |
| **Last Updated** | May 2, 2026 |
| **Status** | In Development |
| **Target Launch** | Q3 2026 (DFW only) |

---

## **📑 TABLE OF CONTENTS**

```
1. Executive Summary
2. Problem Statement
3. Solution Overview
4. Market Opportunity
5. User Personas
6. Product Goals & Success Metrics
7. Scope & Phases (REVISED)
8. Functional Requirements (Detailed)
9. Technical Architecture
10. Database Schema
11. Complete API Specification
12. Security & Compliance Checklist
13. Third-Party Integrations
14. User Stories & Acceptance Criteria
15. Non-Functional Requirements
16. Testing Strategy
17. Scalability & Performance
18. Risk Analysis & Mitigation
19. Development Roadmap
20. Open Questions & Decisions
```

---

## **1. EXECUTIVE SUMMARY**

### **Product Vision**
Create the world's first comprehensive reverse marketplace where **buyers post their needs and sellers compete to fulfill them**, covering products, services, and jobs — transforming how people buy and sell everything. The platform is anchored by an AI chatbot as its primary interface (Jarvis-style conversational posting), not a form.

### **The Problem**
- Buyers waste hours searching across multiple platforms (Facebook, eBay, Craigslist, Thumbtack) for what they need
- No unified platform where you can post "I need this" and have sellers compete for your business
- Traditional marketplaces require buyers to actively hunt; reverse marketplace brings sellers to buyers
- Existing reverse marketplaces are limited: Thumbtack (services only), Upwork (freelancing only)
- No platform handles physical products, services, AND jobs in one place
- Trust issues plague all platforms: scams, no escrow, poor dispute resolution

### **The Solution**
A universal reverse marketplace platform with:
- 🔄 **Reverse Model**: Buyers post needs, sellers submit competitive offers
- 🤖 **AI-First Interface**: Jarvis-style AI chatbot is the primary posting mechanism for buyers and sellers — not a form, but a conversation
- 🎯 **All-in-One**: Products, services, and jobs — everything in one platform
- 💰 **Escrow Protection**: Money held securely until work/delivery complete
- 📸 **Before/After Photos**: Required evidence from both parties (prevents fraud)
- ✅ **Tiered Verification**: Budget-based requirements balance trust and accessibility
- 💵 **Buyer-Free Model**: Buyers pay zero platform fees on all transactions; sellers pay commission only on completed transactions
- 🆓 **Free Local Meetups**: Zero fees for local cash/carry product transactions (customer acquisition strategy)

### **Account Types**
Two distinct account types to separate individual sellers from business resellers:
- **Classic Account**: Individual buyers and sellers. Buy, sell, or both. Single-item posting with no inventory management. No EIN or sales tax certificate required.
- **Business Account**: For resellers and bulk sellers. Quantity management, inventory tracking, UPC barcode scanning, EIN and sales tax certificate required. Displays a storefront view.

### **Target Market**
- **Phase 1 (MVP)**: DFW Metroplex, Texas — Three Categories: Products, Services, and Jobs
  - Products: Local transactions FREE (no platform fees), shipped items via escrow
  - Services: All service subcategories — platform fee on completion
  - Jobs: Lead generation model — companies pay per qualified candidate lead
- **Phase 2**: Expand features + enhance categories in DFW (real-time messaging, advanced search, OAuth)
- **Phase 3**: Geographic expansion (Houston, Austin, San Antonio) + advanced categories (real estate, vehicles, inventory)

### **Competitive Advantage**
1. **Only platform** doing reverse marketplace across products, services, AND jobs (not just one vertical)
2. **AI chatbot as primary interface** — no competitor has this for a consumer marketplace
3. **Buyer-free model** — buyers never pay a platform fee, making adoption frictionless
4. **Before/after photo requirement** prevents scams (no competitor mandates this)
5. **Free local product transactions** drives user acquisition against Facebook Marketplace
6. **Three-day exclusivity system** creates urgency and protects buyer advantage
7. **Transparent seller-side fees only** (sustainable business model vs. Thumbtack's expensive seller-only leads)
8. **Local-first approach** builds network effects neighborhood by neighborhood

---

## **2. PROBLEM STATEMENT**

### **Current Pain Points**

#### **For Buyers:**
1. **Fragmented platforms** — Must search Facebook for products, Thumbtack for services, Indeed for jobs, Craigslist for everything (outdated)
2. **Time-consuming search** — Actively hunt for what they need instead of posting once
3. **No price competition** — See listed prices, can't solicit competitive bids
4. **Limited options** — Only see what's currently listed, miss unlisted inventory
5. **Trust issues** — Scams, fake listings, no recourse on Craigslist/Facebook
6. **No escrow protection** — Send money, hope for the best
7. **Hidden fees** — Quoted $200 for service, charged $500 after work starts
8. **Emergency situations** — Need help NOW, can't spend hours researching

#### **For Sellers:**
1. **Low visibility** — Compete with established players with big advertising budgets
2. **Passive waiting** — Must wait for buyers to find them
3. **High advertising costs** — Google Ads ($50-100/click), Thumbtack ($20-60/lead), Yelp ($400/month)
4. **No qualified leads** — Waste time on tire-kickers, scammers, price shoppers
5. **Platform fees eat margins** — Thumbtack charges per lead (not per hire), Upwork takes 20%
6. **Can't showcase quality** — Limited ways to display work quality online
7. **Competition based on price only** — Race to the bottom, can't differentiate on quality

### **Market Gaps**
- ✅ Services reverse marketplace exists (Thumbtack, Upwork) — but expensive and limited
- ❌ **No reverse marketplace for physical products** (consumer goods, electronics, furniture)
- ❌ **No reverse marketplace for B2B inventory** (bulk purchases, wholesale, liquidation)
- ❌ **No unified platform for products + services + jobs**
- ❌ **No platform with mandatory before/after photo evidence** (all are optional)
- ❌ **No platform with buyer-free fee model** for a full-category reverse marketplace
- ❌ **No platform with AI chatbot as primary posting interface**
- ❌ **No platform with true escrow** (most just authorize credit card, not separate account)

---

## **3. SOLUTION OVERVIEW**

### **Core Concept**
"The reverse Google of buying and selling — post what you need once through an AI conversation, let sellers compete for your business."

### **Universal Categories**

| Category | Transaction Type | Examples | Launch Phase |
|----------|-----------------|----------|--------------|
| **Products** | C2C, B2C | "Need a used MacBook Pro", "Looking for dining table", "Want iPhone 15" | **Phase 1 MVP** |
| **Services** | B2C, B2B | Plumbing, electrical, HVAC, cleaning, landscaping, moving, events, professional | **Phase 1 MVP** |
| **Jobs** | B2C, B2B | Lead generation: companies pay per qualified candidate lead | **Phase 1 MVP** |
| **Inventory (B2B)** | B2B | "Need 500 iPhone screens wholesale", "Restaurant equipment bulk buy" | Phase 2 |
| **Real Estate** | B2C | Lead generation only — not brokerage | Phase 3 (Coming Soon) |
| **Vehicles** | C2C, B2C | "Buying used trucks", Auto repair, detailing | Phase 1 (within Products) |

### **How It Works**

#### **For Buyers:**
```
1. Open the AI chat — describe what you need in plain English
   - Service: "Need bathroom sink repaired"
   - Product: "Looking for used MacBook Pro 16-inch"
   - Job: "Hiring part-time bookkeeper"

2. AI generates a structured post (title, description, category, budget, location)

3. Post goes live — receive up to 10 competitive offers (3-day exclusivity window)

4. Review offers (compare prices, ratings, portfolios)

5. Accept best offer

6. Pay (funds held in escrow for services/shipped; cash for local products)

7. Receive product/service

8. Approve & release payment (or raise dispute)

9. Rate seller/provider
```

#### **For Sellers:**
```
1. Create profile (business info, portfolio, credentials)

2. Browse buyer requests (feed matches your categories and location)
   - Auto-notified when matching posts appear within your radius
   
3. Submit competitive offer (max 10 per post; pay for additional batches)

4. Get selected

5. Complete work/deliver product

6. Upload completion evidence (before/after photos required for services)

7. Get paid after buyer approval (or auto-release)

8. Build 5-star reputation
```

### **Three-Day Exclusivity System**
When a buyer posts, they receive a **private 3-day window** where only they can see the offers coming in from sellers. After 3 days without acceptance, the post — along with its seller offers — becomes **publicly visible** to other buyers searching for the same thing. This creates:
- **Buyer benefit**: First-mover advantage; motivated to respond quickly
- **Seller benefit**: Posts with no buyer response surface to other potential buyers automatically
- **Platform benefit**: Creates urgency and reduces dead listings; enables a "for you" discovery feed for buyers who haven't posted

### **For-You Page / Discovery Feed**
Buyers can browse a feed of posts made by other buyers (after the 3-day window) and see the offers those buyers received from sellers. If a buyer sees an offer they like, they can connect with that seller directly. This is still reverse — the buyer is finding sellers through other buyers' listing history — not through a traditional seller catalog.

### **Offer Cap & Paid Overflow**
Each buyer post accepts a **maximum of 10 seller offers**. This prevents spam, ensures quality competition, and creates a monetization lever: sellers who want to offer beyond the cap (e.g., a business reseller blasting their inventory to many buyers) can pay for additional offer batches.

### **Budget Hidden from Sellers**
Buyer budget is used **only for matching purposes behind the scenes** — the algorithm matches buyers and sellers based on budget compatibility, but sellers never see the buyer's stated budget. This prevents price gouging and anchoring. Sellers compete based on their own pricing, not the buyer's ceiling.

### **Key Differentiators**

| Feature | Sorcyn | Thumbtack | Facebook Marketplace | eBay | Upwork |
|---------|--------|-----------|---------------------|------|--------|
| **Reverse model** | ✅ All categories | ✅ Services only | ❌ No | ⚠️ Auctions only | ✅ Freelance only |
| **AI chatbot interface** | ✅ Primary UX | ❌ No | ❌ No | ❌ No | ❌ No |
| **Buyer-free fees** | ✅ Always | ❌ Split | ✅ Yes | ❌ No | ❌ No |
| **All categories** | ✅ Products + Services + Jobs | ❌ Services | ⚠️ Products only | ⚠️ Products only | ❌ Freelance |
| **Escrow with photo evidence** | ✅ Required | ❌ No escrow | ❌ No | ⚠️ PayPal only | ⚠️ Optional |
| **Before/after photos** | ✅ Required | ❌ Optional | ❌ No | ⚠️ Listing only | ❌ No |
| **Free local transactions** | ✅ Products | ❌ No | ✅ Yes (no escrow) | ❌ No | ❌ No |
| **3-day exclusivity** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Classic/Business accounts** | ✅ Yes | ❌ No | ❌ No | ⚠️ Seller tiers | ❌ No |
---

## **4. MARKET OPPORTUNITY**

### **Market Size (TAM/SAM/SOM)**

**TAM (Total Addressable Market):**
- US e-commerce + services marketplace: **$1.5 trillion (2026)**
  - E-commerce: $1.2 trillion
  - Home services: $600 billion (subset)
  - Professional services: $450 billion
  - Job marketplace: $200 billion
- **Our TAM: $1.5 trillion**

**SAM (Serviceable Addressable Market):**
- Online marketplaces + local services (addressable by platform): **$150 billion**
  - Home services (online bookable): $50 billion
  - Consumer products (C2C + small B2C): $80 billion
  - Professional services (online): $20 billion

**SOM (Serviceable Obtainable Market):**
- **Year 1 (DFW, 3 categories):** $850 million market → target 0.5% capture = **$4.25M GMV** → platform revenue ~$297K
- **Year 2 (All categories in DFW):** $8.5 billion market → target 0.5% = **$42.5M GMV** → platform revenue ~$2.97M
- **Year 3 (Texas-wide):** $35 billion market → target 0.3% = **$105M GMV** → platform revenue ~$7.35M

**Unit Economics (10,000 users at full stride):**
- Gross monthly revenue: ~$56,740
- Monthly expenses (infrastructure + AI): ~$1,200–$2,000 (varies by AI model)
- Stripe fees (~87% of compute costs at scale) become primary cost driver
- Monthly net profit estimate: ~$47,000+

---

## **5. USER PERSONAS**

*(Unchanged from v2.1 — personas 1–6 remain accurate. See v2.1 for full persona definitions: Sarah Martinez, Miguel Rodriguez, Amanda Foster, James Chen, Linda Washington, Tyler Johnson.)*

---

## **6. PRODUCT GOALS & SUCCESS METRICS**

*(Unchanged from v2.1 — metrics framework, north star metric (Weekly Active Transactions), and all dashboard categories remain accurate. See v2.1 for full metric definitions.)*

---

## **7. SCOPE & PHASES (REVISED)**

### **⚠️ CRITICAL: MVP Strategy**

**Sorcyn launches with THREE umbrella categories in DFW:** Products, Services, and Jobs.

**The AI chatbot is the primary interface** — not a supplementary helper. Buyers and sellers interact with the platform as if talking to a Jarvis-style AI assistant. The AI generates structured posts from natural language. A manual form fallback exists for users who prefer it.

**Account types at launch:**
- **Classic**: Individual buyer/seller. No EIN, no inventory management. Single-item posts.
- **Business**: Reseller/bulk seller. Requires EIN + sales tax certificate. Inventory quantity management. Storefront view. UPC barcode scanning (Phase 2 refinement).

**Database architecture supports ALL future categories from Day 1.** Future categories display as "Coming Soon" in the UI. Zero schema changes needed when unlocking them.

---

### **Phase 1: MVP (Months 1–3) — "Prove the Model"**

**Timeline:** 12 weeks from kickoff to public launch  
**Target:** DFW Metroplex — Products, Services, Jobs  
**Screen count:** 43 screens (as documented in `docs/screen_hierarchy.md`)

#### **Included (MUST HAVE):**

- ✅ **Account Types**
  - **Classic Account**: Buy, sell, or both. Single-item posts. Legal first name display only. Toggle between buyer and seller views (like Uber driver/rider mode).
  - **Business Account**: Resellers/bulk sellers. EIN + sales tax certificate required at registration. Quantity management per listing (auto-reduces inventory on sale). Business storefront profile. Additional registration flow with "Continue" on account type selection (not direct "Create Account") to collect business details.

- ✅ **User registration & authentication** (email/password only; email verification as MFA)
  - Phone collected at registration; SMS verification deferred to Phase 2
  - OAuth (Google, Apple) deferred to Phase 2
  - Real legal first names only displayed publicly (no usernames)

- ✅ **AI-First Post Creation** (core MVP feature — primary UX)
  - Buyers describe what they need in natural language via AI chat → AI generates structured post (title, description, category, budget, location, timeline)
  - Manual form available as fallback (always free)
  - AI-assisted post creation is the default path; the form is secondary
  - AI pulls product images from the web for product requests (e.g., "iPhone 16 Pro Gold 256GB")
  - Post duration defaults to **30 days maximum** (reduced from 14 days in v2.1)
  - AI generates structured job seeker and company profiles for Jobs category

- ✅ **Budget field: buyer-visible only**
  - Budget is collected from the buyer for matching algorithm use only
  - Budget is **never shown to sellers** in any API response — strip field before sending to seller endpoints
  - Matching algorithm uses budget behind the scenes to surface relevant buyer posts to sellers

- ✅ **Three-Day Exclusivity Window**
  - When a buyer post first receives its first seller offer, a 3-day private window begins
  - During this window, only the original buyer sees the offers
  - After 3 days without buyer acceptance, the post and its offers become visible to other buyers searching for the same category/items
  - Other buyers can see expired/unaccepted offers and use them to find and contact sellers directly (shortcut discovery)
  - If buyer accepts within 3 days: post fills, offers stay private, transaction proceeds

- ✅ **Seller Offer Cap: Maximum 10 offers per post**
  - Seller posts can receive a maximum of 10 offers before the post stops showing in seller feeds
  - Sellers who want additional reach beyond 10 can pay for additional offer batches (promotes monetization)
  - Cap prevents spam and ensures buyers receive a manageable, quality-curated set of offers
  - First-come, first-served within the cap

- ✅ **Seller feed / "For You" page**
  - Sellers see buyer posts matching their categories, service radius, and verification tier
  - Matching algorithm uses buyer's hidden budget to determine which sellers see which posts
  - Auto-notification (push) when a matching buyer post appears within seller's radius

- ✅ **Buyer discovery feed (post-exclusivity)**
  - Buyers can browse posts from other buyers where the 3-day window has expired
  - Clicking a post shows which seller offers came in (but not the original buyer's identity or budget)
  - Buyer can connect with any of those sellers directly or make their own post
  - This is still reverse-marketplace behavior: buyer discovers sellers through other buyers' history

- ✅ **Offer submission**
  - Sellers submit quote, timeline, message, and portfolio attachments
  - Sellers do NOT see other sellers' offers
  - Sellers do NOT see buyer's stated budget
  - Counteroffers negotiated through messaging (no public bid wars)
  - When buyer accepts one offer, all other sellers notified: "Buyer has chosen to move on with a different candidate"

- ✅ **Escrow payment flow (Stripe Connect)**
  - Services: Buyer pays upfront → held in escrow → released after buyer approval (auto-release after 7 days)
  - Products (shipped): Escrow payment released upon buyer confirmation of receipt (auto-release 3 days after delivery)
  - Products (local pickup — cash): NO platform fees, NO payment processing, meet in public
  - Jobs: Companies pay per lead at time of lead delivery (not per hire)

- ✅ **Fee structure (CONFIRMED — Buyer Always Free)**
  - **Buyers: $0 platform fee on all transactions**
  - **Sellers: 5–10% commission on completed service transactions**
  - **Sellers: 5–8% commission on shipped product transactions**
  - **Sellers: 0% on local cash/pickup product transactions**
  - **Jobs: Per-lead fee charged to employers** ($10–$500 depending on role level)
  - Stripe processing fees (2.9% + $0.30) absorbed by seller — not shown to or charged to buyer
  - Rationale: buyer is creating value by posting; taxing them is counterproductive to adoption

- ✅ **Milestone-based payments** (no minimum threshold — available for any multi-stage project)

- ✅ **Before/after photos REQUIRED for ALL services**

- ✅ **Low-ball offer warning**
  - When a buyer submits an offer significantly below market value, a warning appears: "This offer is below the typical rate for this service. You may have difficulty finding qualified sellers."
  - Warning is advisory only — buyer can still submit

- ✅ **Local fraud prevention**
  - If a seller's registered address is outside the posted service radius by a meaningful distance, the system auto-flags or auto-converts the listing from "local" to "shipped"
  - Chat message filtering blocks sharing of addresses or phone numbers for local listings until after transaction is confirmed
  - Location-based radius check for local post eligibility at post creation

- ✅ **In-app messaging** (HTTP polling MVP; WebSocket Phase 2)
  - One continuous chat thread between any buyer-seller pair
  - Item/service-specific chats attached to that item's detail page
  - Context tagging for referencing specific projects/items
  - Offer details viewable within chat
  - Chat history preserved permanently
  - Profanity filter, external payment detection (Venmo, CashApp), phone/email blocking before transaction confirmation
  - Messaging tab in bottom navigation bar

- ✅ **Transaction approval/release**
  - Buyer approves work → funds released
  - 7-day auto-release for services if no response
  - 3-day auto-release for shipped products after delivery confirmation

- ✅ **Rating & review system**
  - 5-star rating + written review
  - Reviews linked to verified transactions
  - Auto 5-star review generated if no review submitted after 3-day reminder period
  - Reviews persist even if user deletes account (reviewer's name stays on reviews, NOT anonymized)

- ✅ **Post management**
  - Drafts: save for later, never expire, visible only to creator
  - Post duration: 30 days maximum
  - Renew post: Re-surface post to top of feeds (similar to Facebook Marketplace's renew)
  - Repost: Create new post with same details

- ✅ **Account deactivation & deletion** (per v2.1 policy)

- ✅ **Basic dispute resolution** (manual admin review in MVP)

- ✅ **Admin dashboard** (basic transaction monitoring, manual license/insurance verification)

- ✅ **iOS + Android apps** (Flutter)

- ✅ **Responsive web app**

- ✅ **Color scheme: White background, violet-purple primary accent**

- ✅ **"Coming Soon" display** for future categories (Real Estate, Inventory/Wholesale, etc.)

- ✅ **Location privacy**: Only radius/area displayed publicly, never exact address

- ✅ **Cold-start seed data strategy**
  - Before launch, generate 5,000–15,000 realistic buyer posts across 10–15 metros (not DFW-only)
  - Posts distributed across US zip codes in a believable density pattern (150–400 posts per metro; 400–1,500 per major category)
  - Seed posts are flagged internally (`is_seed: true`) to distinguish from real posts
  - Wind down seed posts gradually as real traction builds
  - Handle seller offers on seed posts carefully (redirect to nearest real buyer match or gracefully expire)

**Jobs Category (Lead Generation Model) — MVP:**
- Platform acts as lead navigator/generator — NOT a staffing agency
- Job seekers post resume, skills, experience, desired role, location, salary via AI chat
- Companies post job descriptions, requirements, salary via AI chat
- AI/ATS automatically matches candidates to jobs with percentage match scoring
- Companies see ranked match list (not spammed with every applicant)
- Batched notifications: daily digests of top matches (90%+)
- Employer verification via work email domain (not Gmail/personal)
- Lead pricing tiers:
  - Entry-level roles: $10–20 per lead
  - Mid-level roles: $30–50 per lead
  - Specialized/senior roles ($100K+ salary): $100–500 per lead

**UPC Barcode Scanning (Business Accounts — Phase 1 implementation, refinement in Phase 2):**
- Business account sellers can scan a product's UPC barcode via phone camera to auto-fill listing details
- System pulls product name, description, and cover photo from product database
- Seller **must** still add at least one real photo of their actual item — the pulled cover photo is the default cover only
- Submission is blocked until a real seller photo is added
- Applicable to popular/mainstream items; niche/white-label items require manual entry
- Manual form always available as fallback

**Explicitly OUT of MVP (Phase 2+):**
- ❌ OAuth login (Google, Apple)
- ❌ SMS phone verification (phone collected but verification deferred)
- ❌ Automated dispute resolution
- ❌ Real-time WebSocket messaging (HTTP polling sufficient)
- ❌ Advanced search/filters (basic search + sort only)
- ❌ Saved searches & alerts
- ❌ EIN/license API verification (manual admin review in MVP)
- ❌ Subscription tiers for sellers
- ❌ Advanced analytics
- ❌ Authenticity verification for collectibles
- ❌ Third-party financing integration (Affirm, Klarna)
- ❌ Interstate/long-distance moving (FMCSA broker regulations)
- ❌ Real estate category (Coming Soon — lead gen only, needs attorney review)
- ❌ Inventory/wholesale B2B (Phase 2)
- ❌ Seller promotions / sponsored placement feature (deferred until sufficient user base)

---

### **Phase 2: Enhanced Platform (Months 4–6) — "Scale & Optimize"**

- ✅ Real-time messaging (WebSocket via Socket.IO) with typing indicators
- ✅ Advanced search with Elasticsearch (fuzzy matching, faceted search)
- ✅ Saved searches with notifications
- ✅ OAuth login (Google, Apple)
- ✅ SMS phone verification (Twilio — enabled as revenue justifies cost)
- ✅ EIN & license verification APIs (Signzy or Middesk)
- ✅ Stripe Identity for ID verification
- ✅ Improved dispute system with AI photo comparison
- ✅ Shipping integration (ShipStation or similar)
- ✅ Inventory/Wholesale (B2B) category
- ✅ Subscription tiers for sellers (Basic/Premium/Elite)
- ✅ Seller analytics dashboard (win rate, earnings trends, response time)
- ✅ Referral program ($10 credit for buyer referral, $50 credit for seller referral after first job)
- ✅ **Seller promotions scaffold** — seller-side paid promotion feature (priority placement, sponsored listings, pay-per-reach model — introduced only after marketplace has competitive seller density)
- ✅ Instant payout option (1% fee, 15-minute arrival) for Tier 2+ sellers

---

### **Phase 3: Advanced Platform (Months 7–12) — "Complete Marketplace"**

- ✅ Real estate category (lead generation only — attorney review required before launch)
- ✅ Junk/Unwanted Items category
- ✅ Interstate/Long-Distance Moving (pending FMCSA research)
- ✅ Video consultations for estimates
- ✅ Real-time job tracking (On the Way → Started → Complete)
- ✅ Geographic expansion: Houston (Month 8), Austin (Month 10), San Antonio (Month 11)
- ✅ Advanced fraud detection (ML model, device fingerprinting)
- ✅ Insurance partnerships (on-demand liability insurance for sellers)
- ✅ Financing options (Affirm, Klarna for high-value items)
- ✅ White-label API for enterprise partners
- ✅ Multi-language support (Spanish)
- ✅ SOC 2 Type II compliance

---

### **Staffing Plan**

- **0–5,000 users**: Faisal (engineering) + partner (business development & client relations). AI chatbot handles most customer support queries. ~5–10 support tickets/day.
- **5,000–15,000 users**: Hire first trust & safety / dispute resolution staff member. This is the non-negotiable first hire — the platform cannot scale without human intervention for disputes at this volume.
- **15,000–30,000 users**: Small full team (engineering, support, marketing).
- **30,000+ users**: Full organization, potential overseas support staff for tier-1 customer service.

---

## **8. FUNCTIONAL REQUIREMENTS (DETAILED)**

---

### **8.1 USER MANAGEMENT**

#### **FR-UM-001: User Registration**

**Description:** Users register via email/password. Two account types available at registration. Email verification serves as MFA. OAuth and SMS verification deferred to Phase 2.

**Account Types:**

| Account Type | Who It's For | Requirements | Key Capabilities |
|---|---|---|---|
| **Classic** | Individual buyers, individual sellers, casual resellers | Email + phone (verified later), profile photo | Buy, sell, or both; single-item posts; toggle between buyer/seller views |
| **Business** | Resellers, bulk sellers, stores | All Classic requirements + EIN + sales tax certificate upload | Quantity management per listing, inventory auto-reduction on sale, UPC barcode scanning, storefront profile |

**Classic Account Registration Flow:**
- User selects account purpose: Buy, Sell, or Both
- If Sell or Both: secondary question appears — "Are you an individual seller or a business reseller?"
  - **Individual seller → Classic**: Continues to standard registration form
  - **Business reseller → Business**: Button changes to "Continue" (not "Create Account"); additional business info collected (business name, EIN, sales tax certificate upload)
- Both account types share the same login; role/view is toggled within the app (buyer view ↔ seller view)

**Requirements:**
- SHALL support email + password registration
- SHALL collect: first name (legal), last name (legal), email, phone, location (city/zip), account type
- SHALL display only legal first name publicly (no usernames or handles)
- SHALL require email verification before posting or offering
- SHALL collect phone number at registration but defer SMS verification to Phase 2
- SHALL enforce password requirements (8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)
- SHALL validate email format (RFC 5322)
- SHALL validate phone format (E.164)
- SHALL rate limit registration: 3 attempts per IP per hour
- SHALL block disposable email domains
- Business accounts SHALL require EIN upload and sales tax certificate before seller profile is active
- SHALL log all registration attempts with IP, timestamp, user agent

---

#### **FR-UM-008: Seller Profile Creation**

**Classic Seller Profile:**
- Profile photo (required)
- Business name (optional for individuals)
- Bio/description (max 500 chars)
- Years of experience
- Service/product categories (multi-select)
- Service area (location + radius: 5, 10, 15, 25, 50 miles)
- License upload (optional — earns "Licensed" badge if verified)
- Insurance certificate upload (optional — earns "Insured" badge)
- Portfolio photos

**Business Account Seller Profile (additional fields):**
- Business name (required)
- Business type (LLC, Corporation, Sole Proprietor)
- EIN number (required — verified manually in MVP, via API in Phase 2)
- Sales tax certificate (required upload)
- Inventory management: quantity per listing, auto-reduces on sale
- Return policy
- Bulk pricing tiers (optional)
- Storefront view: displays all active listings organized by category
- UPC barcode scanning enabled for product listings

**Business Account — UPC Barcode Scanning:**
- Business sellers see a "Scan Barcode" button on the create listing screen
- Camera opens; seller scans UPC on product packaging
- System fetches product name, description, and default cover image from product database
- Default cover image auto-populates as listing cover
- Seller must add at least one real photo of their actual item before submission is enabled
- All other fields (price, condition, quantity) remain editable
- Falls back to manual entry for unrecognized barcodes

---

### **8.2 BUYER JOURNEY**

#### **FR-BUY-001: Create Post (AI-First — Primary Path)**

**Description:** The AI chatbot is the default and primary mechanism for creating a buyer post. The manual form is a secondary fallback. Both paths produce identical structured post data.

**AI Chat Path (Default):**
1. Buyer opens "Create Post" — lands on AI chat interface (not a form)
2. AI greets buyer: "What are you looking for? Describe it like you'd tell a friend."
3. Buyer types in natural language (e.g., "I need a plumber to fix a leaking sink under my kitchen cabinet, I'm in Fort Worth, and I'd like it done this week for around $150-250")
4. AI parses the description and generates a structured post preview:
   - **Title**: Kitchen Sink Leak Repair Needed
   - **Category**: Home Services > Plumbing
   - **Description**: [AI-generated from buyer's natural language]
   - **Budget**: $150–$250 *(stored for matching; will NOT be shown to sellers)*
   - **Location**: Fort Worth, TX *(auto-detected or confirmed)*
   - **Timeline**: Within 1 week
5. Buyer reviews the AI-generated preview with an "Edit Details" button if anything is off
6. Buyer clicks "Post Now" → post goes live
7. For product posts: AI also pulls a product image from the web to use as the default cover (buyer must still confirm or replace with their own photo)

**Manual Form Path (Fallback):**
- Available as alternative if buyer prefers to fill fields manually
- Always free (no charge for manual vs. AI path)
- Identical fields to AI-generated post
- Explicitly positioned as "Prefer to fill it out yourself?" secondary option

**Post Duration:** Default 30 days maximum. Buyer can choose shorter duration. Renew option available to re-surface post before expiry.

**Budget field behavior:**
- Collected from buyer during post creation
- Stored in database
- Used by matching algorithm to surface relevant seller posts
- **Never returned in any API response sent to sellers** (stripped at the API layer)
- Shown only to the buyer in their own post management view

**Requirements:**
- SHALL collect universal fields: title, description, category, subcategory, budget (min/max or open), location, photos/videos (up to 10, 5MB each), timeline/urgency, seller requirements, post duration
- SHALL auto-detect location if GPS permission granted
- SHALL save draft automatically every 30 seconds (drafts never expire)
- SHALL display estimated number of potential sellers in area before posting
- SHALL show estimated market rate guidance for category (Phase 2 for full guidance; basic placeholder in MVP)
- SHALL send notifications to matching sellers within 60 seconds of post going live
- SHALL allow editing post only if no offers have been received yet
- Buyers can have max 10 active posts simultaneously

**Post Status Flow:**
```
Draft → Active → Filled (offer accepted) → Completed (transaction done)
                ↓
            Expired (30 days, no acceptance)
                ↓
            Cancelled (buyer cancelled)
```

---

#### **FR-BUY-002: Three-Day Exclusivity Window**

**Description:** Buyer posts receive a private exclusivity window when the first seller offer arrives.

**Behavior:**
- When a seller submits the first offer on a buyer's post, a **3-day timer begins**
- During the 3-day window: only the original buyer can see the offers
- The post itself is visible in seller feeds (sellers can still submit offers up to the 10-offer cap)
- After 3 days WITHOUT acceptance:
  - The post and its accumulated seller offers become **publicly visible** to other buyers
  - Other buyers can see seller offers from this post and contact those sellers directly
  - The original buyer loses exclusive access — if they want to re-engage, they renew the post
- After acceptance (within 3 days): post fills, transaction begins, exclusivity is maintained permanently (no public disclosure)

**Post-Exclusivity Discovery:**
- Other buyers searching for similar items see a "Available Sellers" section populated by expired/unaccepted offers from similar posts
- Buyer sees: seller name, rating, service offered, approximate price range — but NOT the original buyer's identity or budget
- Clicking a seller offer shows that seller's profile and allows the buyer to reach out or create their own post targeting that seller

**API Behavior:**
- `exclusivity_expires_at` field stored on post when first offer received
- After expiry: `GET /api/v1/posts/{post_id}` returns offers to any authenticated user
- Before expiry: offers visible only to `post.buyer_id`

---

#### **FR-BUY-003 through FR-BUY-007:** *(View & Compare Offers, Accept Offer, Transaction Monitoring, Transaction Completion, Rating & Review — unchanged from v2.1 except for the following modifications)*

**Modifications from v2.1:**

**FR-BUY-003 (View & Compare Offers):**
- Sellers' offer cards do NOT display the buyer's budget anywhere
- "Best Match" algorithm remains: price (30%), rating (40%), distance (15%), response time (10%), completion rate (5%)

**FR-BUY-004 (Accept Offer & Initiate Transaction) — Fee Structure Update:**
```javascript
// CONFIRMED FEE STRUCTURE (v2.2)
// Buyers pay ZERO platform fees on all transaction types
// Sellers pay commission on completed transactions only

function calculateTransactionFees(amount, transactionType) {
  const STRIPE_FEE_PERCENT = 0.029;
  const STRIPE_FEE_FIXED = 0.30;

  if (transactionType === 'product_local_cash') {
    return { amount, buyerFee: 0, stripeFee: 0, totalCharged: amount,
             sellerFee: 0, sellerPayout: amount, platformNet: 0 };
  }

  let sellerFeePercent;
  if (transactionType === 'service') sellerFeePercent = 0.08; // 8% (5–10% range, 8% default)
  else if (transactionType === 'product_shipped') sellerFeePercent = 0.07; // 7% (5–8% range, 7% default)
  else if (transactionType === 'product_local_platform') sellerFeePercent = 0.05;
  
  const buyerTotal = amount; // Buyer pays face value — zero platform fee
  const stripeFee = (amount * STRIPE_FEE_PERCENT) + STRIPE_FEE_FIXED;
  const sellerFee = amount * sellerFeePercent;
  const sellerPayout = amount - sellerFee - stripeFee;
  
  return {
    amount,
    buyerFee: 0,            // Always zero
    totalCharged: amount,   // Buyer pays exactly the quote
    stripeFee: parseFloat(stripeFee.toFixed(2)),
    sellerFee: parseFloat(sellerFee.toFixed(2)),
    sellerPayout: parseFloat(sellerPayout.toFixed(2)),
    platformNet: parseFloat(sellerFee.toFixed(2)) // Platform keeps seller fee minus Stripe cost
  };
}

// Example: Service $250
// Buyer pays: $250 (no additional fee)
// Stripe takes: $7.55 (2.9% + $0.30)
// Platform fee: $20.00 (8%)
// Seller receives: $222.45

// Example: Shipped product $1,650  
// Buyer pays: $1,650 (no additional fee)
// Stripe takes: $48.15 (2.9% + $0.30)
// Platform fee: $115.50 (7%)
// Seller receives: $1,486.35

// Example: Local cash $300
// Buyer pays: $300 cash directly to seller
// Platform fee: $0
// Seller keeps: $300
```

**Cost breakdown shown to buyer at checkout:**
```
Your quote:          $250.00
Platform fee:          $0.00  ✅ Free for buyers
Total you pay:       $250.00
```

**Cost breakdown shown to seller when submitting offer:**
```
Your quote:          $250.00
Platform fee (8%):   -$20.00
Stripe processing:    -$7.55
Your estimated payout: $222.45
```

---

### **8.3 SELLER JOURNEY**

#### **FR-SEL-001: Browse Buyer Requests (Seller Feed)**

**Description:** Sellers see a curated feed of buyer posts matching their categories, service radius, and account type. Budget is hidden throughout.

**Feed behavior:**
- Matching algorithm factors: seller's declared categories, service radius, verification tier, and (invisibly) compatibility between seller's typical pricing and buyer's hidden budget
- Sellers never see budget ranges on post cards or post detail pages
- Competition level displayed (🟢 Low 0–2 offers / 🟡 Medium 3–5 / 🔴 High 6–10)
- Posts at the offer cap (10 offers) are hidden from the feed unless seller has purchased an additional batch

**Low-ball detection:**
- When a seller submits an offer significantly below the typical market rate for that category/location, an advisory warning appears before submission
- Warning is informational only — seller can still submit

---

#### **FR-SEL-003: Submit Offer — Offer Cap & Paid Batches**

**Requirements:**
- Each buyer post accepts a **maximum of 10 seller offers** (stored in `offer_count` on the post)
- Once `offer_count = 10`, the post is hidden from seller feeds
- Sellers who want to offer beyond the cap can purchase additional **offer batches** through the app (e.g., pay $X to unlock access to posts where they've been blocked by the cap)
- Alternatively: Business sellers can pay for a batch to blast their inventory post to additional buyers (same mechanic in reverse)
- Batch pricing TBD based on category and market conditions
- A seller cannot submit a duplicate offer on the same post (one offer per seller per post)
- Can edit offer anytime before buyer accepts
- Can withdraw offer before buyer accepts (silent removal — no buyer notification)
- Cannot re-submit after withdrawal on same post (24-hour cooldown)

**Earnings calculator (seller view — no budget shown):**
```
Your Quote:        $250.00
Platform Fee (8%): -$20.00
Stripe:             -$7.55
Your Payout:       $222.45

Buyer pays:        $250.00 (they pay no extra fees)
```

---

#### **FR-SEL-004 through FR-SEL-006:** *(Manage Offers, Transaction Execution, Receive Payment — unchanged from v2.1 except fee calculations now use buyer-free model above)*

---

### **8.4 MESSAGING SYSTEM**

*(Unchanged from v2.1 — see v2.1 for full spec)*

**Key addition from sessions:**
- Chat for local product transactions: system blocks sharing of full addresses or phone numbers until after transaction has been confirmed through the platform (prevents off-platform meetup fraud)
- Address/phone sharing in chat is radius-checked: if shared location is outside the declared local radius, the message is blocked and both parties are warned

---

### **8.5 PAYMENT SYSTEM**

#### **FR-PAY-001: Stripe Connect Escrow Flow — Updated Fee Model**

**Confirmed fee structure (v2.2):**

| Transaction Type | Buyer Fee | Seller Fee | Notes |
|---|---|---|---|
| **Service (any)** | $0 | 5–10% (default 8%) | Stripe fees absorbed by seller |
| **Product — shipped** | $0 | 5–8% (default 7%) | Stripe fees absorbed by seller |
| **Product — local cash** | $0 | 0% | No platform involvement in payment |
| **Product — local through platform** | $0 | 3–5% | Reduced rate for in-person platform-mediated |
| **Jobs (lead gen)** | N/A | Per-lead fee to employer: $10–$500 | Charged at lead delivery |

**What buyers see at checkout:**
- The exact quote amount from the seller
- No platform fee line item (because it's $0)
- No Stripe processing fee line item (because it's $0 for buyers)
- Total = quote amount exactly

**What sellers see when submitting offer:**
- Their quoted amount
- Platform fee percentage and dollar amount
- Stripe processing estimate
- Estimated payout

**Stripe setup:**
- Stripe absorbs from seller payout: processing fee (2.9% + $0.30)
- Platform keeps seller fee
- Net platform revenue = seller fee − Stripe cost
- Seller receives: quote − seller fee − Stripe fee

**Auto-release timers (unchanged from v2.1):**
- Services: 7 days after marked complete
- Shipped products: 3 days after delivery
- Local platform: 1 hour after QR scan
- Jobs milestones: 5 days per milestone

---

### **8.6 REVIEW & RATING SYSTEM**

*(Unchanged from v2.1 — auto 5-star after 3-day reminder period, immutable reviews, category-specific ratings all remain as specified)*

---

### **8.7 DISPUTE RESOLUTION SYSTEM**

*(Unchanged from v2.1 — Tier 1 AI auto-resolve, Tier 2 human review, Tier 3 arbitration structure all remain as specified)*

---

### **8.8 SEARCH & DISCOVERY SYSTEM**

*(Unchanged from v2.1 — PostgreSQL full-text search for MVP, Elasticsearch Phase 2. Post-exclusivity discovery feed described in FR-BUY-002 above adds a new buyer discovery layer.)*

---

### **8.9 SELLER PROMOTIONS (DEFERRED — Phase 2+)**

**Description:** A paid promotion feature for sellers to gain priority placement in buyer feeds. Deferred until the marketplace has sufficient seller density to justify competitive placement.

**Planned mechanics:**
- Sellers can pay to "promote" their profile/offer response in relevant buyer feeds
- Promotion model: pay-per-buyer-reach (e.g., $200 reaches 50 targeted buyers)
- Priority placement: higher-paying promotions rank above lower-paying in buyer feeds, within the same category and radius
- Time-limited promotions (seller defines duration)
- Sellers can also promote specific offers during live transactions (e.g., "20% off IT support this week")
- Promoted content clearly labeled as "Sponsored" in buyer feeds
- Not launched until platform has 5,000+ active sellers in a category — premature promotion with few sellers creates a bad buyer experience

---

## **9. TECHNICAL ARCHITECTURE**

*(Unchanged from v2.1 — full architecture diagram, technology stack, Node.js recommendation, DigitalOcean hosting recommendation, CI/CD pipeline, monitoring setup all remain as specified.)*

**Key infrastructure decisions confirmed in sessions:**
- **Cloudflare R2** for all media storage (offloaded from Supabase from Day 1 to avoid Pro storage overage at scale). Photo URLs stored in Supabase; actual files in R2 at ~$0.021/GB/month.
- **Supabase Pro** for database ($75/month base). R2 offloading keeps storage well within limits.
- **AI chatbot**: Start with **Gemini Flash-Lite** or **GPT-4o mini** (cost-efficient for structured listing generation — no deep reasoning required). Switch to higher-quality model if output quality is insufficient. Cost estimate: $72–$112/month at 10,000 users; up to ~$500–$840/month with heavier usage or premium models.
- **Meilisearch** noted as search infrastructure option for Phase 1/2 (implementation status pending audit).

---

## **10. DATABASE SCHEMA**

*(All tables from v2.1 remain. The following changes and additions apply.)*

### **10.1 Updated: `users` table**

New field:
```sql
account_type VARCHAR(20) NOT NULL DEFAULT 'classic' 
  CHECK (account_type IN ('classic', 'business')),
```

### **10.2 Updated: `seller_profiles` table**

New fields for Business accounts:
```sql
-- Business account fields
is_business_account BOOLEAN DEFAULT FALSE,
ein_number VARCHAR(20),                    -- Encrypted at rest
ein_verified BOOLEAN DEFAULT FALSE,
sales_tax_certificate_url TEXT,           -- Stored in R2/S3
sales_tax_verified BOOLEAN DEFAULT FALSE,
business_type VARCHAR(50)                  -- LLC, Corporation, Sole Proprietor

-- Inventory management (Business accounts only)
inventory_management_enabled BOOLEAN DEFAULT FALSE,
```

### **10.3 Updated: `posts` table**

New fields:
```sql
-- Budget is stored but stripped from seller-facing API responses
budget_min DECIMAL(10,2),
budget_max DECIMAL(10,2),
budget_open BOOLEAN DEFAULT FALSE,

-- Three-day exclusivity
first_offer_at TIMESTAMP,                 -- Set when first offer received
exclusivity_expires_at TIMESTAMP,         -- first_offer_at + 3 days
is_public_discovery BOOLEAN DEFAULT FALSE, -- Set to TRUE after exclusivity expires

-- Post management
expires_at TIMESTAMP,                     -- 30 days from created_at by default
renewed_at TIMESTAMP,                     -- Last renewal timestamp
renewal_count INT DEFAULT 0,

-- Offer cap enforcement
offer_count INT DEFAULT 0,               -- Incremented on each offer; max 10
offer_cap INT DEFAULT 10,

-- Cold-start seed data
is_seed BOOLEAN DEFAULT FALSE,           -- TRUE for pre-launch seeded posts

-- Search vector (unchanged)
search_vector TSVECTOR
```

**Post creation trigger — auto-set expiry:**
```sql
CREATE OR REPLACE FUNCTION set_post_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_expiry_trigger
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION set_post_expiry();
```

**Exclusivity trigger — set when first offer arrives:**
```sql
CREATE OR REPLACE FUNCTION set_exclusivity_window()
RETURNS TRIGGER AS $$
BEGIN
  -- When offer_count goes from 0 to 1, start the exclusivity window
  IF OLD.offer_count = 0 AND NEW.offer_count = 1 THEN
    NEW.first_offer_at := NOW();
    NEW.exclusivity_expires_at := NOW() + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exclusivity_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  WHEN (OLD.offer_count IS DISTINCT FROM NEW.offer_count)
  EXECUTE FUNCTION set_exclusivity_window();
```

**Cron job — flip posts to public discovery after exclusivity expires:**
```sql
-- Run every hour
UPDATE posts
SET is_public_discovery = TRUE
WHERE exclusivity_expires_at < NOW()
  AND is_public_discovery = FALSE
  AND status = 'active'
  AND offer_count > 0;
```

### **10.4 Updated: `offers` table**

New fields:
```sql
-- Offer visibility controlled by post exclusivity
-- No changes to offer table itself; visibility gated at API layer by post.is_public_discovery
```

**API-layer budget stripping (enforced on all seller-facing endpoints):**
```javascript
// Middleware: strip budget from posts before returning to non-owner sellers
function stripBudgetForSellers(post, requestingUserId) {
  if (post.buyer_id !== requestingUserId) {
    const { budget_min, budget_max, budget_open, ...sanitized } = post;
    return sanitized;
  }
  return post; // Buyer sees their own budget
}
```

### **10.5 New: `offer_batches` table (Business accounts / paid overflow)**

```sql
CREATE TABLE offer_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(seller_id),
  batch_type VARCHAR(50) CHECK (batch_type IN ('overflow_cap', 'bulk_blast')),
  posts_unlocked INT DEFAULT 0,     -- Number of additional post slots purchased
  amount_paid DECIMAL(10,2),
  stripe_charge_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP             -- Batch slots expire if unused
);
```

### **10.6 Unchanged tables from v2.1:**
- `categories` — no changes (all categories pre-seeded, enabled_in_mvp flag controls UI)
- `transactions` — no changes (fee amounts updated in application logic)
- `reviews` — no changes
- `conversations` / `messages` — no changes (+ local fraud prevention logic in application layer)
- `disputes` — no changes
- `payouts` — no changes (fee model updated in application logic)
- `notifications` — no changes
- `verification_requests` — no changes (Business account adds `ein` and `sales_tax` to verification_type enum)
- `audit_logs` — no changes

### **10.7 Updated: `verification_requests` table**

Updated constraint:
```sql
verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN (
  'id', 'ein', 'sales_tax', 'license', 'insurance', 'background_check'
)),
```

---

## **11. API SPECIFICATIONS (COMPLETE)**

*(All endpoints from v2.1 remain. The following changes apply.)*

### **11.1 Updated: POST /api/v1/posts**

**Request body — new fields:**
```json
{
  "post_duration_days": 30,
  "budget_min": 150,
  "budget_max": 250
}
```

**Response — budget included (buyer view only):**
```json
{
  "success": true,
  "post": {
    "post_id": "post_abc123",
    "status": "active",
    "expires_at": "2026-06-01T00:00:00Z",
    "exclusivity_expires_at": null,
    "is_public_discovery": false,
    "offer_count": 0,
    "offer_cap": 10
  }
}
```

### **11.2 Updated: GET /api/v1/posts/feed (Seller feed)**

Budget fields stripped from all posts in this response. Middleware enforced.

### **11.3 Updated: GET /api/v1/posts/{post_id} (Seller view)**

- If `requesting_user_id !== post.buyer_id`: budget fields stripped
- If `post.exclusivity_expires_at > NOW()` and `requesting_user_id !== post.buyer_id`: offers array returned as empty `[]` (exclusivity active)
- If `post.is_public_discovery = TRUE` or `requesting_user_id === post.buyer_id`: full offers returned

### **11.4 New: GET /api/v1/posts/discovery**

Public discovery feed — posts past exclusivity window, for buyer browsing.

```
GET /api/v1/posts/discovery?category=home_services&subcategory=plumbing&location=Dallas,TX&radius_miles=25&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "post_id": "post_xyz789",
      "category": "home_services",
      "subcategory": "plumbing",
      "title": "Bathroom sink leak repair",
      "location": { "city": "Dallas", "state": "TX" },
      "offer_count": 4,
      "expired_offers_available": true,
      "sellers_available": [
        {
          "seller_id": "sel_abc",
          "name": "Miguel R.",
          "rating": 4.8,
          "service": "Plumbing repair",
          "approximate_price_range": "$150–$300",
          "badges": ["licensed", "insured"]
        }
      ]
    }
  ]
}
```

**Note:** Budget is never included in discovery feed responses.

### **11.5 Updated: POST /api/v1/offers**

**Offer cap enforcement:**
```javascript
// Before accepting offer submission
const post = await db.posts.findById(postId);
if (post.offer_count >= post.offer_cap) {
  return res.status(409).json({
    success: false,
    error: {
      title: "Offer Cap Reached",
      status: 409,
      detail: "This post has reached its maximum offer limit. You can purchase an offer batch to continue."
    }
  });
}
```

### **11.6 New: POST /api/v1/offer-batches**

Purchase additional offer batch.

**Request:**
```json
{
  "batch_type": "overflow_cap",
  "quantity": 10,
  "payment_method_id": "pm_stripe_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "batch": {
    "batch_id": "batch_abc123",
    "posts_unlocked": 10,
    "expires_at": "2026-06-15T00:00:00Z",
    "amount_paid": 9.99
  }
}
```

### **11.7 Updated: POST /api/v1/auth/register**

**Request body — account type:**
```json
{
  "account_type": "classic",
  "first_name": "Faisal",
  "last_name": "Idris",
  "email": "faisal@example.com",
  "password": "SecurePass123!",
  "phone": "+18175551234",
  "zip_code": "76101",
  "accept_terms": true,
  "accept_privacy": true
}
```

For Business accounts, additional fields required:
```json
{
  "account_type": "business",
  "business_name": "DFW Tech Resale LLC",
  "business_type": "llc",
  "ein_number": "XX-XXXXXXX",
  "sales_tax_certificate_url": "https://r2.example.com/uploads/cert.pdf"
}
```

---

## **12. SECURITY CHECKLIST**

*(Unchanged from v2.1 — all security requirements remain. See v2.1 Section 12 for full checklist.)*

**Additional notes from sessions:**
- Budget field must be stripped at the API middleware layer — not just omitted in documentation. Treat it like a PII field for seller-facing endpoints.
- Local transaction fraud: address-sharing and phone-sharing in chat are blocked by regex/NLP filters until transaction is confirmed. Out-of-radius address detection triggers an auto-flag.

---

## **13. THIRD-PARTY INTEGRATIONS**

*(Unchanged from v2.1 — Stripe Connect, Twilio, SendGrid, Firebase, Google Maps, AWS S3/Cloudflare R2, Cloudinary, Stripe Identity, Signzy/Middesk, OpenAI all remain as specified.)*

**AI Model recommendation (confirmed in sessions):**
- **Primary**: Gemini Flash-Lite or GPT-4o mini (cost-efficient for structured listing generation)
- **Fallback/upgrade**: Claude Haiku if quality requires it
- Model is swappable with ~2 lines of code — design for provider-agnostic AI layer
- Cost at 10,000 users: $72–$112/month (Gemini), $85–$112/month (Claude Haiku), up to $500–$840/month with heavier usage

---

## **14. USER STORIES & ACCEPTANCE CRITERIA**

*(All user stories from v2.1 remain. The following are added or updated.)*

#### **US-B-008: Post via AI Chat (Primary Path)**
**As a** buyer  
**I want to** describe what I need in plain language  
**So that** the AI creates a structured post for me without filling out a form

**Acceptance Criteria:**
- ✅ AI chat is the default landing experience for "Create Post"
- ✅ Buyer can type in natural language and receive a structured preview within 3 seconds
- ✅ Preview shows all fields: title, description, category, budget, location, timeline
- ✅ Buyer can edit any field in the preview before posting
- ✅ "Post Now" publishes the post within 2 seconds
- ✅ For products: AI pulls web image as cover; buyer must confirm or replace with own photo
- ✅ Manual form accessible as secondary option with "Prefer to fill it out yourself?" link
- ✅ Budget confirmed as stored and used for matching but never shown to sellers

---

#### **US-B-009: Three-Day Exclusivity**
**As a** buyer  
**I want to** have 3 days of exclusive access to seller offers before others can see them  
**So that** I have first-mover advantage on the best offers

**Acceptance Criteria:**
- ✅ When first offer arrives, `exclusivity_expires_at` is set to `first_offer_at + 3 days`
- ✅ Other users' GET requests for this post's offers return empty during the window
- ✅ After 3 days, `is_public_discovery` flips to TRUE automatically
- ✅ Buyer receives push notification: "Your 3-day exclusive window is expiring in 24 hours"
- ✅ Post and offers now visible to other buyers in discovery feed

---

#### **US-S-008: Offer Cap & Paid Batches**
**As a** seller  
**I want to** understand the offer limit and have a way to reach more buyers  
**So that** I can maximize my selling opportunities

**Acceptance Criteria:**
- ✅ Feed hides posts that have reached 10 offers
- ✅ Seller sees clear messaging: "This post is at capacity — purchase a batch to offer"
- ✅ Paid batch purchase flow completes via Stripe within 3 seconds
- ✅ After batch purchase, seller can submit offer on cap-locked posts
- ✅ Batch slots tracked and expire at defined `expires_at`

---

#### **US-C-001: Classic vs. Business Account Selection**
**As a** new user registering as a seller  
**I want to** choose the right account type for my situation  
**So that** I get the right feature set

**Acceptance Criteria:**
- ✅ After selecting "Sell" or "Both" on account type screen, a secondary prompt appears
- ✅ "Individual seller" → Classic account → Standard registration
- ✅ "Business reseller" → Business account → Additional fields (EIN, sales tax cert)
- ✅ "Continue" button shown (not "Create Account") until all business fields are filled
- ✅ Business account cannot post listings until EIN and sales tax certificate are uploaded and pending verification
- ✅ Classic accounts can upgrade to Business from settings later

---

## **15. NON-FUNCTIONAL REQUIREMENTS**

*(Unchanged from v2.1 — all performance, scalability, reliability, usability, and security NFRs remain as specified.)*

---

## **16. TESTING STRATEGY**

*(Unchanged from v2.1)*

---

## **17. SCALABILITY & PERFORMANCE**

*(Unchanged from v2.1)*

---

## **18. RISK ANALYSIS & MITIGATION**

*(All risks from v2.1 remain. The following updates apply.)*

**RISK-T-005 (New): Budget Field Exposure**  
**Risk:** Seller-facing API inadvertently returns buyer budget, enabling price anchoring/gouging.  
**Likelihood:** Medium (easy to miss in new endpoint development)  
**Impact:** High (undermines competitive pricing model)  
**Mitigation:**
- Budget stripping implemented as API middleware (not per-endpoint)
- Automated test suite includes budget-exposure tests for all seller-facing endpoints
- Code review checklist item: "Does this endpoint expose budget to non-owner?"

**RISK-T-006 (New): Offer Cap Gaming**  
**Risk:** Sellers create multiple accounts to submit more than 10 offers per post.  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Offer cap enforced per `seller_id`, not per account
- Duplicate offer detection checks same seller submitting via multiple profiles linked to same phone/email
- Rate limiting on offer submission per IP

**RISK-B-006 (New): Seed Data Exposure**  
**Risk:** Users discover that pre-launch buyer posts are seeded (fake), damaging trust.  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Seed posts internally flagged (`is_seed: true`) but never exposed in API responses
- Seed posts are written to be indistinguishable from real posts (realistic language, varied zip codes, realistic budgets)
- Seed posts are wound down gradually as real posts replace them
- If real seller offers arrive on seed posts, they are gracefully redirected to real buyer matches or allowed to expire naturally

---

## **19. DEVELOPMENT ROADMAP**

*(Unchanged from v2.1 — Phases 1–4 timeline and milestone structure remain. See Section 7 for detailed Phase 1 scope, which supersedes v2.1 Section 7.)*

**Current state (as of May 2026):**
- Backend: meaningful number of APIs completed; comprehensive backend audit in progress (`docs/BACKEND_AUDIT_REPORT.md`)
- CLAUDE.md: 15 structured sections, full tech stack, 15-model database schema, 11 critical design patterns
- Figma: 23 screens completed before AI credit exhaustion; 43 total screens mapped
- Domain: `sorcyn.com` secured
- Color scheme: white background, violet-purple primary accent (specific shade saved in design files)

**Immediate next steps:**
1. Complete and review backend audit report
2. Implement session gaps identified in audit (three-day exclusivity, offer cap, budget stripping, Classic/Business account types)
3. Resume Figma design work (remaining 20 screens)
4. Export design tokens; build frontend with Claude Code or Cursor using Figma as static reference

---

## **20. OPEN QUESTIONS & DECISIONS**

### **Resolved (Closed)**

| # | Question | Decision |
|---|---|---|
| Q1 | Platform name? | **Sorcyn** — domain `sorcyn.com` secured |
| Q2 | Brand identity? | White background, violet-purple primary accent |
| Q3 | Buyer fee on services? | **$0 — buyers always free on all transaction types** |
| Q4 | Platform absorb Stripe fees? | **Seller absorbs Stripe fees** (not buyer, not platform) |
| Q5 | Node.js vs. Python? | **Node.js (TypeScript)** recommended for MVP |
| Q6 | Flutter vs. React Native? | **Flutter** confirmed |
| Q7 | PostgreSQL vs. Elasticsearch? | **PostgreSQL for MVP**, Elasticsearch Phase 2 |
| Q8 | SMS vs. Push for MVP notifications? | **Push only in MVP**; SMS deferred to Phase 2 |
| Q9 | Seller no-show handling? | 10% no-show fee + suspension + rating impact |
| Q10 | Arbitration fee for Tier 3? | **Losing party pays $50** |
| Q11 | AI model for chatbot? | **Gemini Flash-Lite** to start; upgrade path defined |
| Q12 | Account types? | **Classic** (individual) and **Business** (reseller) |
| Q13 | Budget visibility for sellers? | **Hidden from sellers**; used only for matching algorithm |
| Q14 | Offer cap per post? | **Max 10 offers; paid batch system for overflow** |
| Q15 | Post duration? | **30 days maximum** (extended from 14 days in v2.1) |
| Q16 | Three-day exclusivity? | **Confirmed** — 3 days from first offer; post goes public after |
| Q17 | Discovery feed for buyers? | **Confirmed** — post-exclusivity offers surface in buyer discovery |
| Q18 | UPC barcode scanning? | **Business accounts only** — camera-based, requires real seller photo |
| Q19 | Cold-start seed data scope? | **5,000–15,000 posts across 10–15 US metros** at launch |
| Q20 | Seller promotions? | **Deferred to Phase 2+** — not at launch |

### **Open (Unresolved)**

| # | Question | Options | Priority |
|---|---|---|---|
| O1 | Meilisearch implementation status? | Already implemented / Needs to be added / Was only a recommendation | High — confirm during backend audit |
| O2 | Exact offer batch pricing? | $5/batch, $10/batch, tiered by category? | Medium — decide pre-launch |
| O3 | Seed post handling when real seller responds? | Auto-expire / redirect to nearest real buyer / manual review | High — needed for launch |
| O4 | Business account EIN verification in MVP: admin manual or queued review? | Manual review within 24h / Simple format validation only | Medium — decide pre-implementation |
| O5 | Renew post behavior: does renewing reset the 3-day exclusivity window? | Yes (new window on renew) / No (one-time per post) | Medium |
| O6 | Sales tax certificate requirement: hard block or soft warning for Business sellers? | Hard block (can't post until verified) / Soft warning (can post, badge pending) | Medium |
| O7 | Local fraud radius threshold: what distance triggers auto-convert to shipped? | >50 miles / >100 miles / State boundary | Medium — needs legal/ops input |
| O8 | Discovery feed: should original buyer's first name be shown or anonymized? | Show "Buyer in Fort Worth, TX" / Show "Sarah M." / Fully anonymous | Low |

---

## **APPENDICES**

### **Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-09 | Faisal + Partners | Initial draft |
| 2.0 | 2026-02-11 | Faisal + Partners | Universal categories, complete API specs, security checklist |
| 2.1 | 2026-02-12 | Faisal + Partners | MVP expanded to 3 categories; AI-assisted posting added; single account dual view; badge-based verification; auto 5-star reviews; jobs lead gen model; local products free; purple/white branding; before/after photos required; milestone payments; deferred SMS/OAuth; account deactivation/deletion policies; messaging enhancements; drafts; Coming Soon categories; infrastructure cost expectations |
| 2.2 | 2026-05-02 | Faisal + Partners | **Major policy updates from Apr 14–16 sessions**: Buyer-free fee model (sellers only); Classic/Business account types; three-day exclusivity window; max 10 offer cap per post with paid batch overflow; budget hidden from sellers (matching use only); AI chatbot as primary interface (not just helper); 30-day post duration; post renew feature; seller discovery feed; buyer discovery/for-you page (post-exclusivity); low-ball offer warnings; local fraud prevention; cold-start seed data strategy (5K–15K posts, 10–15 metros); seller promotions deferred to Phase 2+; UPC barcode scanning for Business accounts; screen count updated to 43; Sorcyn name and sorcyn.com domain confirmed; Cloudflare R2 media storage confirmed; Gemini Flash-Lite as primary AI model; staffing plan added |

---

*END OF PRD v2.2*
