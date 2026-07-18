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
7. **Offer cap (max 10 per post)** ensures buyers receive a manageable, quality-curated set of bids — and creates a paid-overflow monetization lever for sellers who want additional reach
8. **Transparent seller-side fees only** (sustainable business model vs. Thumbtack's expensive seller-only leads)
9. **Local-first approach** builds network effects neighborhood by neighborhood

---

## **2. PROBLEM STATEMENT**

### **Current Pain Points**

#### **For Buyers:**
1. **Fragmented platforms** - Must search Facebook for products, Thumbtack for services, Indeed for jobs, Craigslist for everything (outdated)
2. **Time-consuming search** - Actively hunt for what they need instead of posting once
3. **No price competition** - See listed prices, can't solicit competitive bids
4. **Limited options** - Only see what's currently listed, miss unlisted inventory
5. **Trust issues** - Scams, fake listings, no recourse on Craigslist/Facebook
6. **No escrow protection** - Send money, hope for the best
7. **Hidden fees** - Quoted $200 for service, charged $500 after work starts
8. **Emergency situations** - Need help NOW, can't spend hours researching

#### **For Sellers:**
1. **Low visibility** - Compete with established players with big advertising budgets
2. **Passive waiting** - Must wait for buyers to find them
3. **High advertising costs** - Google Ads ($50-100/click), Thumbtack ($20-60/lead), Yelp ($400/month)
4. **No qualified leads** - Waste time on tire-kickers, scammers, price shoppers
5. **Platform fees eat margins** - Thumbtack charges per lead (not per hire), Upwork takes 20%
6. **Can't showcase quality** - Limited ways to display work quality online
7. **Competition based on price only** - Race to the bottom, can't differentiate on quality

### **Market Gaps**
- ✅ Services reverse marketplace exists (Thumbtack, Upwork) - but expensive and limited
- ❌ **No reverse marketplace for physical products** (consumer goods, electronics, furniture)
- ❌ **No reverse marketplace for B2B inventory** (bulk purchases, wholesale, liquidation)
- ❌ **No reverse marketplace for junk/unwanted items** ("buying broken MacBooks")
- ❌ **No unified platform for products + services + inventory + jobs**
- ❌ **No platform with mandatory before/after photo evidence** (all are optional)
- ❌ **No platform with transparent dual-sided fees** (most hide fees or charge one side heavily)
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
- **Our TAM: $1.5 trillion** (all categories combined)

**SAM (Serviceable Addressable Market):**
- Online marketplaces + local services (addressable by platform): **$150 billion**
  - Home services (online bookable): $50 billion
  - Consumer products (C2C + small B2C): $80 billion
  - Professional services (online): $20 billion
- **Our SAM: $150 billion**

**SOM (Serviceable Obtainable Market):**
- **Year 1 (DFW Home Services Only)**: $850 million market
  - Target: 0.5% capture = **$4.25 million GMV**
  - Platform revenue (7% avg): **$297,000**
- **Year 2 (All categories in DFW)**: $8.5 billion market
  - Target: 0.5% capture = **$42.5 million GMV**
  - Platform revenue (7% avg): **$2.97 million**
- **Year 3 (Texas-wide)**: $35 billion market
  - Target: 0.3% capture = **$105 million GMV**
  - Platform revenue (7% avg): **$7.35 million**

### **Competitive Landscape**

| Platform | Focus | Model | Strength | Weakness | Our Advantage |
|----------|-------|-------|----------|----------|---------------|
| **Thumbtack** | Home services | Reverse (services only) | Established brand, large network | Expensive for sellers ($20-60/lead), services only | We charge only on hire, expand to all categories |
| **Upwork** | Freelancing | Reverse (digital services) | Global reach, payment protection | 20% fees, digital only, complex | Lower fees, local+physical, simpler |
| **TaskRabbit** | Odd jobs | Gig economy | Easy booking, vetted taskers | Not for licensed trades, limited scope | Licensed professionals, all services |
| **Facebook Marketplace** | Products | Traditional classifieds | Massive reach, free | Scams, no trust/safety, no escrow | Escrow, verification, dispute resolution |
| **eBay** | Products | Auction + Buy Now | Global, established | Complex, high fees (13%), slow | Simpler, reverse model, local-first |
| **Craigslist** | Everything | Classifieds | Free, massive reach | Outdated UX, scams, dangerous meetups | Modern UX, escrow, safe transactions |
| **Angi (Angie's List)** | Home services | Directory/Lead gen | Brand recognition | Outdated model, expensive ads | Reverse model, transparent pricing |
| **OfferUp** | Products | Traditional | Local focus, simple | No escrow, scams | True escrow, verification |

**Our Positioning:** 
"The universal reverse marketplace - post what you need, get competitive offers for anything: services, products, inventory, jobs. Safe, transparent, and fair."

---

## **5. USER PERSONAS**

### **Persona 1: Busy Homeowner (Buyer - Services)**

**Name:** Sarah Martinez  
**Age:** 38  
**Occupation:** Marketing Manager  
**Income:** $85,000/year  
**Location:** Dallas, TX (75201)  
**Home:** 3BR/2BA house, built 1985

**Goals:**
- Find reliable licensed contractors for home repairs (plumbing, electrical, HVAC)
- Get fair competitive pricing without calling 10 companies
- Trust that work will be done properly with recourse if not
- Get repairs done quickly (within 1 week, not emergency)

**Pain Points:**
- No time to research contractors during work hours
- Got burned by unlicensed "handyman" who made leak worse
- Doesn't know fair market prices (is $200 right? $500?)
- Last time: called 5 plumbers, 2 never called back, 3 wanted "come see it first" (wasted Saturday)
- Scared of Craigslist (heard horror stories)
- Thumbtack overwhelms her with calls from desperate contractors

**Tech Savviness:** High - uses apps for everything (Uber, DoorDash, Airbnb)

**How Our Platform Helps:**
- Posts once with photos → receives 5 competitive bids by evening
- Sees all contractors are licensed (auto-verified with state)
- Reviews show before/after photos of past work
- Escrow protects her payment ($250 held until work approved)
- Can book tonight, contractor comes tomorrow

**Quote:** *"I just want to post my problem and have qualified professionals come to me with prices. Why isn't there an app for that?"*

---

### **Persona 2: Independent Contractor (Seller - Services)**

**Name:** Miguel Rodriguez  
**Age:** 42  
**Occupation:** Licensed Master Plumber (TSBPE #M-12345)  
**Income:** $75,000/year  
**Location:** Fort Worth, TX  
**Business:** Rodriguez Plumbing (solo + 1 helper)

**Goals:**
- Get more residential clients without expensive ads
- Fill schedule gaps (has 2-3 open slots per week)
- Build online reputation to compete with big companies
- Avoid tire-kickers, get serious paying customers
- Work within 20-mile radius of Fort Worth

**Pain Points:**
- Thumbtack costs $30-50 per lead, only 1 in 5 hires him = losing money
- Google Ads too expensive ($80 per click for "emergency plumber")
- Yelp wants $400/month for ads (can't afford)
- Facebook Marketplace is all DIY people and hagglers ("can you do it for $50?")
- Has great work quality but no online presence
- Spends 30% of time on phone/estimates that don't convert

**Tech Savviness:** Medium - uses smartphone for business, not super tech-savvy

**How Our Platform Helps:**
- Only pays 8% when actually hired (not per lead)
- Browses pre-qualified leads (homeowners ready to hire)
- Can offer competitive bids on jobs he wants (filters by location, type)
- Before/after photos showcase his quality work
- Builds 5-star reputation visible to all buyers
- Gets paid quickly through escrow (no chasing payments)
- **Example:** Spends $20 on Thumbtack lead (doesn't hire). On our platform: wins $250 job, pays $20 fee, nets $230 - only when hired.

**Quote:** *"Thumbtack is killing my margins. I need leads that actually convert, and I shouldn't pay unless I get the job."*

---

### **Persona 3: Reseller/Flipper (Buyer - Products)**

**Name:** Amanda Foster  
**Age:** 29  
**Occupation:** Full-time Reseller (eBay/Poshmark)  
**Income:** $60,000/year  
**Location:** Dallas, TX

**Goals:**
- Find cheap inventory to resell online
- Buy broken electronics to repair and flip
- Get deals before other resellers
- Scale inventory purchasing efficiently

**Pain Points:**
- Spends 4-5 hours/day scrolling Facebook Marketplace, OfferUp, Craigslist
- Misses good deals by minutes (notifications too slow)
- Hard to find specific items ("broken MacBooks", "vintage furniture")
- Sellers don't respond or flake on meetups
- No way to broadcast "I'm buying X" and have sellers come to her
- Fees on eBay (13%) and Poshmark (20%) eat margins

**Tech Savviness:** High - power user, uses automation tools

**How Our Platform Helps:**
- Posts "Buying broken MacBooks - any condition, $50-$200" → sellers bring to her
- Sets up alerts for keywords (vintage, wholesale, bulk, broken)
- Free local pickups (no platform fees on cash transactions)
- Can negotiate multiple deals simultaneously
- Sellers compete to sell to her (reverse of normal marketplaces)
- **Example:** Instead of hunting for 1 MacBook/day on Facebook, posts once and gets 10 offers/week

**Quote:** *"I'm tired of hunting. I should be able to post what I'm buying and have sellers compete to sell to me."*

---

### **Persona 4: Small Business Owner (Buyer + Seller - Mixed)**

**Name:** James Chen  
**Age:** 51  
**Occupation:** Owner of Local Electronics Repair Shop  
**Income:** $120,000/year (business revenue: $280k)  
**Location:** Arlington, TX

**Goals:**
- Find bulk inventory suppliers (iPhone screens, parts)
- Hire part-time technicians
- Offer repair services to new customers
- Buy used/broken electronics to refurbish and resell
- Expand customer base locally

**Pain Points:**
- Hard to find wholesale suppliers locally (uses Alibaba, slow shipping)
- Indeed charges $5/day per job post, gets unqualified applicants
- No good B2B marketplace for electronics parts
- Wants to advertise repair services but Google Ads too expensive
- Craigslist is dead for business listings
- Yelp brings customers but charges $600/month

**Tech Savviness:** Medium-high - runs business software, active online

**How Our Platform Helps:**
- **As Buyer (Inventory):** Posts "Need 500 iPhone 13 screens wholesale" → suppliers respond with quotes
- **As Buyer (Jobs):** Posts "Hiring part-time phone technician, $18/hr" → applicants come to him (free posting Phase 2)
- **As Buyer (Products):** Posts "Buying broken iPhones - any condition" → people bring broken phones to repair
- **As Seller (Services):** Lists repair services → customers find him with specific needs
- **One platform for all needs** instead of Indeed + Alibaba + Craigslist + Yelp

**Quote:** *"I need one platform where I can buy inventory, hire staff, and get customers. Right now I'm paying 5 different services."*

---

### **Persona 5: Property Manager (Buyer - Services, High Volume)**

**Name:** Linda Washington  
**Age:** 48  
**Occupation:** Property Manager (manages 35 rental units in DFW)  
**Income:** $95,000/year  
**Location:** Irving, TX

**Goals:**
- Find 3-5 reliable contractors she can call repeatedly
- Get fast response for tenant emergencies (plumbing, HVAC, electrical)
- Pay fair prices (not emergency premium rates)
- Track expenses per property for owner reports
- Avoid bad contractors (had tenant sue after botched repair)

**Pain Points:**
- Tenants call at 9 PM with "emergency" (usually not emergency)
- Current plumber charges 2x for "after hours" ($400 vs $200)
- Hard to find trustworthy contractors who do good work
- Needs detailed receipts and photos for property owners
- Some properties have ongoing issues (old pipes, HVAC)
- HomeAdvisor is expensive and sends too many unqualified leads

**Tech Savviness:** Medium - uses property management software (AppFolio), smartphone for everything

**How Our Platform Helps:**
- Can post for multiple properties from one account
- Finds contractors willing to be "on-call" for her portfolio (negotiates rates)
- Escrow and photo evidence creates paper trail for owners
- Can rate contractors per job, builds trusted network
- Negotiates bulk/repeat customer rates (8% fee vs one-off jobs)
- **Example:** "Water heater out at 123 Main St" → 5 HVAC contractors offer quotes within 2 hours, she picks based on rating + availability

**Quote:** *"I manage 35 properties. I need reliable contractors on speed dial, not to search from scratch every time something breaks."*

---

### **Persona 6: College Student (Buyer - Products, Low Budget)**

**Name:** Tyler Johnson  
**Age:** 21  
**Occupation:** College Student (Business major)  
**Income:** $15,000/year (part-time job + financial aid)  
**Location:** Denton, TX (near UNT)

**Goals:**
- Furnish dorm/apartment cheaply
- Find used textbooks, electronics, furniture
- Sell unwanted items when moving
- Make extra money flipping items

**Pain Points:**
- Facebook Marketplace sellers flaky (no-shows, fake listings)
- OfferUp has scammers ("send $50 deposit first")
- Craigslist sketchy (doesn't feel safe meeting strangers)
- Can't afford new furniture ($800 couch vs $150 used)
- No time to hunt deals between classes and work

**Tech Savviness:** Very high - Gen Z, mobile-first

**How Our Platform Helps:**
- Posts "Need couch for apartment, $50-$150 budget" → sellers with couches respond with photos
- Verification reduces scams (ID verified sellers)
- Can meet in public place (local pickup, free transaction)
- Sellers compete on price (gets best deal)
- Can also sell: "Moving out, selling couch, desk, TV"
- **Example:** Posted "need desk", got 8 offers ranging $30-$100, picked $40 desk from verified seller, met at Starbucks

**Quote:** *"I shouldn't have to scroll Facebook for hours. I should post what I need and let sellers come to me."*

---

## **6. PRODUCT GOALS & SUCCESS METRICS**

### **Business Goals (Year 1 - MVP)**

| Goal | Target | Metric | Rationale |
|------|--------|--------|-----------|
| **User Acquisition** | 2,500 total users | Registrations | 1,500 buyers, 1,000 sellers |
| **Active Sellers** | 200 sellers | Posted profile + made 1+ offer | Focus: licensed contractors (plumbers, electricians, HVAC, handyman) |
| **Active Buyers** | 750 buyers | Posted 1+ request | Homeowners, property managers, small businesses |
| **Transactions** | 500 completed | Escrow released | Avg $280/transaction |
| **GMV** | $140,000 | Total transaction value | Conservative estimate |
| **Revenue** | $9,800 | Platform fees collected | 7% avg take rate |
| **Geographic Coverage** | 80% of DFW | Zip codes with 1+ active seller | 350+ zip codes covered |
| **Category Expansion** | 3 service categories | Live categories | Plumbing → +Electrical, +HVAC by month 6 |

### **North Star Metric**
**Weekly Active Transactions (WAT)**
- **Month 3 (Launch):** 10 WAT
- **Month 6:** 30 WAT
- **Month 12:** 120 WAT

**Why this metric:** Transactions represent actual value exchange and platform health:
- Buyer found value (posted, received offers)
- Seller found value (won bid, got paid)
- Platform created value (facilitated match)
- Money changed hands (revenue generated)

### **Detailed Metrics Dashboard**

#### **Acquisition Metrics**
| Metric | Target | Measurement |
|--------|--------|-------------|
| New signups per week | 50 | 35 buyers / 15 sellers |
| Signup source split | Varied | Organic 40%, Paid 30%, Referral 30% |
| Cost per acquisition (CPA) | <$15 buyer, <$50 seller | Marketing spend / acquisitions |
| Email verification rate | >80% | Verified / registered |
| Conversion: Landing → Signup | >8% | Signups / landing page visits |

#### **Activation Metrics**
| Metric | Target | Measurement |
|--------|--------|-------------|
| % buyers who post | >60% | Posted / registered buyers |
| % sellers who offer | >50% | Offered / registered sellers |
| Time to first post (buyers) | <48 hours | Median time from signup to first post |
| Time to first offer (sellers) | <24 hours | Median time from signup to first offer |
| Profile completion rate | >85% | Sellers with complete profiles |
| License upload rate | >95% | Sellers with verified licenses |

#### **Engagement Metrics**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Offers per post | 3-5 | Average offers received per post |
| Buyer response rate | >70% | Buyers who respond to offers |
| Seller offer acceptance rate | >25% | Offers accepted / total offers |
| Message response time | <2 hours | Median time to respond |
| Post completion rate | >75% | Posts that receive 1+ offers |

#### **Transaction Metrics**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Transaction completion rate | >85% | Completed / accepted offers |
| Average transaction value (ATV) | $280 | Total GMV / transactions |
| Platform take rate | 7% avg | Platform fees / GMV |
| Dispute rate | <5% | Disputes / transactions |
| Refund rate | <3% | Refunds / transactions |
| Payment success rate | >95% | Successful charges / attempts |

#### **Retention Metrics**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Repeat buyer rate | >35% at 6 months | Buyers with 2+ transactions |
| Repeat seller rate | >60% at 6 months | Sellers with 2+ jobs |
| 30-day retention | >45% | Active after 30 days / new users |
| Monthly churn rate | <12% | Users who leave / total users |
| Days between transactions | <45 days (buyers) | Median time between posts |

#### **Quality Metrics**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Average seller rating | >4.5 | Weighted average of all reviews |
| % 5-star reviews | >65% | 5-star / total reviews |
| NPS score | >40 | Net Promoter Score survey |
| Referral rate | >15% | Users acquired via referral |
| Support ticket rate | <10% | Tickets / transactions |

#### **Marketplace Health**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Supply/demand ratio | 0.25-0.35 sellers per buyer post | Sellers / active posts |
| Liquidity score | >75% | Posts receiving 1+ offers |
| Time to first offer | <6 hours | Median time post → first offer |
| Geographic coverage | >80% of DFW | Zip codes with 1+ seller |
| Offer acceptance rate | 25-35% | Sweet spot for competition |

#### **Category Performance (Track per category)**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Posts per category | Balanced | Distribution across categories |
| GMV per category | Varied | Total value per category |
| Dispute rate per category | <5% | Disputes / transactions by category |
| Avg rating per category | >4.5 | Seller ratings by category |

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

**Note:** Requirements written generically to support all categories. Examples use various categories to illustrate flexibility. MVP launches with Products, Services, and Jobs in DFW. The codebase supports all categories from Day 1.

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

**API Endpoint, request/response shapes, and validation rules:** see Section 11.7 (POST /api/v1/auth/register) for the v2.2 schema, including the `account_type` discriminator and the additional Business-account fields.

**Acceptance Criteria:**
- ✅ User receives verification email within 1 minute
- ✅ Email verification link valid for 24 hours, single-use
- ✅ Cannot post/offer until email verified
- ✅ Duplicate email returns 409 Conflict with clear message
- ✅ Invalid phone format returns 400 with specific error
- ✅ Weak password returns 400 with password requirements
- ✅ Rate limit exceeded returns 429 Too Many Requests
- ✅ Password never logged or returned in responses
- ✅ User receives welcome email after email verification
- ✅ Business accounts cannot publish listings until EIN and sales tax certificate are uploaded and pending verification

**Business Rules:**
- Email must be unique across all users
- Phone can be shared (e.g., business line) but flagged for review if >3 accounts
- Users under 18 cannot register (age verification via DOB in Phase 2)
- Business accounts must provide business name, business type, EIN, and sales tax certificate
- Classic accounts can upgrade to Business from settings later

---

#### **FR-UM-002: Email Verification**

**Description:** Users must verify email before posting or offering.

**Requirements:**
- SHALL send verification email immediately after registration
- SHALL include unique token (256-bit random, URL-safe)
- SHALL expire token after 24 hours
- SHALL mark token as used after single verification
- SHALL allow resending verification email (rate limited: 1 per 5 minutes)
- SHALL redirect to app after successful verification (deep link)

**API Endpoints:**
```
GET /api/v1/auth/verify-email?token={token}
POST /api/v1/auth/resend-verification
```

**Email Template:**
```
Subject: Verify your email - [Platform Name]

Hi John,

Welcome to [Platform Name]! Please verify your email address by clicking below:

[Verify Email Button] → https://app.reversemarket.com/verify?token=abc123...

This link expires in 24 hours.

Didn't sign up? Ignore this email.

Thanks,
The [Platform Name] Team
```

**Acceptance Criteria:**
- ✅ Email delivered within 60 seconds
- ✅ Token cannot be reused after verification
- ✅ Expired token returns clear error message
- ✅ Invalid token returns 404 Not Found
- ✅ Successful verification redirects to onboarding flow

---

#### **FR-UM-003: Phone Verification (SMS) — DEFERRED TO PHASE 2**

**Description:** Phone number collected at registration but SMS verification deferred to Phase 2 to save Twilio costs. Email verification serves as MFA in MVP.

**MVP Behavior:**
- SHALL collect phone number at registration
- SHALL NOT send SMS verification in MVP (cost savings)
- SHALL use email verification as the primary MFA mechanism

**Phase 2 Requirements (when enabled):**
- SHALL send 6-digit verification code via SMS (Twilio)
- SHALL expire code after 10 minutes
- SHALL allow 3 verification attempts per phone per hour
- SHALL rate limit: 5 SMS per phone per day (prevent abuse)
- SHALL support resend code (1 per 2 minutes)
- SHALL block VoIP numbers (Twilio Lookup API)

**API Endpoints:**
```
POST /api/v1/auth/send-phone-verification
POST /api/v1/auth/verify-phone
```

**Send Verification Request:**
```json
{
  "phone": "+14695551234"
}
```

**Send Verification Response:**
```json
{
  "success": true,
  "message": "Verification code sent to +1 (469) 555-1234",
  "expires_in": 600,
  "can_resend_at": "2026-02-10T12:42:00Z"
}
```

**Verify Phone Request:**
```json
{
  "phone": "+14695551234",
  "code": "847293"
}
```

**Verify Phone Response:**
```json
{
  "success": true,
  "phone_verified": true,
  "message": "Phone verified successfully"
}
```

**SMS Template:**
```
Your [Platform Name] verification code is: 847293

Valid for 10 minutes. Do not share this code.
```

**Acceptance Criteria:**
- ✅ SMS delivered within 30 seconds
- ✅ Invalid code returns clear error (3 attempts max)
- ✅ Expired code returns error, prompts resend
- ✅ Rate limit prevents SMS bombing
- ✅ VoIP numbers rejected with explanation

---

#### **FR-UM-004: User Authentication (Login)**

**Description:** Users can log in securely.

**Requirements:**
- SHALL support email + password login
- SHALL return JWT access token (30-day expiry)
- SHALL return refresh token (90-day expiry, stored in httpOnly cookie)
- SHALL implement rate limiting: 5 failed attempts = 15 min lockout
- SHALL log all login attempts (IP, timestamp, device, success/failure)
- SHALL support "Remember me" (extends refresh token to 180 days)
- SHALL require 2FA for account reactivation (code sent to email or phone on file)
- SHALL require 2FA for high-value accounts (transactions >$5000)
- SHALL invalidate old tokens on password change
- SHALL support logout (token blacklist in Redis)

**API Endpoint:**
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "user_id": "usr_a7f8d9e12b3c",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "buyer",
    "email_verified": true,
    "phone_verified": true,
    "profile_complete": 85
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 2592000
}
```

**Response (Error - Invalid Credentials):**
```json
{
  "success": false,
  "error": {
    "type": "https://docs.reversemarket.com/errors/auth/invalid-credentials",
    "title": "Invalid Credentials",
    "status": 401,
    "detail": "Email or password is incorrect",
    "instance": "/api/v1/auth/login"
  }
}
```

**Response (Error - Account Locked):**
```json
{
  "success": false,
  "error": {
    "type": "https://docs.reversemarket.com/errors/auth/account-locked",
    "title": "Account Locked",
    "status": 429,
    "detail": "Too many failed login attempts. Try again in 14 minutes.",
    "retry_after": 840,
    "instance": "/api/v1/auth/login"
  }
}
```

**JWT Payload Structure:**
```json
{
  "sub": "usr_a7f8d9e12b3c",
  "email": "john@example.com",
  "role": "buyer",
  "iat": 1644576000,
  "exp": 1647168000,
  "jti": "jwt_unique_id_123"
}
```

**Acceptance Criteria:**
- ✅ Valid credentials return token within 200ms
- ✅ Invalid credentials return 401 (generic message, don't reveal if email exists)
- ✅ Rate limit enforced per IP + per email
- ✅ Locked account shows countdown timer
- ✅ Token blacklisted on logout
- ✅ Token refresh works seamlessly before expiry

---

#### **FR-UM-005: Token Refresh**

**Description:** Refresh access token without requiring login.

**Requirements:**
- SHALL validate refresh token
- SHALL issue new access token
- SHALL rotate refresh token (optional security enhancement)
- SHALL detect token reuse (security: possible theft)
- SHALL invalidate all tokens on suspicious activity

**API Endpoint:**
```
POST /api/v1/auth/refresh
```

**Request:**
```json
{
  "refresh_token": "rt_b8g9e0f13c4d..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_c9h0f1g14d5e...",
  "expires_in": 2592000
}
```

---

#### **FR-UM-006: Password Reset**

**Description:** Users can reset forgotten passwords.

**Requirements:**
- SHALL send reset link via email
- SHALL use unique token (256-bit, single-use, 1-hour expiry)
- SHALL rate limit: 3 reset requests per email per day
- SHALL require new password (different from old password)
- SHALL invalidate all existing tokens on password change
- SHALL notify user via email when password changed (security alert)

**API Endpoints:**
```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

**Forgot Password Request:**
```json
{
  "email": "john@example.com"
}
```

**Forgot Password Response:**
```json
{
  "success": true,
  "message": "If this email is registered, you'll receive a password reset link"
}
```
*Note: Generic message to prevent email enumeration*

**Reset Password Request:**
```json
{
  "token": "reset_abc123...",
  "new_password": "NewSecurePass456!"
}
```

**Email Template:**
```
Subject: Reset your password - [Platform Name]

Hi John,

We received a request to reset your password. Click below to create a new password:

[Reset Password Button] → https://app.reversemarket.com/reset?token=abc123...

This link expires in 1 hour.

Didn't request this? Ignore this email or contact support if concerned.

Thanks,
The [Platform Name] Team
```

**Acceptance Criteria:**
- ✅ Reset email sent within 60 seconds
- ✅ Token expires after 1 hour
- ✅ Used token cannot be reused
- ✅ New password cannot match old password
- ✅ User receives confirmation email after successful reset
- ✅ All active sessions logged out after reset

---

#### **FR-UM-007: User Profile Management**

**Description:** Users can view and edit their profiles.

**Requirements:**
- SHALL allow editing: first name, last name, phone, location, profile photo, bio
- SHALL NOT allow editing email directly (requires re-verification flow)
- SHALL support profile photo upload (max 5MB, JPEG/PNG/WebP)
- SHALL auto-compress photos to 800x800px, <500KB
- SHALL display verification badges
- SHALL display **public profile pages** (viewable by other users within the app)
  - Users can see each other's profiles, reviews, posts
  - Users can **follow** each other (like Offer Up)
  - Users CANNOT see other users' activity (e.g., "just bought this")
  - Completed/sold transactions hidden from all users except the buyer and seller involved
- SHALL display only legal first name publicly (no full name, no usernames)
- SHALL NOT display phone numbers on profiles (prevent off-platform transactions)
- SHALL display location as radius/area only, NEVER exact address
- SHALL show user-specific fields based on role:
  - **Buyers**: First name, photo, location (radius only for privacy), join date, total posts, average rating given
  - **Sellers**: All above PLUS business name, service/product categories, service area/radius (for services), bio, portfolio, verification badges
- SHALL support both **account deactivation** and **permanent deletion**:
  - **Deactivation:** Account turned off, everything stays. Reactivated by logging back in with 2FA verification (code sent to email or phone on file). If user lost access to both, must contact support.
  - **Deletion:** Account permanently deleted. Reviews and ratings left by the user REMAIN (name stays on reviews, NOT anonymized). Ongoing transactions cancelled and posts deleted. Must be explicitly stated in Terms & Conditions / Privacy Policy.
- SHALL comply with GDPR right-to-deletion
- SHALL require 2FA (email or phone code) for account reactivation after deactivation

**API Endpoints:**
```
GET /api/v1/users/{user_id}
GET /api/v1/users/me
PUT /api/v1/users/me
DELETE /api/v1/users/me (soft delete)
```

**Get Profile Response:**
```json
{
  "success": true,
  "user": {
    "user_id": "usr_a7f8d9e12b3c",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+14695551234",
    "profile_photo": "https://cdn.reversemarket.com/users/usr_a7f8d9e12b3c/photo.jpg",
    "location": {
      "city": "Dallas",
      "state": "TX",
      "zip": "75201"
    },
    "role": "buyer",
    "verified": {
      "email": true,
      "phone": true,
      "id": false
    },
    "stats": {
      "posts_created": 12,
      "transactions_completed": 8,
      "average_rating_given": 4.7
    },
    "joined_at": "2026-01-15T10:30:00Z",
    "last_active": "2026-02-09T14:22:00Z"
  }
}
```

**Update Profile Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+14695551234",
  "location": {
    "zip": "75201"
  },
  "bio": "Homeowner looking for reliable contractors and quality products"
}
```

**Acceptance Criteria:**
- ✅ Profile updates reflect immediately
- ✅ Invalid data returns 400 with field-specific errors
- ✅ Profile photo upload compresses automatically
- ✅ Cannot view another user's email/phone (privacy)
- ✅ Deactivated account hides profile but retains data
- ✅ Permanent deletion removes all PII after 30 days

---

#### **FR-UM-008: Seller Profile Creation**

**Description:** Sellers create profiles based on account type. Classic accounts capture an individual seller profile; Business accounts capture additional inventory, EIN, and storefront fields.

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

**Profile Strength & Badges (unchanged from v2.1):**
- "Profile Strength" score (0–100%)
- Badge progression:
  - 🆕 New (0–5 transactions)
  - ⭐ Rising Star (5–20 transactions, >4.5 rating)
  - 👑 Top-Rated (20+ transactions, >4.8 rating, <2% dispute rate)
  - 💎 Elite (50+ transactions, >4.9 rating, <1% dispute rate)

**API Endpoint:**
```
POST /api/v1/sellers/profile
PUT /api/v1/sellers/profile
GET /api/v1/sellers/{seller_id}
```

**Create Seller Profile Request (Service Provider Example):**
```json
{
  "seller_type": "service_provider",
  "business_name": "Rodriguez Plumbing",
  "business_type": "individual",
  "bio": "Licensed master plumber with 18 years experience. Specializing in residential repairs and remodels. Fast, reliable, and fairly priced.",
  "years_experience": 18,
  "categories": ["plumbing"],
  "service_area": {
    "lat": 32.7555,
    "lng": -97.3308,
    "radius_miles": 25,
    "address": "Fort Worth, TX"
  },
  "availability": {
    "monday": { "open": "08:00", "close": "18:00" },
    "tuesday": { "open": "08:00", "close": "18:00" },
    "wednesday": { "open": "08:00", "close": "18:00" },
    "thursday": { "open": "08:00", "close": "18:00" },
    "friday": { "open": "08:00", "close": "18:00" },
    "saturday": { "open": "09:00", "close": "15:00" },
    "sunday": null
  },
  "emergency_services": true,
  "pricing_structure": "quotes",
  "credentials": {
    "license": {
      "number": "M-38472",
      "type": "master_plumber",
      "state": "TX",
      "expiration": "2027-06-30"
    },
    "insurance": {
      "provider": "State Farm",
      "policy_number": "1234567890",
      "coverage_amount": 1000000,
      "expiration": "2026-12-31",
      "certificate_url": "https://s3.../insurance_cert.pdf"
    }
  }
}
```

**Create Seller Profile Request (Product Seller Example):**
```json
{
  "seller_type": "product_seller",
  "business_name": "Tech Resale DFW",
  "business_type": "llc",
  "bio": "We buy and sell used electronics. All items tested and guaranteed. Local pickup or nationwide shipping available.",
  "years_experience": 3,
  "categories": ["electronics", "computers", "phones"],
  "product_details": {
    "inventory_types": ["used", "refurbished", "parts"],
    "shipping_options": ["local_pickup", "ship_nationwide"],
    "return_policy": "30-day money-back guarantee on all items",
    "typical_response_time": "within_4_hours"
  },
  "credentials": {
    "business_license": {
      "number": "BL-12345",
      "city": "Dallas",
      "state": "TX",
      "expiration": "2027-12-31"
    }
  }
}
```

**Get Seller Profile Response (Service Provider):**
```json
{
  "success": true,
  "seller": {
    "seller_id": "usr_b8g9e0f13c4d",
    "seller_type": "service_provider",
    "business_name": "Rodriguez Plumbing",
    "bio": "Licensed master plumber with 18 years experience...",
    "profile_photo": "https://cdn.reversemarket.com/sellers/usr_b8g9e0f13c4d/photo.jpg",
    "years_experience": 18,
    "categories": ["plumbing"],
    "service_area": {
      "city": "Fort Worth",
      "state": "TX",
      "radius_miles": 25
    },
    "availability": "Mon-Sat, 8AM-6PM",
    "emergency_services": true,
    "pricing_structure": "quotes",
    "credentials": {
      "license": {
        "number": "M-38472",
        "type": "Master Plumber",
        "state": "TX",
        "verified": true,
        "expiration": "2027-06-30"
      },
      "insurance": {
        "verified": true,
        "coverage_amount": 1000000,
        "expiration": "2026-12-31"
      }
    },
    "verification": {
      "email": true,
      "phone": true,
      "license": true,
      "insurance": true,
      "background_check": false
    },
    "stats": {
      "total_jobs": 47,
      "completed_jobs": 45,
      "average_rating": 4.8,
      "total_reviews": 42,
      "response_rate": 95,
      "response_time_minutes": 34,
      "acceptance_rate": 68,
      "on_time_rate": 91
    },
    "badges": ["top_rated", "fast_responder", "emergency_available"],
    "profile_strength": 95,
    "joined_at": "2025-11-10T08:00:00Z"
  }
}
```

**Profile Strength Calculation:**
```javascript
function calculateProfileStrength(seller) {
  let score = 0;
  
  // Basic info (30 points)
  if (seller.profile_photo) score += 10;
  if (seller.bio && seller.bio.length >= 100) score += 10;
  if (seller.years_experience > 0) score += 5;
  if (seller.business_name) score += 5;
  
  // Category-specific (40 points)
  if (seller.seller_type === 'service_provider') {
    if (seller.availability) score += 10;
    if (seller.credentials.license?.verified) score += 20;
    if (seller.credentials.insurance?.verified) score += 10;
  } else if (seller.seller_type === 'product_seller') {
    if (seller.product_details.return_policy) score += 10;
    if (seller.product_details.shipping_options.length > 1) score += 10;
    if (seller.credentials.business_license?.verified) score += 20;
  }
  
  // Performance (30 points)
  if (seller.stats.total_jobs >= 5) score += 10;
  if (seller.stats.average_rating >= 4.5) score += 15;
  if (seller.stats.response_rate >= 80) score += 5;
  
  return Math.min(score, 100);
}
```

**Acceptance Criteria:**
- ✅ Profile cannot be published until >80% complete
- ✅ Credentials verified within 24 hours (admin review in MVP)
- ✅ Service area displayed on map (for service providers)
- ✅ Product categories display relevant fields
- ✅ Profile visible in search after approval
- ✅ Profile strength updates in real-time
- ✅ Can switch between seller types (e.g., add product selling to service profile)

---

#### **FR-UM-009: Verification System (Badge-Based - Universal)**

**Description:** Verification uses a badge-based system. Sellers can optionally upload credentials to earn verification badges. Background checks required ONLY for high-risk categories. Higher-value projects get higher priority for verification.

**Base Verification (All Users):**
- Email verification (required — serves as MFA in MVP)
- Phone number collected (SMS verification deferred to Phase 2)
- Profile photo (required)

**Optional Badge-Earning Verifications:**
- **"Licensed" badge:** Upload license number, issuing state, expiration date. Auto-verified where state lookup databases exist; manual verification where no online lookup exists.
- **"Insured" badge:** Upload insurance certificate. Verified by admin.
- **"ID Verified" badge:** Government-issued ID upload (required for complex services)
- **"Background Checked" badge:** Required ONLY for high-risk categories: childcare, pet care, personal in-home services, large in-home projects, commercial projects
- **"Business Verified" badge:** Business license/EIN verification

**Category-Specific Verification:**

| Category | Base Requirements | Optional Badges | Required for High-Value |
|----------|------------------|-----------------|------------------------|
| **Services (Licensed trades)** | Email, Photo | Licensed, Insured, ID Verified | Background check for high-risk only |
| **Services (Unlicensed)** | Email, Photo | Insured, ID Verified | Background check for in-home/childcare only |
| **Products (C2C)** | Email, Photo | ID Verified | Business Verified (if business) |
| **Products (B2C)** | Email, Photo | Business Verified, ID Verified | EIN |
| **Professional Services** | Email, Photo | Licensed (where applicable), ID Verified | Professional license |
| **Jobs (Employers)** | Work email domain verification | Business Verified | EIN |
| **Jobs (Applicants)** | Email, Photo | ID Verified | Background check (optional) |

**Requirements:**
- SHALL use Stripe Identity for ID verification (Phase 2)
- SHALL manually review documents in MVP (admin portal)
- SHALL display earned badges prominently on profile
- SHALL re-verify annually (licenses, insurance expire)
- SHALL send reminders 30 days before verification expiry
- SHALL allow progressive verification (earn more badges over time)
- Non-licensed/unverified sellers are still allowed on the platform but do NOT get verification badges
- NO disclaimer pop-up for unverified sellers (could push sellers away) — disclaimers in Terms of Service only
- Higher-value projects may pause and require seller verification before proceeding
- License verification applies to ALL license-based professions (broader than just high-risk categories)

**API Endpoints:**
```
POST /api/v1/verification/email
POST /api/v1/verification/phone
POST /api/v1/verification/id
POST /api/v1/verification/license
POST /api/v1/verification/insurance
POST /api/v1/verification/business
POST /api/v1/verification/background-check
GET /api/v1/users/{user_id}/verification-status
```

**Verification Status Response:**
```json
{
  "success": true,
  "user_id": "usr_b8g9e0f13c4d",
  "current_tier": 2,
  "max_transaction_amount": 5000,
  "seller_type": "service_provider",
  "category": "plumbing",
  "verifications": {
    "email": {
      "verified": true,
      "verified_at": "2025-11-10T08:15:00Z"
    },
    "phone": {
      "verified": true,
      "verified_at": "2025-11-10T08:30:00Z"
    },
    "id": {
      "verified": true,
      "verified_at": "2025-11-12T14:22:00Z",
      "expires_at": null
    },
    "license": {
      "verified": true,
      "verified_at": "2025-11-13T10:00:00Z",
      "expires_at": "2027-06-30T00:00:00Z",
      "needs_renewal": false,
      "license_type": "Master Plumber (TSBPE)"
    },
    "insurance": {
      "verified": true,
      "verified_at": "2025-11-13T10:00:00Z",
      "expires_at": "2026-12-31T00:00:00Z",
      "needs_renewal": false,
      "coverage_amount": 1000000
    },
    "background_check": {
      "verified": false,
      "available": true,
      "cost": 29.99
    }
  },
  "next_tier_requirements": [
    "State contractor license verification (automated via API)",
    "Bonding documentation ($10,000 bond minimum)"
  ],
  "badges": [
    "email_verified",
    "phone_verified",
    "id_verified",
    "licensed_professional",
    "insured"
  ]
}
```

**Acceptance Criteria:**
- ✅ Sellers cannot transact above their tier limit
- ✅ Verification badges displayed prominently on profile
- ✅ Expired verifications trigger email reminders (30 days before)
- ✅ Manual review completed within 24 hours (MVP)
- ✅ Clear rejection reasons provided
- ✅ Users can resubmit after rejection
- ✅ Progressive verification (can upgrade tiers as needed)
- ✅ Category-specific requirements enforced

---

### **8.2 BUYER JOURNEY (UNIVERSAL - ALL CATEGORIES)**

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

**Requirements (universal fields, AI-generated or manually entered):**
- SHALL collect: title, description, category, subcategory, budget (min/max or open), location, photos (up to 10, 10MB each) and videos (up to 3, 100MB each; 13 files max per post total), timeline/urgency, seller requirements, post duration
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

**Category-specific fields (unchanged from v2.1 — see legacy spec below for examples by category):**
- Home Services, Products (buying/selling), Inventory/Wholesale, Jobs (hiring) all have category-specific JSONB extensions
- Examples preserved in the Request Body samples below

**Acceptance Criteria:**
- ✅ Post creation completes in <3 seconds
- ✅ AI preview returns within 3 seconds of buyer's first message
- ✅ Photos upload and compress automatically
- ✅ Location auto-detected if permission granted
- ✅ Estimated sellers displayed (category-specific)
- ✅ Cannot post if email not verified
- ✅ Draft saved automatically every 30 seconds
- ✅ Notification sent to matching sellers within 60 seconds
- ✅ Budget stored but stripped from all seller-facing responses

**Business Rules:**
- Buyers can have max 10 active posts simultaneously (across all categories)
- Cannot edit post after first offer received
- Post auto-expires after 30-day duration; renew/repost available
- Deleted posts retain data for 90 days (analytics)
- Free to post in all categories (buyers never pay to post)

---

##### **Legacy field spec & request/response examples (retained for reference)**

The following manual-form field spec, request bodies, and budget guidance examples are retained from v2.1 as reference for the same structured payloads the AI chatbot generates and the manual fallback collects.

**Universal fields (all categories) — manual entry equivalent:**
- SHALL collect **universal fields** (all categories):
  - **Title** (required, 10-100 chars)
    - Examples: 
      - Service: "Leaking kitchen faucet needs repair"
      - Product: "Looking for used MacBook Pro 16-inch"
      - Inventory: "Need 500 iPhone screens wholesale"
      - Job: "Hiring part-time bookkeeper"
  - **Description** (required, 50-1000 chars)
  - **Category** (required, dropdown):
    - Home Services (MVP Phase 1)
    - Professional Services (Phase 2)
    - Products - Buying (Phase 2)
    - Products - Selling (Phase 2)
    - Inventory/Wholesale (Phase 2)
    - Jobs - Hiring (Phase 3)
    - Junk/Unwanted Items (Phase 2)
  - **Sub-category** (required, dynamic based on category)
  - **Transaction type** (required): B2B, B2C, C2C
  - **Budget range** (optional for services/products, required for jobs):
    - Min/max OR "Open to offers"
    - Show market rate guidance (AI-powered Phase 2)
  - **Location** (required):
    - Full address (for services requiring site visit)
    - City + zip only (for products/remote services)
    - Nationwide (for shipped products/remote work)
  - **Photos** (optional, up to 10, max 10MB each)
  - **Videos** (optional, up to 3, max 100MB each)
    - Allowed formats: MP4, MOV (QuickTime), WebM
    - Combined limit: 13 media files max per post (photos + videos)
  - **Timeline/urgency** (required):
    - ASAP (within 24 hours)
    - Within 1 week
    - Within 2 weeks
    - Flexible
    - Specific date
  - **Seller requirements** (optional):
    - Minimum rating (1.0-5.0)
    - Verified sellers only
    - Licensed professionals only (services)
    - Business sellers only (B2B)
  - **Post duration** (default: 3 days): 24h, 3d, 7d, 14d

- SHALL collect **category-specific fields**:

  **Home Services:**
  - Property type (Single-family, Apartment, Townhouse, Commercial)
  - Emergency service needed (yes/no)
  - Preferred contact method (Phone, Text, App message)
  
  **Products - Buying:**
  - Condition preference (New, Like New, Used, For Parts)
  - Pickup vs Shipping (Local pickup only, Ship to me, Either)
  - Brand preference (optional)
  - Model/specifications
  
  **Products - Selling:**
  - Condition (New, Like New, Good, Fair, For Parts)
  - Original packaging (yes/no)
  - Purchase date
  - Reason for selling
  - Pickup location OR Shipping available
  
  **Inventory/Wholesale:**
  - Quantity needed
  - Frequency (One-time, Weekly, Monthly, Ongoing)
  - Specifications/certifications required
  - Delivery requirements
  
  **Jobs - Hiring:**
  - Job type (Full-time, Part-time, Contract, Temporary)
  - Hourly rate OR Salary range
  - Hours per week
  - Start date
  - Required qualifications
  - Work location (On-site, Remote, Hybrid)

- SHALL validate all required fields
- SHALL auto-detect location if permission granted
- SHALL compress uploaded images to <1MB
- SHALL save as draft if incomplete (drafts never expire, visible only to creator, persist until user deletes them)
- SHALL show estimated number of potential sellers in area before posting
- SHALL provide budget guidance based on historical data (Phase 2)
- SHALL allow editing if no offers received yet

**API Endpoint:**
```
POST /api/v1/posts
PUT /api/v1/posts/{post_id} (if no offers yet)
```

**Request Body (Service Example - Plumbing):**
```json
{
  "category_id": "cat_home_services",
  "subcategory_id": "subcat_plumbing_leak_repair",
  "transaction_type": "b2c",
  "title": "Bathroom sink dripping, need urgent repair",
  "description": "My bathroom sink has been dripping constantly for 3 days. Water is pooling in the cabinet underneath. I've attached photos showing the leak. Need someone to come look at it this week.",
  "budget_min": 100,
  "budget_max": 300,
  "budget_open": false,
  "location": {
    "address": "123 Elm Street, Dallas, TX 75201",
    "lat": 32.7767,
    "lng": -96.7970,
    "zip": "75201",
    "city": "Dallas",
    "state": "TX"
  },
  "photos": [
    "https://s3.amazonaws.com/reversemarket-uploads/usr_a7f8d9e12b3c/post_photo1.jpg",
    "https://s3.amazonaws.com/reversemarket-uploads/usr_a7f8d9e12b3c/post_photo2.jpg"
  ],
  "timeline": "within_1_week",
  "specific_date": null,
  "seller_requirements": {
    "min_rating": 4.0,
    "verified_only": true,
    "licensed_only": true
  },
  "category_specific": {
    "property_type": "single_family",
    "emergency_needed": false,
    "preferred_contact": "app_message"
  },
  "post_duration_hours": 72
}
```

**Request Body (Product Example - Buying):**
```json
{
  "category_id": "cat_products_buying",
  "subcategory_id": "subcat_electronics_computers",
  "transaction_type": "c2c",
  "title": "Looking for used MacBook Pro 16-inch (2021 or newer)",
  "description": "Need a MacBook Pro 16-inch for video editing. Must be 2021 or newer model with M1 Pro/Max chip. Prefer 32GB RAM but 16GB okay. Good condition with minimal scratches. Include charger and original box if available. Willing to pay fair price for quality unit.",
  "budget_min": 1200,
  "budget_max": 2000,
  "budget_open": false,
  "location": {
    "city": "Dallas",
    "state": "TX",
    "zip": "75201",
    "nationwide": false
  },
  "photos": [],
  "timeline": "within_2_weeks",
  "specific_date": null,
  "seller_requirements": {
    "min_rating": 4.0,
    "verified_only": true
  },
  "category_specific": {
    "condition_preference": ["like_new", "used"],
    "pickup_vs_shipping": "either",
    "brand": "Apple",
    "model_specs": "MacBook Pro 16-inch, M1 Pro/Max, 16GB+ RAM"
  },
  "post_duration_hours": 168
}
```

**Request Body (Job Example - Hiring):**
```json
{
  "category_id": "cat_jobs_hiring",
  "subcategory_id": "subcat_jobs_administrative",
  "transaction_type": "b2c",
  "title": "Hiring part-time bookkeeper for small business",
  "description": "Local electronics repair shop needs part-time bookkeeper. Handle QuickBooks, invoicing, payroll (5 employees), monthly reconciliation. 15-20 hours/week, flexible schedule. Remote work okay but prefer someone local for occasional in-person meetings.",
  "budget_min": 25,
  "budget_max": 35,
  "budget_open": false,
  "location": {
    "city": "Arlington",
    "state": "TX",
    "zip": "76015",
    "work_location_type": "hybrid"
  },
  "photos": [],
  "timeline": "within_1_week",
  "specific_date": "2026-03-01",
  "seller_requirements": {
    "min_rating": 4.5,
    "verified_only": true
  },
  "category_specific": {
    "job_type": "part_time",
    "pay_type": "hourly",
    "hours_per_week": "15-20",
    "start_date": "2026-03-01",
    "required_qualifications": "QuickBooks experience, payroll processing, 2+ years bookkeeping",
    "work_location": "hybrid"
  },
  "post_duration_hours": 168
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "post_id": "post_c9h0f1g14d5e",
    "category": "home_services",
    "subcategory": "plumbing_leak_repair",
    "status": "active",
    "created_at": "2026-02-10T10:00:00Z",
    "expires_at": "2026-02-13T10:00:00Z",
    "estimated_sellers_in_area": 47,
    "market_insights": {
      "average_quote": 225,
      "typical_response_time": "2-4 hours",
      "similar_posts_completed": 156
    }
  },
  "message": "Your post is now live! You'll receive offers soon."
}
```

**Budget Guidance (Category-Specific):**
```javascript
// Service example
{
  "job_type": "Leak Repair - Faucet",
  "typical_range": "$150-$350",
  "factors": [
    "Type of faucet (standard vs high-end)",
    "Accessibility (easy vs under-sink)",
    "Parts needed (washer vs full faucet replacement)",
    "Emergency service (adds 50-100%)"
  ],
  "tip": "Most leaking faucets can be fixed in 1-2 hours for $150-250 including parts."
}

// Product example
{
  "product": "Used MacBook Pro 16-inch (2021 M1 Pro)",
  "typical_range": "$1400-$2200",
  "factors": [
    "RAM (16GB vs 32GB vs 64GB)",
    "Storage (512GB vs 1TB vs 2TB)",
    "Condition (like new vs used)",
    "Included accessories (charger, box)"
  ],
  "tip": "Prices dropped 30% in last 6 months due to M3 release. Good time to buy."
}
```

**Acceptance Criteria:**
- ✅ Post creation completes in <3 seconds
- ✅ Photos upload and compress automatically
- ✅ Location auto-detected if permission granted
- ✅ Budget guidance shown based on category (Phase 2)
- ✅ Estimated sellers displayed (category-specific)
- ✅ Cannot post if email not verified
- ✅ Draft saved automatically every 30 seconds
- ✅ Notification sent to matching sellers within 60 seconds
- ✅ Post appears in seller feeds within 60 seconds
- ✅ Category-specific fields validated properly

**Business Rules:**
- Buyers can have max 10 active posts simultaneously (across all categories)
- Cannot edit post after first offer received
- Post auto-expires after duration (can extend once, +3 days)
- Deleted posts retain data for 90 days (analytics)
- Free to post in all categories (buyers never pay to post)

---

#### **FR-BUY-002: Three-Day Exclusivity Window** *(NEW in v2.2)*

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
- `exclusivity_expires_at` field stored on post when first offer received (`first_offer_at + 3 days`)
- After expiry: `GET /api/v1/posts/{post_id}` returns offers to any authenticated user
- Before expiry: offers visible only to `post.buyer_id`
- Hourly cron flips `is_public_discovery = TRUE` once `exclusivity_expires_at < NOW()`

**Acceptance Criteria:**
- ✅ When first offer arrives, `exclusivity_expires_at` is set automatically by trigger
- ✅ Other users' GET requests for this post's offers return empty during the window
- ✅ After 3 days, `is_public_discovery` flips to TRUE automatically
- ✅ Buyer receives push notification: "Your 3-day exclusive window is expiring in 24 hours"
- ✅ Post and offers now visible to other buyers in discovery feed
- ✅ Acceptance within the window suppresses public disclosure permanently

---

#### **FR-BUY-008: View & Manage Posts (Universal - All Categories)**

**Description:** Buyers can see their active posts and received offers across all categories.

**Requirements:**
- SHALL display all user's posts with status:
  - **Active** (accepting offers)
  - **Filled** (offer accepted, transaction in progress)
  - **Completed** (transaction finished, payment released)
  - **Expired** (no offers accepted before expiry)
  - **Cancelled** (buyer cancelled)
- SHALL show for each post:
  - Title, description, budget
  - Category and subcategory
  - Photos
  - Created date, expires date
  - Offer count (e.g., "8 offers")
  - Status
  - Quick actions (view offers, extend, cancel, mark filled)
- SHALL allow sorting:
  - Newest first
  - Most offers
  - Expiring soon
  - By category
- SHALL allow filtering:
  - Status (active, filled, completed, expired)
  - Category
  - Date range
  - Budget range
- SHALL allow actions:
  - **Edit post** (only if no offers received)
  - **Extend duration** (add 3 days, max 1 extension per post)
  - **Cancel post** (with confirmation)
  - **Mark as filled** (if hired/purchased outside platform)
  - **Repost** (create new post with same details)
- SHALL send notifications:
  - New offer received (push + email)
  - Post expiring soon (24h before)
  - Post expired with no offers (suggestions to improve)
  - Message from seller (push)

**API Endpoints:**
```
GET /api/v1/posts/my-posts
GET /api/v1/posts/{post_id}
PUT /api/v1/posts/{post_id}
DELETE /api/v1/posts/{post_id}
POST /api/v1/posts/{post_id}/extend
POST /api/v1/posts/{post_id}/mark-filled
POST /api/v1/posts/{post_id}/repost
```

**Get My Posts Response:**
```json
{
  "success": true,
  "total_posts": 18,
  "active_posts": 3,
  "by_category": {
    "home_services": 6,
    "products_buying": 8,
    "jobs_hiring": 2,
    "professional_services": 2
  },
  "posts": [
    {
      "post_id": "post_c9h0f1g14d5e",
      "category": "home_services",
      "subcategory": "plumbing_leak_repair",
      "title": "Bathroom sink dripping, need urgent repair",
      "status": "active",
      "budget_range": "$100-$300",
      "location": {
        "city": "Dallas",
        "zip": "75201"
      },
      "offer_count": 5,
      "photo_urls": [
        "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/photo1.jpg"
      ],
      "created_at": "2026-02-10T10:00:00Z",
      "expires_at": "2026-02-13T10:00:00Z",
      "time_remaining": "2 days",
      "can_edit": false,
      "can_extend": true,
      "new_offers": 2
    },
    {
      "post_id": "post_d0i1g2h15e6f",
      "category": "products_buying",
      "subcategory": "electronics_computers",
      "title": "Looking for used MacBook Pro 16-inch",
      "status": "active",
      "budget_range": "$1200-$2000",
      "location": {
        "city": "Dallas",
        "zip": "75201",
        "nationwide": false
      },
      "offer_count": 12,
      "photo_urls": [],
      "created_at": "2026-02-08T14:30:00Z",
      "expires_at": "2026-02-15T14:30:00Z",
      "time_remaining": "5 days",
      "can_edit": false,
      "can_extend": true,
      "new_offers": 3
    },
    {
      "post_id": "post_e1j2h3i16f7g",
      "category": "home_services",
      "subcategory": "hvac_installation",
      "title": "Need new AC unit installed",
      "status": "filled",
      "budget_range": "$3000-$5000",
      "location": {
        "city": "Dallas",
        "zip": "75201"
      },
      "offer_count": 8,
      "accepted_offer": {
        "seller_name": "Cool Air HVAC",
        "amount": 4200
      },
      "transaction_id": "txn_f2k3i4j17g8h",
      "created_at": "2026-02-05T09:00:00Z",
      "filled_at": "2026-02-06T15:20:00Z"
    }
  ]
}
```

**Extend Post Request:**
```
POST /api/v1/posts/{post_id}/extend
```

**Response:**
```json
{
  "success": true,
  "post_id": "post_c9h0f1g14d5e",
  "new_expires_at": "2026-02-16T10:00:00Z",
  "extensions_remaining": 0,
  "message": "Post extended by 3 days"
}
```

**Acceptance Criteria:**
- ✅ Posts load in <500ms
- ✅ New offers badge updates in real-time
- ✅ Cannot edit post after offers received
- ✅ Extension adds exactly 3 days
- ✅ Cannot extend more than once
- ✅ Cancelled posts removed from active feed but retained in history
- ✅ Repost pre-fills all fields from original
- ✅ Category filter shows all categories with active posts

---

#### **FR-BUY-003: View & Compare Offers (Universal - All Categories)**

**Description:** Buyers can review all offers received on their post across any category.

**Requirements:**
- SHALL display all offers for a post in list/card view
- SHALL show for each offer (universal fields):
  - Seller info:
    - Name, business name
    - Profile photo
    - Star rating (average)
    - Total reviews
    - Verification badges
    - Distance from buyer (for local transactions)
    - Response time (how fast they responded to post)
  - Offer details:
    - Quote amount OR price (for products)
    - Estimated timeline
    - Detailed message from seller
    - Attachments (portfolio photos, product photos, resume)
  - Seller stats:
    - Jobs/transactions completed
    - Response rate
    - On-time completion rate (for services)

- SHALL show **category-specific offer details**:

  **Services:**
  - Hourly rate or flat rate
  - Estimated hours
  - Warranty information
  - License verification badge
  - Insurance verification badge
  - Emergency availability
  
  **Products:**
  - Price
  - Condition (with photos)
  - Pickup location OR shipping options
  - Shipping cost (if applicable)
  - Return policy
  - Original packaging (yes/no)
  
  **Jobs (Applicants):**
  - Desired hourly rate OR salary
  - Availability (start date, hours/week)
  - Resume attachment
  - Cover letter/message
  - Years of experience
  - Relevant certifications
  
  **Inventory/Wholesale:**
  - Unit price
  - Minimum order quantity
  - Bulk pricing tiers
  - Delivery timeline
  - Payment terms
  - Samples available

- SHALL allow sorting:
  - Lowest price first
  - Highest rated first
  - Fastest response first
  - Closest distance first (for local)
  - Most relevant (algorithm-based)
  
- SHALL allow filtering:
  - Rating range (4.0-5.0)
  - Price range
  - Availability (can start within 24h, 48h, week)
  - Verification (licensed only, insured only, business only)
  - Location (distance for local)
  
- SHALL allow actions per offer:
  - **View full seller profile**
  - **Message seller** (ask questions)
  - **Accept offer** (proceed to payment/transaction)
  - **Decline offer** (optional reason)
  - **Counter offer** (Phase 2)
  
- SHALL support side-by-side comparison (select up to 3 offers)
- SHALL highlight "Best Match" based on algorithm (rating + price + distance + response time)
- SHALL show "Popular Choice" if multiple buyers hired this seller

**API Endpoint:**
```
GET /api/v1/posts/{post_id}/offers
```

**Response (Service Example - Plumbing):**
```json
{
  "success": true,
  "post_id": "post_c9h0f1g14d5e",
  "post_category": "home_services",
  "post_subcategory": "plumbing_leak_repair",
  "total_offers": 7,
  "best_match": "off_f2k3i4j17g8h",
  "offers": [
    {
      "offer_id": "off_f2k3i4j17g8h",
      "seller": {
        "seller_id": "usr_b8g9e0f13c4d",
        "name": "Miguel Rodriguez",
        "business_name": "Rodriguez Plumbing",
        "profile_photo": "https://cdn.reversemarket.com/sellers/usr_b8g9e0f13c4d/photo.jpg",
        "rating": 4.8,
        "total_reviews": 42,
        "total_jobs": 47,
        "response_rate": 95,
        "on_time_rate": 91,
        "distance_miles": 8.3,
        "badges": ["licensed", "insured", "top_rated", "fast_responder"]
      },
      "quote_amount": 225,
      "pricing_type": "flat_rate",
      "estimated_timeline": "Can start tomorrow (Feb 11), complete same day",
      "estimated_hours": 2,
      "specific_date": "2026-02-11",
      "message": "Hi Sarah, I can fix your leaking sink tomorrow morning. This is a common issue - usually a worn cartridge or gasket. I carry all common parts in my truck, so I can complete it in one visit (1-2 hours). Included: diagnosis, parts, labor, cleanup. Licensed master plumber, insured, 90-day warranty. Check out my reviews!",
      "attachments": [
        {
          "type": "portfolio_photo",
          "url": "https://cdn.reversemarket.com/sellers/usr_b8g9e0f13c4d/portfolio/sink_repair1.jpg",
          "caption": "Similar sink repair I did last week"
        }
      ],
      "warranty": "90-day warranty on parts and labor",
      "created_at": "2026-02-10T10:22:00Z",
      "response_time_minutes": 22,
      "status": "pending",
      "is_best_match": true
    }
  ]
}
```

**Response (Product Example - MacBook):**
```json
{
  "success": true,
  "post_id": "post_d0i1g2h15e6f",
  "post_category": "products_buying",
  "post_subcategory": "electronics_computers",
  "total_offers": 12,
  "best_match": "off_g3l4j5k18h9i",
  "offers": [
    {
      "offer_id": "off_g3l4j5k18h9i",
      "seller": {
        "seller_id": "usr_c9h0f1g14d5e",
        "name": "Tech Resale DFW",
        "business_name": "Tech Resale DFW",
        "profile_photo": "https://cdn.reversemarket.com/sellers/usr_c9h0f1g14d5e/photo.jpg",
        "rating": 4.9,
        "total_reviews": 156,
        "total_sales": 320,
        "response_rate": 98,
        "distance_miles": 12.7,
        "badges": ["verified_business", "top_rated", "fast_shipper"]
      },
      "price": 1650,
      "product_details": {
        "condition": "like_new",
        "model": "MacBook Pro 16-inch (2021)",
        "specs": "M1 Pro, 32GB RAM, 1TB SSD",
        "purchase_date": "2022-03-15",
        "original_packaging": true,
        "accessories_included": ["Original charger", "USB-C cable", "Original box"]
      },
      "photos": [
        "https://cdn.reversemarket.com/offers/off_g3l4j5k18h9i/photo1.jpg",
        "https://cdn.reversemarket.com/offers/off_g3l4j5k18h9i/photo2.jpg",
        "https://cdn.reversemarket.com/offers/off_g3l4j5k18h9i/photo3.jpg"
      ],
      "delivery_options": {
        "pickup": {
          "available": true,
          "location": "Richardson, TX 75080",
          "cost": 0
        },
        "shipping": {
          "available": true,
          "cost": 25,
          "carrier": "FedEx",
          "estimated_days": "2-3 business days"
        }
      },
      "return_policy": "30-day money-back guarantee. Full refund if not as described.",
      "message": "Hi! I have exactly what you're looking for. MacBook Pro 16-inch 2021 with M1 Pro, 32GB RAM, 1TB. Mint condition, only used for light office work. Comes with everything in original box. Battery health 96%. Can meet locally in Richardson or ship same day. Let me know!",
      "created_at": "2026-02-08T15:10:00Z",
      "response_time_minutes": 40,
      "status": "pending",
      "is_best_match": true
    }
  ]
}
```

**Side-by-Side Comparison View:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ COMPARE OFFERS                                                             │
├──────────────────────┬──────────────────────┬──────────────────────────────┤
│ Rodriguez Plumbing   │ Foster Plumbing      │ Smith Bros Plumbing          │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│ Price: $225          │ Price: $175 (lowest) │ Price: $285                  │
│ Rating: 4.8⭐ (42)   │ Rating: 4.9⭐ (8)    │ Rating: 4.7⭐ (156)          │
│ Can Start: Tomorrow  │ Can Start: Today ⚡  │ Can Start: Next week         │
│ Distance: 8.3 mi     │ Distance: 12.7 mi    │ Distance: 5.1 mi (closest)   │
│ Licensed: ✅ Master  │ Licensed: ✅ Journey │ Licensed: ✅ Master          │
│ Insured: ✅ $1M      │ Insured: ✅ $1M      │ Insured: ✅ $2M              │
│ Response: 22 min     │ Response: 35 min     │ Response: 2 hours            │
│ Warranty: 90 days    │ Warranty: 60 days    │ Warranty: 1 year             │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│ [Accept Offer]       │ [Accept Offer]       │ [Accept Offer]               │
│ [Message]            │ [Message]            │ [Message]                    │
│ [View Profile]       │ [View Profile]       │ [View Profile]               │
└──────────────────────┴──────────────────────┴──────────────────────────────┘
```

**Acceptance Criteria:**
- ✅ Offers load in <500ms
- ✅ Sorting/filtering updates instantly (client-side)
- ✅ "Best Match" algorithm considers: price (30%), rating (40%), distance (15%), response time (10%), completion rate (5%)
- ✅ Cannot accept multiple offers simultaneously
- ✅ Declined offers cannot be re-accepted
- ✅ Messaging opens threaded conversation
- ✅ Portfolio/product photos open in lightbox
- ✅ Category-specific fields display correctly

**Business Rules:**
- Cannot accept offer if post expired
- Cannot accept offer if already accepted another offer on same post
- Declining offer optional but encouraged (seller notification)
- Sellers notified immediately when offer declined/accepted
- Offers auto-expire when post expires

---

#### **FR-BUY-004: Accept Offer & Initiate Transaction (Universal - All Categories)**

**Description:** Buyer selects an offer and proceeds to payment/transaction initiation.

**Requirements:**
- SHALL display confirmation modal with offer details
- SHALL show final cost breakdown (category-specific):

  **Services:**
  - Seller's quote amount
  - Buyer service fee (5% of quote)
  - Stripe processing fee (2.9% + $0.30)
  - **Total charged to buyer**
  
  **Products (Shipped):**
  - Product price
  - Shipping cost (if applicable)
  - Buyer service fee (5% of total)
  - Stripe processing fee (2.9% + $0.30)
  - **Total charged to buyer**
  
  **Products (Local Pickup - Cash):**
  - Product price
  - **Platform fee: $0 (FREE)**
  - **Total: Product price only**
  - Note: "Pay seller directly with cash. No platform fees!"
  
  **Products (Local Pickup - Through Platform):**
  - Product price
  - Buyer service fee (3% for verified sellers)
  - Stripe processing fee (2.9% + $0.30)
  - **Total charged to buyer**
  
  **Jobs (Milestone):**
  - First milestone amount (typically 20-30% deposit)
  - Buyer service fee (5% of milestone)
  - Stripe processing fee (2.9% + $0.30)
  - **Total for first milestone**
  - Note: "Remaining milestones charged as work progresses"

- SHALL collect/confirm payment method:
  - Credit/debit card (Stripe)
  - Apple Pay
  - Google Pay
  - ACH bank transfer (Phase 2, for >$1000)
  
- SHALL handle transaction flow by category:

  **Services:**
  1. Charge buyer immediately
  2. Hold funds in escrow
  3. Notify seller of acceptance
  4. Require buyer to upload "before" photos (optional MVP, required Phase 2)
  5. Create transaction record
  6. Decline all other offers automatically
  
  **Products (Shipped):**
  1. Charge buyer immediately
  2. Hold funds in escrow
  3. Notify seller to ship
  4. Seller uploads tracking number
  5. Release funds after delivery confirmation + 3 days
  
  **Products (Local Pickup - Cash):**
  1. NO payment through platform
  2. Create meeting record
  3. Suggest public meetup locations
  4. Send safety tips
  5. After meetup, both parties confirm completion
  6. Prompt for ratings
  
  **Products (Local Pickup - Through Platform):**
  1. Charge buyer immediately
  2. Hold funds in escrow
  3. Generate QR code for in-person handoff
  4. Buyer scans QR at pickup → releases funds
  5. Or manual release after 24 hours
  
  **Jobs (First Milestone):**
  1. Charge first milestone
  2. Hold funds in escrow
  3. Create employment record
  4. Seller (applicant) starts work
  5. Subsequent milestones charged as phases complete

- SHALL display next steps to buyer (category-specific)
- SHALL update post status to "Filled"

**API Endpoint:**
```
POST /api/v1/offers/{offer_id}/accept
```

**Request Body (Service Example):**
```json
{
  "payment_method_id": "pm_stripe_abc123",
  "before_photos": [
    "https://s3.amazonaws.com/reversemarket-uploads/usr_a7f8d9e12b3c/before1.jpg",
    "https://s3.amazonaws.com/reversemarket-uploads/usr_a7f8d9e12b3c/before2.jpg"
  ],
  "special_instructions": "Please text me when you're on the way. Building code is 1234."
}
```

**Request Body (Product - Local Pickup Cash):**
```json
{
  "payment_method": "cash",
  "meetup_preference": {
    "location": "Starbucks, 123 Main St, Dallas, TX",
    "date": "2026-02-12",
    "time": "14:00"
  }
}
```

**Request Body (Product - Shipped):**
```json
{
  "payment_method_id": "pm_stripe_abc123",
  "shipping_address": {
    "name": "Sarah Martinez",
    "street": "123 Elm Street",
    "city": "Dallas",
    "state": "TX",
    "zip": "75201",
    "phone": "+14695557890"
  }
}
```

**Response (Service - Escrow):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_h4m5k6l19i0j",
    "transaction_type": "service",
    "post_id": "post_c9h0f1g14d5e",
    "offer_id": "off_f2k3i4j17g8h",
    "seller": {
      "seller_id": "usr_b8g9e0f13c4d",
      "name": "Miguel Rodriguez",
      "business_name": "Rodriguez Plumbing",
      "phone": "+14695551234",
      "email": "miguel@rodriguezplumbing.com"
    },
    "amount_breakdown": {
      "seller_quote": 225.00,
      "buyer_fee": 11.25,
      "stripe_fee": 6.85,
      "total_charged": 243.10
    },
    "status": "in_progress",
    "escrow_status": "held",
    "payment": {
      "charge_id": "ch_stripe_xyz789",
      "amount_charged": 243.10,
      "charged_at": "2026-02-10T15:30:00Z",
      "payment_method_last4": "4242"
    },
    "seller_payout": {
      "amount": 207.00,
      "platform_fee": 18.00,
      "status": "pending",
      "estimated_payout_date": "2026-02-17T00:00:00Z"
    },
    "created_at": "2026-02-10T15:30:00Z",
    "auto_release_at": "2026-02-17T15:30:00Z"
  },
  "next_steps": [
    "Miguel will contact you within 24 hours to confirm schedule",
    "You can message Miguel directly in the app",
    "Payment is held securely until job is complete",
    "You'll have 7 days to approve the work after completion",
    "Funds automatically release after 7 days if no issues reported"
  ],
  "message": "Offer accepted! Payment secured. Miguel will contact you soon."
}
```

**Response (Product - Local Cash):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_i5n6m7o20k1l",
    "transaction_type": "product_local_cash",
    "post_id": "post_d0i1g2h15e6f",
    "offer_id": "off_g3l4j5k18h9i",
    "seller": {
      "seller_id": "usr_c9h0f1g14d5e",
      "name": "Tech Resale DFW",
      "phone": "+14695558888"
    },
    "amount": 1650.00,
    "platform_fee": 0.00,
    "payment_method": "cash",
    "meetup": {
      "suggested_location": "Starbucks, 123 Main St, Dallas, TX",
      "suggested_date": "2026-02-12",
      "suggested_time": "14:00",
      "status": "pending_confirmation"
    },
    "status": "pending_meetup",
    "created_at": "2026-02-10T15:30:00Z"
  },
  "safety_tips": [
    "Meet in a public place during daylight hours",
    "Bring a friend if possible",
    "Inspect the item thoroughly before paying",
    "Count cash in a well-lit area",
    "Trust your instincts - if something feels wrong, walk away"
  ],
  "next_steps": [
    "Coordinate meetup time with seller via messaging",
    "Inspect MacBook thoroughly at meetup",
    "Pay seller $1650 in cash (NO platform fees!)",
    "After successful exchange, mark transaction as complete",
    "Rate your experience"
  ],
  "message": "Meetup arranged! Coordinate details with seller. Stay safe!"
}
```

**Fee Calculation (Buyer-Free Model — v2.2):**
```javascript
// CONFIRMED FEE STRUCTURE (v2.2)
// Buyers pay ZERO platform fees on all transaction types.
// Sellers pay commission on completed transactions only.

function calculateTransactionFees(amount, transactionType) {
  const STRIPE_FEE_PERCENT = 0.029;
  const STRIPE_FEE_FIXED = 0.30;

  if (transactionType === 'product_local_cash') {
    return { amount, buyerFee: 0, stripeFee: 0, totalCharged: amount,
             sellerFee: 0, sellerPayout: amount, platformNet: 0 };
  }

  let sellerFeePercent;
  if (transactionType === 'service') sellerFeePercent = 0.08;            // 8% (5–10% range, 8% default)
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

**Email Notification to Seller (Service Accepted):**
```
Subject: 🎉 You got hired! New job from Sarah Martinez

Hi Miguel,

Congratulations! Sarah Martinez accepted your offer for:

JOB: Bathroom sink dripping, need urgent repair
YOUR QUOTE: $225
YOUR PAYOUT: $207 (after 8% platform fee)
PAYMENT STATUS: Secured in escrow ($225)

NEXT STEPS:
1. Contact Sarah within 24 hours to confirm schedule
2. Complete the job by Feb 11, 2026
3. Upload completion photos when done
4. Get paid after buyer approval (or automatically after 7 days)

BUYER CONTACT:
Sarah Martinez
Phone: (469) 555-7890
Location: 123 Elm Street, Dallas, TX 75201
Special instructions: "Please text me when you're on the way. Building code is 1234."

[Message Sarah] [View Job Details] [Upload Completion Photos]

Payment is held securely in escrow. You'll be paid automatically after Sarah approves the work (or after 7 days if no response).

Good luck!
The [Platform Name] Team
```

**Acceptance Criteria:**
- ✅ Payment charges successfully within 3 seconds
- ✅ Funds held in escrow for service/shipped products (not immediately transferred to seller)
- ✅ Local cash transactions create meetup record with safety tips
- ✅ Buyer receives confirmation email with seller contact
- ✅ Seller receives notification within 60 seconds
- ✅ All other offers auto-declined with notification
- ✅ Transaction appears in both buyer and seller dashboards
- ✅ Failed payment shows clear error with retry option
- ✅ 3D Secure authentication for cards >$100
- ✅ Category-specific next steps displayed correctly

**Business Rules:**
- Cannot accept offer if post expired
- Cannot accept multiple offers for same post
- Payment method must be valid and have sufficient funds
- Escrow holds for maximum 14 days (auto-release varies by category)
- Buyer can cancel within 1 hour of acceptance for full refund (if seller hasn't started)
- Local cash transactions: platform facilitates connection only, no payment processing
- Shipped products: tracking number required within 3 business days or auto-refund

---

#### **FR-BUY-005: Transaction Monitoring (Universal - All Categories)**

**Description:** Buyer can track status of active transaction across any category.

**Requirements:**
- SHALL display transaction details (universal):
  - Post title and description
  - Seller contact info (name, phone, email)
  - Amount paid (or to be paid for cash transactions)
  - Escrow status (if applicable)
  - Current status
  - Timeline with checkpoints
  
- SHALL show **category-specific status tracking**:

  **Services:**
  - ✅ Offer Accepted → Payment Secured → Scheduled → On the Way → Started → Completed → Buyer Approved → Payment Released
  
  **Products (Shipped):**
  - ✅ Offer Accepted → Payment Secured → Seller Preparing → Shipped (tracking #) → In Transit → Delivered → Buyer Confirms → Payment Released
  
  **Products (Local Cash):**
  - ✅ Offer Accepted → Meetup Scheduled → Meeting Arranged → Completed (both confirm) → Rate Each Other
  
  **Products (Local Platform):**
  - ✅ Offer Accepted → Payment Secured → Meetup Scheduled → QR Code Generated → Scanned at Pickup → Payment Released
  
  **Jobs (Milestones):**
  - ✅ Offer Accepted → Milestone 1 Paid → Work Started → Milestone 1 Complete → Milestone 2 Paid → ... → Final Milestone → Job Complete

- SHALL display before photos (if uploaded at acceptance)
- SHALL show seller's updates (progress photos/notes, optional)
- SHALL allow messaging seller
- SHALL allow actions:
  - **Report issue** (opens dispute if work started)
  - **Cancel transaction** (only if not started, requires reason)
  - **Request update** (ping seller for status)
  - **Mark as complete** (for local cash transactions)
  - **Confirm delivery** (for shipped products)
  - **Request refund** (if seller hasn't shipped/started)
  
- SHALL send push notifications on status changes
- SHALL display countdown timer for auto-release (category-specific)

**API Endpoint:**
```
GET /api/v1/transactions/{transaction_id}
PUT /api/v1/transactions/{transaction_id}/cancel
POST /api/v1/transactions/{transaction_id}/request-update
POST /api/v1/transactions/{transaction_id}/confirm-delivery
POST /api/v1/transactions/{transaction_id}/mark-complete (local cash)
```

**Response (Service In Progress):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_h4m5k6l19i0j",
    "transaction_type": "service",
    "status": "in_progress",
    "post": {
      "post_id": "post_c9h0f1g14d5e",
      "category": "home_services",
      "subcategory": "plumbing_leak_repair",
      "title": "Bathroom sink dripping, need urgent repair",
      "description": "My bathroom sink has been dripping constantly...",
      "property_type": "single_family",
      "photos": [
        "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/photo1.jpg"
      ]
    },
    "seller": {
      "user_id": "usr_b8g9e0f13c4d",
      "name": "Miguel Rodriguez",
      "business_name": "Rodriguez Plumbing",
      "phone": "+14695551234",
      "email": "miguel@rodriguezplumbing.com",
      "profile_photo": "https://cdn.reversemarket.com/sellers/usr_b8g9e0f13c4d/photo.jpg",
      "location": {
        "address": "123 Elm Street, Dallas, TX 75201",
        "lat": 32.7767,
        "lng": -96.7970,
        "directions_url": "https://maps.google.com/?q=32.7767,-96.7970"
      },
      "special_instructions": "Please text me when you're on the way. Code is 1234."
    },
    "quote_amount": 225.00,
    "total_paid": 243.10,
    "escrow_status": "held",
    "scheduled_date": "2026-02-11T09:00:00Z",
    "before_photos": [
      "https://cdn.reversemarket.com/transactions/txn_h4m5k6l19i0j/before1.jpg"
    ],
    "progress_photos": [],
    "after_photos": [],
    "timeline": [
      {
        "event": "offer_accepted",
        "timestamp": "2026-02-10T15:30:00Z",
        "description": "You accepted Miguel's offer",
        "completed": true
      },
      {
        "event": "payment_secured",
        "timestamp": "2026-02-10T15:30:00Z",
        "description": "Payment secured in escrow ($243.10)",
        "completed": true
      },
      {
        "event": "scheduled",
        "timestamp": "2026-02-10T18:45:00Z",
        "description": "Miguel confirmed: Tomorrow 9:00 AM",
        "completed": true
      },
      {
        "event": "on_the_way",
        "timestamp": null,
        "description": "Miguel is on the way",
        "completed": false
      },
      {
        "event": "started",
        "timestamp": null,
        "description": "Work started",
        "completed": false,
        "estimated": "2026-02-11T09:00:00Z"
      },
      {
        "event": "completed",
        "timestamp": null,
        "description": "Work completed",
        "completed": false
      },
      {
        "event": "buyer_approved",
        "timestamp": null,
        "description": "Review and approve work",
        "completed": false
      },
      {
        "event": "payment_released",
        "timestamp": null,
        "description": "Payment released to Miguel",
        "completed": false,
        "auto_release_at": "2026-02-18T15:30:00Z"
      }
    ],
    "seller_updates": [
      {
        "update_id": "upd_i5n6l7m20j1k",
        "message": "Confirmed! I'll be there tomorrow at 9 AM. Should take 1-2 hours.",
        "timestamp": "2026-02-10T18:45:00Z"
      }
    ],
    "messages_unread": 1,
    "created_at": "2026-02-10T15:30:00Z",
    "auto_release_at": "2026-02-18T15:30:00Z",
    "can_cancel": true,
    "can_dispute": false
  }
}
```

**Response (Product - Shipped):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_j6o7n8p21l2m",
    "transaction_type": "product_shipped",
    "status": "in_transit",
    "post": {
      "post_id": "post_d0i1g2h15e6f",
      "category": "products_buying",
      "subcategory": "electronics_computers",
      "title": "Looking for used MacBook Pro 16-inch"
    },
    "seller": {
      "user_id": "usr_c9h0f1g14d5e",
      "name": "Tech Resale DFW",
      "phone": "+14695558888",
      "email": "techresale@example.com"
    },
    "product": {
      "name": "MacBook Pro 16-inch (2021)",
      "condition": "like_new",
      "price": 1650.00
    },
    "shipping": {
      "carrier": "FedEx",
      "tracking_number": "123456789012",
      "tracking_url": "https://www.fedex.com/track?number=123456789012",
      "shipped_date": "2026-02-11T10:00:00Z",
      "estimated_delivery": "2026-02-14T00:00:00Z",
      "delivery_address": {
        "name": "Sarah Martinez",
        "street": "123 Elm Street",
        "city": "Dallas",
        "state": "TX",
        "zip": "75201"
      }
    },
    "total_paid": 1783.04,
    "escrow_status": "held",
    "timeline": [
      {
        "event": "offer_accepted",
        "timestamp": "2026-02-10T15:30:00Z",
        "description": "You accepted the offer",
        "completed": true
      },
      {
        "event": "payment_secured",
        "timestamp": "2026-02-10T15:30:00Z",
        "description": "Payment secured in escrow ($1783.04)",
        "completed": true
      },
      {
        "event": "seller_preparing",
        "timestamp": "2026-02-10T16:00:00Z",
        "description": "Seller preparing item for shipment",
        "completed": true
      },
      {
        "event": "shipped",
        "timestamp": "2026-02-11T10:00:00Z",
        "description": "Item shipped (FedEx tracking: 123456789012)",
        "completed": true
      },
      {
        "event": "in_transit",
        "timestamp": "2026-02-11T14:30:00Z",
        "description": "In transit to Dallas, TX",
        "completed": true,
        "tracking_updates": [
          {
            "status": "Picked up",
            "location": "Richardson, TX",
            "timestamp": "2026-02-11T10:30:00Z"
          },
          {
            "status": "In transit",
            "location": "Dallas Distribution Center",
            "timestamp": "2026-02-11T14:30:00Z"
          }
        ]
      },
      {
        "event": "delivered",
        "timestamp": null,
        "description": "Delivered to your address",
        "completed": false,
        "estimated": "2026-02-14T00:00:00Z"
      },
      {
        "event": "buyer_confirms",
        "timestamp": null,
        "description": "Confirm receipt and inspect item",
        "completed": false
      },
      {
        "event": "payment_released",
        "timestamp": null,
        "description": "Payment released to seller",
        "completed": false,
        "auto_release_at": "2026-02-17T00:00:00Z"
      }
    ],
    "messages_unread": 0,
    "created_at": "2026-02-10T15:30:00Z",
    "auto_release_at": "2026-02-17T00:00:00Z",
    "can_cancel": false,
    "can_dispute": true
  }
}
```

**Response (Product - Local Cash):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_k7p8o9q22m3n",
    "transaction_type": "product_local_cash",
    "status": "meetup_scheduled",
    "post": {
      "post_id": "post_e1j2h3i16f7g",
      "category": "products_buying",
      "subcategory": "furniture",
      "title": "Looking for dining table"
    },
    "seller": {
      "user_id": "usr_d0i1g2h15e6f",
      "name": "John Smith",
      "phone": "+14695559999"
    },
    "product": {
      "name": "Wooden dining table (seats 6)",
      "condition": "good",
      "price": 300.00
    },
    "meetup": {
      "location": "Starbucks, 456 Oak Ave, Dallas, TX 75201",
      "date": "2026-02-12",
      "time": "15:00",
      "status": "confirmed",
      "confirmed_by_seller": true,
      "confirmed_by_buyer": true
    },
    "amount": 300.00,
    "platform_fee": 0.00,
    "payment_method": "cash",
    "timeline": [
      {
        "event": "offer_accepted",
        "timestamp": "2026-02-10T15:30:00Z",
        "description": "You accepted the offer",
        "completed": true
      },
      {
        "event": "meetup_proposed",
        "timestamp": "2026-02-10T15:35:00Z",
        "description": "You proposed meetup: Feb 12 at 3:00 PM",
        "completed": true
      },
      {
        "event": "meetup_confirmed",
        "timestamp": "2026-02-10T16:00:00Z",
        "description": "Seller confirmed meetup",
        "completed": true
      },
      {
        "event": "meetup_completed",
        "timestamp": null,
        "description": "Both parties confirm successful exchange",
        "completed": false
      },
      {
        "event": "rate_each_other",
        "timestamp": null,
        "description": "Rate your experience",
        "completed": false
      }
    ],
    "safety_tips": [
      "Meet in a public place during daylight hours",
      "Bring a friend if possible",
      "Inspect the item thoroughly before paying",
      "Count cash in a well-lit area",
      "Trust your instincts"
    ],
    "messages_unread": 0,
    "created_at": "2026-02-10T15:30:00Z"
  }
}
```

**Cancel Transaction Request:**
```json
{
  "reason": "emergency_cancel",
  "explanation": "Family emergency, need to reschedule",
  "offer_reschedule": true
}
```

**Acceptance Criteria:**
- ✅ Transaction details load in <500ms
- ✅ Timeline updates in real-time (Phase 2: WebSocket)
- ✅ Push notifications sent at each milestone
- ✅ Can cancel before work/shipping starts (full refund minus $5 processing)
- ✅ Cannot cancel after work started or item shipped (must complete or dispute)
- ✅ Seller contact info visible only after payment
- ✅ Auto-release countdown displayed prominently
- ✅ Tracking updates refresh every 30 minutes (shipped products)
- ✅ Safety tips displayed for cash transactions

**Business Rules (Category-Specific):**
- **Services:** Auto-release after 7 days if buyer doesn't respond
- **Products (Shipped):** Auto-release 3 days after delivery confirmation
- **Products (Local Cash):** No auto-release, requires both parties to confirm completion
- **Products (Local Platform):** Auto-release 24 hours after QR scan or manual confirmation
- **Jobs (Milestones):** Each milestone has its own auto-release (7 days after completion)

---

#### **FR-BUY-006: Transaction Completion & Approval (Universal - All Categories)**

**Description:** Buyer approves work/delivery and releases payment to seller.

**Requirements:**
- SHALL notify buyer when seller marks transaction complete
- SHALL display seller's completion evidence (category-specific)
- SHALL provide approval workflow based on category:

  **Services:**
  1. Seller uploads "after" photos
  2. Buyer reviews after photos
  3. Buyer uploads their own after photos (Phase 2 required)
  4. Buyer approves OR requests changes OR disputes
  5. Funds released on approval
  
  **Products (Shipped):**
  1. Carrier confirms delivery
  2. Buyer confirms receipt
  3. Buyer inspects product
  4. Buyer approves OR initiates return/dispute
  5. Funds released 3 days after approval (return window)
  
  **Products (Local Cash):**
  1. Both parties meet
  2. Buyer inspects product
  3. Buyer pays seller in cash directly
  4. Both parties mark as complete in app
  5. Rate each other (no payment through platform)
  
  **Products (Local Platform):**
  1. Both parties meet
  2. Buyer scans seller's QR code
  3. Buyer inspects product
  4. Confirms via app OR manually within 24h
  5. Funds released immediately or after 24h
  
  **Jobs (Milestone):**
  1. Seller marks milestone complete with evidence
  2. Buyer reviews deliverables
  3. Buyer approves milestone
  4. Funds for that milestone released
  5. Process repeats for each milestone

- SHALL implement auto-release timers (category-specific)
- SHALL attach completion evidence to transaction record
- SHALL calculate seller payout
- SHALL initiate Stripe payout

**API Endpoints:**
```
POST /api/v1/transactions/{transaction_id}/approve
POST /api/v1/transactions/{transaction_id}/request-changes
POST /api/v1/transactions/{transaction_id}/dispute
POST /api/v1/transactions/{transaction_id}/upload-after-photos
POST /api/v1/transactions/{transaction_id}/confirm-receipt (shipped products)
POST /api/v1/transactions/{transaction_id}/mark-complete (local cash, both parties)
POST /api/v1/transactions/{transaction_id}/scan-qr (local platform)
```

**Approve Completion Request (Service):**
```json
{
  "after_photos": [
    "https://s3.amazonaws.com/reversemarket-uploads/usr_a7f8d9e12b3c/after1.jpg",
    "https://s3.amazonaws.com/reversemarket-uploads/usr_a7f8d9e12b3c/after2.jpg"
  ],
  "completion_notes": "Excellent work! Miguel fixed the leak perfectly. Very professional and cleaned up after himself. Highly recommend!"
}
```

**Approve Completion Response (Service):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_h4m5k6l19i0j",
    "status": "completed",
    "completed_at": "2026-02-11T11:45:00Z",
    "escrow_status": "released",
    "seller_payout": {
      "amount": 207.00,
      "platform_fee": 18.00,
      "stripe_transfer_id": "tr_stripe_abc123",
      "status": "paid",
      "paid_at": "2026-02-11T11:45:00Z",
      "arrives_by": "2026-02-12T00:00:00Z"
    }
  },
  "message": "Payment released! Miguel will receive $207 in 1-2 business days.",
  "next_step": "Please rate your experience with Miguel"
}
```

**Confirm Receipt Request (Shipped Product):**
```json
{
  "received": true,
  "condition_as_described": true,
  "notes": "MacBook arrived in perfect condition, exactly as described. Very happy with purchase!"
}
```

**Mark Complete Request (Local Cash - Both Parties Must Call):**
```json
{
  "user_role": "buyer",
  "completed": true,
  "cash_paid": 300.00,
  "product_received": true,
  "notes": "Great transaction, table is perfect!"
}
```

**Scan QR Response (Local Platform):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_l8q9p0r23n4o",
    "status": "completed",
    "qr_scanned_at": "2026-02-12T15:05:00Z",
    "payment_released": true,
    "seller_payout": {
      "amount": 1567.50,
      "platform_fee": 82.50,
      "status": "paid"
    }
  },
  "message": "Transaction complete! Payment released to seller."
}
```

**Auto-Release Logic (Category-Specific):**
```javascript
// Cron job runs daily at 12:00 AM UTC
async function processAutoReleases() {
  // Services: 7 days after marked complete
  const serviceTransactions = await db.query(`
    SELECT * FROM transactions
    WHERE status = 'awaiting_buyer_approval'
    AND transaction_type = 'service'
    AND completed_at < NOW() - INTERVAL '7 days'
    AND escrow_status = 'held'
  `);
  
  // Products shipped: 3 days after delivery
  const shippedProducts = await db.query(`
    SELECT * FROM transactions
    WHERE status = 'delivered'
    AND transaction_type = 'product_shipped'
    AND delivered_at < NOW() - INTERVAL '3 days'
    AND escrow_status = 'held'
  `);
  
  // Products local platform: 24 hours after QR scan
  const localPlatform = await db.query(`
    SELECT * FROM transactions
    WHERE status = 'qr_scanned'
    AND transaction_type = 'product_local_platform'
    AND qr_scanned_at < NOW() - INTERVAL '24 hours'
    AND escrow_status = 'held'
  `);
  
  const allTransactions = [...serviceTransactions, ...shippedProducts, ...localPlatform];
  
  for (const txn of allTransactions) {
    await releasePayment(txn.transaction_id, 'auto_release');
    await sendEmail(txn.buyer_id, 'auto_release_buyer_notification');
    await sendEmail(txn.seller_id, 'auto_release_seller_notification');
    await logEvent('auto_release', txn.transaction_id);
  }
}
```

**Acceptance Criteria:**
- ✅ Approval releases payment within 60 seconds
- ✅ Seller receives email confirmation immediately
- ✅ Bank transfer initiated same day (arrives 1-2 business days)
- ✅ Both parties prompted to rate after approval
- ✅ Cannot approve/dispute after auto-release
- ✅ Category-specific approval flows work correctly
- ✅ After photos attached to transaction record
- ✅ Transaction marked "Completed" in both dashboards
- ✅ Local cash transactions require both parties to confirm
- ✅ QR code scan releases funds immediately for local platform

**Business Rules:**
- Auto-release timing varies by category (see above)
- Buyer can still leave review after auto-release (60-day window)
- Services: Maximum 2 "request changes" per transaction
- Shipped products: 3-day inspection window after delivery
- Local cash: No auto-release, manual confirmation required from both
- Local platform: QR scan OR manual confirmation within 24h
- Jobs: Each milestone approved independently

---

#### **FR-BUY-007: Rating & Review (Universal - All Categories)**

**Description:** Buyer rates seller after transaction completion across all categories.

**Requirements:**
- SHALL prompt buyer immediately after approval
- SHALL collect universal fields:
  - **Overall rating** (1-5 stars, required)
  - **Category-specific ratings** (optional, 1-5 stars each)
  - **Written review** (optional, 10-500 chars)
  - **Recommend to others** (Yes/No toggle)
  
- SHALL collect **category-specific ratings**:

  **Services:**
  - Quality of work
  - Communication
  - Timeliness
  - Professionalism
  - Value for money
  
  **Products:**
  - Accuracy of description
  - Product condition
  - Communication
  - Shipping speed (if shipped)
  - Packaging quality (if shipped)
  
  **Jobs (Employer rating applicant):**
  - Work quality
  - Reliability
  - Communication
  - Skills match
  - Professionalism

- SHALL auto-attach completion evidence (photos, tracking, etc.)
- SHALL be immutable once submitted (no editing)
- SHALL send push notification reminders to leave a review for **3 days** after transaction completion
- SHALL generate an **automatic 5-star review** if no review is submitted after 3 days (similar to Mercari's approach)
- SHALL allow skipping initial prompt (reminders continue for 3 days before auto-review)
- SHALL notify seller of new review (push + email)
- SHALL update seller's average rating immediately
- SHALL display review on seller's profile
- SHALL flag reviews containing profanity, personal info, spam
- SHALL preserve reviews even if the reviewing user deletes their account (reviewer's name stays on reviews, NOT anonymized)

**API Endpoint:**
```
POST /api/v1/reviews
PUT /api/v1/reviews/{review_id}/report (if inappropriate)
```

**Submit Review Request (Service):**
```json
{
  "transaction_id": "txn_h4m5k6l19i0j",
  "seller_id": "usr_b8g9e0f13c4d",
  "overall_rating": 5.0,
  "category_ratings": {
    "quality": 5.0,
    "communication": 5.0,
    "timeliness": 4.5,
    "professionalism": 5.0,
    "value": 5.0
  },
  "review_text": "Excellent plumber! Miguel showed up on time, fixed the leak quickly, and cleaned up after himself. Very professional and friendly. I'll definitely hire him again for future plumbing needs.",
  "recommend": true,
  "photos_attached": true
}
```

**Submit Review Request (Product):**
```json
{
  "transaction_id": "txn_j6o7n8p21l2m",
  "seller_id": "usr_c9h0f1g14d5e",
  "overall_rating": 5.0,
  "category_ratings": {
    "accuracy": 5.0,
    "condition": 5.0,
    "communication": 5.0,
    "shipping_speed": 4.5,
    "packaging": 5.0
  },
  "review_text": "MacBook is exactly as described - mint condition, all accessories included. Seller was very responsive and shipped quickly. Highly recommend Tech Resale DFW!",
  "recommend": true,
  "photos_attached": false
}
```

**Submit Review Response:**
```json
{
  "success": true,
  "review": {
    "review_id": "rev_k7p8n9o22l3m",
    "transaction_id": "txn_h4m5k6l19i0j",
    "seller_id": "usr_b8g9e0f13c4d",
    "buyer": {
      "name": "Sarah M.",
      "location": "Dallas, TX",
      "verified_buyer": true
    },
    "overall_rating": 5.0,
    "category_ratings": {
      "quality": 5.0,
      "communication": 5.0,
      "timeliness": 4.5,
      "professionalism": 5.0,
      "value": 5.0
    },
    "review_text": "Excellent plumber! Miguel showed up on time...",
    "recommend": true,
    "completion_evidence": {
      "before_photos": [
        "https://cdn.reversemarket.com/reviews/rev_k7p8n9o22l3m/before1.jpg"
      ],
      "after_photos": [
        "https://cdn.reversemarket.com/reviews/rev_k7p8n9o22l3m/after1.jpg"
      ]
    },
    "created_at": "2026-02-11T12:00:00Z",
    "verified_transaction": true,
    "transaction_category": "home_services"
  },
  "seller_updated_stats": {
    "average_rating": 4.81,
    "total_reviews": 43,
    "five_star_count": 39,
    "four_star_count": 3,
    "three_star_count": 1,
    "by_category": {
      "home_services": {
        "average_rating": 4.85,
        "total_reviews": 38
      }
    }
  },
  "message": "Review submitted! Thank you for your feedback."
}
```

**Rating Calculation (Weighted by Category & Recency):**
```javascript
function calculateSellerRating(seller_id) {
  // Get all reviews, grouped by category
  const reviews = await db.query(`
    SELECT r.overall_rating, r.created_at, t.category
    FROM reviews r
    JOIN transactions t ON r.transaction_id = t.transaction_id
    WHERE r.seller_id = $1
    ORDER BY r.created_at DESC
    LIMIT 100
  `, [seller_id]);
  
  let overallWeightedSum = 0;
  let overallWeightTotal = 0;
  
  reviews.forEach((review, index) => {
    // Recent reviews get higher weight (exponential decay)
    const recencyWeight = Math.exp(-index / 20);
    overallWeightedSum += review.overall_rating * recencyWeight;
    overallWeightTotal += recencyWeight;
  });
  
  const overallRating = overallWeightedSum / overallWeightTotal;
  
  // Calculate per-category ratings
  const byCategory = {};
  const categories = [...new Set(reviews.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryReviews = reviews.filter(r => r.category === category);
    let catWeightedSum = 0;
    let catWeightTotal = 0;
    
    categoryReviews.forEach((review, index) => {
      const weight = Math.exp(-index / 15);
      catWeightedSum += review.overall_rating * weight;
      catWeightTotal += weight;
    });
    
    byCategory[category] = {
      average_rating: Math.round((catWeightedSum / catWeightTotal) * 10) / 10,
      total_reviews: categoryReviews.length
    };
  });
  
  return {
    overall_rating: Math.round(overallRating * 10) / 10,
    by_category: byCategory
  };
}
```

**Email Notification to Seller:**
```
Subject: ⭐ New 5-star review from Sarah Martinez!

Hi Miguel,

You received a new review!

BUYER: Sarah Martinez
CATEGORY: Plumbing - Leak Repair
JOB: Bathroom sink dripping, need urgent repair
RATING: ⭐⭐⭐⭐⭐ (5.0)

REVIEW:
"Excellent plumber! Miguel showed up on time, fixed the leak quickly, and cleaned up after himself. Very professional and friendly. I'll definitely hire him again for future plumbing needs."

CATEGORY RATINGS:
• Quality of work: 5.0 ⭐
• Communication: 5.0 ⭐
• Timeliness: 4.5 ⭐
• Professionalism: 5.0 ⭐
• Value for money: 5.0 ⭐

UPDATED STATS:
Overall Rating: 4.81 ⭐ (43 reviews)
Plumbing Rating: 4.85 ⭐ (38 plumbing reviews)
Recommendation Rate: 95%

[View Full Review] [View Your Profile] [See Before/After Photos]

Keep delivering great service! Your 5-star reviews help you win more jobs.

The [Platform Name] Team
```

**Acceptance Criteria:**
- ✅ Review prompt appears immediately after approval
- ✅ Can skip and review later (60-day window)
- ✅ Cannot submit duplicate review for same transaction
- ✅ Seller's average rating updates within 60 seconds
- ✅ Review visible on seller profile immediately
- ✅ Flagged reviews hidden pending admin review
- ✅ Completion evidence attached automatically
- ✅ Review shows "Verified Transaction" badge
- ✅ Category-specific ratings display correctly

**Business Rules:**
- Only buyers who completed paid transactions can review
- One review per transaction (no editing after submission)
- Reviews remain visible even if seller OR buyer account is deactivated or deleted (reviewer's name stays on reviews, NOT anonymized)
- Must be explicitly stated in Terms & Conditions: "If you delete your account, your previous interaction data like reviews or ratings will remain. Your name will still be there."
- Platform can remove reviews violating TOS
- Sellers can respond to reviews once (Phase 2)
- Reviews factor into search ranking and "Top-Rated" badge
- Category-specific ratings help buyers find specialists
- Auto 5-star review generated after 3-day reminder period if buyer does not submit a review

---

### **8.3 SELLER JOURNEY (UNIVERSAL - ALL CATEGORIES)**

#### **FR-SEL-001: Browse Buyer Requests (Universal Feed)**

**Description:** Sellers discover opportunities across all categories they support. Sellers are auto-notified when buyer posts match their categories and location/radius.

**Requirements:**
- SHALL display feed of buyer posts matching seller's:
  - Service/product categories
  - Service radius (for local services)
  - Geographic preferences (local, regional, nationwide)
  - Verification level (seller meets buyer's requirements)
- SHALL auto-notify sellers (push notification) when a new buyer post matches their categories and service area
- SHALL group requests by category, distance, and time posted to avoid "wall of text"
  
- SHALL show post card with universal fields:
  - Title
  - Budget range (or price for products)
  - Category and subcategory badges
  - Location (distance for local, city for regional, "Nationwide" for remote)
  - Posted time ago (e.g., "2 hours ago")
  - Expires in (e.g., "70 hours remaining")
  - Number of offers already received
  - Urgency indicator
  - Photo count
  - Buyer rating (if repeat buyer)
  
- SHALL show **category-specific indicators**:

  **Services:**
  - 🔥 Emergency needed
  - 🏠 Property type
  - ⚡ ASAP / This week / Flexible
  - 📜 License required
  
  **Products:**
  - 📦 Condition preference
  - 🚚 Pickup / Shipping / Either
  - 🆕 New / Used / Any
  
  **Jobs:**
  - 💼 Full-time / Part-time / Contract
  - 💰 Salary range
  - 📍 On-site / Remote / Hybrid
  - 📅 Start date
  
  **Inventory/Wholesale:**
  - 📊 Quantity needed
  - 🔄 Frequency (One-time / Recurring)
  - 🏢 B2B only

- SHALL support filtering:
  - Category (multi-select)
  - Budget/price range
  - Distance (for local)
  - Urgency
  - Posted date (Last 24h, Last 3 days, Last week)
  - Offers received (0-2, 3-5, 6+)
  - Transaction type (B2B, B2C, C2C)
  
- SHALL support sorting:
  - **Newest first** (default)
  - **Expiring soon**
  - **Highest budget**
  - **Closest distance**
  - **Fewest offers** (less competition)
  - **Most relevant** (algorithm-based on seller's history)
  
- SHALL support keyword search (title + description)
- SHALL highlight posts from:
  - Repeat buyers (worked with seller before)
  - Verified buyers
  - High-rated buyers
  
- SHALL show estimated competition level:
  - 🟢 Low (0-2 offers)
  - 🟡 Medium (3-5 offers)
  - 🔴 High (6+ offers)
  
- SHALL refresh feed in real-time (Phase 2: WebSocket)
- SHALL allow saving posts for later (bookmark, Phase 2)

**API Endpoint:**
```
GET /api/v1/posts/feed
```

**Query Parameters:**
```
?categories=plumbing,electrical,products_selling
&max_distance=25
&min_budget=100
&max_budget=5000
&transaction_types=b2c,c2c
&urgency=asap,within_1_week
&sort=newest
&page=1
&limit=20
```

**Response:**
```json
{
  "success": true,
  "total_posts": 124,
  "page": 1,
  "per_page": 20,
  "filters_applied": {
    "categories": ["plumbing", "electrical", "products_selling"],
    "max_distance": 25,
    "transaction_types": ["b2c", "c2c"]
  },
  "posts": [
    {
      "post_id": "post_c9h0f1g14d5e",
      "category": "home_services",
      "subcategory": "plumbing_leak_repair",
      "transaction_type": "b2c",
      "title": "Bathroom sink dripping, need urgent repair",
      "budget_range": "$100-$300",
      "budget_open": false,
      "location": {
        "city": "Dallas",
        "zip": "75201",
        "distance_miles": 8.3,
        "type": "local"
      },
      "posted_ago": "2 hours ago",
      "expires_in": "70 hours",
      "urgency": "asap",
      "urgency_label": "ASAP",
      "urgency_color": "red",
      "offer_count": 3,
      "competition_level": "medium",
      "photo_count": 2,
      "photos": [
        {
          "url": "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/thumb_photo1.jpg",
          "thumbnail": true
        }
      ],
      "buyer": {
        "name": "Sarah M.",
        "rating": 4.9,
        "total_posts": 4,
        "verified": true
      },
      "requirements": {
        "min_rating": 4.0,
        "licensed_only": true,
        "verified_only": true
      },
      "meets_requirements": true,
      "can_bid": true,
      "category_specific": {
        "property_type": "single_family",
        "emergency_needed": false
      },
      "created_at": "2026-02-10T10:00:00Z",
      "expires_at": "2026-02-13T10:00:00Z"
    },
    {
      "post_id": "post_d0i1g2h15e6f",
      "category": "products_buying",
      "subcategory": "electronics_computers",
      "transaction_type": "c2c",
      "title": "Looking for used MacBook Pro 16-inch (2021 or newer)",
      "budget_range": "$1200-$2000",
      "budget_open": false,
      "location": {
        "city": "Dallas",
        "state": "TX",
        "distance_miles": 8.3,
        "type": "local_or_shipped"
      },
      "posted_ago": "5 hours ago",
      "expires_in": "163 hours",
      "urgency": "within_2_weeks",
      "urgency_label": "Within 2 weeks",
      "urgency_color": "green",
      "offer_count": 12,
      "competition_level": "high",
      "photo_count": 0,
      "photos": [],
      "buyer": {
        "name": "John D.",
        "rating": 4.7,
        "total_posts": 8,
        "verified": true
      },
      "requirements": {
        "min_rating": 4.0,
        "verified_only": true
      },
      "meets_requirements": true,
      "can_bid": true,
      "category_specific": {
        "condition_preference": ["like_new", "used"],
        "pickup_vs_shipping": "either",
        "brand": "Apple"
      },
      "created_at": "2026-02-10T07:00:00Z",
      "expires_at": "2026-02-17T07:00:00Z"
    },
    {
      "post_id": "post_e1j2h3i16f7g",
      "category": "jobs_hiring",
      "subcategory": "administrative",
      "transaction_type": "b2c",
      "title": "Hiring part-time bookkeeper for small business",
      "budget_range": "$25-$35/hour",
      "budget_open": false,
      "location": {
        "city": "Arlington",
        "state": "TX",
        "distance_miles": 18.5,
        "type": "hybrid"
      },
      "posted_ago": "1 day ago",
      "expires_in": "6 days",
      "urgency": "within_1_week",
      "urgency_label": "Start within 1 week",
      "urgency_color": "orange",
      "offer_count": 15,
      "competition_level": "high",
      "photo_count": 0,
      "photos": [],
      "buyer": {
        "name": "James C.",
        "rating": 5.0,
        "total_posts": 3,
        "verified": true,
        "badges": ["repeat_buyer", "verified_business"]
      },
      "requirements": {
        "min_rating": 4.5,
        "verified_only": true
      },
      "meets_requirements": true,
      "can_bid": true,
      "category_specific": {
        "job_type": "part_time",
        "hours_per_week": "15-20",
        "work_location": "hybrid",
        "start_date": "2026-03-01"
      },
      "created_at": "2026-02-09T10:00:00Z",
      "expires_at": "2026-02-16T10:00:00Z",
      "highlight": "Verified business - reliable employer"
    }
  ]
}
```

**Feed UI/UX (Multi-Category):**
```
┌─────────────────────────────────────────────────────────────────┐
│ FILTERS: Categories: All (3) | Budget: Any | Distance: 25mi     │
│ Sort: Newest ▼                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔧 HOME SERVICES • PLUMBING                                     │
│ 🔥 ASAP • Posted 2h ago • Expires in 70h • 3 offers (🟡 Med)  │
│                                                                 │
│ Bathroom sink dripping, need urgent repair                     │
│ $100-$300 • 8.3 mi • Single-family home                        │
│                                                                 │
│ [Photo] [Photo]                                                 │
│                                                                 │
│ Sarah M. ⭐ 4.9 • Verified ✓ • 4 posts                         │
│ Requirements: Licensed ✓ • 4.0+ rating ✓ • Verified ✓          │
│                                                                 │
│ [View Details] [Submit Offer]                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💻 PRODUCTS • ELECTRONICS                                       │
│ ⏰ Within 2 weeks • Posted 5h ago • 12 offers (🔴 High)        │
│                                                                 │
│ Looking for used MacBook Pro 16-inch (2021 or newer)          │
│ $1200-$2000 • 8.3 mi or ship • Like new / Used condition      │
│                                                                 │
│ John D. ⭐ 4.7 • Verified ✓ • 8 posts                          │
│ Requirements: 4.0+ rating ✓ • Verified ✓                       │
│                                                                 │
│ [View Details] [Submit Offer]                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💼 JOBS • ADMINISTRATIVE                                        │
│ 📅 Start Mar 1 • Posted 1d ago • 15 offers (🔴 High)          │
│                                                                 │
│ Hiring part-time bookkeeper for small business                │
│ $25-$35/hr • 15-20 hrs/week • Hybrid (Arlington, TX)          │
│                                                                 │
│ James C. ⭐ 5.0 • Verified Business 🏢 • 3 posts               │
│ 🏆 Verified business - reliable employer                       │
│                                                                 │
│ [View Details] [Submit Offer]                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- ✅ Feed loads in <500ms
- ✅ Filters apply instantly (client-side)
- ✅ New posts appear at top (refresh every 60s or WebSocket Phase 2)
- ✅ Distance calculated from seller's service area center
- ✅ Cannot see posts outside service radius (for local services)
- ✅ Cannot see posts below seller's verification tier
- ✅ "Meets requirements" badge accurate
- ✅ Competition level updates as offers added
- ✅ Category-specific indicators display correctly
- ✅ Can filter by multiple categories simultaneously

---

#### **FR-SEL-002: View Post Details (Universal - All Categories)**

**Description:** Seller views full buyer request before submitting offer.

**Requirements:**
- SHALL display complete post information (universal):
  - Title, full description
  - All photos/videos (full size, lightbox)
  - Budget range
  - Location
  - Timeline/urgency
  - Special requirements
  - Buyer profile
  - Competition info
  
- SHALL show **category-specific details**:

  **Services:**
  - Property type
  - Emergency service needed
  - Preferred contact method
  - Access instructions
  
  **Products (Buying):**
  - Condition preference
  - Brand/model specifications
  - Pickup vs shipping preference
  - Original packaging required
  
  **Products (Selling):**
  - Condition
  - Included accessories
  - Pickup location OR shipping availability
  - Return policy
  
  **Jobs:**
  - Job type (Full/Part/Contract)
  - Hours per week
  - Required qualifications
  - Work location type
  - Start date
  - Benefits (if any)
  
  **Inventory/Wholesale:**
  - Quantity needed
  - Specifications/certifications
  - Frequency (one-time/recurring)
  - Delivery requirements
  - Payment terms preferred

- SHALL show "Submit Offer" button (prominent CTA)
- SHALL show estimated earnings calculator:
  - Seller enters quote/price
  - Shows: Quote - Platform fee = Your payout
  - Category-specific fees displayed
  
- SHALL allow messaging buyer (ask questions before offering)
- SHALL show map with location (zoom level varies by category)
- SHALL display similar transactions seller completed (if any)

**API Endpoint:**
```
GET /api/v1/posts/{post_id}
```

**Response (Service Example):**
```json
{
  "success": true,
  "post": {
    "post_id": "post_c9h0f1g14d5e",
    "category": "home_services",
    "subcategory": "plumbing_leak_repair",
    "transaction_type": "b2c",
    "title": "Bathroom sink dripping, need urgent repair",
    "description": "My bathroom sink has been dripping constantly for 3 days. Water is pooling in the cabinet underneath. I've tried tightening the faucet but it keeps dripping. I've attached photos showing the leak. The sink is a standard single-handle faucet, probably 5-10 years old. Need someone to come look at it this week.",
    "budget": {
      "min": 100,
      "max": 300,
      "open": false,
      "display": "$100-$300"
    },
    "location": {
      "city": "Dallas",
      "state": "TX",
      "zip": "75201",
      "distance_miles": 8.3,
      "map_center": {
        "lat": 32.7767,
        "lng": -96.7970
      }
    },
    "timeline": {
      "type": "within_1_week",
      "label": "Within 1 week",
      "specific_date": null
    },
    "photos": [
      {
        "url": "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/photo1.jpg",
        "thumbnail": "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/thumb_photo1.jpg",
        "caption": "Leak under sink"
      },
      {
        "url": "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/photo2.jpg",
        "thumbnail": "https://cdn.reversemarket.com/posts/post_c9h0f1g14d5e/thumb_photo2.jpg",
        "caption": "Water pooling in cabinet"
      }
    ],
    "buyer": {
      "user_id": "usr_a7f8d9e12b3c",
      "name": "Sarah M.",
      "location": "Dallas, TX",
      "rating": 4.9,
      "total_reviews_given": 4,
      "total_posts": 4,
      "verified": true,
      "member_since": "2025-08-15",
      "response_rate": 100,
      "average_response_time_hours": 2
    },
    "requirements": {
      "min_rating": 4.0,
      "licensed_only": true,
      "verified_only": true
    },
    "offers": {
      "count": 3,
      "seller_has_offered": false,
      "average_amount": 240,
      "last_offer_ago": "15 minutes ago"
    },
    "category_specific": {
      "property_type": "single_family",
      "emergency_needed": false,
      "preferred_contact": "app_message"
    },
    "status": "active",
    "created_at": "2026-02-10T10:00:00Z",
    "expires_at": "2026-02-13T10:00:00Z",
    "time_remaining": "70 hours",
    "can_offer": true,
    "meets_requirements": true,
    "similar_jobs_completed": [
      {
        "transaction_id": "txn_e1j2h3i16f7g",
        "title": "Kitchen faucet leak repair",
        "amount": 180,
        "rating": 5.0,
        "completed_at": "2026-01-20T14:00:00Z"
      }
    ]
  }
}
```

**Response (Product Example - Buying):**
```json
{
  "success": true,
  "post": {
    "post_id": "post_d0i1g2h15e6f",
    "category": "products_buying",
    "subcategory": "electronics_computers",
    "transaction_type": "c2c",
    "title": "Looking for used MacBook Pro 16-inch (2021 or newer)",
    "description": "Need a MacBook Pro 16-inch for video editing. Must be 2021 or newer model with M1 Pro/Max chip. Prefer 32GB RAM but 16GB okay. Good condition with minimal scratches. Include charger and original box if available. Willing to pay fair price for quality unit.",
    "budget": {
      "min": 1200,
      "max": 2000,
      "open": false,
      "display": "$1200-$2000"
    },
    "location": {
      "city": "Dallas",
      "state": "TX",
      "zip": "75201",
      "distance_miles": 8.3,
      "nationwide": false
    },
    "timeline": {
      "type": "within_2_weeks",
      "label": "Within 2 weeks"
    },
    "photos": [],
    "buyer": {
      "user_id": "usr_f2k3j4l18h9i",
      "name": "John D.",
      "location": "Dallas, TX",
      "rating": 4.7,
      "total_posts": 8,
      "verified": true,
      "member_since": "2025-06-10"
    },
    "requirements": {
      "min_rating": 4.0,
      "verified_only": true
    },
    "offers": {
      "count": 12,
      "seller_has_offered": false,
      "average_amount": 1650,
      "price_range": "$1400-$1900"
    },
    "category_specific": {
      "condition_preference": ["like_new", "used"],
      "pickup_vs_shipping": "either",
      "brand": "Apple",
      "model_specs": "MacBook Pro 16-inch, M1 Pro/Max, 16GB+ RAM"
    },
    "status": "active",
    "created_at": "2026-02-10T07:00:00Z",
    "expires_at": "2026-02-17T07:00:00Z",
    "time_remaining": "163 hours",
    "can_offer": true,
    "meets_requirements": true,
    "similar_sales_completed": []
  }
}
```

**Response (Job Example):**
```json
{
  "success": true,
  "post": {
    "post_id": "post_e1j2h3i16f7g",
    "category": "jobs_hiring",
    "subcategory": "administrative",
    "transaction_type": "b2c",
    "title": "Hiring part-time bookkeeper for small business",
    "description": "Local electronics repair shop needs part-time bookkeeper. Handle QuickBooks, invoicing, payroll (5 employees), monthly reconciliation. 15-20 hours/week, flexible schedule. Remote work okay but prefer someone local for occasional in-person meetings.",
    "budget": {
      "min": 25,
      "max": 35,
      "open": false,
      "display": "$25-$35/hour"
    },
    "location": {
      "city": "Arlington",
      "state": "TX",
      "zip": "76015",
      "work_location_type": "hybrid",
      "distance_miles": 18.5
    },
    "timeline": {
      "type": "within_1_week",
      "label": "Start within 1 week",
      "specific_date": "2026-03-01"
    },
    "photos": [],
    "buyer": {
      "user_id": "usr_g3l4k5m19i0j",
      "name": "James C.",
      "business_name": "Chen Electronics Repair",
      "location": "Arlington, TX",
      "rating": 5.0,
      "total_posts": 3,
      "verified": true,
      "verified_business": true,
      "member_since": "2025-10-01"
    },
    "requirements": {
      "min_rating": 4.5,
      "verified_only": true
    },
    "offers": {
      "count": 15,
      "seller_has_offered": false
    },
    "category_specific": {
      "job_type": "part_time",
      "pay_type": "hourly",
      "hours_per_week": "15-20",
      "start_date": "2026-03-01",
      "required_qualifications": "QuickBooks experience, payroll processing, 2+ years bookkeeping",
      "work_location": "hybrid",
      "benefits": "Flexible schedule, potential for full-time"
    },
    "status": "active",
    "created_at": "2026-02-09T10:00:00Z",
    "expires_at": "2026-02-16T10:00:00Z",
    "time_remaining": "6 days",
    "can_offer": true,
    "meets_requirements": true
  }
}
```

**Earnings Calculator (Category-Specific):**
```
┌────────────────────────────────────────────────┐
│ EARNINGS CALCULATOR                            │
│                                                │
│ SERVICE: Your Quote: $ [____250____]           │
│ Platform Fee (8%):     -$20.00                 │
│ Your Payout:            $230.00                │
│ Buyer pays: $270.11 (includes fees)            │
│                                                │
│ PRODUCT (SHIPPED): Your Price: $ [__1650___]   │
│ Platform Fee (8%):     -$132.00                │
│ Your Payout:            $1518.00               │
│ Buyer pays: $1783.04 (includes shipping)       │
│                                                │
│ PRODUCT (LOCAL CASH): Your Price: $ [__300__]  │
│ Platform Fee:           $0 (FREE!)             │
│ Your Payout:            $300.00                │
│ Buyer pays: $300.00 (cash at meetup)           │
│                                                │
│ JOB: Your Rate: $ [____30____] /hour           │
│ Platform Fee (5%):     -$1.50/hr               │
│ Your Rate After Fee:    $28.50/hr              │
│ For 20 hrs/week: $570/week payout              │
│                                                │
│ [Submit Offer]                                  │
└────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- ✅ Post details load in <500ms
- ✅ Photos open in fullscreen lightbox
- ✅ Map shows location (zoom level appropriate for category)
- ✅ Earnings calculator updates in real-time
- ✅ Similar transactions displayed if relevant
- ✅ Cannot view full address until hired (services only)
- ✅ "Submit Offer" disabled if seller doesn't meet requirements
- ✅ Can message buyer to ask questions
- ✅ Category-specific fields display correctly

---

#### **FR-SEL-003: Submit Offer — Offer Cap & Paid Batches** *(updated in v2.2)*

**Description:** Seller submits competitive offer on a buyer's post. v2.2 introduces a 10-offer cap per post and a paid-batch overflow mechanism, plus an explicit ban on showing the buyer's budget anywhere in the seller flow.

**Offer Cap & Paid Batches (v2.2):**
- Each buyer post accepts a **maximum of 10 seller offers** (stored in `offer_count` on the post)
- Once `offer_count = 10`, the post is hidden from seller feeds and `POST /api/v1/offers` returns 409 Conflict
- Sellers who want to offer beyond the cap can purchase additional **offer batches** through the app (e.g., pay $X to unlock access to posts where they've been blocked by the cap) — see `POST /api/v1/offer-batches`
- Business sellers can alternatively pay for a batch to blast their inventory post to additional buyers (same mechanic in reverse)
- Batch pricing TBD based on category and market conditions
- A seller cannot submit a duplicate offer on the same post (one offer per seller per post)
- Can edit offer anytime before buyer accepts
- Can withdraw offer before buyer accepts (silent removal — no buyer notification)
- Cannot re-submit after withdrawal on same post (24-hour cooldown)

**Earnings calculator (seller view — buyer budget never shown):**
```
Your Quote:        $250.00
Platform Fee (8%): -$20.00
Stripe:             -$7.55
Your Payout:       $222.45

Buyer pays:        $250.00 (they pay no extra fees)
```

**Buyer-budget privacy:**
- Sellers do NOT see the buyer's stated budget anywhere in the offer submission UI
- Matching algorithm uses budget invisibly to surface posts to compatible sellers
- Low-ball detection: when a seller submits an offer significantly below typical market rate for that category/location, an advisory warning appears before submission. The warning is informational only — the seller can still submit.

**Requirements (v2.1 fields retained):**
- SHALL collect **universal fields** (all categories):
  - **Quote/Price amount** (required, $10-$50,000)
  - **Estimated timeline** (required)
  - **Detailed message to buyer** (required, 50-1000 chars)
  - **Attachments** (optional, up to 10):
    - Portfolio photos (services)
    - Product photos (products)
    - Resume/portfolio (jobs)
    - Samples (inventory)
  - **Terms/conditions** (optional, max 500 chars)

- SHALL collect **category-specific fields**:

  **Services:**
  - Can start: Today, Tomorrow, 2-3 days, Within week, Specific date
  - Completion time: Hours (1-8), Days (1-7), Weeks (1-4)
  - Pricing type: Flat rate, Hourly rate, Quotes only
  - Estimated hours (if hourly)
  - Warranty information
  - What's included in quote
  - What's NOT included (optional)
  
  **Products (Selling):**
  - Condition (with detailed description)
  - Product photos (1-10, required)
  - Original packaging (yes/no)
  - Accessories included
  - Delivery options:
    - Local pickup only (location)
    - Ship anywhere (shipping cost)
    - Both
  - Return policy
  - Negotiable price (yes/no)
  
  **Products (Buying from buyer's "selling" post):**
  - Offer price
  - Pickup or shipping preference
  - Proposed meetup location (if pickup)
  - Payment method (cash, through platform)
  
  **Inventory/Wholesale:**
  - Unit price
  - Minimum order quantity
  - Bulk pricing tiers
  - Delivery timeline
  - Payment terms (net 30, net 60, etc.)
  - Samples available (yes/no)
  
  **Jobs (Applicant):**
  - Desired hourly rate OR salary
  - Availability (start date, hours/week)
  - Resume attachment (required)
  - Cover letter/message
  - Relevant experience (years)
  - Certifications/qualifications
  - References available

- SHALL validate:
  - Seller meets buyer's requirements (rating, verification)
  - Quote/price within seller's tier limit
  - Seller hasn't already submitted offer on this post
  - Post is still active (not expired/filled)
  
- SHALL show offer summary before submission
- SHALL allow editing offer before buyer accepts
- SHALL track offer status: Pending, Viewed, Accepted, Declined, Countered
- SHALL display estimated earnings

**API Endpoint:**
```
POST /api/v1/offers
PUT /api/v1/offers/{offer_id} (edit before acceptance)
DELETE /api/v1/offers/{offer_id} (withdraw offer)
```

**Request Body (Service Example):**
```json
{
  "post_id": "post_c9h0f1g14d5e",
  "category": "home_services",
  "quote_amount": 250,
  "pricing_type": "flat_rate",
  "timeline": {
    "can_start": "tomorrow",
    "completion_time": "same_day",
    "specific_date": "2026-02-11",
    "estimated_hours": 2
  },
  "message": "Hi Sarah, I can fix your leaking sink tomorrow morning. This is a common issue - usually a worn cartridge or gasket. I carry all standard parts in my truck, so I can complete the repair in one visit (1-2 hours).\n\nIncluded in my quote:\n- Diagnosis of leak source\n- Parts (cartridge, gaskets, or washers)\n- Labor\n- 90-day warranty on parts and labor\n- Clean up\n\nI'm a licensed master plumber (TSBPE #M-38472) with 18 years experience. I've done this repair hundreds of times. Check out my reviews - all 5 stars for leak repairs!\n\nLet me know if you have any questions. Thanks! - Miguel",
  "attachments": [
    {
      "type": "portfolio_photo",
      "url": "https://cdn.reversemarket.com/sellers/usr_b8g9e0f13c4d/portfolio/sink_repair1.jpg",
      "caption": "Similar sink repair I did last week"
    },
    {
      "type": "portfolio_photo",
      "url": "https://cdn.reversemarket.com/sellers/usr_b8g9e0f13c4d/portfolio/sink_repair2.jpg",
      "caption": "Before and after - leak fixed"
    }
  ],
  "category_specific": {
    "warranty": "90-day warranty on parts and labor",
    "whats_included": "Diagnosis, parts, labor, cleanup",
    "whats_not_included": "Wall/floor repair if damage found"
  }
}
```

**Request Body (Product Example - Selling):**
```json
{
  "post_id": "post_d0i1g2h15e6f",
  "category": "products_buying",
  "price": 1650,
  "negotiable": false,
  "message": "Hi Michael! I have exactly what you're looking for. MacBook Pro 16-inch 2021 with M1 Pro, 32GB RAM, 1TB SSD. Mint condition, only used for light office work. Comes with everything in original box. Battery health 96%. Can meet locally in Richardson or ship same day. Let me know!",
  "product_photos": [
    "https://cdn.reversemarket.com/offers/off_xyz123/photo1.jpg",
    "https://cdn.reversemarket.com/offers/off_xyz123/photo2.jpg",
    "https://cdn.reversemarket.com/offers/off_xyz123/photo3.jpg",
    "https://cdn.reversemarket.com/offers/off_xyz123/photo4.jpg"
  ],
  "category_specific": {
    "condition": "like_new",
    "condition_description": "Mint condition, no scratches, minimal use. Battery health 96%. Always kept in case.",
    "model": "MacBook Pro 16-inch (2021)",
    "specs": "M1 Pro, 32GB RAM, 1TB SSD, Space Gray",
    "purchase_date": "2022-03-15",
    "original_packaging": true,
    "accessories_included": ["Original charger", "USB-C cable", "Original box", "Protective case"],
    "delivery_options": {
      "pickup": {
        "available": true,
        "location": "Richardson, TX 75080",
        "cost": 0
      },
      "shipping": {
        "available": true,
        "carrier": "FedEx",
        "cost": 25,
        "estimated_days": "2-3 business days"
      }
    },
    "return_policy": "30-day money-back guarantee. Full refund if not as described."
  }
}
```

**Request Body (Job Application Example):**
```json
{
  "post_id": "post_e1j2h3i16f7g",
  "category": "jobs_hiring",
  "desired_rate": 32,
  "rate_type": "hourly",
  "message": "Hello James, I'm very interested in the part-time bookkeeper position. I have 5 years of experience with QuickBooks and have managed payroll for businesses with up to 15 employees. I'm detail-oriented, reliable, and available to start March 1st as requested.\n\nMy experience includes:\n- Full-cycle bookkeeping (A/R, A/P, reconciliation)\n- Payroll processing (ADP, Paychex, QuickBooks Payroll)\n- Monthly/quarterly financial reporting\n- Tax preparation support\n\nI'm local to Arlington and prefer hybrid work. I can be flexible with scheduling and am available 15-20 hours per week as needed.\n\nI've attached my resume with references. Happy to provide more details or schedule an interview at your convenience.\n\nThank you for your consideration!",
  "attachments": [
    {
      "type": "resume",
      "url": "https://cdn.reversemarket.com/offers/off_abc456/resume.pdf",
      "filename": "Sarah_Johnson_Resume.pdf"
    }
  ],
  "category_specific": {
    "availability": {
      "start_date": "2026-03-01",
      "hours_per_week": 18,
      "preferred_schedule": "Monday-Friday mornings preferred, flexible"
    },
    "experience_years": 5,
    "relevant_skills": [
      "QuickBooks Desktop & Online",
      "Payroll processing (5-15 employees)",
      "Excel (advanced)",
      "Financial reporting",
      "Tax prep support"
    ],
    "certifications": ["QuickBooks Certified User"],
    "education": "Bachelor's in Accounting, UTA 2019",
    "references_available": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "offer": {
    "offer_id": "off_l8q9o0p23m4n",
    "post_id": "post_c9h0f1g14d5e",
    "seller_id": "usr_b8g9e0f13c4d",
    "category": "home_services",
    "quote_amount": 250,
    "estimated_payout": 230,
    "platform_fee": 20,
    "timeline": {
      "can_start": "2026-02-11",
      "completion_time": "same_day"
    },
    "message": "Hi Sarah, I can fix your leaking sink tomorrow morning...",
    "status": "pending",
    "created_at": "2026-02-10T10:22:00Z",
    "expires_at": "2026-02-13T10:00:00Z",
    "can_edit": true,
    "can_withdraw": true
  },
  "buyer_notified": true,
  "estimated_response_time": "Most buyers respond within 4 hours",
  "competition": {
    "total_offers": 4,
    "your_rank_by_price": 2,
    "average_offer": 240
  },
  "message": "Offer submitted successfully! Sarah will be notified."
}
```

**Offer Summary (Confirmation Before Submit - Service):**
```
┌──────────────────────────────────────────────────────────────┐
│ REVIEW YOUR OFFER                                            │
│                                                              │
│ Job: Bathroom sink dripping, need urgent repair             │
│ Buyer: Sarah M. ⭐ 4.9                                      │
│                                                              │
│ YOUR QUOTE:                                                  │
│ Amount: $250 (flat rate)                                     │
│ Can start: Tomorrow (Feb 11)                                 │
│ Complete: Same day (1-2 hours)                               │
│ Warranty: 90-day parts & labor                              │
│                                                              │
│ YOUR EARNINGS:                                               │
│ Quote:          $250.00                                      │
│ Platform fee:    -$20.00 (8%)                                │
│ Your payout:    $230.00                                      │
│                                                              │
│ BUYER WILL PAY:                                              │
│ Your quote:     $250.00                                      │
│ Buyer fee:       $12.50 (5%)                                 │
│ Processing:       $7.61                                      │
│ Total:          $270.11                                      │
│                                                              │
│ Your message:                                                │
│ "Hi Sarah, I can fix your leaking sink tomorrow..."         │
│ (Full message shown)                                         │
│                                                              │
│ Attachments: 2 portfolio photos                              │
│                                                              │
│ Competition: 3 other offers (avg $240)                       │
│                                                              │
│ [Edit] [Cancel] [Submit Offer]                               │
└──────────────────────────────────────────────────────────────┘
```

**Offer Summary (Product):**
```
┌──────────────────────────────────────────────────────────────┐
│ REVIEW YOUR OFFER                                            │
│                                                              │
│ Post: Looking for used MacBook Pro 16-inch                  │
│ Buyer: Michael D. ⭐ 4.7                                    │
│                                                              │
│ YOUR OFFER:                                                  │
│ Product: MacBook Pro 16" 2021, M1 Pro, 32GB, 1TB           │
│ Price: $1650 (firm)                                          │
│ Condition: Like New (9.5/10)                                 │
│                                                              │
│ DELIVERY OPTIONS:                                            │
│ ✓ Local pickup: Richardson, TX (FREE)                       │
│ ✓ Shipping: FedEx 2-3 days ($25)                           │
│                                                              │
│ YOUR EARNINGS (if shipped):                                  │
│ Product price:  $1650.00                                     │
│ Buyer pays ship:  $25.00                                     │
│ Platform fee:   -$132.00 (8%)                                │
│ Your payout:    $1518.00                                     │
│                                                              │
│ YOUR EARNINGS (if local cash):                               │
│ Product price:  $1650.00                                     │
│ Platform fee:     $0.00 ✨ FREE!                            │
│ Your payout:    $1650.00                                     │
│                                                              │
│ Attachments: 4 product photos                                │
│ Return policy: 30-day money-back guarantee                   │
│                                                              │
│ Competition: 11 other offers (avg $1675)                     │
│ 💡 Your offer is competitive!                                │
│                                                              │
│ [Edit] [Cancel] [Submit Offer]                               │
└──────────────────────────────────────────────────────────────┘
```

**Email Notification to Buyer (New Offer):**
```
Subject: 💼 New offer on your post from Rodriguez Plumbing

Hi Sarah,

You received a new offer on "Bathroom sink dripping, need urgent repair"

OFFER FROM: Miguel Rodriguez - Rodriguez Plumbing
QUOTE: $250
CAN START: Tomorrow (Feb 11)
COMPLETE: Same day (1-2 hours)
RATING: ⭐ 4.8 (42 reviews)
VERIFIED: Licensed Master Plumber ✓ | Insured ✓

MESSAGE FROM MIGUEL:
"Hi Sarah, I can fix your leaking sink tomorrow morning. This is a common issue - usually a worn cartridge or gasket. I carry all standard parts in my truck..."

WHAT'S INCLUDED:
• Diagnosis • Parts • Labor • 90-day warranty • Cleanup

[View Full Offer] [Accept Offer] [Message Miguel] [Compare All Offers (4)]

You now have 4 offers total. Compare them to find the best fit!

Thanks,
The [Platform Name] Team
```

**Acceptance Criteria:**
- ✅ Offer submission completes in <2 seconds
- ✅ Buyer notified within 60 seconds (push + email)
- ✅ Cannot submit duplicate offer on same post
- ✅ Cannot submit offer above tier limit
- ✅ Can edit offer anytime before buyer accepts
- ✅ Can withdraw offer before buyer accepts
- ✅ Earnings calculator accurate for all transaction types
- ✅ Portfolio/product photos display in offer
- ✅ Category-specific fields validated properly
- ✅ Competition stats displayed (your rank, average offer)

**Business Rules:**
- Sellers can have max 25 active offers simultaneously (prevent spam)
- Cannot offer on expired or filled posts
- Cannot offer below $10 or above tier limit
- Offer expires when post expires
- Withdrawn offers don't notify buyer (silent removal)
- Cannot re-submit offer after withdrawal on same post (24h cooldown)
- Free local cash offers don't count toward tier limits

---

#### **FR-SEL-004: Manage Offers (Universal - All Categories)**

**Description:** Seller views and manages their submitted offers across all categories.

**Requirements:**
- SHALL display all seller's offers with status:
  - **Pending** (waiting for buyer response)
  - **Viewed** (buyer opened offer)
  - **Accepted** (hired! proceed to transaction)
  - **Declined** (buyer chose someone else)
  - **Expired** (post expired before acceptance)
  - **Withdrawn** (seller withdrew offer)
  
- SHALL show for each offer:
  - Post title
  - Category
  - Your quote/price amount
  - Estimated payout
  - Buyer name and rating
  - Submitted date
  - Status
  - Action buttons (Edit, Withdraw, Message, View)
  
- SHALL allow sorting:
  - Newest first
  - Accepted first
  - Highest payout first
  - By category
  - By status
  
- SHALL allow filtering:
  - Status (pending, accepted, declined, expired)
  - Category
  - Date range
  - Amount range
  
- SHALL send notifications:
  - Offer viewed by buyer (push)
  - Offer accepted (push + email + SMS)
  - Offer declined (push, optional reason from buyer)
  - Buyer sent message (push + email)
  - Offer expiring soon (24h before post expires)
  
- SHALL display performance stats:
  - Overall acceptance rate ("You've been hired on 32% of your offers")
  - By category acceptance rate
  - Average response time
  - Total earnings (pending, completed)

**API Endpoints:**
```
GET /api/v1/offers/my-offers
GET /api/v1/offers/{offer_id}
PUT /api/v1/offers/{offer_id}
DELETE /api/v1/offers/{offer_id}
GET /api/v1/sellers/offer-stats
```

**Get My Offers Response:**
```json
{
  "success": true,
  "total_offers": 78,
  "stats": {
    "pending": 12,
    "accepted": 24,
    "declined": 32,
    "expired": 10,
    "acceptance_rate": 30.8,
    "average_payout": 312,
    "total_earnings_pending": 2850,
    "total_earnings_completed": 7488,
    "by_category": {
      "home_services": {
        "total_offers": 56,
        "accepted": 18,
        "acceptance_rate": 32.1,
        "average_payout": 235
      },
      "products_buying": {
        "total_offers": 22,
        "accepted": 6,
        "acceptance_rate": 27.3,
        "average_payout": 520
      }
    }
  },
  "offers": [
    {
      "offer_id": "off_l8q9o0p23m4n",
      "post": {
        "post_id": "post_c9h0f1g14d5e",
        "category": "home_services",
        "subcategory": "plumbing_leak_repair",
        "title": "Bathroom sink dripping, need urgent repair",
        "location": "Dallas, TX",
        "urgency": "asap"
      },
      "quote_amount": 250,
      "estimated_payout": 230,
      "buyer": {
        "name": "Sarah M.",
        "rating": 4.9
      },
      "status": "pending",
      "viewed_by_buyer": true,
      "viewed_at": "2026-02-10T11:05:00Z",
      "submitted_at": "2026-02-10T10:22:00Z",
      "expires_at": "2026-02-13T10:00:00Z",
      "competition": {
        "total_offers": 4,
        "your_rank_by_price": 2,
        "average_offer": 240
      },
      "can_edit": true,
      "can_withdraw": true,
      "unread_messages": 1
    },
    {
      "offer_id": "off_m9r0p1q24n5o",
      "post": {
        "post_id": "post_d0i1g2h15e6f",
        "category": "products_buying",
        "subcategory": "electronics_computers",
        "title": "Looking for used MacBook Pro 16-inch",
        "location": "Dallas, TX"
      },
      "price": 1650,
      "estimated_payout": 1518,
      "buyer": {
        "name": "Michael D.",
        "rating": 4.7
      },
      "status": "accepted",
      "accepted_at": "2026-02-10T16:30:00Z",
      "transaction_id": "txn_j6o7n8p21l2m",
      "submitted_at": "2026-02-08T15:10:00Z",
      "can_edit": false,
      "can_withdraw": false
    },
    {
      "offer_id": "off_n0s1q2r25o6p",
      "post": {
        "post_id": "post_e1j2h3i16f7g",
        "category": "jobs_hiring",
        "subcategory": "administrative",
        "title": "Hiring part-time bookkeeper",
        "location": "Arlington, TX"
      },
      "desired_rate": 32,
      "rate_type": "hourly",
      "estimated_earnings_monthly": 2560,
      "buyer": {
        "name": "James C.",
        "rating": 5.0
      },
      "status": "declined",
      "declined_at": "2026-02-09T18:20:00Z",
      "decline_reason": "Selected candidate with more payroll experience",
      "submitted_at": "2026-02-09T11:00:00Z",
      "can_edit": false,
      "can_withdraw": false
    }
  ]
}
```

**Offers Dashboard UI:**
```
┌────────────────────────────────────────────────────────────────┐
│ MY OFFERS                                                      │
│ Acceptance Rate: 31% (24 hired / 78 offers)                   │
│ Earnings: $2,850 pending | $7,488 completed                   │
│                                                                │
│ FILTERS: [Pending: 12] [Accepted: 24] [Declined: 32]          │
│ Categories: [Home Services] [Products] [Jobs]                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ⏳ PENDING • Submitted 4h ago • Viewed by buyer              │
│ Home Services > Plumbing                                       │
│                                                                │
│ Bathroom sink dripping, need urgent repair                    │
│ Your quote: $250 → You earn: $230                            │
│ Buyer: Sarah M. ⭐ 4.9 • Dallas, TX                          │
│                                                                │
│ Competition: 4 offers total (you're 2nd lowest)               │
│ Average offer: $240 • Your rank: #2                           │
│ 💬 1 new message from buyer                                   │
│                                                                │
│ [View Details] [Edit Offer] [Message Buyer] [Withdraw]        │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ ACCEPTED • Hired! • Feb 10, 4:30 PM                       │
│ Products > Electronics                                         │
│                                                                │
│ Looking for used MacBook Pro 16-inch                          │
│ Your price: $1,650 → You earn: $1,518 (or $1650 if cash)    │
│ Buyer: Michael D. ⭐ 4.7 • Dallas, TX                        │
│                                                                │
│ Status: Awaiting shipment                                      │
│ Delivery: Local pickup or ship ($25)                          │
│                                                                │
│ [View Transaction] [Message Buyer] [Mark Shipped]             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ DECLINED • Feb 9, 6:20 PM                                  │
│ Jobs > Administrative                                          │
│                                                                │
│ Hiring part-time bookkeeper                                    │
│ Your rate: $32/hour                                            │
│ Buyer: James C. ⭐ 5.0 • Arlington, TX                       │
│                                                                │
│ Reason: "Selected candidate with more payroll experience"     │
│                                                                │
│ 💡 Tip: Highlight payroll experience more in future offers    │
│                                                                │
│ [View Post] [Improve Your Offers]                             │
└────────────────────────────────────────────────────────────────┘
```

**Offer Stats Dashboard:**
```
┌────────────────────────────────────────────────────────────────┐
│ OFFER PERFORMANCE                                              │
│                                                                │
│ Overall Stats:                                                 │
│ • Acceptance Rate: 31% (24 / 78 offers)                       │
│ • Average Response Time: 6.2 hours                            │
│ • Average Payout: $312                                         │
│ • Total Earnings: $10,338 (lifetime)                          │
│                                                                │
│ By Category:                                                   │
│ ┌──────────────────┬──────────┬──────────┬──────────────┐    │
│ │ Category         │ Offers   │ Accepted │ Rate         │    │
│ ├──────────────────┼──────────┼──────────┼──────────────┤    │
│ │ Home Services    │ 56       │ 18       │ 32% ⬆️      │    │
│ │ Products         │ 22       │ 6        │ 27%          │    │
│ └──────────────────┴──────────┴──────────┴──────────────┘    │
│                                                                │
│ Trends:                                                        │
│ • Your acceptance rate is improving (+5% this month)           │
│ • You respond 2x faster than average sellers                  │
│ • Offers with portfolio photos: 45% acceptance                │
│ • Offers without photos: 18% acceptance                       │
│                                                                │
│ 💡 Tip: Add 3+ portfolio photos to double your chances!       │
│                                                                │
│ [Download Report (CSV)] [See Insights]                        │
└────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- ✅ Offers load in <500ms
- ✅ Real-time status updates (Phase 2: WebSocket)
- ✅ Push notification when offer accepted
- ✅ Can edit offer before buyer accepts
- ✅ Cannot withdraw after buyer accepts
- ✅ Decline reason shown (if provided by buyer)
- ✅ Unread message badge accurate
- ✅ Stats calculated correctly per category
- ✅ Performance insights actionable

---

#### **FR-SEL-005: Transaction Execution**

**Description:** Seller completes the job/delivers product and uploads completion evidence.

**Requirements:**

**Transaction Notification:**
- Seller receives push + email + SMS when offer accepted
- Notification includes: Buyer name, contact info, job details, amount, scheduled date/time

**Transaction Dashboard:**
- Display all active transactions with statuses
- For each transaction show:
  - Job/product title
  - Buyer name, rating, contact info
  - Quote amount & estimated payout
  - Before photos (if uploaded, Phase 2)
  - Escrow status (held/released)
  - Scheduled date/time
  - Current status
  - Actions available

**Status Updates (Seller Can Update):**

**Services:**
- **Scheduled** → Default status after acceptance
- **On the Way** → Seller traveling to location (updates buyer with ETA)
- **Started** → Work in progress (optional: upload progress photos)
- **Completed** → Job done, awaiting buyer approval

**Products (Shipped):**
- **Preparing Shipment** → Packing product
- **Shipped** → Upload tracking number (required)
- **Delivered** → Carrier confirms delivery
- **Completed** → Buyer confirms receipt

**Products (Local Cash):**
- **Meetup Scheduled** → Confirmed time/location
- **Meetup Complete** → Seller marks complete after cash exchange

**Products (Local Platform):**
- **Meetup Scheduled** → Confirmed time/location
- **QR Code Shared** → Buyer scans QR to verify seller
- **Payment Received** → Buyer completes payment via app
- **Completed** → Transaction finished

**Inventory/B2B:**
- **Order Confirmed** → Preparing order
- **Shipped** → Upload tracking + delivery receipt
- **Delivered** → Awaiting buyer inspection
- **Completed** → Buyer approves invoice

**Communication:**
- Message buyer directly via in-app chat
- Share updates with photos
- Coordinate scheduling changes
- Answer buyer questions

**Completion Requirements by Category:**

**Services (Phase 2):**
- Upload 1-5 after photos (required Phase 2; optional MVP)
- Mark job complete
- Buyer receives notification to review & approve
- Optional: Add completion notes

**Products (Shipped):**
- Upload tracking number (required)
- Tracking auto-updates status
- Seller notified when delivered
- Buyer confirms receipt

**Products (Local Cash):**
- Seller marks "Meetup Complete" after cash exchange
- No photos required
- No escrow (transaction already finished)

**Products (Local Platform):**
- Seller generates QR code in app
- Buyer scans QR at meetup to verify seller identity
- Buyer confirms item receipt & completes payment via app
- Funds released instantly

**Inventory/B2B:**
- Upload delivery receipt/invoice
- Buyer has 3-day inspection period
- Seller notified when approved

**Progress Photos (Optional, All Categories):**
- Sellers can upload progress photos anytime during transaction
- Buyer receives notification with photos
- Builds trust & transparency

**API Endpoints:**
- `GET /api/v1/transactions/{transaction_id}` → View transaction details
- `PUT /api/v1/transactions/{transaction_id}/update-status` → Update status
- `POST /api/v1/transactions/{transaction_id}/mark-complete` → Mark job complete
- `POST /api/v1/transactions/{transaction_id}/upload-progress-photos` → Upload progress photos
- `POST /api/v1/transactions/{transaction_id}/upload-after-photos` → Upload after photos (Phase 2)

**Get Transaction Request:**  
`GET /api/v1/transactions/{transaction_id}`

**Response:**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_s9t0u1v2w3x4",
    "post": {
      "title": "Kitchen Sink Leak Repair",
      "description": "Leaking under cabinet...",
      "category": "home_services",
      "subcategory": "plumbing",
      "location": {
        "address": "123 Main St, Dallas, TX 75201",
        "city": "Dallas",
        "state": "TX",
        "zip": "75201",
        "latitude": 32.7767,
        "longitude": -96.7970
      },
      "photos": ["https://cdn.example.com/sink-leak1.jpg"]
    },
    "buyer": {
      "user_id": "usr_a1b2c3d4e5f6",
      "name": "Sarah Johnson",
      "phone": "+14695551234",
      "rating": 4.9,
      "total_transactions": 8,
      "member_since": "2024-03-15"
    },
    "quote_amount": 185.00,
    "estimated_payout": 170.15,
    "platform_fee": 14.85,
    "escrow_status": "held",
    "status": "scheduled",
    "scheduled_date": "2026-02-12",
    "scheduled_time": "09:00 AM",
    "timeline": [
      {
        "status": "scheduled",
        "timestamp": "2026-02-11T15:00:00Z",
        "description": "Job scheduled for Feb 12, 9:00 AM"
      }
    ],
    "buyer_requirements": {
      "property_type": "house",
      "access_details": "Gate code 1234, park in driveway",
      "pets_on_property": true
    },
    "actions_available": [
      "update_status",
      "upload_progress_photos",
      "message_buyer",
      "mark_complete"
    ]
  }
}
```

**Update Status Request:**  
`PUT /api/v1/transactions/{transaction_id}/update-status`

**Request:**
```json
{
  "status": "on_the_way",
  "eta_minutes": 15,
  "notes": "Running a few minutes late due to traffic. Will be there by 9:15 AM."
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_s9t0u1v2w3x4",
    "status": "on_the_way",
    "updated_at": "2026-02-12T08:50:00Z"
  },
  "buyer_notified": true,
  "message": "Status updated. Buyer has been notified."
}
```

**Mark Complete Request:**  
`POST /api/v1/transactions/{transaction_id}/mark-complete`

**Request (Service Example):**
```json
{
  "after_photos": [
    "https://s3.amazonaws.com/uploads/after1.jpg",
    "https://s3.amazonaws.com/uploads/after2.jpg"
  ],
  "completion_notes": "Replaced P-trap, tightened all connections, tested for leaks. No issues found. 1-year warranty on parts and labor.",
  "work_summary": "Diagnosed leak source, replaced faulty P-trap, tested all connections"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_s9t0u1v2w3x4",
    "status": "awaiting_approval",
    "marked_complete_at": "2026-02-12T11:00:00Z",
    "after_photos": [
      "https://cdn.example.com/after1.jpg",
      "https://cdn.example.com/after2.jpg"
    ]
  },
  "payout": {
    "estimated_payout": 170.15,
    "estimated_payout_date": "2026-02-14",
    "auto_release_date": "2026-02-19"
  },
  "buyer_notified": true,
  "message": "Job marked complete! Buyer has been notified to review and approve. You'll receive payment within 2 business days after approval."
}
```

**Request (Product Shipped Example):**
```json
{
  "tracking_number": "1Z999AA10123456784",
  "carrier": "UPS",
  "estimated_delivery_date": "2026-02-14",
  "notes": "Package shipped via UPS Ground. Should arrive by Friday."
}
```

**Upload Progress Photos Request:**  
`POST /api/v1/transactions/{transaction_id}/upload-progress-photos`

**Request:**
```json
{
  "photos": [
    "https://s3.amazonaws.com/uploads/progress1.jpg",
    "https://s3.amazonaws.com/uploads/progress2.jpg"
  ],
  "caption": "Removed old P-trap, installing new one now"
}
```

**Seller Transaction Dashboard UI (Example):**
```
╔══════════════════════════════════════════════════════════╗
║  Active Transactions (3)                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  [📍 Scheduled Today - 9:00 AM]                           ║
║  Kitchen Sink Leak Repair                                 ║
║  Buyer: Sarah Johnson ⭐ 4.9 (8 transactions)            ║
║  📍 Dallas, TX • 3.2 miles away                           ║
║  💰 Your Payout: $170.15                                  ║
║  📞 +1 (469) 555-1234                                     ║
║                                                            ║
║  [Update Status ▼]  [Message Buyer]  [View Details]      ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  [📦 Shipped - In Transit]                                ║
║  iPhone 14 Pro - 256GB                                    ║
║  Buyer: Mike Chen ⭐ 4.7                                  ║
║  Tracking: 1Z999AA10123456784 (UPS)                      ║
║  💰 Your Payout: $687.50 (Pending delivery)               ║
║  Est. Delivery: Feb 14                                    ║
║                                                            ║
║  [Track Package]  [Message Buyer]                         ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  [⏳ Awaiting Approval]                                   ║
║  HVAC Maintenance Service                                 ║
║  Buyer: Lisa Rodriguez ⭐ 5.0                             ║
║  Completed: Feb 10, 2:30 PM                               ║
║  💰 Your Payout: $245.00 (Auto-release in 5 days)        ║
║                                                            ║
║  [View After Photos]  [Message Buyer]                     ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
```

**Acceptance Criteria:**
- Buyer contact info visible immediately after offer acceptance
- Status updates reflect in real-time (WebSocket Phase 2; polling MVP)
- Buyer receives push notification on every status update
- Cannot mark complete without after photos (Phase 2)
- After photos auto-compress to <1MB each
- Buyer notified within 60 seconds of completion
- Timeline displays all status changes with timestamps
- ETA updates show on buyer's transaction page

**Business Rules:**
- Services: 1-5 after photos required to mark complete (Phase 2)
- Products (Shipped): Tracking number required
- Products (Local Cash): No completion evidence needed
- Products (Local Platform): QR scan required for payment release
- Cannot mark complete before scheduled date (exception: emergency/early completion approved by buyer)
- Progress updates allowed anytime during transaction
- Buyer can request changes before approval
- Seller payout estimated date shown (1-2 business days after approval)

---

#### **FR-SEL-006: Receive Payment**

**Description:** Seller receives payment after buyer approves completion.

**Requirements:**

**Payout Trigger:**
- Buyer approves transaction, or
- Auto-release timer expires (7 days services, 3 days products, etc.)

**Payment Flow:**
1. Buyer approval triggers payout process
2. Platform releases funds from escrow
3. Platform fee deducted (3-8% depending on category)
4. Stripe Connect transfer initiated to seller's bank account
5. Seller receives notification (push + email)
6. Payout details displayed in seller dashboard

**Payout Details:**
- Gross amount (quote/product price)
- Platform fee (category-specific: 3-8%)
- Net payout (amount seller receives)
- Stripe transfer ID (for tracking)
- Payout status (Pending, In Transit, Paid)
- Estimated arrival date (1-2 business days standard)
- Bank account last 4 digits
- Receipt/invoice (downloadable PDF)

**Payout Schedule:**
- **Standard:** 1-2 business days (free)
- **Instant Payout** (Phase 2): 15 minutes for 1% fee (for sellers Tier 2+)

**Payout Methods:**
- Direct deposit to bank account (via Stripe Connect)
- Daily payout batch at 12:00 AM UTC
- Minimum payout: $10 (smaller amounts accumulate)
- Maximum payout delay: 2 business days

**Earnings Dashboard:**
- Total earnings (all-time)
- Pending earnings (awaiting approval)
- This month earnings
- Last payout date/amount
- Payout history (filterable by date, category)
- Tax documents (1099-K for >$600/year)

**Tax Reporting:**
- Platform issues 1099-K for earnings >$600/year
- Sellers can download tax forms in January
- Transaction history exportable to CSV

**API Endpoints:**
- `POST /api/v1/transactions/{transaction_id}/release-funds` → Internal only (triggered by buyer approval)
- `GET /api/v1/sellers/payouts` → View all payouts
- `GET /api/v1/sellers/payouts/{payout_id}` → View specific payout details
- `GET /api/v1/sellers/earnings-summary` → Dashboard summary

**Release Funds (Internal API - Triggered by Buyer Approval):**  
`POST /api/v1/transactions/{transaction_id}/release-funds`

**Internal Request:**
```json
{
  "transaction_id": "txn_s9t0u1v2w3x4",
  "buyer_approved": true,
  "approved_at": "2026-02-12T11:30:00Z"
}
```

**Internal Response:**
```json
{
  "success": true,
  "payout": {
    "payout_id": "payout_v4w5x6y7z8a9",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "seller_id": "sel_g7h8i9j0k1l2",
    "gross_amount": 185.00,
    "platform_fee": 14.85,
    "platform_fee_percentage": 8,
    "net_payout": 170.15,
    "currency": "USD",
    "payout_method": "stripe_connect",
    "stripe_transfer_id": "tr_1234567890abcdef",
    "status": "pending",
    "initiated_at": "2026-02-12T11:30:00Z",
    "estimated_arrival": "2026-02-14T00:00:00Z"
  },
  "seller_notified": true
}
```

**Get Payouts:**  
`GET /api/v1/sellers/payouts?status=all&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "total_payouts": 52,
  "total_earnings": 8845.75,
  "pending_earnings": 415.30,
  "payouts": [
    {
      "payout_id": "payout_v4w5x6y7z8a9",
      "transaction_id": "txn_s9t0u1v2w3x4",
      "job_title": "Kitchen Sink Leak Repair",
      "buyer_name": "Sarah Johnson",
      "gross_amount": 185.00,
      "platform_fee": 14.85,
      "net_payout": 170.15,
      "currency": "USD",
      "status": "paid",
      "stripe_transfer_id": "tr_1234567890abcdef",
      "initiated_at": "2026-02-12T11:30:00Z",
      "paid_at": "2026-02-14T08:15:00Z",
      "bank_account_last4": "6789",
      "receipt_url": "https://cdn.example.com/receipts/payout_v4w5x6y7z8a9.pdf"
    },
    {
      "payout_id": "payout_w5x6y7z8a9b0",
      "transaction_id": "txn_t0u1v2w3x4y5",
      "job_title": "Bathroom Faucet Installation",
      "buyer_name": "Mike Chen",
      "gross_amount": 275.00,
      "platform_fee": 22.00,
      "net_payout": 253.00,
      "status": "pending",
      "initiated_at": "2026-02-13T14:00:00Z",
      "estimated_arrival": "2026-02-15T00:00:00Z",
      "bank_account_last4": "6789"
    }
  ]
}
```

**Get Payout Details:**  
`GET /api/v1/sellers/payouts/{payout_id}`

**Response:**
```json
{
  "success": true,
  "payout": {
    "payout_id": "payout_v4w5x6y7z8a9",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "job_title": "Kitchen Sink Leak Repair",
    "buyer_name": "Sarah Johnson",
    "category": "home_services",
    "subcategory": "plumbing",
    "gross_amount": 185.00,
    "platform_fee": 14.85,
    "platform_fee_percentage": 8,
    "net_payout": 170.15,
    "currency": "USD",
    "status": "paid",
    "stripe_transfer_id": "tr_1234567890abcdef",
    "bank_account": {
      "last4": "6789",
      "bank_name": "Chase Bank",
      "account_type": "checking"
    },
    "timeline": [
      {
        "status": "initiated",
        "timestamp": "2026-02-12T11:30:00Z",
        "description": "Payout initiated after buyer approval"
      },
      {
        "status": "in_transit",
        "timestamp": "2026-02-13T00:00:00Z",
        "description": "Transfer sent to bank"
      },
      {
        "status": "paid",
        "timestamp": "2026-02-14T08:15:00Z",
        "description": "Funds deposited to your account"
      }
    ],
    "receipt_url": "https://cdn.example.com/receipts/payout_v4w5x6y7z8a9.pdf",
    "invoice_url": "https://cdn.example.com/invoices/txn_s9t0u1v2w3x4.pdf"
  }
}
```

**Seller Earnings Dashboard UI (Example):**
```
╔══════════════════════════════════════════════════════════╗
║  💰 Earnings Dashboard                                    ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  This Month: $1,245.50                                    ║
║  Pending: $415.30 (3 transactions awaiting approval)      ║
║  All-Time: $8,845.75                                      ║
║                                                            ║
║  Last Payout: Feb 14 - $170.15 → Chase ****6789          ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  Recent Payouts                                           ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  ✅ Paid - Feb 14                                         ║
║  Kitchen Sink Leak Repair                                 ║
║  Gross: $185.00 | Fee: $14.85 | Net: $170.15             ║
║  [Download Receipt]                                       ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  ⏳ Pending - Estimated Feb 15                            ║
║  Bathroom Faucet Installation                             ║
║  Gross: $275.00 | Fee: $22.00 | Net: $253.00             ║
║  Status: Transfer in transit                              ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  ⏳ Awaiting Approval                                     ║
║  Water Heater Repair                                      ║
║  Gross: $420.00 | Fee: $33.60 | Est. Net: $386.40        ║
║  Auto-release in 5 days                                   ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
```

**Email Notification (Payout Initiated):**
```
Subject: Payment on the Way! 💰 $170.15 Coming to Your Account

Hi John,

Great news! Payment for your recent job has been initiated.

Transaction: Kitchen Sink Leak Repair
Buyer: Sarah Johnson
Completed: Feb 12, 2026

Payout Breakdown:
- Gross Amount: $185.00
- Platform Fee (8%): -$14.85
- Net Payout: $170.15

Bank Account: Chase ****6789
Estimated Arrival: Feb 14, 2026 (1-2 business days)

[View Payout Details]  [Download Receipt]

Keep up the excellent work!

[Platform Name] Team
```

**Receipt/Invoice (PDF) - Example Structure:**
```
╔════════════════════════════════════════════════════════╗
║         [PLATFORM LOGO]                                 ║
║         PAYOUT RECEIPT                                  ║
╠════════════════════════════════════════════════════════╣
║                                                          ║
║  Receipt #: payout_v4w5x6y7z8a9                         ║
║  Date: February 14, 2026                                ║
║                                                          ║
║  Seller: Smith Plumbing & Repair                        ║
║  Business ID: sel_g7h8i9j0k1l2                          ║
║                                                          ║
║  Transaction: Kitchen Sink Leak Repair                  ║
║  Transaction ID: txn_s9t0u1v2w3x4                       ║
║  Buyer: Sarah Johnson                                   ║
║  Completed: February 12, 2026                           ║
║                                                          ║
╠════════════════════════════════════════════════════════╣
║  PAYOUT BREAKDOWN                                       ║
╠════════════════════════════════════════════════════════╣
║                                                          ║
║  Service Fee (Gross)              $185.00               ║
║  Platform Fee (8%)                -$14.85               ║
║  ───────────────────────────────────────────            ║
║  Net Payout                       $170.15               ║
║                                                          ║
╠════════════════════════════════════════════════════════╣
║  PAYMENT DETAILS                                        ║
╠════════════════════════════════════════════════════════╣
║                                                          ║
║  Payment Method: Direct Deposit                         ║
║  Bank Account: Chase ****6789                           ║
║  Stripe Transfer ID: tr_1234567890abcdef                ║
║  Paid On: February 14, 2026 at 8:15 AM CST             ║
║                                                          ║
╠════════════════════════════════════════════════════════╣
║                                                          ║
║  Questions? Contact support@platform.com                ║
║  Tax Form 1099-K available in January 2027              ║
║                                                          ║
╚════════════════════════════════════════════════════════╝
```

**Acceptance Criteria:**
- Payment released within 60 seconds of buyer approval
- Stripe transfer initiated same day (within 1 hour)
- Seller receives email notification immediately
- Bank deposit arrives in 1-2 business days (standard)
- Receipt PDF generated automatically
- Earnings dashboard updates in real-time
- All receipts downloadable anytime
- Tax forms (1099-K) available by January 31st for prior year

**Business Rules:**
- Platform fee: Services (escrow-based fees on completion), Products shipped (small escrow fee + possible shipping label markup), Products local (FREE — no platform fees), Jobs (per-lead fee to employers), Inventory/B2B (5%)
- Stripe fees absorbed by platform (seller receives net after platform fee only)
- Daily payout batch at 12:00 AM UTC
- Minimum payout: $10 (smaller amounts accumulate until threshold met)
- Maximum payout delay: 2 business days
- Instant payout (Phase 2): 1% fee, arrives in 15 minutes (Tier 2+ sellers only)
- 1099-K issued for earnings >$600/year (IRS requirement)
- Transaction history retained for 7 years (tax compliance)

---

### **8.4 Messaging System (Universal)**

**Description:** In-app messaging for buyers and sellers to communicate throughout the transaction lifecycle.

**Requirements:**

**Message Types:**
- **Pre-Transaction:** Buyer/seller can message before offer acceptance (clarify details, ask questions)
- **Active Transaction:** Real-time messaging during job/delivery
- **Post-Transaction:** Follow-up questions, warranty issues

**Messaging Features:**
- **Messaging tab** in the bottom navigation bar with full chat history
- **Text messages** (50-1000 chars)
- **Photo/video attachments** (up to 5 per message, 5MB each)
- **File attachments** (PDF, docs; up to 10MB)
- **Quick replies** (predefined responses for common questions)
- **Typing indicators** (show when other party is typing) — Phase 2 with WebSocket
- **Read receipts** (show when message read)
- **Chat history preserved permanently** (never deleted — users can reference past transactions, prices, agreements)
- **Counteroffers:** Buyers can counteroffer sellers through the messaging system (no public bid wars)

**Message Threading:**
- **Item/service-specific chats:** When messaging about a specific item or service, the chat is attached to that item/service detail page
- **Context tagging:** Users can tag/reference specific projects or items within a chat so the other person knows the topic
- **One continuous chat thread** between any buyer-seller pair for all their interactions
- On the item/service detail page: buyer can see all seller chats related to that specific post
- Within a chat, users can click an info/details icon to see the offer details the seller submitted
- Conversations organized by: Active, Completed, Archived
- Unread message badge count
- Search conversations by keyword or contact name

**Real-Time Delivery:**
- **MVP:** HTTP polling (5-second intervals for active conversations)
- **Phase 2:** WebSocket (Socket.IO) for real-time updates
- Push notifications for new messages (even if app closed)
- SMS notification backup deferred to Phase 2 (push only in MVP to save Twilio costs)

**Safety & Moderation:**
- **Profanity filter:** Auto-flag offensive language
- **External payment detection:** Flag messages containing Venmo, CashApp, Zelle, PayPal requests
- **Phone number/email detection:** Warn users against sharing contact info before transaction confirmed
- **Spam detection:** Rate limit messages (max 50/hour per user)
- **Report message:** Users can report inappropriate messages (human review)
- **Block user:** Prevent future communications (requires support approval)

**Notifications:**
- New message: Push + in-app badge
- Unread messages: Daily digest email (if unread >24 hours)
- Transaction-critical messages: Push + SMS (e.g., "Seller running late")

**Quick Replies (Pre-defined Templates):**

**Sellers:**
- "Yes, I'm available for that date/time"
- "Can we reschedule? I have availability on [dates]"
- "Do you have photos of the issue?"
- "I'll need to see the job in person to provide accurate quote"
- "I can start today if you're available"

**Buyers:**
- "What's your availability?"
- "Can you provide references or portfolio?"
- "What's included in your quote?"
- "How long will this take?"
- "Do you offer a warranty?"

**API Endpoints:**
- `GET /api/v1/conversations` → List all conversations
- `GET /api/v1/conversations/{conversation_id}` → Get conversation thread
- `POST /api/v1/conversations/{conversation_id}/messages` → Send message
- `PUT /api/v1/conversations/{conversation_id}/mark-read` → Mark messages as read
- `POST /api/v1/conversations/{conversation_id}/report` → Report conversation
- `WebSocket: wss://api.reversemarket.com/ws/chat` → Real-time messaging (Phase 2)

**Get Conversations:**  
`GET /api/v1/conversations?status=active&unread_only=false&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "total_conversations": 15,
  "unread_count": 3,
  "conversations": [
    {
      "conversation_id": "conv_a1b2c3d4e5f6",
      "post_id": "post_c9h0f1g14d5e",
      "transaction_id": "txn_s9t0u1v2w3x4",
      "participants": [
        {
          "user_id": "usr_a1b2c3d4e5f6",
          "name": "Sarah Johnson",
          "role": "buyer",
          "profile_photo": "https://cdn.example.com/sarah.jpg"
        },
        {
          "user_id": "sel_g7h8i9j0k1l2",
          "name": "John Smith",
          "role": "seller",
          "business_name": "Smith Plumbing & Repair",
          "profile_photo": "https://cdn.example.com/john.jpg"
        }
      ],
      "last_message": {
        "message_id": "msg_x1y2z3a4b5c6",
        "sender_id": "usr_a1b2c3d4e5f6",
        "text": "Thank you! Looking forward to seeing you tomorrow morning.",
        "timestamp": "2026-02-11T18:30:00Z"
      },
      "unread_count": 0,
      "status": "active",
      "created_at": "2026-02-11T14:00:00Z",
      "updated_at": "2026-02-11T18:30:00Z"
    },
    {
      "conversation_id": "conv_b2c3d4e5f6g7",
      "post_id": "post_d0i1g2h15e6f",
      "offer_id": "off_m9r0p1q24n5o",
      "participants": [
        {
          "user_id": "usr_h8i9j0k1l2m3",
          "name": "Mike Chen",
          "role": "buyer"
        },
        {
          "user_id": "sel_g7h8i9j0k1l2",
          "name": "John Smith",
          "role": "seller",
          "business_name": "Smith Plumbing & Repair"
        }
      ],
      "last_message": {
        "message_id": "msg_y2z3a4b5c6d7",
        "sender_id": "usr_h8i9j0k1l2m3",
        "text": "Do you offer any warranty on your work?",
        "timestamp": "2026-02-11T16:45:00Z"
      },
      "unread_count": 1,
      "status": "active",
      "created_at": "2026-02-11T15:30:00Z",
      "updated_at": "2026-02-11T16:45:00Z"
    }
  ]
}
```

**Get Conversation Thread:**  
`GET /api/v1/conversations/{conversation_id}?limit=50&before_message_id=null`

**Response:**
```json
{
  "success": true,
  "conversation": {
    "conversation_id": "conv_a1b2c3d4e5f6",
    "post": {
      "post_id": "post_c9h0f1g14d5e",
      "title": "Kitchen Sink Leak Repair",
      "category": "home_services"
    },
    "transaction_id": "txn_s9t0u1v2w3x4",
    "participants": [
      {
        "user_id": "usr_a1b2c3d4e5f6",
        "name": "Sarah Johnson",
        "role": "buyer",
        "profile_photo": "https://cdn.example.com/sarah.jpg"
      },
      {
        "user_id": "sel_g7h8i9j0k1l2",
        "name": "John Smith",
        "role": "seller",
        "business_name": "Smith Plumbing & Repair",
        "profile_photo": "https://cdn.example.com/john.jpg",
        "rating": 4.8
      }
    ],
    "status": "active"
  },
  "messages": [
    {
      "message_id": "msg_w0x1y2z3a4b5",
      "sender_id": "sel_g7h8i9j0k1l2",
      "sender_name": "John Smith",
      "sender_role": "seller",
      "text": "Hi Sarah! I can come today and fix this quickly. I've handled hundreds of similar leaks. Would 9 AM tomorrow work for you?",
      "timestamp": "2026-02-11T14:15:00Z",
      "read": true,
      "read_at": "2026-02-11T14:20:00Z"
    },
    {
      "message_id": "msg_x1y2z3a4b5c6",
      "sender_id": "usr_a1b2c3d4e5f6",
      "sender_name": "Sarah Johnson",
      "sender_role": "buyer",
      "text": "Yes, 9 AM works perfectly! The gate code is 1234 and you can park in the driveway. We have a friendly dog, hope that's okay.",
      "timestamp": "2026-02-11T14:25:00Z",
      "read": true,
      "read_at": "2026-02-11T14:30:00Z"
    },
    {
      "message_id": "msg_y2z3a4b5c6d7",
      "sender_id": "sel_g7h8i9j0k1l2",
      "sender_name": "John Smith",
      "sender_role": "seller",
      "text": "Perfect! I love dogs 🐕 See you tomorrow at 9 AM sharp.",
      "timestamp": "2026-02-11T14:35:00Z",
      "read": true,
      "read_at": "2026-02-11T14:40:00Z"
    },
    {
      "message_id": "msg_z3a4b5c6d7e8",
      "sender_id": "usr_a1b2c3d4e5f6",
      "sender_name": "Sarah Johnson",
      "sender_role": "buyer",
      "text": "Thank you! Looking forward to seeing you tomorrow morning.",
      "timestamp": "2026-02-11T18:30:00Z",
      "read": false,
      "read_at": null
    }
  ],
  "total_messages": 4,
  "has_more": false
}
```

**Send Message:**  
`POST /api/v1/conversations/{conversation_id}/messages`

**Request:**
```json
{
  "text": "I'm running about 10 minutes late due to traffic. Should be there by 9:15 AM.",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "message_id": "msg_a4b5c6d7e8f9",
    "conversation_id": "conv_a1b2c3d4e5f6",
    "sender_id": "sel_g7h8i9j0k1l2",
    "sender_name": "John Smith",
    "sender_role": "seller",
    "text": "I'm running about 10 minutes late due to traffic. Should be there by 9:15 AM.",
    "timestamp": "2026-02-12T08:50:00Z",
    "read": false,
    "attachments": []
  },
  "recipient_notified": true
}
```

**Request (With Photo Attachment):**
```json
{
  "text": "Here's a photo of the new P-trap I'll be installing:",
  "attachments": [
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/uploads/p-trap-photo.jpg",
      "filename": "p-trap-photo.jpg",
      "size_bytes": 245678
    }
  ]
}
```

**Mark as Read:**  
`PUT /api/v1/conversations/{conversation_id}/mark-read`

**Request:**
```json
{
  "last_read_message_id": "msg_z3a4b5c6d7e8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "All messages marked as read",
  "unread_count": 0
}
```

**Report Conversation:**  
`POST /api/v1/conversations/{conversation_id}/report`

**Request:**
```json
{
  "reason": "spam",
  "description": "Seller asking for payment outside platform via Venmo",
  "message_ids": ["msg_x1y2z3a4b5c6"]
}
```

**WebSocket Connection (Phase 2):**  
`wss://api.reversemarket.com/ws/chat?token={jwt_access_token}`

**WebSocket Events:**

**Client → Server (Send Message):**
```json
{
  "event": "send_message",
  "data": {
    "conversation_id": "conv_a1b2c3d4e5f6",
    "text": "On my way!",
    "attachments": []
  }
}
```

**Server → Client (New Message):**
```json
{
  "event": "new_message",
  "data": {
    "message_id": "msg_b5c6d7e8f9g0",
    "conversation_id": "conv_a1b2c3d4e5f6",
    "sender_id": "sel_g7h8i9j0k1l2",
    "sender_name": "John Smith",
    "text": "On my way!",
    "timestamp": "2026-02-12T08:55:00Z"
  }
}
```

**Server → Client (Typing Indicator):**
```json
{
  "event": "typing",
  "data": {
    "conversation_id": "conv_a1b2c3d4e5f6",
    "user_id": "sel_g7h8i9j0k1l2",
    "user_name": "John Smith",
    "is_typing": true
  }
}
```

**Server → Client (Message Read):**
```json
{
  "event": "message_read",
  "data": {
    "conversation_id": "conv_a1b2c3d4e5f6",
    "message_id": "msg_b5c6d7e8f9g0",
    "read_by_user_id": "usr_a1b2c3d4e5f6",
    "read_at": "2026-02-12T08:56:00Z"
  }
}
```

**Messaging UI (Example):**
```
╔══════════════════════════════════════════════════════════╗
║  ← Kitchen Sink Leak Repair                              ║
║     Sarah Johnson • Buyer ⭐ 4.9                         ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║                          [Sarah] Feb 11, 2:25 PM          ║
║                    ┌──────────────────────────────┐       ║
║                    │ Yes, 9 AM works perfectly!   │       ║
║                    │ Gate code is 1234. Park in   │       ║
║                    │ the driveway. We have a      │       ║
║                    │ friendly dog, hope OK.       │       ║
║                    └──────────────────────────────┘       ║
║                                              ✓✓ Read       ║
║                                                            ║
║  [You] Feb 11, 2:35 PM                                    ║
║  ┌──────────────────────────────┐                         ║
║  │ Perfect! I love dogs 🐕       │                         ║
║  │ See you tomorrow at 9 AM.    │                         ║
║  └──────────────────────────────┘                         ║
║                          ✓✓ Read                          ║
║                                                            ║
║                          [Sarah] Feb 11, 6:30 PM          ║
║                    ┌──────────────────────────────┐       ║
║                    │ Thank you! Looking forward.  │       ║
║                    └──────────────────────────────┘       ║
║                                              ✓ Delivered   ║
║                                                            ║
║  [You] Feb 12, 8:50 AM                                    ║
║  ┌──────────────────────────────┐                         ║
║  │ Running 10 min late due to   │                         ║
║  │ traffic. Be there by 9:15 AM │                         ║
║  └──────────────────────────────┘                         ║
║                          ✓ Sent                           ║
║                                                            ║
║  Sarah is typing...                                       ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  [📎]  Type your message here...             [Send 📤]   ║
╚══════════════════════════════════════════════════════════╝
```

**Acceptance Criteria:**
- Messages delivered within 5 seconds (HTTP polling MVP)
- Messages delivered instantly (WebSocket Phase 2)
- Push notifications sent within 30 seconds
- Unread badge count accurate at all times
- Typing indicators appear/disappear correctly (Phase 2)
- Read receipts update in real-time (Phase 2)
- Photo attachments auto-compress to <1MB
- External payment requests flagged for review
- Conversations searchable by keyword
- Message history retained for 90 days post-transaction

**Business Rules:**
- Max 50 messages per hour per user (spam prevention)
- Messages 50-1000 characters
- Photo/video attachments max 5MB each
- File attachments (PDF, docs) max 10MB
- Profanity auto-flagged for review
- Users can report inappropriate messages
- Support team can review flagged conversations
- Cannot message after transaction completed + 90 days (archived)
- Sellers cannot request payment outside platform (auto-flagged)

---

## **8.5 Payment System (Stripe Connect Integration)**

#### **FR-PAY-001: Stripe Connect Escrow Flow**

**Description:** Secure escrow-based payment system using Stripe Connect Destination Charges.

**Requirements:**

**Stripe Connect Account Type:**
- **Standard Accounts** (sellers create their own Stripe accounts)
- Platform uses **Destination Charges** flow
- Funds held on platform's Stripe account until released
- Platform has full control over fund release timing

**Payment Methods Supported:**
- Credit/Debit cards (Visa, Mastercard, Amex, Discover)
- Apple Pay
- Google Pay
- **Phase 2:** ACH bank transfers (for transactions >$1,000)
- **Phase 3:** Buy Now, Pay Later (Affirm, Klarna for >$500)

**Payment Flow:**

**Step 1: Buyer Accepts Offer**
- Buyer charged upfront (full amount for services/products; initial milestone for jobs)
- Payment captured immediately (not just authorized)
- Funds held in escrow on platform's Stripe account
- Buyer receives receipt via email

**Step 2: Escrow Hold**
- Funds remain on platform Stripe account
- Not transferred to seller until buyer approves completion
- Escrow status visible to both parties in real-time

**Step 3: Completion & Approval**
- Seller marks transaction complete (uploads evidence)
- Buyer approves or requests changes
- If approved, platform initiates Stripe transfer to seller

**Step 4: Fund Release**
- Platform transfers funds to seller's Stripe Connect account
- Deducts platform fee (3-8% depending on category)
- Seller receives payout in 1-2 business days
- Both parties receive payout confirmation

**Step 5: Auto-Release (If Buyer Unresponsive)**
- Services: 7 days after marked complete
- Shipped products: 3 days after delivery
- Local platform meetups: 1 hour after QR scan
- B2B inventory: 3 days after delivery
- Jobs milestones: 5 days per milestone

**Refund Handling:**
- Full refund if cancelled before work starts (minus 10% no-show fee to seller)
- Partial refund if dispute resolved with compromise
- Full refund if seller fails to complete work
- Refund processed to original payment method
- Refund arrives in 5-10 business days

**Fee Structure (CONFIRMED — Buyer-Free Model, v2.2):**

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

**Example Calculation (Service $185 quote, v2.2 buyer-free):**
```javascript
const quote = 185.00;

// Buyer side — zero platform/Stripe fees
const buyerTotal = quote; // $185.00

// Seller side
const stripeFee = quote * 0.029 + 0.30;       // $5.67
const platformFee = quote * 0.08;              // $14.80
const sellerNet = quote - platformFee - stripeFee; // $164.53

// Platform revenue (gross, before Stripe cost is netted at the gateway):
// = platformFee = $14.80
// Effective seller take rate ≈ 11.06% all-in
```

**Local Cash:**
- Buyer pays product price in cash, in person
- Seller receives product price in cash
- Platform fee: **$0.00** — no escrow, no Stripe involvement

**Jobs (Lead Generation - MVP):**
- Companies pay per lead (not per hire):
  - Entry-level roles: $10-20 per lead
  - Mid-level roles: $30-50 per lead
  - Specialized/senior roles ($100k+ salary): $100-500 per lead
  - Pricing may be dynamic based on demand and role scarcity
- Platform charges regardless of whether company hires the candidate

**Milestone-based Payments (Services - MVP):**
- No minimum threshold — available for any multi-stage project
- Each milestone/sub-project processed and paid individually upon completion
- Different contractors can handle different aspects (e.g., plumbing + electrical as separate milestones)

**3D Secure (SCA) Requirement:**
- All card transactions >$100 require 3D Secure authentication
- Modal popup prompts buyer for bank authentication (SMS code, fingerprint, etc.)
- Payment fails if 3D Secure not completed
- Retries allowed (3 attempts max)

**Multi-Currency Support (Phase 3):**
- USD (MVP)
- CAD, EUR, GBP (Phase 3)
- Real-time exchange rates via Stripe
- Sellers can choose payout currency

**API Endpoints:**
- `POST /api/v1/payments/charge` → Charge buyer (escrow)
- `POST /api/v1/payments/release-escrow` → Release funds to seller
- `POST /api/v1/payments/refund` → Process refund
- `GET /api/v1/payments/{payment_id}` → Get payment details
- `POST /api/v1/webhooks/stripe` → Stripe webhook handler

**Charge Buyer (Escrow):**  
`POST /api/v1/payments/charge`

**Request:**
```json
{
  "offer_id": "off_l8q9o0p23m4n",
  "transaction_id": "txn_s9t0u1v2w3x4",
  "payment_method": "pm_card_visa_4242",
  "amount": 185.00,
  "buyer_fee": 9.25,
  "stripe_fee": 5.94,
  "total": 200.19,
  "currency": "USD",
  "description": "Kitchen Sink Leak Repair - Escrow Payment",
  "metadata": {
    "post_id": "post_c9h0f1g14d5e",
    "buyer_id": "usr_a1b2c3d4e5f6",
    "seller_id": "sel_g7h8i9j0k1l2",
    "category": "home_services"
  }
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "payment_id": "pay_c1d2e3f4g5h6",
    "stripe_charge_id": "ch_1234567890abcdef",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "amount_charged": 200.19,
    "currency": "USD",
    "payment_method": "Visa ****4242",
    "status": "succeeded",
    "escrow_status": "held",
    "charged_at": "2026-02-11T15:00:00Z",
    "receipt_url": "https://stripe.com/receipts/ch_1234567890abcdef"
  },
  "message": "Payment successful. Funds held in escrow."
}
```

**Release Escrow to Seller:**  
`POST /api/v1/payments/release-escrow`

**Request:**
```json
{
  "transaction_id": "txn_s9t0u1v2w3x4",
  "payment_id": "pay_c1d2e3f4g5h6",
  "seller_stripe_account_id": "acct_seller123",
  "gross_amount": 185.00,
  "platform_fee": 14.85,
  "net_payout": 170.15,
  "currency": "USD",
  "reason": "buyer_approved"
}
```

**Response:**
```json
{
  "success": true,
  "transfer": {
    "transfer_id": "tr_9876543210zyxwvu",
    "payout_id": "payout_v4w5x6y7z8a9",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "seller_id": "sel_g7h8i9j0k1l2",
    "gross_amount": 185.00,
    "platform_fee": 14.85,
    "net_payout": 170.15,
    "currency": "USD",
    "status": "pending",
    "initiated_at": "2026-02-12T11:30:00Z",
    "estimated_arrival": "2026-02-14T00:00:00Z"
  },
  "escrow_status": "released",
  "message": "Funds transferred to seller. Estimated arrival: Feb 14, 2026"
}
```

**Process Refund:**  
`POST /api/v1/payments/refund`

**Request:**
```json
{
  "transaction_id": "txn_s9t0u1v2w3x4",
  "payment_id": "pay_c1d2e3f4g5h6",
  "stripe_charge_id": "ch_1234567890abcdef",
  "refund_amount": 200.19,
  "reason": "buyer_cancelled",
  "description": "Buyer cancelled before work started. Full refund issued."
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "refund_id": "ref_h6i7j8k9l0m1",
    "stripe_refund_id": "re_abcdef1234567890",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "refund_amount": 200.19,
    "currency": "USD",
    "status": "succeeded",
    "refunded_at": "2026-02-11T16:00:00Z",
    "estimated_arrival": "5-10 business days"
  },
  "message": "Refund processed successfully. Funds will return to original payment method in 5-10 business days."
}
```

**Stripe Webhook Handler:**  
`POST /api/v1/webhooks/stripe`

**Webhook Events Handled:**
- `charge.succeeded` → Update payment status
- `charge.failed` → Notify buyer, retry options
- `transfer.paid` → Update seller payout status
- `transfer.failed` → Alert support team
- `refund.created` → Update transaction status
- `account.updated` → Sync seller verification status
- `payout.paid` → Notify seller of bank deposit

**Example Webhook Payload (charge.succeeded):**
```json
{
  "id": "evt_webhook123",
  "type": "charge.succeeded",
  "data": {
    "object": {
      "id": "ch_1234567890abcdef",
      "amount": 20019,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "transaction_id": "txn_s9t0u1v2w3x4",
        "post_id": "post_c9h0f1g14d5e",
        "buyer_id": "usr_a1b2c3d4e5f6",
        "seller_id": "sel_g7h8i9j0k1l2"
      }
    }
  }
}
```

**Fee Calculation Functions (Backend):**

```javascript
// Calculate buyer total (including fees)
function calculateBuyerTotal(quoteAmount, category, transactionType) {
  let buyerFeePercentage;
  
  if (transactionType === 'local_cash') {
    return quoteAmount; // No fees for cash transactions
  }
  
  if (category === 'home_services') {
    buyerFeePercentage = 0.05; // 5%
  } else if (category === 'products_shipped') {
    buyerFeePercentage = 0.05; // 5%
  } else if (category === 'products_local_platform') {
    buyerFeePercentage = 0.03; // 3%
  } else if (category === 'inventory') {
    buyerFeePercentage = 0.05; // 5%
  } else if (category === 'jobs') {
    buyerFeePercentage = 0.06; // 6%
  }
  
  const buyerFee = quoteAmount * buyerFeePercentage;
  const subtotal = quoteAmount + buyerFee;
  const stripeFee = (subtotal * 0.029) + 0.30;
  const total = subtotal + stripeFee;
  
  return {
    quoteAmount: parseFloat(quoteAmount.toFixed(2)),
    buyerFee: parseFloat(buyerFee.toFixed(2)),
    stripeFee: parseFloat(stripeFee.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

// Calculate seller payout (after platform fee)
function calculateSellerPayout(quoteAmount, category, transactionType) {
  if (transactionType === 'local_cash') {
    return {
      gross: quoteAmount,
      platformFee: 0,
      net: quoteAmount
    };
  }
  
  let platformFeePercentage;
  
  if (category === 'home_services') {
    platformFeePercentage = 0.08; // 8%
  } else if (category === 'products_shipped') {
    platformFeePercentage = 0.06; // 6%
  } else if (category === 'products_local_platform') {
    platformFeePercentage = 0.03; // 3%
  } else if (category === 'inventory') {
    platformFeePercentage = 0.05; // 5%
  } else if (category === 'jobs') {
    platformFeePercentage = 0.06; // 6%
  }
  
  const platformFee = quoteAmount * platformFeePercentage;
  const netPayout = quoteAmount - platformFee;
  
  return {
    gross: parseFloat(quoteAmount.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    platformFeePercentage: platformFeePercentage * 100,
    net: parseFloat(netPayout.toFixed(2))
  };
}

// Example usage
const quote = 185.00;
const buyerCalc = calculateBuyerTotal(quote, 'home_services', 'platform');
console.log(buyerCalc);
// { quoteAmount: 185.00, buyerFee: 9.25, stripeFee: 5.94, total: 200.19 }

const sellerCalc = calculateSellerPayout(quote, 'home_services', 'platform');
console.log(sellerCalc);
// { gross: 185.00, platformFee: 14.85, platformFeePercentage: 8, net: 170.15 }
```

**Charge User (Stripe API Integration):**

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function chargeUser(transaction) {
  try {
    // Calculate fees
    const feeCalc = calculateBuyerTotal(
      transaction.quote_amount,
      transaction.category,
      transaction.transaction_type
    );
    
    // Create payment intent with 3D Secure
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(feeCalc.total * 100), // Convert to cents
      currency: 'usd',
      payment_method: transaction.payment_method_id,
      customer: transaction.buyer_stripe_customer_id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      description: `${transaction.post_title} - Escrow Payment`,
      metadata: {
        transaction_id: transaction.transaction_id,
        post_id: transaction.post_id,
        buyer_id: transaction.buyer_id,
        seller_id: transaction.seller_id,
        category: transaction.category
      }
    });
    
    // If 3D Secure required
    if (paymentIntent.status === 'requires_action') {
      return {
        success: false,
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        message: '3D Secure authentication required'
      };
    }
    
    // Payment succeeded
    if (paymentIntent.status === 'succeeded') {
      // Update transaction in database
      await updateTransaction(transaction.transaction_id, {
        payment_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0].id,
        escrow_status: 'held',
        status: 'payment_complete',
        buyer_total: feeCalc.total,
        buyer_fee: feeCalc.buyerFee,
        stripe_fee: feeCalc.stripeFee
      });
      
      return {
        success: true,
        payment_intent: paymentIntent,
        escrow_status: 'held'
      };
    }
    
    // Payment failed
    return {
      success: false,
      error: 'Payment failed',
      message: paymentIntent.last_payment_error?.message || 'Unknown error'
    };
    
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Release Payment to Seller (Stripe Transfer):**

```javascript
async function releasePaymentToSeller(transaction) {
  try {
    // Calculate seller payout
    const payoutCalc = calculateSellerPayout(
      transaction.quote_amount,
      transaction.category,
      transaction.transaction_type
    );
    
    // Create transfer to seller's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payoutCalc.net * 100), // Convert to cents
      currency: 'usd',
      destination: transaction.seller_stripe_account_id,
      transfer_group: transaction.transaction_id,
      description: `Payout for ${transaction.post_title}`,
      metadata: {
        transaction_id: transaction.transaction_id,
        seller_id: transaction.seller_id,
        gross_amount: payoutCalc.gross,
        platform_fee: payoutCalc.platformFee,
        net_payout: payoutCalc.net
      }
    });
    
    // Create payout record in database
    const payout = await createPayout({
      payout_id: generateId('payout'),
      transaction_id: transaction.transaction_id,
      seller_id: transaction.seller_id,
      gross_amount: payoutCalc.gross,
      platform_fee: payoutCalc.platformFee,
      net_payout: payoutCalc.net,
      stripe_transfer_id: transfer.id,
      status: 'pending',
      initiated_at: new Date(),
      estimated_arrival: addDays(new Date(), 2)
    });
    
    // Update transaction
    await updateTransaction(transaction.transaction_id, {
      escrow_status: 'released',
      payout_id: payout.payout_id,
      payout_initiated_at: new Date()
    });
    
    // Notify seller
    await sendEmail(transaction.seller_email, 'payout_initiated', {
      payout: payout,
      transaction: transaction
    });
    
    return {
      success: true,
      transfer: transfer,
      payout: payout
    };
    
  } catch (error) {
    console.error('Transfer error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Acceptance Criteria:**
- Payment charge completes in <3 seconds
- Escrow status visible to both parties
- 3D Secure modal appears for cards >$100
- Payment failures show clear error messages with retry option
- Funds released within 60 seconds of buyer approval
- Refunds processed same day
- All transactions logged with Stripe IDs
- Webhooks processed reliably (with retry logic)

**Business Rules:**
- Minimum transaction: $50
- Maximum transaction (MVP): $5,000 (increases with seller tier)
- Escrow hold period: 7-14 days depending on category
- Refunds issued to original payment method only
- Partial refunds supported (dispute resolution)
- Platform absorbs all Stripe fees (seller receives net after platform fee only)
- Failed charges automatically retry once after 24 hours
- 3D Secure required for all card transactions >$100
- Cash transactions bypass platform entirely (free, no escrow)

---

#### **FR-PAY-002: Seller Onboarding (Stripe Connect)**

**Description:** Sellers connect their bank account via Stripe Connect to receive payouts.

**Requirements:**

**Stripe Connect Standard Account Flow:**
- Sellers create their own Stripe accounts (not managed by platform)
- Platform generates Stripe Connect onboarding link
- Seller redirected to Stripe-hosted onboarding
- Stripe collects all required information
- Platform receives webhook when onboarding complete

**Data Collection (Handled by Stripe):**
- Legal business name (or individual name)
- Business type (Individual, Company, LLC, etc.)
- Tax ID (SSN for individuals, EIN for businesses)
- Date of birth (identity verification)
- Business address
- Bank account details (routing + account number)
- Identity verification (government ID upload)

**Verification Process:**
- Stripe automatically verifies identity (SSN/EIN, DOB, address)
- Bank account verified via micro-deposits or instant verification (Plaid)
- Identity documents verified (driver's license, passport)
- Typically completes in <10 minutes (instant verification)
- Manual review if auto-verification fails (24-48 hours)

**1099-K Tax Reporting:**
- Stripe automatically handles 1099-K reporting
- Issued to sellers earning >$600/year (IRS requirement)
- Tax forms available by January 31st each year
- Sellers download from Stripe dashboard

**Bank Account Updates:**
- Sellers update bank info directly in Stripe dashboard
- Platform receives webhook notification of changes
- Changes effective immediately for new payouts
- Cannot change bank mid-payout (must wait for payout to complete)

**Payout Schedules:**
- **Standard:** Daily automatic payouts (1-2 business days), free
- **Instant Payout** (Phase 2): On-demand payouts (15 minutes), 1% fee, requires Tier 2+ verification

**Onboarding Status:**
- **Not Started:** Seller hasn't clicked onboarding link
- **In Progress:** Seller started but hasn't completed onboarding
- **Pending Verification:** Stripe verifying information
- **Active:** Verified and ready to receive payouts
- **Restricted:** Account restricted (requires action)
- **Suspended:** Account suspended (contact support)

**API Endpoints:**
- `GET /api/v1/sellers/stripe-onboarding-link` → Generate Stripe Connect onboarding link
- `GET /api/v1/sellers/stripe-account-status` → Check seller's Stripe account status
- `POST /api/v1/webhooks/stripe` → Handle Stripe account events

**Generate Onboarding Link:**  
`GET /api/v1/sellers/stripe-onboarding-link`

**Response:**
```json
{
  "success": true,
  "onboarding_url": "https://connect.stripe.com/setup/s/acct_1234567890/abcdef123456",
  "expires_at": "2026-02-11T16:00:00Z",
  "message": "Complete your Stripe onboarding to receive payouts. Link expires in 1 hour."
}
```

**Get Stripe Account Status:**  
`GET /api/v1/sellers/stripe-account-status`

**Response (Active Account):**
```json
{
  "success": true,
  "stripe_account": {
    "account_id": "acct_1234567890",
    "status": "active",
    "charges_enabled": true,
    "payouts_enabled": true,
    "details_submitted": true,
    "verification_status": "verified",
    "requirements": {
      "currently_due": [],
      "past_due": [],
      "eventually_due": []
    },
    "bank_account": {
      "last4": "6789",
      "bank_name": "Chase Bank",
      "account_type": "checking",
      "status": "verified"
    },
    "payout_schedule": {
      "interval": "daily",
      "delay_days": 2
    }
  },
  "can_receive_payouts": true,
  "message": "Your Stripe account is active and ready to receive payouts."
}
```

**Response (Incomplete Onboarding):**
```json
{
  "success": true,
  "stripe_account": {
    "account_id": "acct_1234567890",
    "status": "restricted",
    "charges_enabled": false,
    "payouts_enabled": false,
    "details_submitted": false,
    "verification_status": "unverified",
    "requirements": {
      "currently_due": ["individual.id_number", "individual.dob", "tos_acceptance.date"],
      "past_due": [],
      "eventually_due": ["bank_account"]
    }
  },
  "can_receive_payouts": false,
  "message": "Complete your Stripe onboarding to start receiving payouts.",
  "action_required": "Click 'Complete Onboarding' to finish setup"
}
```

**Stripe Webhook (Account Updated):**

**Webhook Event: `account.updated`**
```json
{
  "id": "evt_webhook456",
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_1234567890",
      "charges_enabled": true,
      "payouts_enabled": true,
      "details_submitted": true,
      "requirements": {
        "currently_due": [],
        "past_due": [],
        "eventually_due": []
      }
    }
  }
}
```

**Backend Handler:**
```javascript
// Update seller's Stripe status in database
if (event.type === 'account.updated') {
  const account = event.data.object;
  
  await updateSellerStripeStatus(account.id, {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    verification_status: account.details_submitted ? 'verified' : 'unverified',
    requirements_due: account.requirements.currently_due
  });
  
  // Notify seller if onboarding complete
  if (account.payouts_enabled && !account.requirements.currently_due.length) {
    await sendEmail(seller.email, 'stripe_onboarding_complete', {
      seller: seller,
      message: "You're all set! You can now receive payouts."
    });
  }
}
```

**Create Stripe Connect Account (Backend):**

```javascript
async function createStripeConnectAccount(seller) {
  try {
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'US',
      email: seller.email,
      business_type: seller.business_type || 'individual',
      metadata: {
        seller_id: seller.seller_id,
        platform_user_id: seller.user_id
      }
    });
    
    // Save Stripe account ID to database
    await updateSeller(seller.seller_id, {
      stripe_account_id: account.id,
      stripe_onboarding_status: 'created'
    });
    
    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `https://app.reversemarket.com/seller/stripe-onboarding`,
      return_url: `https://app.reversemarket.com/seller/dashboard`,
      type: 'account_onboarding'
    });
    
    return {
      success: true,
      stripe_account_id: account.id,
      onboarding_url: accountLink.url,
      expires_at: accountLink.expires_at
    };
    
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Seller Onboarding UI (Example):**

```
╔══════════════════════════════════════════════════════════╗
║  💳 Connect Your Bank Account                            ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  To receive payouts, you need to connect your bank        ║
║  account via Stripe (our payment processor).              ║
║                                                            ║
║  ✅ Secure: Your bank details are handled by Stripe      ║
║  ✅ Fast: Verification usually takes less than 10 mins   ║
║  ✅ Easy: Automatic payouts to your bank account         ║
║                                                            ║
║  You'll need:                                             ║
║  • Social Security Number or EIN                          ║
║  • Date of birth                                          ║
║  • Bank routing & account number                          ║
║  • Government ID (driver's license or passport)           ║
║                                                            ║
║  [Complete Stripe Onboarding] →                          ║
║                                                            ║
║  Powered by Stripe                                        ║
╚══════════════════════════════════════════════════════════╝
```

**Onboarding Status Check UI:**

```
╔══════════════════════════════════════════════════════════╗
║  ⚠️ Action Required: Complete Stripe Onboarding         ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  You cannot receive payouts until you complete Stripe     ║
║  onboarding.                                              ║
║                                                            ║
║  Missing Information:                                     ║
║  ❌ Tax ID (SSN or EIN)                                  ║
║  ❌ Date of Birth                                        ║
║  ❌ Bank Account Details                                 ║
║                                                            ║
║  [Complete Onboarding Now] →                             ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
```

**Acceptance Criteria:**
- Onboarding link generated in <1 second
- Link expires after 1 hour (renewable)
- Seller redirected to Stripe-hosted onboarding
- Onboarding typically completes in <10 minutes
- Platform receives webhook when onboarding complete
- Seller can update bank info anytime via Stripe dashboard
- Unverified sellers cannot receive payouts
- Verified sellers see "Ready to Receive Payouts" badge
- Status checks reflect real-time Stripe account status

**Business Rules:**
- Sellers must complete Stripe onboarding before receiving first payout
- Cannot submit offers until phone verified, but can complete Stripe onboarding anytime
- Bank account changes effective immediately for new payouts
- Standard payouts: Daily at 12:00 AM UTC, arrive in 1-2 business days
- Instant payouts (Phase 2): 1% fee, arrive in 15 minutes, requires Tier 2+ verification
- 1099-K issued for earnings >$600/year
- Sellers can view all tax documents in Stripe dashboard
- Platform never stores sensitive bank account details (handled entirely by Stripe)

---

## **8.6 Review & Rating System (Universal)**

**Description:** Comprehensive review and rating system for buyers to rate sellers (and vice versa in Phase 2).

**Requirements:**

**Review Timing:**
- Buyer prompted to review immediately after transaction approval
- Can skip and review later (within 60 days of completion)
- Push reminder 7 days after completion if not reviewed
- After 60 days, review window closes automatically

**Universal Rating Fields:**
- **Overall rating** (required, 1-5 stars)
- **Written review** (optional, 50-500 characters)
- **Would you recommend this seller?** (Yes/No, required)
- **Category-specific ratings** (optional, 1-5 stars each)

**Category-Specific Rating Dimensions:**

**Services (Home Services, Handyman, Cleaning, etc.):**
- Quality of work (1-5 stars)
- Timeliness (on-time arrival) (1-5 stars)
- Professionalism (1-5 stars)
- Communication (1-5 stars)
- Value for money (1-5 stars)

**Products (Buying/Selling):**
- Item as described (1-5 stars)
- Packaging quality (1-5 stars)
- Shipping speed (1-5 stars, if shipped)
- Communication (1-5 stars)

**Inventory/B2B:**
- Product quality (1-5 stars)
- Delivery timeliness (1-5 stars)
- Packaging (1-5 stars)
- Invoice accuracy (1-5 stars)
- Communication (1-5 stars)

**Jobs (Phase 3):**
- Skill level (1-5 stars)
- Reliability (1-5 stars)
- Communication (1-5 stars)
- Cultural fit (1-5 stars)

**Review Features:**
- **Immutable:** Reviews cannot be edited after submission
- **Verified completion:** Badge indicates review from verified transaction
- **Seller response** (Phase 2): Sellers can respond to reviews (1 response per review, 500 char max)
- **Flag inappropriate reviews:** Report profanity, spam, or fake reviews
- **Completion evidence attached:** After photos auto-attached to service reviews (Phase 2)
- **Review visibility:** All reviews public on seller profile

**Review Moderation:**
- AI profanity filter (auto-flag offensive language)
- Spam detection (duplicate reviews, fake reviews)
- Human review for flagged content (within 24 hours)
- Reviews violating terms removed with explanation
- Sellers can dispute unfair reviews (human arbitration)

**Seller Rating Calculation:**
- **Overall rating:** Weighted average of all reviews
- **Recent reviews weighted higher:** 70% weight to last 6 months, 30% to older
- **Category-specific ratings:** Calculated separately per dimension
- **Display format:** "4.8/5.0 (47 reviews)"
- **Minimum reviews for display:** 3 reviews minimum to show rating
- **Rating badge levels:**
  - 4.8-5.0: ⭐ "Top Rated" (gold badge)
  - 4.5-4.79: ⭐ "Highly Rated" (silver badge)
  - 4.0-4.49: ⭐ "Good" (bronze badge)
  - <4.0: No badge

**Review Impact on Seller:**
- **Profile rating:** Displayed prominently on seller profile
- **Search ranking:** Higher-rated sellers rank higher in feed
- **Offer competitiveness:** Buyers see ratings when comparing offers
- **Tier upgrades:** Consistent >4.5 rating unlocks perks (Phase 2)
- **Low ratings action:**
  - <3.5 rating with 10+ reviews: Warning email + coaching resources
  - <3.0 rating with 20+ reviews: Account under review
  - <2.5 rating with 30+ reviews: Account suspension (pending investigation)

**Review Reminders:**
- Day 0: Prompt immediately after approval
- Day 7: Push notification reminder
- Day 30: Email reminder
- Day 60: Final reminder (window closes after this)

**API Endpoints:**
- `POST /api/v1/reviews` → Submit review
- `GET /api/v1/sellers/{seller_id}/reviews` → Get all reviews for seller
- `PUT /api/v1/reviews/{review_id}/report` → Report inappropriate review
- `POST /api/v1/reviews/{review_id}/response` → Seller responds to review (Phase 2)

**Submit Review:**  
`POST /api/v1/reviews`

**Request (Service Example):**
```json
{
  "transaction_id": "txn_s9t0u1v2w3x4",
  "seller_id": "sel_g7h8i9j0k1l2",
  "category": "home_services",
  "overall_rating": 5,
  "category_ratings": {
    "quality_of_work": 5,
    "timeliness": 5,
    "professionalism": 5,
    "communication": 4,
    "value_for_money": 5
  },
  "written_review": "Smith Plumbing was excellent! Arrived on time, fixed the leak quickly, and cleaned up perfectly. Very professional and reasonably priced. Highly recommend!",
  "would_recommend": true,
  "completion_evidence_attached": true
}
```

**Response:**
```json
{
  "success": true,
  "review": {
    "review_id": "rev_x5y6z7a8b9c0",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "seller_id": "sel_g7h8i9j0k1l2",
    "buyer_id": "usr_a1b2c3d4e5f6",
    "buyer_name": "Sarah J.",
    "category": "home_services",
    "overall_rating": 5,
    "category_ratings": {
      "quality_of_work": 5,
      "timeliness": 5,
      "professionalism": 5,
      "communication": 4,
      "value_for_money": 5
    },
    "written_review": "Smith Plumbing was excellent! Arrived on time, fixed the leak quickly...",
    "would_recommend": true,
    "verified_completion": true,
    "completion_photos": [
      "https://cdn.example.com/after1.jpg",
      "https://cdn.example.com/after2.jpg"
    ],
    "created_at": "2026-02-12T12:00:00Z"
  },
  "seller_stats_updated": {
    "new_average_rating": 4.82,
    "total_reviews": 48,
    "total_completed_jobs": 52,
    "rating_badge": "top_rated"
  },
  "message": "Thank you for your feedback! Your review helps other buyers make informed decisions."
}
```

**Get Seller Reviews:**  
`GET /api/v1/sellers/{seller_id}/reviews?sort=newest&rating_filter=all&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "seller": {
    "seller_id": "sel_g7h8i9j0k1l2",
    "business_name": "Smith Plumbing & Repair",
    "overall_rating": 4.82,
    "total_reviews": 48,
    "rating_badge": "top_rated",
    "rating_breakdown": {
      "5_stars": 38,
      "4_stars": 8,
      "3_stars": 2,
      "2_stars": 0,
      "1_star": 0
    },
    "category_ratings": {
      "quality_of_work": 4.85,
      "timeliness": 4.78,
      "professionalism": 4.90,
      "communication": 4.70,
      "value_for_money": 4.82
    },
    "recommendation_rate": 95.8
  },
  "reviews": [
    {
      "review_id": "rev_x5y6z7a8b9c0",
      "buyer_name": "Sarah J.",
      "buyer_rating": 4.9,
      "overall_rating": 5,
      "written_review": "Smith Plumbing was excellent! Arrived on time, fixed the leak quickly...",
      "would_recommend": true,
      "verified_completion": true,
      "completion_photos": [
        "https://cdn.example.com/after1-thumb.jpg"
      ],
      "created_at": "2026-02-12T12:00:00Z",
      "transaction_details": {
        "service": "Kitchen Sink Leak Repair",
        "amount": 185.00
      }
    },
    {
      "review_id": "rev_y6z7a8b9c0d1",
      "buyer_name": "Mike C.",
      "buyer_rating": 4.7,
      "overall_rating": 4,
      "written_review": "Good work overall. Took a bit longer than expected but got the job done well.",
      "would_recommend": true,
      "verified_completion": true,
      "created_at": "2026-02-08T15:30:00Z",
      "seller_response": {
        "response_text": "Thank you for the feedback! The extra time was needed to ensure we fixed the underlying issue properly. Appreciate your patience!",
        "responded_at": "2026-02-09T09:00:00Z"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_reviews": 48
  }
}
```

**Report Review:**  
`PUT /api/v1/reviews/{review_id}/report`

**Request:**
```json
{
  "reason": "spam",
  "description": "This review is fake. I never worked for this person."
}
```

**Response:**
```json
{
  "success": true,
  "report_id": "rpt_z7a8b9c0d1e2",
  "message": "Review reported successfully. Our team will review within 24 hours.",
  "status": "under_review"
}
```

**Weighted Rating Calculation (Backend):**

```javascript
function calculateWeightedRating(reviews) {
  const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
  
  let recentSum = 0, recentCount = 0;
  let oldSum = 0, oldCount = 0;
  
  reviews.forEach(review => {
    const reviewDate = new Date(review.created_at).getTime();
    
    if (reviewDate > sixMonthsAgo) {
      recentSum += review.overall_rating;
      recentCount++;
    } else {
      oldSum += review.overall_rating;
      oldCount++;
    }
  });
  
  const recentAvg = recentCount > 0 ? recentSum / recentCount : 0;
  const oldAvg = oldCount > 0 ? oldSum / oldCount : 0;
  
  // 70% weight to recent reviews, 30% to older reviews
  const weightedRating = (recentAvg * 0.7) + (oldAvg * 0.3);
  
  // Calculate rating badge
  let ratingBadge = null;
  if (weightedRating >= 4.8) {
    ratingBadge = 'top_rated';
  } else if (weightedRating >= 4.5) {
    ratingBadge = 'highly_rated';
  } else if (weightedRating >= 4.0) {
    ratingBadge = 'good';
  }
  
  return {
    overall_rating: parseFloat(weightedRating.toFixed(2)),
    total_reviews: reviews.length,
    recent_reviews: recentCount,
    older_reviews: oldCount,
    rating_badge: ratingBadge
  };
}
```

**Acceptance Criteria:**
- Review prompt appears immediately after transaction approval
- Can skip and review later (within 60 days)
- Cannot submit duplicate review for same transaction
- Reviews immutable after submission
- Seller rating updates in real-time after each review
- After photos auto-attach to service reviews (Phase 2)
- Profanity automatically flagged for review
- Reported reviews reviewed by human within 24 hours
- Rating badge displayed on seller profile and in feed

**Business Rules:**
- Minimum 3 reviews to display overall rating
- Recent reviews (last 6 months) weighted 70%, older 30%
- Sellers can respond to reviews (Phase 2, 1 response per review)
- Reviews deleted only if violate terms (spam, fake, profanity)
- Sellers with <3.0 rating and 20+ reviews flagged for review
- Buyers cannot review seller without completed transaction
- Review window closes 60 days after completion

---

## **8.7 Dispute Resolution System**

**Description:** Tiered dispute resolution system to handle conflicts between buyers and sellers fairly and efficiently.

**Requirements:**

**Dispute Triggers:**
- Buyer reports issue during or after transaction
- Seller disputes buyer claim
- Payment held due to quality/completion issues
- Delivery disputes (wrong/damaged item, not as described)
- Service disputes (incomplete work, poor quality, damage to property)
- No-show disputes (seller didn't arrive, buyer wasn't available)
- Refund disputes (buyer wants refund, seller disagrees)

**Dispute Types by Category:**

**Services:**
- Work incomplete or not done
- Poor quality work
- Damage to property
- Seller no-show
- Pricing dispute (unexpected charges)
- Timeline dispute (took longer than quoted)

**Products (Shipped):**
- Item not as described
- Item damaged in shipping
- Wrong item received
- Item never arrived (despite tracking showing delivery)
- Item defective/not working

**Products (Local Meetup):**
- Item not as described
- Seller no-show
- Buyer no-show (seller claims)
- Item defective discovered after meetup

**Inventory/B2B:**
- Wrong quantity delivered
- Quality issues (defective products)
- Invoice discrepancies
- Late delivery

**Jobs (Phase 3):**
- Work quality issues
- Employee no-show
- Payment disputes

**Tiered Resolution System:**

**Tier 1: Automated Resolution (AI-Assisted)**
- **Applies to:** Simple disputes <$200, clear evidence
- **Process:**
  1. AI analyzes before/after photos, messages, transaction history
  2. AI assigns confidence score (0-100%)
  3. If confidence >80%, AI issues auto-resolution
  4. Resolution options: Full refund, Partial refund, No refund
- **Timeline:** 15 minutes automated analysis
- **Cost:** Free

**Tier 2: Human Support Review**
- **Applies to:** Disputes $200-$1,000, or Tier 1 confidence <80%
- **Process:**
  1. Support agent reviews evidence (photos, messages, transaction details)
  2. Agent contacts both parties for additional info if needed
  3. Agent mediates conversation, suggests resolution
  4. If agreed, resolution executed
  5. If no agreement, escalates to Tier 3
- **Timeline:** 24-48 hours
- **Cost:** Free

**Tier 3: Formal Arbitration**
- **Applies to:** Disputes >$1,000, or Tier 2 unresolved
- **Process:**
  1. Neutral third-party arbitrator assigned
  2. Both parties submit detailed evidence packets
  3. Arbitrator reviews all evidence
  4. Arbitrator holds hearing (video call or written statements)
  5. Arbitrator issues binding decision
- **Timeline:** 5-7 business days
- **Cost:** $50 fee (charged to losing party)

**Dispute Process Flow:**

**Step 1: Initiate Dispute**
- Buyer (or seller) clicks "Report Issue" on transaction page
- Select dispute type from dropdown
- Provide description (100-1000 chars)
- Upload evidence (photos, videos, documents; max 10 files, 5MB each)
- Submit dispute

**Step 2: Escrow Freeze**
- Payment immediately frozen (cannot be released during dispute)
- Both parties notified via push + email
- Transaction status changed to "Disputed"

**Step 3: Evidence Collection**
- Both parties invited to submit evidence within 48 hours
- Before/after photos, messages, receipts, inspection reports
- Platform automatically includes transaction history, messages, photos

**Step 4: Resolution Attempt**
- Tier 1: AI analyzes and issues resolution (if confidence >80%)
- Tier 2: Support agent reviews and mediates
- Tier 3: Arbitrator issues binding decision

**Step 5: Outcome**
- **Full refund to buyer:** Escrow refunded to buyer, seller receives nothing
- **Partial refund:** Escrow split (e.g., 70% to buyer, 30% to seller)
- **No refund:** Escrow released to seller, buyer receives nothing
- **Other resolution:** Custom agreement (e.g., seller completes remaining work, buyer extends deadline)

**Step 6: Appeal (Optional)**
- Losing party can appeal Tier 2 decision (escalates to Tier 3)
- Tier 3 decisions are final and binding
- Appeal must be filed within 72 hours

**Evidence Types:**

**Services:**
- Before photos (uploaded by seller at start, Phase 2)
- After photos (uploaded by seller at completion, Phase 2)
- Buyer photos showing issue
- Message history
- Video evidence (walkthroughs, damage footage)
- Third-party inspection reports (optional)

**Products:**
- Product listing screenshots
- Product condition photos (seller's original photos)
- Received item photos (buyer's photos showing issue)
- Packaging photos (damage evidence)
- Shipping carrier reports
- Tracking history

**Inventory/B2B:**
- Invoice/purchase order
- Delivery receipt
- Product photos (quality issues)
- Quantity count documentation
- Third-party inspection reports

**AI-Assisted Dispute Analysis (Phase 2):**
- **Photo comparison:** AI compares before/after photos for services, product listing vs. received item photos
- **Message sentiment analysis:** Detect tone, satisfaction signals, red flags
- **Transaction pattern analysis:** Check for suspicious patterns (repeat disputes, serial refunders)
- **Confidence scoring:**
  - 90-100%: Very high confidence, auto-resolve
  - 80-89%: High confidence, auto-resolve with human review notification
  - 60-79%: Medium confidence, escalate to human
  - <60%: Low confidence, escalate immediately

**Resolution Outcomes:**

**Full Refund to Buyer:**
- 100% escrow refunded to buyer
- Seller receives $0
- Negative mark on seller's record
- Seller can appeal

**Partial Refund:**
- Escrow split (common: 50/50, 70/30, 80/20)
- Both parties partially compensated
- Neutral mark on records

**No Refund (Seller Wins):**
- 100% escrow released to seller
- Buyer receives $0
- Negative mark on buyer's record (if frivolous dispute)
- Buyer can appeal Tier 2 decisions

**Alternative Resolutions:**
- Seller completes remaining work (timeline extension granted)
- Seller offers discount on future service
- Buyer accepts item "as-is" with partial refund
- Buyer returns item, seller refunds (products)

**Dispute Prevention:**
- **Clear expectations:** Detailed job descriptions, product descriptions
- **Before/after photos:** Required for services >$500 (Phase 2)
- **Milestone payments:** For complex jobs >$2,000 (Phase 3)
- **Communication logs:** In-app messaging required (off-platform communication discouraged)
- **Delivery confirmation:** Required for shipped products
- **QR verification:** Required for local platform meetups

**API Endpoints:**
- `POST /api/v1/disputes` → Create dispute
- `GET /api/v1/disputes/{dispute_id}` → Get dispute details
- `POST /api/v1/disputes/{dispute_id}/evidence` → Submit additional evidence
- `PUT /api/v1/disputes/{dispute_id}/respond` → Respond to dispute
- `POST /api/v1/disputes/{dispute_id}/accept-resolution` → Accept proposed resolution
- `POST /api/v1/disputes/{dispute_id}/appeal` → Appeal decision

**Create Dispute:**  
`POST /api/v1/disputes`

**Request:**
```json
{
  "transaction_id": "txn_s9t0u1v2w3x4",
  "dispute_type": "work_incomplete",
  "description": "The plumber fixed the main leak but did not replace the old P-trap as agreed. The sink is still dripping from the P-trap connection. I asked him to return and complete the work, but he has not responded to my messages.",
  "evidence": [
    {
      "type": "photo",
      "url": "https://s3.amazonaws.com/uploads/dripping-p-trap.jpg",
      "description": "P-trap still leaking after job marked complete"
    },
    {
      "type": "photo",
      "url": "https://s3.amazonaws.com/uploads/old-p-trap-not-replaced.jpg",
      "description": "Old P-trap was not replaced as agreed in the quote"
    }
  ],
  "requested_resolution": "partial_refund",
  "requested_amount": 75.00,
  "resolution_details": "Requesting partial refund of $75 for incomplete work (P-trap replacement not done)."
}
```

**Response:**
```json
{
  "success": true,
  "dispute": {
    "dispute_id": "dsp_a1b2c3d4e5f6",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "status": "open",
    "dispute_type": "work_incomplete",
    "opened_by": "buyer",
    "opened_at": "2026-02-13T10:00:00Z",
    "tier": 1,
    "ai_analysis_status": "in_progress",
    "escrow_status": "frozen",
    "evidence_deadline": "2026-02-15T10:00:00Z"
  },
  "message": "Dispute opened successfully. Payment has been frozen. Both parties will be notified and can submit evidence within 48 hours.",
  "next_steps": "Our AI system will analyze the evidence. If confidence is high, we'll issue a resolution within 15 minutes. Otherwise, a support agent will review within 24-48 hours."
}
```

**Get Dispute Details:**  
`GET /api/v1/disputes/{dispute_id}`

**Response:**
```json
{
  "success": true,
  "dispute": {
    "dispute_id": "dsp_a1b2c3d4e5f6",
    "transaction_id": "txn_s9t0u1v2w3x4",
    "post_title": "Kitchen Sink Leak Repair",
    "quote_amount": 185.00,
    "escrow_amount": 185.00,
    "status": "under_review",
    "dispute_type": "work_incomplete",
    "opened_by": "buyer",
    "opened_at": "2026-02-13T10:00:00Z",
    "tier": 2,
    "assigned_agent": {
      "name": "Support Agent Mike",
      "agent_id": "agent_123"
    },
    "parties": {
      "buyer": {
        "user_id": "usr_a1b2c3d4e5f6",
        "name": "Sarah Johnson",
        "rating": 4.9
      },
      "seller": {
        "seller_id": "sel_g7h8i9j0k1l2",
        "business_name": "Smith Plumbing & Repair",
        "rating": 4.82
      }
    },
    "buyer_claim": {
      "description": "The plumber fixed the main leak but did not replace the old P-trap as agreed...",
      "requested_resolution": "partial_refund",
      "requested_amount": 75.00,
      "evidence": [
        {
          "type": "photo",
          "url": "https://cdn.example.com/evidence/dripping-p-trap.jpg",
          "description": "P-trap still leaking after job marked complete"
        },
        {
          "type": "photo",
          "url": "https://cdn.example.com/evidence/old-p-trap-not-replaced.jpg",
          "description": "Old P-trap was not replaced"
        }
      ]
    },
    "seller_response": {
      "description": "I fixed the main leak as requested. The P-trap replacement was not included in my original quote. The buyer asked me to do it during the job, but I explained it would be an additional $75. She declined the extra work at that time.",
      "evidence": [
        {
          "type": "message_thread",
          "excerpt": "Buyer: 'Can you also replace the P-trap?' Seller: 'That would be an additional $75. Would you like me to do that?' Buyer: 'Let me think about it.'",
          "timestamp": "2026-02-12T09:30:00Z"
        },
        {
          "type": "photo",
          "url": "https://cdn.example.com/evidence/completed-main-leak.jpg",
          "description": "Main leak repair completed as quoted"
        }
      ],
      "submitted_at": "2026-02-13T14:00:00Z"
    },
    "ai_analysis": {
      "confidence_score": 65,
      "recommended_outcome": "partial_refund",
      "recommended_amount": 50.00,
      "reasoning": "Message history shows P-trap replacement was discussed as optional extra work, not included in original quote. However, buyer's expectation was not clearly managed. Recommend compromise: 50% partial refund ($50) to buyer for miscommunication."
    },
    "timeline": [
      {
        "event": "dispute_opened",
        "timestamp": "2026-02-13T10:00:00Z",
        "description": "Buyer opened dispute"
      },
      {
        "event": "escrow_frozen",
        "timestamp": "2026-02-13T10:00:01Z",
        "description": "Payment frozen"
      },
      {
        "event": "seller_notified",
        "timestamp": "2026-02-13T10:00:30Z",
        "description": "Seller notified of dispute"
      },
      {
        "event": "seller_responded",
        "timestamp": "2026-02-13T14:00:00Z",
        "description": "Seller submitted response and evidence"
      },
      {
        "event": "ai_analysis_complete",
        "timestamp": "2026-02-13T14:15:00Z",
        "description": "AI analysis complete (confidence: 65%, escalated to human)"
      },
      {
        "event": "escalated_to_tier_2",
        "timestamp": "2026-02-13T14:16:00Z",
        "description": "Escalated to support agent for review"
      }
    ],
    "estimated_resolution": "2026-02-15T10:00:00Z"
  }
}
```

**Submit Additional Evidence:**  
`POST /api/v1/disputes/{dispute_id}/evidence`

**Request:**
```json
{
  "party": "seller",
  "evidence": [
    {
      "type": "document",
      "url": "https://s3.amazonaws.com/uploads/original-quote.pdf",
      "description": "Original quote showing P-trap replacement NOT included"
    }
  ],
  "additional_comments": "My original quote clearly stated I would fix the main leak only. P-trap replacement was discussed as optional add-on during the job, which the buyer declined."
}
```

**Accept Resolution:**  
`POST /api/v1/disputes/{dispute_id}/accept-resolution`

**Request:**
```json
{
  "party": "buyer",
  "accept": true,
  "comments": "I accept the $50 partial refund as a fair compromise."
}
```

**Response:**
```json
{
  "success": true,
  "resolution": {
    "dispute_id": "dsp_a1b2c3d4e5f6",
    "status": "resolved",
    "outcome": "partial_refund",
    "refund_amount": 50.00,
    "seller_payout": 135.00,
    "resolved_at": "2026-02-15T11:00:00Z",
    "resolution_summary": "Both parties agreed to $50 partial refund to buyer. Seller receives $135 (original $185 minus $50 refund)."
  },
  "payment_actions": [
    {
      "action": "refund_buyer",
      "amount": 50.00,
      "status": "processing",
      "estimated_arrival": "5-10 business days"
    },
    {
      "action": "release_to_seller",
      "amount": 135.00,
      "status": "processing",
      "estimated_arrival": "1-2 business days"
    }
  ],
  "message": "Resolution accepted. Refund and payout are being processed."
}
```

**Appeal Decision:**  
`POST /api/v1/disputes/{dispute_id}/appeal`

**Request:**
```json
{
  "party": "seller",
  "appeal_reason": "The resolution was unfair. My quote clearly did not include P-trap replacement. I should receive full payment.",
  "additional_evidence": [
    {
      "type": "document",
      "url": "https://s3.amazonaws.com/uploads/signed-quote.pdf",
      "description": "Signed quote by buyer showing P-trap NOT included"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "appeal": {
    "appeal_id": "apl_x1y2z3a4b5c6",
    "dispute_id": "dsp_a1b2c3d4e5f6",
    "status": "under_review",
    "tier": 3,
    "appeal_filed_by": "seller",
    "appeal_filed_at": "2026-02-15T12:00:00Z",
    "arbitrator_assigned": "Senior Arbitrator Jane Doe",
    "estimated_decision": "2026-02-22T12:00:00Z"
  },
  "message": "Appeal submitted. Case escalated to formal arbitration (Tier 3). A neutral arbitrator will review all evidence and issue a binding decision within 5-7 business days."
}
```

**Dispute Dashboard UI (Buyer View):**
```
╔══════════════════════════════════════════════════════════╗
║  ⚠️ Dispute Open: Kitchen Sink Leak Repair              ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  Status: Under Review (Tier 2 - Support Agent)           ║
║  Opened: Feb 13, 2026 at 10:00 AM                        ║
║  Estimated Resolution: Feb 15, 2026                       ║
║                                                            ║
║  Dispute Type: Work Incomplete                            ║
║  Amount in Dispute: $185.00 (frozen)                     ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  Your Claim                                               ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  The plumber fixed the main leak but did not replace     ║
║  the old P-trap as agreed. Requesting $75 partial        ║
║  refund for incomplete work.                              ║
║                                                            ║
║  Evidence:                                                ║
║  • 📷 P-trap still leaking [View Photo]                  ║
║  • 📷 Old P-trap not replaced [View Photo]               ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  Seller Response                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  Seller claims P-trap replacement was optional add-on,   ║
║  not included in original quote. Buyer declined extra    ║
║  work during job.                                         ║
║                                                            ║
║  Evidence:                                                ║
║  • 💬 Message thread [View Messages]                     ║
║  • 📷 Completed main leak repair [View Photo]            ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  AI Analysis (Confidence: 65%)                            ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  Recommended Outcome: Partial Refund ($50)                ║
║  Reasoning: Message history shows miscommunication.       ║
║  Recommend 50% compromise for fair resolution.            ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  Support Agent Review                                     ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  Agent Mike is reviewing your case. You'll receive an     ║
║  update within 24-48 hours.                               ║
║                                                            ║
║  [Submit Additional Evidence]  [Message Support]          ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
```

**Acceptance Criteria:**
- Dispute opens instantly, escrow frozen within 1 second
- Both parties notified within 60 seconds (push + email)
- AI analysis completes within 15 minutes (Tier 1)
- Support agent responds within 24-48 hours (Tier 2)
- Arbitrator decision within 5-7 business days (Tier 3)
- Evidence uploads support photos/videos/documents up to 5MB each
- Resolution outcomes processed within 1 hour of acceptance
- Appeal window open for 72 hours after Tier 2 decision

**Business Rules:**
- Disputes freeze escrow immediately (no auto-release during dispute)
- Minimum dispute amount: $25 (disputes <$25 handled informally)
- Maximum evidence submission: 10 files, 5MB each
- Evidence deadline: 48 hours after dispute opened
- Tier 1 (AI): Auto-resolve if confidence >80%, disputes <$200
- Tier 2 (Human): All disputes $200-$1,000, or Tier 1 confidence <80%
- Tier 3 (Arbitration): Disputes >$1,000, or Tier 2 unresolved; $50 fee charged to losing party
- Appeal deadline: 72 hours after Tier 2 decision
- Tier 3 decisions final and binding (no further appeals)
- Frivolous disputes tracked (3+ lost disputes = warning, 5+ = account review)
- Sellers with >15% dispute rate flagged for review

---

## **8.8 Search & Discovery System**

**Description:** Powerful search and discovery features to help buyers find sellers and sellers find relevant posts.

**Requirements:**

**Search Types:**

**1. Buyer Post Search (Sellers searching for opportunities):**
- Search by keyword (title, description)
- Filter by category/subcategory
- Filter by location/radius
- Filter by budget range
- Filter by urgency (ASAP, Within 24h, etc.)
- Filter by competition level (offers count)
- Filter by buyer requirements (rating, verification)
- Sort by: Newest, Expiring soon, Highest budget, Closest, Fewest offers, Most relevant

**2. Seller Search (Buyers searching for sellers):**
- Search by business name, services offered
- Filter by category/subcategory
- Filter by location/radius
- Filter by rating (4+, 4.5+, 5 stars)
- Filter by verification level (Tier 1, 2, 3)
- Filter by availability (available today, this week)
- Sort by: Highest rated, Most reviews, Closest, Lowest price range

**3. Universal Keyword Search:**
- Search across posts, sellers, categories
- Auto-complete suggestions
- Recent searches saved
- Popular searches displayed

**Search Technology:**

**MVP (Phase 1):**
- PostgreSQL full-text search with `tsvector` and `tsquery`
- GIN indexes on searchable columns
- Basic keyword matching with stemming
- Location-based search using PostGIS

**Phase 2:**
- Elasticsearch for advanced search
- Fuzzy matching (typo tolerance)
- Synonym expansion
- Relevance scoring with boosting
- Faceted search (aggregations)
- Real-time indexing

**Location-Based Search:**
- **Input:** Zip code, city, or "Current location" (GPS)
- **Radius:** Default 25 miles; adjustable (5, 10, 25, 50, 100 miles)
- **Calculation:** Haversine formula for distance calculation
- **Display:** Show distance in miles from buyer/seller location
- **Map view:** Display posts/sellers on map (Phase 2)

**Relevance Scoring:**

**Post Relevance (for sellers):**
- Keyword match: 30%
- Budget fit (within seller tier): 20%
- Location proximity: 25%
- Buyer rating: 10%
- Post urgency: 10%
- Competition level (fewer offers = higher score): 5%

**Seller Relevance (for buyers):**
- Keyword match: 25%
- Rating: 30%
- Location proximity: 20%
- Verification level: 15%
- Completion rate: 10%

**Saved Searches (Phase 2):**
- Save search criteria with custom name
- Receive notifications when new matches appear
- Manage saved searches (edit, delete, enable/disable notifications)

**Search Suggestions:**
- **Auto-complete:** As user types, suggest matching categories, services, keywords
- **Did you mean?:** Suggest corrections for typos
- **Related searches:** Show similar searches based on query
- **Popular searches:** Display trending searches in category

**Search Filters UI:**

**Buyer Searching for Sellers:**
```
╔══════════════════════════════════════════════════════════╗
║  🔍 Find Sellers                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  [Search for plumbers near me...                    ] 🔍 ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  Filters                                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  Category: [Home Services ▼]                              ║
║  Subcategory: [Plumbing ▼]                                ║
║                                                            ║
║  Location: [Dallas, TX          ] Within [25 mi ▼]       ║
║                                                            ║
║  Rating: [⭐ 4.0+] [⭐ 4.5+] [⭐ 5.0]                      ║
║                                                            ║
║  Verification: [ ] Email  [ ] Phone  [ ] License          ║
║                                                            ║
║  Availability: [ ] Available Today  [ ] This Week         ║
║                                                            ║
║  Sort by: [Highest Rated ▼]                              ║
║                                                            ║
║  [Apply Filters]  [Clear All]                             ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
```

**Seller Searching for Posts:**
```
╔══════════════════════════════════════════════════════════╗
║  🔍 Find Jobs                                             ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  [Search for plumbing jobs...                       ] 🔍 ║
║                                                            ║
╠══════════════════════════════════════════════════════════╣
║  Filters                                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                            ║
║  Category: [Home Services ▼]                              ║
║  Subcategory: [Plumbing ▼]                                ║
║                                                            ║
║  Location: [Dallas, TX          ] Within [25 mi ▼]       ║
║                                                            ║
║  Budget: [$100] ──────●──────── [$500]                   ║
║                                                            ║
║  Urgency: [ ] ASAP  [ ] Within 24h  [ ] This Week        ║
║                                                            ║
║  Competition: [ ] Low (0-2 offers)  [ ] Medium (3-5)     ║
║                                                            ║
║  Sort by: [Newest First ▼]                               ║
║                                                            ║
║  [Apply Filters]  [Clear All]  [💾 Save Search]          ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
```

**API Endpoints:**
- `GET /api/v1/search/posts` → Search buyer posts (for sellers)
- `GET /api/v1/search/sellers` → Search sellers (for buyers)
- `GET /api/v1/search/autocomplete` → Auto-complete suggestions
- `POST /api/v1/search/save` → Save search (Phase 2)
- `GET /api/v1/search/saved` → Get saved searches (Phase 2)

**Search Posts (for Sellers):**  
`GET /api/v1/search/posts`

**Query Parameters:**
```
?query=kitchen sink leak
&category=home_services
&subcategory=plumbing
&location=Dallas,TX
&radius_miles=25
&min_budget=100
&max_budget=500
&urgency=asap,within_24_hours
&max_competition=3
&buyer_min_rating=4.0
&sort=newest
&page=1
&limit=20
```

**Response:**
```json
{
  "success": true,
  "total_results": 42,
  "page": 1,
  "per_page": 20,
  "query": "kitchen sink leak",
  "filters_applied": {
    "category": "home_services",
    "subcategory": "plumbing",
    "location": "Dallas, TX",
    "radius_miles": 25,
    "budget_range": "100-500",
    "urgency": ["asap", "within_24_hours"]
  },
  "posts": [
    {
      "post_id": "post_c9h0f1g14d5e",
      "title": "Kitchen Sink Leak Repair Needed",
      "description": "My kitchen sink has been leaking under the cabinet...",
      "category": "home_services",
      "subcategory": "plumbing",
      "budget_range": "$100 - $300",
      "location": {
        "city": "Dallas",
        "state": "TX",
        "distance_miles": 3.2
      },
      "urgency": "within_24_hours",
      "posted_at": "2026-02-11T12:00:00Z",
      "expires_at": "2026-02-18T12:00:00Z",
      "offer_count": 2,
      "competition_level": "low",
      "buyer": {
        "name": "Sarah J.",
        "rating": 4.9,
        "total_transactions": 8,
        "verification_badges": ["email_verified", "phone_verified"]
      },
      "photos": ["https://cdn.example.com/sink-leak-thumb.jpg"],
      "meets_requirements": true,
      "can_bid": true,
      "relevance_score": 95
    },
    {
      "post_id": "post_d0i1g2h15e6f",
      "title": "Emergency Kitchen Faucet Replacement",
      "description": "Faucet broke off completely, water everywhere...",
      "category": "home_services",
      "subcategory": "plumbing",
      "budget_range": "$200 - $400",
      "location": {
        "city": "Dallas",
        "state": "TX",
        "distance_miles": 5.8
      },
      "urgency": "asap",
      "posted_at": "2026-02-11T14:30:00Z",
      "expires_at": "2026-02-18T14:30:00Z",
      "offer_count": 5,
      "competition_level": "medium",
      "buyer": {
        "name": "Mike C.",
        "rating": 4.7,
        "total_transactions": 15
      },
      "photos": ["https://cdn.example.com/broken-faucet-thumb.jpg"],
      "meets_requirements": true,
      "can_bid": true,
      "relevance_score": 88
    }
  ]
}
```

**Search Sellers (for Buyers):**  
`GET /api/v1/search/sellers`

**Query Parameters:**
```
?query=plumber
&category=home_services
&subcategory=plumbing
&location=Dallas,TX
&radius_miles=25
&min_rating=4.5
&verification_tier=2,3
&available=today
&sort=highest_rated
&page=1
&limit=20
```

**Response:**
```json
{
  "success": true,
  "total_results": 28,
  "page": 1,
  "per_page": 20,
  "query": "plumber",
  "filters_applied": {
    "category": "home_services",
    "subcategory": "plumbing",
    "location": "Dallas, TX",
    "radius_miles": 25,
    "min_rating": 4.5,
    "verification_tier": [2, 3]
  },
  "sellers": [
    {
      "seller_id": "sel_g7h8i9j0k1l2",
      "business_name": "Smith Plumbing & Repair",
      "profile_photo": "https://cdn.example.com/seller123.jpg",
      "rating": 4.82,
      "total_reviews": 48,
      "total_completed": 52,
      "verification_tier": 3,
      "verification_badges": ["email_verified", "phone_verified", "license_verified", "insurance_verified"],
      "rating_badge": "top_rated",
      "location": {
        "city": "Dallas",
        "state": "TX",
        "distance_miles": 3.2
      },
      "service_radius_miles": 25,
      "years_experience": 10,
      "categories": ["home_services"],
      "subcategories": ["plumbing", "drain_cleaning"],
      "price_range": "$100 - $500",
      "availability": "today",
      "response_time": "2 hours avg",
      "bio_snippet": "Licensed plumber with 10+ years experience. Specializing in residential repairs...",
      "portfolio_photos": [
        "https://cdn.example.com/portfolio-thumb1.jpg",
        "https://cdn.example.com/portfolio-thumb2.jpg"
      ],
      "relevance_score": 98
    },
    {
      "seller_id": "sel_h8i9j0k1l2m3",
      "business_name": "Quick Fix Plumbing",
      "rating": 4.65,
      "total_reviews": 32,
      "total_completed": 38,
      "verification_tier": 2,
      "verification_badges": ["email_verified", "phone_verified", "id_verified"],
      "rating_badge": "highly_rated",
      "location": {
        "city": "Dallas",
        "state": "TX",
        "distance_miles": 7.1
      },
      "service_radius_miles": 30,
      "years_experience": 5,
      "price_range": "$75 - $400",
      "availability": "today",
      "response_time": "4 hours avg",
      "relevance_score": 92
    }
  ]
}
```

**Auto-complete:**  
`GET /api/v1/search/autocomplete?query=plumb&type=posts`

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "text": "plumbing",
      "type": "subcategory",
      "category": "home_services",
      "count": 42
    },
    {
      "text": "plumber near me",
      "type": "popular_search",
      "count": 1250
    },
    {
      "text": "plumbing leak repair",
      "type": "keyword",
      "count": 18
    },
    {
      "text": "plumbing emergency",
      "type": "keyword",
      "count": 9
    }
  ]
}
```

**PostgreSQL Full-Text Search (MVP Implementation):**

```sql
-- Add tsvector column to posts table
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);

-- Update search_vector on insert/update
CREATE TRIGGER posts_search_update BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);

-- Search query example
SELECT 
  post_id,
  title,
  description,
  ts_rank(search_vector, query) AS rank
FROM posts, plainto_tsquery('english', 'kitchen sink leak') query
WHERE search_vector @@ query
  AND category = 'home_services'
  AND ST_DWithin(
    location_point,
    ST_SetSRID(ST_MakePoint(-96.7970, 32.7767), 4326),
    40234  -- 25 miles in meters
  )
  AND budget_min >= 100
  AND budget_max <= 500
ORDER BY rank DESC, created_at DESC
LIMIT 20;
```

**Elasticsearch Integration (Phase 2):**

```javascript
// Index post document in Elasticsearch
async function indexPost(post) {
  await elasticsearchClient.index({
    index: 'posts',
    id: post.post_id,
    document: {
      post_id: post.post_id,
      title: post.title,
      description: post.description,
      category: post.category,
      subcategory: post.subcategory,
      budget_min: post.budget_min,
      budget_max: post.budget_max,
      location: {
        lat: post.latitude,
        lon: post.longitude,
        city: post.city,
        state: post.state
      },
      urgency: post.urgency,
      buyer_rating: post.buyer_rating,
      offer_count: post.offer_count,
      created_at: post.created_at,
      expires_at: post.expires_at,
      status: post.status
    }
  });
}

// Search with Elasticsearch
async function searchPosts(params) {
  const response = await elasticsearchClient.search({
    index: 'posts',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: params.query,
                fields: ['title^2', 'description'],
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: [
            { term: { category: params.category } },
            { term: { subcategory: params.subcategory } },
            { term: { status: 'active' } },
            {
              geo_distance: {
                distance: `${params.radius_miles}mi`,
                location: {
                  lat: params.latitude,
                  lon: params.longitude
                }
              }
            },
            {
              range: {
                budget_min: { gte: params.min_budget }
              }
            },
            {
              range: {
                budget_max: { lte: params.max_budget }
              }
            }
          ]
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { created_at: { order: 'desc' } }
      ],
      from: (params.page - 1) * params.limit,
      size: params.limit
    }
  });
  
  return response.hits.hits.map(hit => hit._source);
}
```

**Acceptance Criteria:**
- Search results return in <500ms (PostgreSQL MVP)
- Search results return in <200ms (Elasticsearch Phase 2)
- Auto-complete suggestions appear as user types (after 3 characters)
- Location-based search accurate within 0.1 miles
- Relevance scoring prioritizes best matches
- Filters apply instantly (client-side filtering for loaded results)
- Saved searches trigger notifications when new matches appear (Phase 2)
- Search works across mobile and web

**Business Rules:**
- Minimum search query length: 3 characters
- Maximum search radius: 100 miles
- Default search radius: 25 miles
- Auto-complete shows max 8 suggestions
- Search results paginated (20 per page)
- Saved searches max: 10 per user (Phase 2)
- Search history retained for 90 days
- Popular searches updated daily

---

### **8.9 Seller Promotions** *(NEW in v2.2 — DEFERRED to Phase 2+)*

**Description:** A paid promotion feature for sellers to gain priority placement in buyer feeds. Deferred until the marketplace has sufficient seller density to justify competitive placement.

**Planned mechanics:**
- Sellers can pay to "promote" their profile/offer response in relevant buyer feeds
- Promotion model: pay-per-buyer-reach (e.g., $200 reaches 50 targeted buyers)
- Priority placement: higher-paying promotions rank above lower-paying in buyer feeds, within the same category and radius
- Time-limited promotions (seller defines duration)
- Sellers can also promote specific offers during live transactions (e.g., "20% off IT support this week")
- Promoted content clearly labeled as "Sponsored" in buyer feeds
- Not launched until platform has 5,000+ active sellers in a category — premature promotion with few sellers creates a bad buyer experience

**Status:** Out of MVP scope. Tracked in Phase 2 backlog. Schema and APIs intentionally not specified at v2.2 — will be defined when launch criteria are met.

---

## **9. TECHNICAL ARCHITECTURE**

**Description:** Comprehensive technical architecture for the Reverse Marketplace Platform, designed for scalability, reliability, and performance.

---

### **9.1 System Architecture Overview**

**Architecture Pattern:** Microservices-ready monolith (MVP), transitioning to microservices (Phase 2+)

**MVP Approach:**
- Start with modular monolith for faster development
- Clear service boundaries within codebase
- Prepare for future microservices extraction
- Single deployment unit for simplicity

**Phase 2+ Microservices:**
- Extract high-traffic services (messaging, notifications, search)
- Independent scaling and deployment
- Service mesh for inter-service communication

**High-Level Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Flutter    │  │   Flutter    │  │   Flutter    │      │
│  │   Web App    │  │   iOS App    │  │  Android App │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────┴────────────────────────────────────┐
│                      EDGE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │          Cloudflare CDN + DDoS Protection          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │        API Gateway / Load Balancer (Nginx)         │     │
│  │  • Rate limiting  • SSL termination  • Routing     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Node.js API Server (TypeScript)             │    │
│  │  OR  Python API Server (FastAPI)                    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                       │    │
│  │  • Auth Service        • Transaction Service        │    │
│  │  • User Service        • Payment Service            │    │
│  │  • Post Service        • Notification Service       │    │
│  │  • Offer Service       • Search Service             │    │
│  │  • Messaging Service   • Dispute Service            │    │
│  │  • Review Service      • Analytics Service          │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         WebSocket Server (Socket.IO)                │    │
│  │         Real-time messaging (Phase 2)               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Background Job Workers (Bull/Celery)        │    │
│  │  • Email sending  • Push notifications              │    │
│  │  • Auto-release   • Analytics aggregation           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │    Redis     │  │ Elasticsearch│      │
│  │   Primary    │  │   Cache +    │  │    Search    │      │
│  │   Database   │  │   Sessions   │  │  (Phase 2)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   STORAGE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   AWS S3     │  │  Cloudinary  │                         │
│  │ File Storage │  │    Image     │                         │
│  │              │  │  Processing  │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│               THIRD-PARTY INTEGRATIONS                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Stripe Connect (Payments)    • Twilio (SMS)              │
│  • SendGrid (Email)             • Firebase (Push)           │
│  • OpenAI API (AI, Phase 2)     • Google Maps API           │
│  • Signzy/Middesk (Verification, Phase 2)                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### **9.2 Technology Stack**

#### **Frontend**

**Primary: Flutter (Cross-Platform)**
- **Why:** Single codebase for Web, iOS, Android
- **Version:** Flutter 3.16+ (Dart 3.2+)
- **State Management:** Riverpod or Provider
- **HTTP Client:** Dio
- **WebSocket:** socket_io_client (Phase 2)
- **Local Storage:** Hive or Shared Preferences
- **Maps:** google_maps_flutter
- **Image Handling:** cached_network_image, image_picker
- **Push Notifications:** firebase_messaging
- **Advantages:** Fast development, native performance, hot reload, single codebase

**Phase 2: React.js/Next.js Web (Optional)**
- For SEO-optimized marketing pages
- Server-side rendering (SSR) for better SEO
- Static site generation (SSG) for landing pages

#### **Backend**

**Option A: Node.js (TypeScript) - RECOMMENDED**
- **Why:** Excellent for real-time features (WebSockets), large ecosystem, fast development
- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js or Fastify
- **Language:** TypeScript 5+
- **Real-time:** Socket.IO (WebSocket)
- **Job Queue:** Bull (Redis-backed)
- **Validation:** Zod or Joi
- **ORM:** Prisma or TypeORM
- **Testing:** Jest + Supertest
- **Advantages:** JavaScript ecosystem, real-time capabilities, async I/O, npm packages

**Option B: Python (FastAPI) - ALTERNATIVE**
- **Why:** Excellent for AI integration, strong typing, fast API development
- **Version:** Python 3.11+
- **Framework:** FastAPI
- **Real-time:** WebSockets (native), Socket.IO (socketio package)
- **Job Queue:** Celery (Redis-backed)
- **ORM:** SQLAlchemy or Tortoise ORM
- **Validation:** Pydantic (built into FastAPI)
- **Testing:** Pytest
- **Advantages:** AI/ML libraries (OpenAI, LangChain), type safety, async support

**Decision Criteria:**
- **Choose Node.js if:** Real-time features prioritized, team knows JavaScript, rapid MVP development
- **Choose Python if:** AI features prioritized (Phase 2), team knows Python, data processing heavy

**MVP Recommendation: Node.js (TypeScript)**

#### **Database**

**Primary: PostgreSQL 15+**
- **Why:** Robust ACID compliance, JSON support, full-text search, PostGIS for location
- **Hosting:** AWS RDS, DigitalOcean Managed Database, or Supabase
- **Features Used:**
  - JSONB columns for flexible data (category-specific fields)
  - Full-text search (tsvector, GIN indexes)
  - PostGIS extension for geospatial queries
  - Row-level security (future multi-tenancy)
- **Replication:** Master-slave replication (read replicas) for scale
- **Backup:** Automated daily backups with 30-day retention

**Cache: Redis 7+**
- **Why:** In-memory cache, session store, job queue, pub/sub
- **Use Cases:**
  - Session storage (JWT refresh tokens)
  - API response caching (feed, search results)
  - Rate limiting (request counters)
  - Real-time features (pub/sub for WebSocket scaling)
  - Job queue (Bull or Celery)
- **Hosting:** AWS ElastiCache, DigitalOcean Managed Redis, or Upstash

**Search Engine: Elasticsearch 8+ (Phase 2)**
- **Why:** Full-text search, fuzzy matching, faceted search, real-time indexing
- **Use Cases:**
  - Advanced post/seller search
  - Auto-complete suggestions
  - Typo tolerance
  - Relevance scoring
- **Hosting:** AWS OpenSearch, Elastic Cloud, or self-hosted
- **Alternative (MVP):** PostgreSQL full-text search (sufficient for MVP)

#### **File Storage**

**AWS S3**
- **Use Cases:** User uploads (photos, videos, documents), receipts, invoices
- **Bucket Structure:**
  - `uploads/` → User-uploaded files (pre-signed URLs)
  - `receipts/` → Generated PDF receipts
  - `invoices/` → Generated invoices
- **Features:** Versioning enabled, lifecycle policies (move to Glacier after 90 days)

**Cloudinary**
- **Use Cases:** Image processing, transformations, thumbnails, CDN delivery
- **Features:** Auto image optimization, responsive images, face detection, watermarking
- **Integration:** Direct upload from client with signed URLs

#### **Infrastructure**

**Hosting Options:**

**Option A: AWS (Amazon Web Services)**
- **Compute:** EC2 (t3.medium for MVP) or ECS Fargate (containers)
- **Database:** RDS PostgreSQL (db.t3.medium)
- **Cache:** ElastiCache Redis
- **Storage:** S3
- **CDN:** CloudFront (optional, use Cloudflare instead)
- **Load Balancer:** ALB (Application Load Balancer)
- **Advantages:** Mature ecosystem, scalability, wide service selection
- **Cost:** ~$300-500/month for MVP

**Option B: DigitalOcean (RECOMMENDED FOR MVP)**
- **Compute:** Droplets (4GB RAM, 2 vCPU for MVP) or App Platform
- **Database:** Managed PostgreSQL (4GB RAM)
- **Cache:** Managed Redis (1GB RAM)
- **Storage:** Spaces (S3-compatible)
- **CDN:** Spaces CDN
- **Load Balancer:** Managed Load Balancer
- **Advantages:** Simpler, cheaper, easier to manage, great for MVPs
- **Cost:** ~$150-250/month for MVP

**Option C: Render or Railway (Easiest for MVP)**
- **Compute:** Managed containers (auto-scaling)
- **Database:** Managed PostgreSQL
- **Advantages:** Zero DevOps, auto-deploy from GitHub, easy setup
- **Cost:** ~$100-200/month for MVP
- **Limitations:** Less control, harder to scale beyond 10k users

**Infrastructure Cost Expectations (Feb 11 meeting):**
- Expected monthly cost: $300-700/month at up to 10,000 active users
- AI usage costs absorbed by platform (not charged to users)
- Acceptable to operate at a loss initially until fee revenue builds

**MVP Recommendation: DigitalOcean (cost-effective, scalable)**

**CDN: Cloudflare**
- **Why:** Free tier generous, DDoS protection, caching, SSL, analytics
- **Features:** Auto minification, image optimization, bot protection, rate limiting
- **Integration:** DNS-level, points to backend load balancer

#### **Deployment & CI/CD**

**Version Control:** Git + GitHub/GitLab

**CI/CD Pipeline:**
- **GitHub Actions** or **GitLab CI** for automated pipelines
- **Workflow:**
  1. Code pushed to `develop` branch
  2. Run linting (ESLint/Pylint)
  3. Run unit tests (Jest/Pytest)
  4. Run integration tests
  5. Build Docker image
  6. Push to container registry (Docker Hub, AWS ECR, or DigitalOcean Registry)
  7. Deploy to staging environment
  8. Manual approval for production deploy
  9. Deploy to production (blue-green or canary)

**Containerization:**
- **Docker** for containerized deployments
- **Docker Compose** for local development
- **Kubernetes** (Phase 3) for orchestration at scale

**Monitoring & Logging:**
- **Monitoring:** Datadog, New Relic, or Grafana + Prometheus
- **Logging:** Centralized logging with Logstash/Fluentd → Elasticsearch → Kibana (ELK Stack), or Datadog Logs
- **Error Tracking:** Sentry for real-time error alerts
- **Uptime Monitoring:** UptimeRobot or Pingdom
- **Alerts:** PagerDuty or Slack for critical alerts

---

### **9.3 API Architecture**

**API Style:** RESTful API with WebSocket for real-time features (Phase 2)

**Base URL:** `https://api.reversemarket.com`

**API Versioning:** URL-based versioning (`/api/v1/`, `/api/v2/`)

**Authentication:** JWT (JSON Web Tokens)
- Access token: 15-minute expiry
- Refresh token: 30-day expiry (90 days with "Remember me")
- Token stored in HTTP-only cookies (web) or secure storage (mobile)

**Request/Response Format:**
- **Content-Type:** `application/json`
- **Character Encoding:** UTF-8
- **Date Format:** ISO 8601 (e.g., `2026-02-11T15:30:00Z`)

**Standard Response Structure:**

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-02-11T15:30:00Z"
}
```

**Error Response (RFC 7807 Problem Details):**
```json
{
  "success": false,
  "error": {
    "type": "https://api.reversemarket.com/errors/validation-error",
    "title": "Validation Error",
    "status": 400,
    "detail": "Email is required",
    "instance": "/api/v1/auth/register",
    "timestamp": "2026-02-11T15:30:00Z",
    "trace_id": "abc123xyz789",
    "errors": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED_FIELD"
      }
    ]
  }
}
```

**HTTP Status Codes:**
- `200 OK` → Success (GET, PUT, PATCH)
- `201 Created` → Resource created (POST)
- `204 No Content` → Success with no response body (DELETE)
- `400 Bad Request` → Validation error
- `401 Unauthorized` → Authentication required
- `403 Forbidden` → Insufficient permissions
- `404 Not Found` → Resource not found
- `409 Conflict` → Duplicate resource
- `422 Unprocessable Entity` → Semantic error
- `429 Too Many Requests` → Rate limit exceeded
- `500 Internal Server Error` → Server error
- `503 Service Unavailable` → Maintenance mode

**Rate Limiting:**
- **Anonymous requests:** 100 requests/hour per IP
- **Authenticated requests:** 1,000 requests/hour per user
- **Sensitive endpoints (auth):** 5 attempts/15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 950`
  - `X-RateLimit-Reset: 1612345678` (Unix timestamp)

**Pagination:**
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
- **Response Metadata:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 98,
    "has_next": true,
    "has_prev": false
  }
}
```

**Filtering & Sorting:**
- **Filters:** Query parameters (e.g., `?category=home_services&status=active`)
- **Sorting:** `?sort=created_at&order=desc`
- **Multi-field sorting:** `?sort=rating,created_at&order=desc,desc`

**Idempotency:**
- **Idempotency Key Header:** `Idempotency-Key: {uuid}`
- Used for critical operations (payments, offer acceptance)
- Server caches result for 24 hours, returns same response for duplicate requests

**CORS (Cross-Origin Resource Sharing):**
- **Allowed Origins:** `https://app.reversemarket.com`, `https://www.reversemarket.com`
- **Allowed Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- **Allowed Headers:** `Content-Type, Authorization, Idempotency-Key`
- **Credentials:** `true` (allow cookies)

**WebSocket (Phase 2):**
- **URL:** `wss://api.reversemarket.com/ws/chat`
- **Authentication:** JWT token passed in connection query param
- **Protocol:** Socket.IO (fallback to HTTP long-polling)
- **Events:** `new_message`, `typing`, `message_read`, `offer_update`, `transaction_update`

**API Documentation:**
- **Tool:** Swagger/OpenAPI 3.0
- **Auto-generated:** From code annotations (NestJS Swagger, FastAPI auto-docs)
- **Hosted:** `https://api.reversemarket.com/docs`
- **Interactive:** Swagger UI for testing endpoints

---

## **10. DATABASE SCHEMA**

**Description:** Comprehensive database schema for the Reverse Marketplace Platform using PostgreSQL 15+.

---

### **10.1 Schema Design Principles**

- **Normalization:** 3NF (Third Normal Form) to minimize redundancy
- **Soft Deletes:** Use `deleted_at` column instead of hard deletes (data retention)
- **Timestamps:** Every table has `created_at` and `updated_at`
- **UUIDs:** Use UUIDs for primary keys (better for distributed systems, security)
- **Indexes:** Strategic indexes on foreign keys, search fields, frequently queried columns
- **JSON Columns:** Use JSONB for flexible category-specific data
- **Constraints:** Foreign key constraints, check constraints, unique constraints
- **Audit Trail:** Track who created/updated records (`created_by`, `updated_by`)

---

### **10.2 Core Tables**

#### **Table: users**
**Description:** All users (buyers and sellers)

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('buyer', 'seller', 'both')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  location_zip VARCHAR(10),
  location_country VARCHAR(50) DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  notification_preferences JSONB DEFAULT '{"email_offers": true, "sms_offers": false, "push_messages": true}'::jsonb,
  rating DECIMAL(3, 2),
  total_reviews INT DEFAULT 0,
  total_transactions INT DEFAULT 0,
  stripe_customer_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_location ON users USING GIST(ll_to_earth(latitude, longitude)) WHERE deleted_at IS NULL;
```

#### **Table: seller_profiles**
**Description:** Seller-specific profile information

```sql
CREATE TABLE seller_profiles (
  seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  profile_photo_url TEXT,
  service_radius_miles INT DEFAULT 25,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
  bio TEXT,
  years_experience INT,
  portfolio_photos JSONB DEFAULT '[]'::jsonb,
  business_website TEXT,
  business_hours JSONB,
  
  -- Verification
  verification_tier INT DEFAULT 1 CHECK (verification_tier IN (1, 2, 3)),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,
  ein_verified BOOLEAN DEFAULT FALSE,
  license_verified BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  background_check_verified BOOLEAN DEFAULT FALSE,
  verification_badges JSONB DEFAULT '[]'::jsonb,
  
  -- License & Insurance
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  insurance_expiry DATE,
  
  -- Stripe Connect
  stripe_account_id VARCHAR(100),
  stripe_onboarding_status VARCHAR(50) DEFAULT 'not_started',
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  
  -- Stats
  profile_strength INT DEFAULT 0,
  max_bid_amount DECIMAL(10, 2) DEFAULT 500.00,
  rating DECIMAL(3, 2),
  total_reviews INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  total_active_offers INT DEFAULT 0,
  acceptance_rate DECIMAL(5, 2),
  response_time_hours DECIMAL(5, 2),
  rating_badge VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_categories ON seller_profiles USING GIN(categories);
CREATE INDEX idx_seller_profiles_rating ON seller_profiles(rating DESC);
CREATE INDEX idx_seller_profiles_verification_tier ON seller_profiles(verification_tier);
CREATE INDEX idx_seller_profiles_stripe_account ON seller_profiles(stripe_account_id);
```

#### **Table: categories**
**Description:** Universal categories for all marketplace types

```sql
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_category_id UUID REFERENCES categories(category_id),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  enabled_in_mvp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories (MVP: Products, Services, and Jobs enabled)
INSERT INTO categories (slug, name, description, enabled_in_mvp) VALUES
('products', 'Products', 'Buy and sell physical goods (local FREE, shipped with escrow)', TRUE),
('services', 'Services', 'All service categories (improvement, plumbing, cleaning, etc.)', TRUE),
('jobs', 'Jobs', 'Lead generation: companies pay per qualified candidate lead', TRUE),
('inventory_wholesale', 'Inventory/Wholesale', 'B2B bulk orders and supplies', FALSE),
('real_estate', 'Real Estate', 'Lead generation only (Coming Soon)', FALSE);

-- Subcategories
INSERT INTO categories (slug, name, parent_category_id, enabled_in_mvp) VALUES
('plumbing', 'Plumbing', (SELECT category_id FROM categories WHERE slug = 'home_services'), TRUE),
('electrical', 'Electrical', (SELECT category_id FROM categories WHERE slug = 'home_services'), FALSE),
('hvac', 'HVAC', (SELECT category_id FROM categories WHERE slug = 'home_services'), FALSE),
('handyman', 'Handyman', (SELECT category_id FROM categories WHERE slug = 'home_services'), FALSE),
('cleaning', 'Cleaning', (SELECT category_id FROM categories WHERE slug = 'home_services'), FALSE);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_active ON categories(is_active, enabled_in_mvp);
```

#### **Table: posts**
**Description:** Buyer requests across all categories

```sql
CREATE TABLE posts (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(category_id),
  subcategory_id UUID REFERENCES categories(category_id),
  
  -- Universal fields
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  budget_type VARCHAR(20) DEFAULT 'range' CHECK (budget_type IN ('range', 'open', 'fixed')),
  
  -- Location
  location_address TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  location_zip VARCHAR(10),
  location_country VARCHAR(50) DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Timeline
  urgency VARCHAR(50) CHECK (urgency IN ('asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date')),
  preferred_date DATE,
  preferred_time VARCHAR(50),
  
  -- Category-specific data (JSONB for flexibility)
  category_specific JSONB DEFAULT '{}'::jsonb,
  
  -- Requirements
  requirements JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'filled', 'expired', 'cancelled')),
  offer_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  
  -- Dates
  expires_at TIMESTAMP,
  filled_at TIMESTAMP,
  extended_count INT DEFAULT 0,
  
  -- Search
  search_vector TSVECTOR,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_posts_buyer_id ON posts(buyer_id);
CREATE INDEX idx_posts_category ON posts(category_id, subcategory_id);
CREATE INDEX idx_posts_status ON posts(status) WHERE deleted_at IS NULL;

```sql
CREATE INDEX idx_posts_location ON posts USING GIST(ll_to_earth(latitude, longitude)) WHERE status = 'active';
CREATE INDEX idx_posts_budget ON posts(budget_min, budget_max);
CREATE INDEX idx_posts_urgency ON posts(urgency);
CREATE INDEX idx_posts_expires_at ON posts(expires_at) WHERE status = 'active';
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Trigger to update search_vector
CREATE TRIGGER posts_search_update BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);
```

#### **Table: reviews**
**Description:** Buyer reviews of sellers after transaction completion

```sql
CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES seller_profiles(seller_id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Ratings
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  category_ratings JSONB DEFAULT '{}'::jsonb,
  
  -- Review content
  written_review TEXT,
  would_recommend BOOLEAN NOT NULL,
  
  -- Evidence
  verified_completion BOOLEAN DEFAULT TRUE,
  completion_photos JSONB DEFAULT '[]'::jsonb,
  
  -- Seller response (Phase 2)
  seller_response_text TEXT,
  seller_responded_at TIMESTAMP,
  
  -- Moderation
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(50),
  flagged_at TIMESTAMP,
  moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'rejected')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE(transaction_id)
);

CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX idx_reviews_transaction_id ON reviews(transaction_id);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_moderation_status ON reviews(moderation_status);
```

#### **Table: conversations**
**Description:** Messaging threads between buyers and sellers

```sql
CREATE TABLE conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(offer_id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
  
  -- Participants (denormalized for performance)
  participant_1_id UUID NOT NULL REFERENCES users(user_id),
  participant_2_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Metadata
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  last_message_id UUID,
  last_message_at TIMESTAMP,
  unread_count_p1 INT DEFAULT 0,
  unread_count_p2 INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CHECK (participant_1_id != participant_2_id)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_post_id ON conversations(post_id);
CREATE INDEX idx_conversations_transaction_id ON conversations(transaction_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
```

#### **Table: messages**
**Description:** Individual messages within conversations

```sql
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Content
  message_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Moderation
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(50),
  moderation_status VARCHAR(20) DEFAULT 'approved',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read ON messages(read);
```

#### **Table: disputes**
**Description:** Transaction disputes between buyers and sellers

```sql
CREATE TABLE disputes (
  dispute_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(post_id),
  
  -- Parties
  opened_by_id UUID NOT NULL REFERENCES users(user_id),
  buyer_id UUID NOT NULL REFERENCES users(user_id),
  seller_id UUID NOT NULL REFERENCES seller_profiles(seller_id),
  
  -- Dispute details
  dispute_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  requested_resolution VARCHAR(50) CHECK (requested_resolution IN ('full_refund', 'partial_refund', 'no_refund', 'other')),
  requested_amount DECIMAL(10, 2),
  
  -- Evidence
  buyer_evidence JSONB DEFAULT '[]'::jsonb,
  seller_evidence JSONB DEFAULT '[]'::jsonb,
  
  -- Resolution tier
  tier INT DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  assigned_agent_id UUID,
  arbitrator_name VARCHAR(255),
  
  -- AI Analysis (Phase 2)
  ai_confidence_score INT,
  ai_recommended_outcome VARCHAR(50),
  ai_recommended_amount DECIMAL(10, 2),
  ai_reasoning TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'appealed', 'closed')),
  
  -- Resolution
  outcome VARCHAR(50) CHECK (outcome IN ('full_refund', 'partial_refund', 'no_refund', 'custom')),
  refund_amount DECIMAL(10, 2),
  seller_payout_amount DECIMAL(10, 2),
  resolution_summary TEXT,
  
  -- Timeline
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evidence_deadline TIMESTAMP,
  resolved_at TIMESTAMP,
  estimated_resolution_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX idx_disputes_buyer_id ON disputes(buyer_id);
CREATE INDEX idx_disputes_seller_id ON disputes(seller_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_tier ON disputes(tier);
CREATE INDEX idx_disputes_opened_at ON disputes(opened_at DESC);
```

#### **Table: payouts**
**Description:** Seller payouts via Stripe Connect

```sql
CREATE TABLE payouts (
  payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(transaction_id),
  seller_id UUID NOT NULL REFERENCES seller_profiles(seller_id),
  
  -- Amounts
  gross_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  platform_fee_percentage DECIMAL(5, 2) NOT NULL,
  net_payout DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Stripe
  stripe_transfer_id VARCHAR(100),
  stripe_payout_id VARCHAR(100),
  
  -- Bank details (denormalized for record-keeping)
  bank_account_last4 VARCHAR(4),
  bank_name VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'cancelled')),
  
  -- Timeline
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estimated_arrival TIMESTAMP,
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  
  -- Receipts
  receipt_url TEXT,
  invoice_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_payouts_transaction_id ON payouts(transaction_id);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_stripe_transfer ON payouts(stripe_transfer_id);
CREATE INDEX idx_payouts_initiated_at ON payouts(initiated_at DESC);
```

#### **Table: notifications**
**Description:** Push, email, and SMS notifications

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Notification content
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Channels
  channels JSONB DEFAULT '["push"]'::jsonb,
  
  -- Delivery status
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP,
  
  -- Read status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Links
  action_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

#### **Table: verification_requests**
**Description:** Seller verification requests (ID, EIN, License, Insurance)

```sql
CREATE TABLE verification_requests (
  verification_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(seller_id) ON DELETE CASCADE,
  
  -- Request details
  verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('id', 'ein', 'license', 'insurance', 'background_check')),
  tier INT NOT NULL CHECK (tier IN (1, 2, 3)),
  
  -- Submitted documents
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
  
  -- Review
  reviewed_by_id UUID,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  notes TEXT,
  
  -- Expiry (for license/insurance)
  expires_at DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_verification_requests_seller_id ON verification_requests(seller_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_type ON verification_requests(verification_type);
CREATE INDEX idx_verification_requests_created_at ON verification_requests(created_at DESC);
```

#### **Table: saved_searches (Phase 2)**
**Description:** Saved searches with notifications

```sql
CREATE TABLE saved_searches (
  saved_search_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Search criteria
  name VARCHAR(255) NOT NULL,
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('posts', 'sellers')),
  filters JSONB NOT NULL,
  
  -- Notifications
  notifications_enabled BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_active ON saved_searches(is_active);
```

#### **Table: audit_logs**
**Description:** Audit trail for sensitive operations

```sql
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(user_id),
  actor_type VARCHAR(20) CHECK (actor_type IN ('user', 'admin', 'system')),
  
  -- Action
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

### **10.3 Data Relationships & Constraints**

**Key Relationships:**

1. **Users ↔ Seller Profiles** (1:1)
   - One user can have one seller profile
   - Seller profile references user

2. **Posts ↔ Offers** (1:N)
   - One post can have many offers
   - Offer references post

3. **Offers ↔ Transactions** (1:1)
   - One accepted offer becomes one transaction
   - Transaction references offer

4. **Transactions ↔ Reviews** (1:1)
   - One transaction can have one review
   - Review references transaction

5. **Transactions ↔ Payouts** (1:1)
   - One transaction generates one payout
   - Payout references transaction

6. **Conversations ↔ Messages** (1:N)
   - One conversation has many messages
   - Message references conversation

7. **Transactions ↔ Disputes** (1:1)
   - One transaction can have one dispute
   - Dispute references transaction

**Cascade Rules:**
- **ON DELETE CASCADE:** When parent deleted, children deleted (e.g., delete user → delete posts)
- **ON DELETE SET NULL:** When parent deleted, child reference nullified (e.g., delete user → conversation remains but user_id set to NULL)
- **Soft Deletes:** Most tables use `deleted_at` instead of hard deletes for data retention

**Check Constraints:**
- Enum-like values enforced with CHECK constraints
- Budget ranges: `budget_max >= budget_min`
- Rating ranges: `rating BETWEEN 1 AND 5`
- Participant uniqueness: `participant_1_id != participant_2_id`

---

### **10.4 v2.2 Schema Additions** *(NEW — Apr 14–16 Sessions)*

All v2.1 tables remain. The following are **additive only** — new columns, new triggers, and one new table. No drops, renames, or NOT NULL changes on existing columns (per `DEC-forward-compatible-migrations`).

#### **10.4.1 Updated: `users` table**

New field:
```sql
account_type VARCHAR(20) NOT NULL DEFAULT 'classic'
  CHECK (account_type IN ('classic', 'business')),
```

#### **10.4.2 Updated: `seller_profiles` table**

New fields for Business accounts:
```sql
-- Business account fields
is_business_account BOOLEAN DEFAULT FALSE,
ein_number VARCHAR(20),                    -- Encrypted at rest
ein_verified BOOLEAN DEFAULT FALSE,
sales_tax_certificate_url TEXT,            -- Stored in R2/S3
sales_tax_verified BOOLEAN DEFAULT FALSE,
business_type VARCHAR(50),                 -- LLC, Corporation, Sole Proprietor

-- Inventory management (Business accounts only)
inventory_management_enabled BOOLEAN DEFAULT FALSE
```

#### **10.4.3 Updated: `posts` table**

New fields:
```sql
-- Budget is stored but stripped from seller-facing API responses
budget_min DECIMAL(10,2),
budget_max DECIMAL(10,2),
budget_open BOOLEAN DEFAULT FALSE,

-- Three-day exclusivity
first_offer_at TIMESTAMP,                  -- Set when first offer received
exclusivity_expires_at TIMESTAMP,          -- first_offer_at + 3 days
is_public_discovery BOOLEAN DEFAULT FALSE, -- TRUE after exclusivity expires

-- Post management
expires_at TIMESTAMP,                      -- 30 days from created_at by default
renewed_at TIMESTAMP,                      -- Last renewal timestamp
renewal_count INT DEFAULT 0,

-- Offer cap enforcement
offer_count INT DEFAULT 0,                 -- Incremented on each offer; max 10
offer_cap INT DEFAULT 10,

-- Cold-start seed data
is_seed BOOLEAN DEFAULT FALSE              -- TRUE for pre-launch seeded posts
```

**Post creation trigger — auto-set 30-day expiry:**
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

**Cron job — flip posts to public discovery after exclusivity expires (run hourly):**
```sql
UPDATE posts
SET is_public_discovery = TRUE
WHERE exclusivity_expires_at < NOW()
  AND is_public_discovery = FALSE
  AND status = 'active'
  AND offer_count > 0;
```

#### **10.4.4 Updated: `offers` table**

No structural changes to the offers table itself. Visibility is gated at the API layer based on `post.is_public_discovery` and `post.exclusivity_expires_at`.

**API-layer budget stripping (applied as middleware on all seller-facing endpoints):**
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

#### **10.4.5 New: `offer_batches` table** *(Business accounts / paid overflow)*

```sql
CREATE TABLE offer_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(seller_id),
  batch_type VARCHAR(50) CHECK (batch_type IN ('overflow_cap', 'bulk_blast')),
  posts_unlocked INT DEFAULT 0,    -- Number of additional post slots purchased
  amount_paid DECIMAL(10,2),
  stripe_charge_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP             -- Batch slots expire if unused
);
```

#### **10.4.6 Updated: `verification_requests` table**

Updated CHECK constraint to add `ein` and `sales_tax`:
```sql
verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN (
  'id', 'ein', 'sales_tax', 'license', 'insurance', 'background_check'
)),
```

#### **10.4.7 Unchanged tables from v2.1**

`categories`, `transactions`, `reviews`, `conversations`, `messages`, `disputes`, `payouts`, `notifications`, `audit_logs` — no schema changes. Fee amounts on `transactions` and `payouts` are updated in application logic only (see Section 8.5).

---

## **11. API SPECIFICATIONS (COMPLETE)**

**Description:** Complete API endpoint specifications with request/response examples.

---

### **11.1 Authentication Endpoints**

#### **POST /api/v1/auth/register** *(updated in v2.2)*
**Description:** Register new user. `account_type` is now the v2.2 Classic/Business discriminator.

**Request Body — Classic account:**
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

**Request Body — Business account (additional fields required):**
```json
{
  "account_type": "business",
  "first_name": "Faisal",
  "last_name": "Idris",
  "email": "ops@dfwtechresale.com",
  "password": "SecurePass123!",
  "phone": "+18175551234",
  "zip_code": "76101",
  "business_name": "DFW Tech Resale LLC",
  "business_type": "llc",
  "ein_number": "XX-XXXXXXX",
  "sales_tax_certificate_url": "https://r2.example.com/uploads/cert.pdf",
  "accept_terms": true,
  "accept_privacy": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "user_id": "usr_a1b2c3d4e5f6",
    "email": "faisal@example.com",
    "account_type": "classic",
    "email_verified": false,
    "phone_verified": false,
    "created_at": "2026-05-02T10:30:00Z"
  },
  "message": "Registration successful. Please verify your email.",
  "next_steps": {
    "verify_email": "Check your inbox for verification link",
    "complete_seller_profile": "Optional — required only if you intend to sell"
  }
}
```

**Notes:**
- `account_type` MUST be one of `classic` or `business` (the v2.1 `seller`/`buyer` values are deprecated; buyer/seller mode is toggled in-app post-registration)
- Business accounts cannot publish listings until `ein_number` and `sales_tax_certificate_url` are uploaded and pending verification (manual admin review in MVP, API-based in Phase 2)

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "type": "https://api.reversemarket.com/errors/validation-error",
    "title": "Validation Error",
    "status": 400,
    "detail": "Email is already registered",
    "instance": "/api/v1/auth/register",
    "timestamp": "2026-02-11T10:30:00Z",
    "trace_id": "abc123xyz789",
    "errors": [
      {
        "field": "email",
        "message": "Email is already registered",
        "code": "EMAIL_ALREADY_EXISTS"
      }
    ]
  }
}
```

---

#### **POST /api/v1/auth/login**
**Description:** Authenticate user and receive JWT tokens

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": "usr_a1b2c3d4e5f6",
    "email": "john@example.com",
    "account_type": "seller",
    "email_verified": true,
    "phone_verified": true,
    "profile_complete": 85
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "token_type": "Bearer"
  }
}
```

---

#### **POST /api/v1/auth/refresh**
**Description:** Refresh expired access token

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "token_type": "Bearer"
  }
}
```

---

#### **POST /api/v1/auth/logout**
**Description:** Logout user and invalidate refresh token

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

---

### **11.2 Posts Endpoints**

#### **POST /api/v1/posts**
**Description:** Create new buyer post

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body (Service Example):**
```json
{
  "category": "home_services",
  "subcategory": "plumbing",
  "title": "Kitchen Sink Leak Repair Needed",
  "description": "My kitchen sink has been leaking under the cabinet for the past week...",
  "location": {
    "address": "123 Main St, Dallas, TX 75201",
    "city": "Dallas",
    "state": "TX",
    "zip": "75201",
    "latitude": 32.7767,
    "longitude": -96.7970
  },
  "photos": [
    "https://s3.amazonaws.com/uploads/sink-leak1.jpg",
    "https://s3.amazonaws.com/uploads/sink-leak2.jpg"
  ],
  "budget_min": 100,
  "budget_max": 300,
  "timeline": {
    "urgency": "within_24_hours",
    "preferred_date": "2026-02-12",
    "preferred_time": "morning"
  },
  "category_specific": {
    "property_type": "house",
    "property_size": "1800 sqft",
    "access_details": "Gate code 1234, park in driveway",
    "emergency_service": false,
    "pets_on_property": true
  },
  "requirements": {
    "min_rating": 4.0,
    "license_required": false,
    "insurance_required": false
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "post": {
    "post_id": "post_c9h0f1g14d5e",
    "category": "home_services",
    "subcategory": "plumbing",
    "title": "Kitchen Sink Leak Repair Needed",
    "status": "active",
    "created_at": "2026-02-11T12:00:00Z",
    "expires_at": "2026-02-18T12:00:00Z",
    "estimated_sellers_in_area": 42,
    "market_insights": {
      "similar_posts_avg_offers": 4.2,
      "avg_accepted_price": 185,
      "avg_time_to_first_offer": "3 hours"
    }
  },
  "message": "Your request is live! We estimate you'll receive 3-5 offers within 24 hours."
}
```

---

#### **GET /api/v1/posts/my-posts**
**Description:** Get all posts for authenticated buyer

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?status=active&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "total_posts": 12,
  "active_posts": 3,
  "by_category": {
    "home_services": 8,
    "products_buying": 3,
    "inventory": 1
  },
  "posts": [
    {
      "post_id": "post_c9h0f1g14d5e",
      "category": "home_services",
      "subcategory": "plumbing",
      "title": "Kitchen Sink Leak Repair Needed",
      "status": "active",
      "budget_range": "$100 - $300",
      "location": "Dallas, TX",
      "offer_count": 4,
      "photo_urls": ["https://cdn.example.com/thumb1.jpg"],
      "created_at": "2026-02-11T12:00:00Z",
      "expires_at": "2026-02-18T12:00:00Z",
      "time_remaining": "6 days 23 hours",
      "can_edit": false,
      "can_extend": true,
      "new_offers": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 1,
    "total_items": 12
  }
}
```

---

#### **GET /api/v1/posts/{post_id}**
**Description:** Get post details

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See FR-SEL-002 response example)*

---

#### **PUT /api/v1/posts/{post_id}**
**Description:** Update post (only if no offers received)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(Same structure as POST /api/v1/posts)*

**Response (200 OK):** *(Updated post object)*

---

#### **DELETE /api/v1/posts/{post_id}**
**Description:** Delete/cancel post

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

---

#### **GET /api/v1/posts/discovery** *(NEW in v2.2)*
**Description:** Public discovery feed of buyer posts whose 3-day exclusivity window has expired (`is_public_discovery = TRUE`). Surfaces sellers that already responded so other buyers can connect with them directly.

**Query Parameters:**
```
?category=home_services
&subcategory=plumbing
&location=Dallas,TX
&radius_miles=25
&page=1
&limit=20
```

**Response (200 OK):**
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

**Notes:**
- Budget is **never** included in discovery feed responses
- Original buyer's identity is anonymized at the API layer (only "Buyer in {City, State}" is returned in the post object's `buyer_display`, not surfaced in this snippet for brevity)
- Only posts with `is_public_discovery = TRUE` AND `status = 'active'` AND `offer_count > 0` are returned

---

### **11.3 Offers Endpoints**

#### **POST /api/v1/offers**
**Description:** Submit offer on post

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body (Service Example):**
```json
{
  "post_id": "post_c9h0f1g14d5e",
  "category": "home_services",
  "quote_amount": 185.00,
  "pricing_type": "fixed",
  "timeline": {
    "can_start": "today",
    "completion_time": 2,
    "completion_unit": "hours"
  },
  "message": "I can come today and fix this quickly. I've handled hundreds of similar leaks...",
  "attachments": [
    "https://cdn.example.com/portfolio/job5.jpg"
  ],
  "category_specific": {
    "warranty": "1 year on labor and parts",
    "whats_included": [
      "Diagnose leak source",
      "Replace P-trap if needed",
      "Test for leaks",
      "Clean up work area"
    ],
    "whats_not_included": [
      "Cabinet repair if water-damaged"
    ]
  }
}
```

**Response (201 Created):** *(See FR-SEL-003 response example)*

**Cap Enforcement (v2.2) — 409 Conflict when post.offer_count >= post.offer_cap:**
```javascript
// Server-side guard before accepting offer submission
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

---

#### **POST /api/v1/offer-batches** *(NEW in v2.2)*
**Description:** Purchase an additional offer batch — either to bypass the 10-offer cap on individual posts (`overflow_cap`) or for Business sellers to blast inventory posts to additional buyers (`bulk_blast`).

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "batch_type": "overflow_cap",
  "quantity": 10,
  "payment_method_id": "pm_stripe_abc123"
}
```

**Response (201 Created):**
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

**Notes:**
- `batch_type` MUST be `overflow_cap` or `bulk_blast`
- Stripe charge is captured immediately at purchase time and recorded in `offer_batches.stripe_charge_id`
- Batch slots expire if unused — see `expires_at` in the response
- Batch pricing TBD pre-launch (Open Question O2)

---

#### **GET /api/v1/offers/my-offers**
**Description:** Get all offers for authenticated seller

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?status=active&page=1&limit=20
```

**Response (200 OK):** *(See FR-SEL-004 response example)*

---

#### **GET /api/v1/posts/{post_id}/offers**
**Description:** Get all offers for a post (buyer view)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See FR-BUY-003 response example)*

---

#### **POST /api/v1/offers/{offer_id}/accept**
**Description:** Accept offer and initiate transaction

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
Idempotency-Key: {uuid}
```

**Request Body:** *(See FR-BUY-004 request example)*

**Response (201 Created):** *(See FR-BUY-004 response example)*

---

### **11.4 Transaction Endpoints**

#### **GET /api/v1/transactions/{transaction_id}**
**Description:** Get transaction details

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See FR-SEL-005 and FR-BUY-005 response examples)*

---

#### **PUT /api/v1/transactions/{transaction_id}/update-status**
**Description:** Update transaction status (seller action)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "on_the_way",
  "eta_minutes": 15,
  "notes": "Running a few minutes late due to traffic. Will be there by 9:15 AM."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_s9t0u1v2w3x4",
    "status": "on_the_way",
    "updated_at": "2026-02-12T08:50:00Z"
  },
  "buyer_notified": true,
  "message": "Status updated. Buyer has been notified."
}
```

---

#### **POST /api/v1/transactions/{transaction_id}/mark-complete**
**Description:** Mark transaction complete (seller action)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "after_photos": [
    "https://s3.amazonaws.com/uploads/after1.jpg",
    "https://s3.amazonaws.com/uploads/after2.jpg"
  ],
  "completion_notes": "Replaced P-trap, tightened all connections, tested for leaks. No issues found.",
  "work_summary": "Diagnosed leak source, replaced faulty P-trap, tested all connections"
}
```

**Response (200 OK):** *(See FR-SEL-005 response example)*

---

#### **POST /api/v1/transactions/{transaction_id}/approve**
**Description:** Approve transaction and release funds (buyer action)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent work! Fixed the leak quickly and cleaned up perfectly.",
  "attach_completion_evidence": true
}
```

**Response (200 OK):** *(See FR-BUY-006 response example)*

---

#### **POST /api/v1/transactions/{transaction_id}/request-changes**
**Description:** Request changes to completed work (buyer action)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "changes_requested": "The faucet is still dripping slightly. Please return to tighten the connection.",
  "photos": [
    "https://s3.amazonaws.com/uploads/drip-photo.jpg"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Change request submitted. Seller has been notified.",
  "transaction": {
    "transaction_id": "txn_s9t0u1v2w3x4",
    "status": "changes_requested"
  },
  "auto_release_paused": true
}
```

---

#### **PUT /api/v1/transactions/{transaction_id}/cancel**
**Description:** Cancel transaction

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Seller not responding",
  "details": "Called twice, no answer. Need to cancel and find another plumber."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transaction": {
    "transaction_id": "txn_s9t0u1v2w3x4",
    "status": "cancelled",
    "cancelled_at": "2026-02-11T16:00:00Z"
  },
  "refund": {
    "refund_amount": 200.19,
    "refund_status": "processing",
    "estimated_arrival": "5-10 business days"
  },
  "message": "Transaction cancelled. Full refund will be processed to your original payment method."
}
```

---

### **11.5 Payment Endpoints**

#### **POST /api/v1/payments/charge**
**Description:** Charge buyer and hold funds in escrow (internal use)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
Idempotency-Key: {uuid}
```

**Request Body:** *(See FR-PAY-001 request example)*

**Response (200 OK):** *(See FR-PAY-001 response example)*

---

#### **POST /api/v1/payments/release-escrow**
**Description:** Release funds to seller (internal use, triggered by buyer approval)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See FR-PAY-001 request example)*

**Response (200 OK):** *(See FR-PAY-001 response example)*

---

#### **POST /api/v1/payments/refund**
**Description:** Process refund to buyer

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
Idempotency-Key: {uuid}
```

**Request Body:** *(See FR-PAY-001 request example)*

**Response (200 OK):** *(See FR-PAY-001 response example)*

---

#### **GET /api/v1/sellers/payouts**
**Description:** Get seller payout history

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?status=all&page=1&limit=20
```

**Response (200 OK):** *(See FR-SEL-006 response example)*

---

#### **GET /api/v1/sellers/payouts/{payout_id}**
**Description:** Get specific payout details

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See FR-SEL-006 response example)*

---

#### **GET /api/v1/sellers/stripe-onboarding-link**
**Description:** Generate Stripe Connect onboarding link

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See FR-PAY-002 response example)*

---

#### **GET /api/v1/sellers/stripe-account-status**
**Description:** Check seller's Stripe account status

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See FR-PAY-002 response example)*

---

### **11.6 Review Endpoints**

#### **POST /api/v1/reviews**
**Description:** Submit review for seller

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See Section 8.6 request example)*

**Response (201 Created):** *(See Section 8.6 response example)*

---

#### **GET /api/v1/sellers/{seller_id}/reviews**
**Description:** Get all reviews for a seller

**Query Parameters:**
```
?sort=newest&rating_filter=all&page=1&limit=20
```

**Response (200 OK):** *(See Section 8.6 response example)*

---

#### **PUT /api/v1/reviews/{review_id}/report**
**Description:** Report inappropriate review

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "spam",
  "description": "This review is fake. I never worked for this person."
}
```

**Response (200 OK):** *(See Section 8.6 response example)*

---

### **11.7 Messaging Endpoints**

#### **GET /api/v1/conversations**
**Description:** Get all conversations for authenticated user

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?status=active&unread_only=false&page=1&limit=20
```

**Response (200 OK):** *(See Section 8.4 response example)*

---

#### **GET /api/v1/conversations/{conversation_id}**
**Description:** Get conversation thread with messages

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?limit=50&before_message_id=null
```

**Response (200 OK):** *(See Section 8.4 response example)*

---

#### **POST /api/v1/conversations/{conversation_id}/messages**
**Description:** Send message in conversation

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "I'm running about 10 minutes late due to traffic. Should be there by 9:15 AM.",
  "attachments": []
}
```

**Response (201 Created):** *(See Section 8.4 response example)*

---

#### **PUT /api/v1/conversations/{conversation_id}/mark-read**
**Description:** Mark messages as read

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "last_read_message_id": "msg_z3a4b5c6d7e8"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All messages marked as read",
  "unread_count": 0
}
```

---

### **11.8 Dispute Endpoints**

#### **POST /api/v1/disputes**
**Description:** Create dispute

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See Section 8.7 request example)*

**Response (201 Created):** *(See Section 8.7 response example)*

---

#### **GET /api/v1/disputes/{dispute_id}**
**Description:** Get dispute details

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** *(See Section 8.7 response example)*

---

#### **POST /api/v1/disputes/{dispute_id}/evidence**
**Description:** Submit additional evidence

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See Section 8.7 request example)*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Evidence submitted successfully",
  "dispute_id": "dsp_a1b2c3d4e5f6"
}
```

---

#### **POST /api/v1/disputes/{dispute_id}/accept-resolution**
**Description:** Accept proposed resolution

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See Section 8.7 request example)*

**Response (200 OK):** *(See Section 8.7 response example)*

---

#### **POST /api/v1/disputes/{dispute_id}/appeal**
**Description:** Appeal dispute decision

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See Section 8.7 request example)*

**Response (200 OK):** *(See Section 8.7 response example)*

---

### **11.9 Search Endpoints**

#### **GET /api/v1/search/posts**
**Description:** Search buyer posts (for sellers)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:** *(See Section 8.8 query parameters)*

**Response (200 OK):** *(See Section 8.8 response example)*

---

#### **GET /api/v1/search/sellers**
**Description:** Search sellers (for buyers)

**Query Parameters:** *(See Section 8.8 query parameters)*

**Response (200 OK):** *(See Section 8.8 response example)*

---

#### **GET /api/v1/search/autocomplete**
**Description:** Get search auto-complete suggestions

**Query Parameters:**
```
?query=plumb&type=posts
```

**Response (200 OK):** *(See Section 8.8 response example)*

---

### **11.10 Seller Profile Endpoints**

#### **POST /api/v1/sellers/profile**
**Description:** Create seller profile

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(See FR-UM-008 request example)*

**Response (201 Created):** *(See FR-UM-008 response example)*

---

#### **PUT /api/v1/sellers/profile**
**Description:** Update seller profile

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** *(Same structure as POST)*

**Response (200 OK):** *(Updated profile object)*

---

#### **GET /api/v1/sellers/{seller_id}**
**Description:** Get public seller profile

**Response (200 OK):**
```json
{
  "success": true,
  "seller": {
    "seller_id": "sel_g7h8i9j0k1l2",
    "business_name": "Smith Plumbing & Repair",
    "profile_photo_url": "https://cdn.example.com/seller123.jpg",
    "rating": 4.82,
    "total_reviews": 48,
    "total_completed": 52,
    "verification_tier": 3,
    "verification_badges": ["email_verified", "phone_verified", "license_verified", "insurance_verified"],
    "rating_badge": "top_rated",
    "location": {
      "city": "Dallas",
      "state": "TX"
    },
    "service_radius_miles": 25,
    "years_experience": 10,
    "categories": ["home_services"],
    "subcategories": ["plumbing", "drain_cleaning"],
    "bio": "Licensed plumber with 10+ years experience. Specializing in residential repairs, repiping, and emergency services. Available 24/7.",
    "portfolio_photos": [
      "https://cdn.example.com/portfolio1.jpg",
      "https://cdn.example.com/portfolio2.jpg"
    ],
    "business_hours": {
      "monday": "8:00 AM - 6:00 PM",
      "tuesday": "8:00 AM - 6:00 PM",
      "saturday": "9:00 AM - 3:00 PM",
      "sunday": "Emergency only"
    },
    "response_time": "2 hours avg",
    "acceptance_rate": 30.5,
    "member_since": "2015-03-10"
  }
}
```

---

### **11.11 Webhook Endpoints**

#### **POST /api/v1/webhooks/stripe**
**Description:** Stripe webhook handler for payment events

**Headers:**
```
Stripe-Signature: {signature}
Content-Type: application/json
```

**Request Body (Example - charge.succeeded):**
```json
{
  "id": "evt_webhook123",
  "type": "charge.succeeded",
  "data": {
    "object": {
      "id": "ch_1234567890abcdef",
      "amount": 20019,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "transaction_id": "txn_s9t0u1v2w3x4"
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

**Supported Events:**
- `charge.succeeded`
- `charge.failed`
- `transfer.paid`
- `transfer.failed`
- `refund.created`
- `account.updated`
- `payout.paid`
- `payout.failed`

---

## **12. SECURITY CHECKLIST**

**Description:** Comprehensive security measures to protect the platform and user data.

---

### **12.1 Authentication & Authorization**

#### **Password Security**
- ✅ **Minimum Requirements:**
  - 8+ characters
  - 1 uppercase letter
  - 1 number
  - 1 special character
- ✅ **Hashing:** bcrypt with min 12 rounds (recommended: 14 rounds)
- ✅ **Salt:** Unique salt per password (automatic with bcrypt)
- ✅ **Password Reset:** 
  - 256-bit token
  - 1-hour expiry
  - Single-use only
  - Rate limit: 3 requests/hour per email

#### **JWT Tokens**
- ✅ **Algorithm:** HS256 (HMAC-SHA256)
- ✅ **Secret:** 256-bit randomly generated secret
- ✅ **Access Token:** 15-minute expiry
- ✅ **Refresh Token:** 30-day expiry (90 days with "Remember me")
- ✅ **Token Rotation:** Refresh tokens rotated on use (invalidate old)
- ✅ **Blacklisting:** Maintain blacklist for revoked tokens (Redis)
- ✅ **Token Storage:**
  - Web: HTTP-only cookies (prevents XSS access)
  - Mobile: Secure encrypted storage (iOS Keychain, Android Keystore)

#### **Session Management**
- ✅ **Session Storage:** Redis with TTL
- ✅ **Session Timeout:** 30 minutes inactivity (web), 7 days (mobile)
- ✅ **Concurrent Sessions:** Max 5 active sessions per user
- ✅ **Device Tracking:** Track device fingerprint, IP, user agent
- ✅ **Force Logout:** Admin can force logout on security breach

#### **Two-Factor Authentication (Phase 2)**
- ✅ **Methods:** SMS, Authenticator app (TOTP)
- ✅ **Required For:** 
  - Transactions >$1,000
  - Stripe Connect onboarding
  - Account settings changes
  - Admin actions
- ✅ **Backup Codes:** 10 single-use backup codes

#### **OAuth Integration (Phase 2)**
- ✅ **Providers:** Google, Apple
- ✅ **Scope:** Email, name, profile photo only
- ✅ **Validation:** Verify OAuth token with provider
- ✅ **Account Linking:** Link OAuth to existing account via email

---

### **12.2 Input Validation & Sanitization**

#### **Server-Side Validation**
- ✅ **All Inputs Validated:** Never trust client-side validation alone
- ✅ **Type Checking:** Enforce data types (string, number, email, UUID)
- ✅ **Length Limits:** 
  - Email: 255 chars
  - Names: 100 chars
  - Description: 1000 chars
  - Messages: 1000 chars
- ✅ **Format Validation:**
  - Email: RFC 5322 compliant
  - Phone: E.164 format (+1234567890)
  - URLs: Valid HTTP/HTTPS only
  - UUIDs: Valid UUID v4 format
- ✅ **Whitelist Approach:** Accept only known-good values for enums

#### **SQL Injection Prevention**
- ✅ **Parameterized Queries:** Use prepared statements always
- ✅ **ORM Usage:** Prisma/TypeORM/SQLAlchemy auto-escapes
- ✅ **No Dynamic SQL:** Never concatenate user input into SQL
- ✅ **Stored Procedures:** Consider for complex queries (optional)

**Example (Node.js with Prisma):**
```javascript
// ✅ SAFE - Parameterized query
const user = await prisma.users.findUnique({
  where: { email: userInput.email }
});

// ❌ UNSAFE - Never do this
const user = await prisma.$queryRaw(
  `SELECT * FROM users WHERE email = '${userInput.email}'`
);
```

#### **XSS (Cross-Site Scripting) Prevention**
- ✅ **Output Encoding:** Encode all user-generated content before rendering
- ✅ **Content Security Policy (CSP):** 
  ```
  Content-Security-Policy: default-src 'self'; 
    script-src 'self' https://apis.google.com; 
    img-src 'self' https://cdn.example.com data:; 
    style-src 'self' 'unsafe-inline';
  ```
- ✅ **Sanitize HTML:** Use DOMPurify for rich text (if allowed)
- ✅ **Escape User Input:** Escape special characters (<, >, &, ", ')
- ✅ **HTTP-only Cookies:** Prevent JavaScript access to auth cookies

#### **CSRF (Cross-Site Request Forgery) Prevention**
- ✅ **CSRF Tokens:** Generate unique token per session
- ✅ **SameSite Cookies:** `SameSite=Strict` or `SameSite=Lax`
- ✅ **Origin Validation:** Verify `Origin` and `Referer` headers
- ✅ **Double Submit Cookie:** Send token in both cookie and request body

---

### **12.3 API Security**

#### **Rate Limiting**
- ✅ **Anonymous Requests:** 100 requests/hour per IP
- ✅ **Authenticated Requests:** 1,000 requests/hour per user
- ✅ **Auth Endpoints:**
  - Login: 5 attempts per 15 minutes per IP
  - Registration: 5 attempts per hour per IP
  - Password reset: 3 attempts per hour per email
  - Phone verification: 3 SMS per hour per phone
- ✅ **Payment Endpoints:** 10 requests/minute per user
- ✅ **Implementation:** Redis with sliding window counter
- ✅ **Response Headers:**
```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 950
  X-RateLimit-Reset: 1612345678
  Retry-After: 3600
  ```

#### **API Key Management (Internal APIs)**
- ✅ **Rotation:** Rotate API keys every 90 days
- ✅ **Scopes:** Limit API key permissions to minimum required
- ✅ **Revocation:** Immediate revocation on compromise
- ✅ **Logging:** Log all API key usage

#### **HTTPS/TLS**
- ✅ **Enforce HTTPS:** Redirect all HTTP to HTTPS
- ✅ **TLS Version:** TLS 1.2+ only (disable TLS 1.0, 1.1)
- ✅ **SSL Certificate:** Valid certificate from trusted CA (Let's Encrypt)
- ✅ **HSTS Header:** 
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```
- ✅ **Certificate Pinning:** Consider for mobile apps (Phase 2)

#### **CORS (Cross-Origin Resource Sharing)**
- ✅ **Allowed Origins:** Whitelist only trusted domains
  ```
  Access-Control-Allow-Origin: https://app.reversemarket.com
  ```
- ✅ **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- ✅ **Allowed Headers:** Content-Type, Authorization, Idempotency-Key
- ✅ **Credentials:** `Access-Control-Allow-Credentials: true`
- ✅ **Preflight Cache:** `Access-Control-Max-Age: 86400` (24 hours)

#### **Request Validation**
- ✅ **Content-Type Validation:** Reject unexpected content types
- ✅ **Request Size Limits:**
  - JSON body: 10 MB max
  - File uploads: 5 MB per file, 50 MB total
- ✅ **Parameter Tampering Prevention:** Validate all parameters server-side
- ✅ **Idempotency:** Support idempotency keys for critical operations

---

### **12.4 Data Protection**

#### **Encryption at Rest**
- ✅ **Database Encryption:** 
  - PostgreSQL: Transparent Data Encryption (TDE) or disk-level encryption
  - RDS: Enable encryption at rest (AES-256)
- ✅ **File Storage:** S3 server-side encryption (SSE-S3 or SSE-KMS)
- ✅ **Sensitive Fields:** Encrypt PII (SSN, EIN, license numbers) with AES-256
- ✅ **Key Management:** AWS KMS or HashiCorp Vault
- ✅ **Backup Encryption:** Encrypted backups with separate keys

#### **Encryption in Transit**
- ✅ **HTTPS:** All API communication over TLS 1.2+
- ✅ **Database Connections:** SSL/TLS for DB connections
- ✅ **Third-Party APIs:** HTTPS only (Stripe, Twilio, SendGrid)
- ✅ **WebSocket:** WSS (WebSocket Secure) for real-time messaging

#### **PII (Personally Identifiable Information) Protection**
- ✅ **Data Minimization:** Collect only necessary data
- ✅ **Pseudonymization:** Use UUIDs instead of sequential IDs
- ✅ **Masked Display:** 
  - Phone: +1 (469) ***-1234
  - Email: j***@example.com
  - Bank: Chase ****6789
- ✅ **Access Controls:** Restrict PII access to authorized users only
- ✅ **Audit Logging:** Log all PII access

#### **Data Retention & Deletion**
- ✅ **Soft Deletes:** Use `deleted_at` column (30-day grace period)
- ✅ **Hard Deletes:** Permanently delete after 30 days (or user request)
- ✅ **GDPR Right to Erasure:** 
  - User can request account deletion
  - Delete all data within 30 days
  - Retain financial records for 7 years (legal requirement)
- ✅ **Data Expiry:**
  - Email verification tokens: 24 hours
  - Password reset tokens: 1 hour
  - Phone verification codes: 10 minutes
  - Sessions: 30 minutes inactivity (web), 7 days (mobile)
  - Conversations: 90 days after transaction completion (then archived)

---

### **12.5 Payment Security**

#### **PCI-DSS Compliance**
- ✅ **Stripe Hosted:** Never store card numbers (Stripe handles PCI compliance)
- ✅ **Tokenization:** Use Stripe payment methods (tokens), never raw card data
- ✅ **No Card Data Logging:** Never log CVV, full card numbers
- ✅ **Secure Transmission:** HTTPS only for payment data

#### **Fraud Prevention**
- ✅ **3D Secure (SCA):** Required for cards >$100
- ✅ **Stripe Radar:** Enable ML-based fraud detection
- ✅ **Velocity Checks:**
  - Max 5 payment attempts per hour per user
  - Max 3 failed attempts per card
- ✅ **Address Verification:** AVS check for cards
- ✅ **CVV Verification:** Require CVV for all transactions
- ✅ **IP Geolocation:** Flag transactions from high-risk countries
- ✅ **Device Fingerprinting:** Track device for suspicious patterns

#### **Escrow Security**
- ✅ **Stripe Connect:** Funds held on platform Stripe account
- ✅ **Destination Charges:** Platform has full control over fund release
- ✅ **Dispute Freeze:** Auto-freeze escrow on dispute
- ✅ **Audit Trail:** Log all escrow state changes

#### **Payout Security**
- ✅ **Bank Verification:** Stripe verifies bank accounts (micro-deposits or Plaid)
- ✅ **Identity Verification:** Stripe Identity for sellers >$5,000/month
- ✅ **Payout Limits:** Tier-based limits (Tier 1: $500, Tier 2: $5,000, Tier 3: unlimited)
- ✅ **1099-K Reporting:** Automatic tax reporting for >$600/year

---

### **12.6 File Upload Security**

#### **File Validation**
- ✅ **File Type Whitelist:** 
  - Images: JPEG, PNG, WebP, HEIC
  - Videos: MP4, MOV, AVI (Phase 2)
  - Documents: PDF only
- ✅ **MIME Type Validation:** Check magic bytes, not just extension
- ✅ **File Size Limits:**
  - Images: 5 MB per file
  - Videos: 50 MB per file (Phase 2)
  - Documents: 10 MB per file
- ✅ **Virus Scanning:** ClamAV or AWS S3 virus scanning
- ✅ **Image Validation:** Verify image can be decoded (prevent malformed files)

#### **File Storage**
- ✅ **Separate Domain:** Serve uploads from separate domain (e.g., cdn.reversemarket.com)
- ✅ **Pre-signed URLs:** Generate time-limited upload URLs (S3 presigned)
- ✅ **No Execute Permissions:** Files stored with no execution permissions
- ✅ **Content-Disposition:** Force download with `Content-Disposition: attachment`
- ✅ **Cloudinary Transformations:** Use Cloudinary for image processing (prevent malicious images)

#### **EXIF Data Stripping**
- ✅ **Remove GPS Data:** Strip location metadata from photos
- ✅ **Remove Camera Info:** Strip camera model, timestamps
- ✅ **Privacy Protection:** Prevent accidental PII exposure in photos

---

### **12.7 Infrastructure Security**

#### **Server Hardening**
- ✅ **Firewall:** UFW or Security Groups (allow only 80, 443, SSH)
- ✅ **SSH Security:**
  - Disable password authentication
  - Use SSH keys only
  - Change default SSH port
  - Fail2ban for brute-force protection
- ✅ **OS Updates:** Automated security patches (unattended-upgrades)
- ✅ **Minimal Services:** Disable unnecessary services
- ✅ **Non-Root User:** Run app as non-root user

#### **Database Security**
- ✅ **Private Network:** Database not publicly accessible
- ✅ **Strong Passwords:** 32-character random passwords
- ✅ **Principle of Least Privilege:** App user has only required permissions
- ✅ **Connection Pooling:** Limit max connections (prevent DoS)
- ✅ **Backup Encryption:** Encrypted backups stored separately
- ✅ **Backup Testing:** Regular restore tests

#### **Secrets Management**
- ✅ **Environment Variables:** Never hardcode secrets
- ✅ **Secrets Manager:** AWS Secrets Manager or HashiCorp Vault
- ✅ **Rotation:** Rotate secrets every 90 days
- ✅ **.env Files:** Never commit to Git (add to .gitignore)
- ✅ **Access Control:** Limit who can access secrets

#### **DDoS Protection**
- ✅ **Cloudflare:** DDoS protection, rate limiting, bot detection
- ✅ **Auto-Scaling:** Scale infrastructure on traffic spikes
- ✅ **Rate Limiting:** API-level rate limiting (see 12.3)
- ✅ **CAPTCHA:** Show CAPTCHA after failed login attempts

---

### **12.8 Monitoring & Incident Response**

#### **Logging**
- ✅ **Application Logs:** Log all errors, warnings, security events
- ✅ **Audit Logs:** Log sensitive actions (payments, account changes, admin actions)
- ✅ **Access Logs:** Log all API requests (IP, user agent, endpoint, response time)
- ✅ **Security Events:** Log failed logins, rate limit hits, suspicious activity
- ✅ **Log Retention:** 90 days for app logs, 7 years for financial logs
- ✅ **Centralized Logging:** ELK Stack or Datadog for aggregation
- ✅ **No PII in Logs:** Never log passwords, tokens, full card numbers

#### **Monitoring & Alerts**
- ✅ **Uptime Monitoring:** UptimeRobot or Pingdom (5-minute checks)
- ✅ **Performance Monitoring:** Datadog or New Relic APM
- ✅ **Error Tracking:** Sentry for real-time error alerts
- ✅ **Security Alerts:**
  - Failed login spikes (>50/minute)
  - Payment failures (>10% failure rate)
  - Unusual traffic patterns
  - Database connection errors
- ✅ **On-Call Rotation:** PagerDuty for critical alerts
- ✅ **Response Time SLA:** <5 minutes for critical alerts

#### **Incident Response Plan**
- ✅ **Security Team:** Designated security lead
- ✅ **Incident Playbook:**
  1. Detect & confirm incident
  2. Contain breach (block IP, revoke tokens)
  3. Investigate root cause
  4. Remediate vulnerability
  5. Post-mortem & prevention
- ✅ **Communication Plan:** Notify affected users within 72 hours (GDPR requirement)
- ✅ **Backup & Recovery:** Test restore process quarterly

---

### **12.9 Compliance**

#### **GDPR (General Data Protection Regulation)**
- ✅ **Data Privacy Policy:** Clear privacy policy on website
- ✅ **Consent:** Explicit consent for data collection
- ✅ **Right to Access:** Users can download their data
- ✅ **Right to Erasure:** Users can request account deletion
- ✅ **Right to Portability:** Export data in JSON format
- ✅ **Data Breach Notification:** Notify within 72 hours
- ✅ **Data Processing Agreement (DPA):** With third-party processors (Stripe, Twilio)

#### **CCPA (California Consumer Privacy Act)**
- ✅ **Do Not Sell:** No selling of user data (not applicable, we don't sell data)
- ✅ **Opt-Out:** Users can opt out of data collection (marketing)
- ✅ **Disclosure:** Disclose data collection practices

#### **SOC 2 (Phase 3)**
- ✅ **Security Controls:** Implement SOC 2 Type II controls
- ✅ **Annual Audit:** Third-party audit

---

## **13. THIRD-PARTY INTEGRATIONS**

**Description:** External services integrated into the platform for payments, communications, verification, and more.

---

### **13.1 Payment Processing**

#### **Stripe Connect**
**Purpose:** Payment processing, escrow, seller payouts

**Integration Type:** Stripe Connect Standard Accounts

**Key Features:**
- **Destination Charges:** Platform charges buyer, holds funds, transfers to seller
- **Escrow Control:** Platform controls when funds are released
- **Automatic Payouts:** Daily payouts to seller bank accounts
- **Tax Reporting:** Automatic 1099-K generation
- **Fraud Detection:** Stripe Radar ML-based fraud prevention
- **Identity Verification:** Stripe Identity for seller verification (Phase 2)

**API Endpoints Used:**
- `POST /v1/payment_intents` → Charge buyer
- `POST /v1/transfers` → Transfer to seller
- `POST /v1/refunds` → Refund buyer
- `POST /v1/accounts` → Create seller Connect account
- `POST /v1/account_links` → Generate onboarding link
- `GET /v1/accounts/{account_id}` → Check account status
- `POST /v1/payouts` → Instant payout (Phase 2)

**Webhooks:**
- `charge.succeeded` → Update transaction status
- `charge.failed` → Notify buyer, retry
- `transfer.paid` → Update payout status
- `transfer.failed` → Alert support
- `account.updated` → Sync seller verification status
- `payout.paid` → Notify seller of bank deposit
- `dispute.created` → Freeze funds, notify parties

**Cost:**
- 2.9% + $0.30 per successful card charge
- Platform absorbs Stripe fees
- No monthly fees

**Documentation:** https://stripe.com/docs/connect

---

### **13.2 Communication Services**

#### **Twilio (SMS)**
**Purpose:** Phone verification, SMS notifications

**Integration Type:** Twilio Verify API + Messaging API

**Key Features:**
- **Phone Verification:** Send 6-digit codes via SMS
- **SMS Notifications:** Critical alerts (offer accepted, payment received)
- **Rate Limiting:** Built-in fraud prevention
- **International Support:** 200+ countries

**API Endpoints Used:**
- `POST /v2/Services/{ServiceSid}/Verifications` → Send verification code
- `POST /v2/Services/{ServiceSid}/VerificationCheck` → Verify code
- `POST /v1/Messages` → Send SMS notification

**Use Cases:**
- Phone number verification during registration
- Seller notification when offer accepted
- Transaction status updates (optional, user preference)
- Urgent alerts (dispute opened, payment issue)

**Cost:**
- $0.05 per SMS (US/Canada)
- Verification API: $0.05 per verification attempt

**Rate Limits:**
- 3 SMS per phone per hour
- 5 verification attempts per phone per day

**Documentation:** https://www.twilio.com/docs/verify/api

---

#### **SendGrid (Email)**
**Purpose:** Transactional emails, marketing emails (Phase 2)

**Integration Type:** SendGrid Web API v3

**Key Features:**
- **Transactional Emails:** Verification, password reset, notifications
- **Email Templates:** Dynamic templates with handlebars
- **Analytics:** Open rates, click rates, bounce tracking
- **Email Validation:** Check email validity before sending
- **Deliverability:** 95%+ inbox placement rate

**API Endpoints Used:**
- `POST /v3/mail/send` → Send email
- `POST /v3/templates` → Create email template
- `GET /v3/stats` → Get email analytics

**Email Types:**
- **Verification:** Email verification link
- **Password Reset:** Password reset link
- **Notifications:** Offer received, transaction updates, review reminders
- **Receipts:** Payment receipts, payout confirmations
- **Digest:** Daily/weekly summary emails (Phase 2)

**Templates:**
- `email_verification` → Welcome email with verification link
- `password_reset` → Password reset instructions
- `offer_received` → New offer notification to buyer
- `offer_accepted` → Offer accepted notification to seller
- `payment_received` → Payment confirmation to seller
- `review_reminder` → Reminder to review seller

**Cost:**
- Free tier: 100 emails/day
- Essentials: $19.95/month for 50,000 emails

**Documentation:** https://docs.sendgrid.com/

---

#### **Firebase Cloud Messaging (FCM)**
**Purpose:** Push notifications (mobile & web)

**Integration Type:** Firebase Admin SDK

**Key Features:**
- **Cross-Platform:** iOS, Android, Web
- **Topic Subscriptions:** Subscribe to categories (e.g., "home_services")
- **Silent Notifications:** Background data sync
- **Rich Notifications:** Images, actions, badges

**Notification Types:**
- **New Offer:** "You received 3 new offers on your post!"
- **Offer Accepted:** "Your offer was accepted! Time to get to work."
- **Message Received:** "John sent you a message"
- **Transaction Updates:** "Seller is on the way"
- **Payment Received:** "$170.15 has been deposited to your account"
- **Review Reminder:** "How was your experience with John?"

**Implementation:**
```javascript
// Send push notification
const message = {
  notification: {
    title: 'New Offer Received!',
    body: 'You received 3 new offers on "Kitchen Sink Leak Repair"'
  },
  data: {
    post_id: 'post_c9h0f1g14d5e',
    action: 'view_offers'
  },
  token: user.fcm_token
};

await admin.messaging().send(message);
```

**Cost:** Free

**Documentation:** https://firebase.google.com/docs/cloud-messaging

---

### **13.3 Maps & Location**

#### **Google Maps Platform**
**Purpose:** Location search, geocoding, distance calculation, map display

**APIs Used:**
- **Places API:** Address autocomplete
- **Geocoding API:** Convert addresses to lat/lng
- **Distance Matrix API:** Calculate distances between locations
- **Maps JavaScript API:** Display maps in web app (Phase 2)
- **Maps SDK for Flutter:** Display maps in mobile app

**Key Features:**
- **Address Autocomplete:** Suggest addresses as user types
- **Geocoding:** Convert "123 Main St, Dallas, TX" to lat/lng
- **Reverse Geocoding:** Convert lat/lng to address
- **Distance Calculation:** Calculate distance between buyer and seller
- **Service Radius:** Check if seller services buyer's area

**API Endpoints Used:**
- `GET /maps/api/place/autocomplete/json` → Address suggestions
- `GET /maps/api/geocode/json` → Convert address to coordinates
- `GET /maps/api/distancematrix/json` → Calculate distances

**Use Cases:**
- Buyer enters address → autocomplete suggestions
- Post created → geocode address to lat/lng
- Seller browses posts → calculate distance from seller location
- Search posts → filter by radius (25 miles from seller)

**Cost:**
- $0.00283 per autocomplete request
- $0.005 per geocoding request
- $0.005 per distance matrix request
- Free tier: $200/month credit

**Documentation:** https://developers.google.com/maps/documentation

---

### **13.4 File Storage & CDN**

#### **AWS S3**
**Purpose:** File storage for user uploads, receipts, invoices

**Key Features:**
- **Object Storage:** Store photos, videos, PDFs
- **Pre-signed URLs:** Secure direct uploads from client
- **Lifecycle Policies:** Auto-delete old files, move to Glacier
- **Versioning:** Keep file versions (optional)
- **Server-Side Encryption:** AES-256 encryption

**Bucket Structure:**
```
reversemarket-uploads/
├── users/
│   └── {user_id}/
│       └── profile-photo.jpg
├── posts/
│   └── {post_id}/
│       ├── photo1.jpg
│       └── photo2.jpg
├── offers/
│   └── {offer_id}/
│       └── portfolio1.jpg
├── transactions/
│   └── {transaction_id}/
│       ├── before/
│       │   └── before1.jpg
│       └── after/
│           └── after1.jpg
├── receipts/
│   └── {payout_id}.pdf
└── invoices/
    └── {transaction_id}.pdf
```

**Pre-signed URL Upload Flow:**
1. Client requests upload URL: `POST /api/v1/uploads/presigned-url`
2. Server generates S3 pre-signed URL (expires in 15 minutes)
3. Client uploads directly to S3 using pre-signed URL
4. Client notifies server of successful upload
5. Server saves file URL in database

**Cost:**
- $0.023 per GB/month (Standard storage)
- $0.005 per 1,000 PUT requests
- $0.0004 per 1,000 GET requests

**Documentation:** https://docs.aws.amazon.com/s3/

---

#### **Cloudinary**
**Purpose:** Image processing, transformations, CDN delivery

**Key Features:**
- **Auto Image Optimization:** WebP conversion, compression
- **Responsive Images:** Generate multiple sizes
- **Transformations:** Resize, crop, rotate, filters
- **Face Detection:** Auto-crop to faces
- **Thumbnail Generation:** Auto-generate thumbnails
- **CDN Delivery:** Global CDN for fast image loading

**Transformations:**
- **Thumbnail:** `w_300,h_300,c_fill`
- **Profile Photo:** `w_200,h_200,c_fill,g_face` (crop to face)
- **Post Photo:** `w_800,h_600,c_fit` (fit within bounds)
- **WebP Conversion:** `f_auto,q_auto` (auto format and quality)

**Example URL:**
```
https://res.cloudinary.com/reversemarket/image/upload/w_300,h_300,c_fill/posts/post_c9h0f1g14d5e/photo1.jpg
```

**Cost:**
- Free tier: 25 GB storage, 25 GB bandwidth
- Paid: $89/month for 90 GB storage, 190 GB bandwidth

**Documentation:** https://cloudinary.com/documentation

---

### **13.5 Identity Verification (Phase 2)**

#### **Stripe Identity**
**Purpose:** Government ID verification for sellers

**Key Features:**
- **ID Verification:** Driver's license, passport, national ID
- **Selfie Verification:** Liveness check with selfie
- **Fraud Detection:** Check for fake/stolen IDs
- **Instant Verification:** Results in <1 minute
- **Compliance:** GDPR, CCPA compliant

**Verification Flow:**
1. Seller clicks "Verify ID" in app
2. Server creates Stripe Identity session: `POST /v1/identity/verification_sessions`
3. Seller redirected to Stripe-hosted verification page
4. Seller uploads ID photo and takes selfie
5. Stripe verifies ID (1-2 minutes)
6. Webhook received: `identity.verification_session.verified`
7. Server updates seller verification status

**Use Cases:**
- Tier 2 verification (required for bids up to $5,000)
- High-value transactions (>$1,000)
- Suspicious activity flagged by fraud detection

**Cost:**
- $1.50 per ID verification

**Documentation:** https://stripe.com/docs/identity

---

#### **Signzy / Middesk**
**Purpose:** EIN verification, business license verification

**Key Features:**
- **EIN Verification:** Verify business tax ID
- **Business License:** Verify contractor licenses (state-specific)
- **Background Checks:** Criminal background checks (optional, Phase 3)
- **Real-Time Verification:** Results in seconds to minutes

**Use Cases:**
- Tier 2 verification: EIN verification for businesses
- Tier 3 verification: Trade license verification for contractors
- Compliance: Ensure sellers are properly licensed

**Cost:**
- $3-5 per EIN verification
- $10-15 per license verification

**Documentation:** 
- Signzy: https://signzy.com/docs
- Middesk: https://docs.middesk.com

---

### **13.6 AI/ML Services (Phase 2)**

#### **OpenAI API**
**Purpose:** AI-assisted post creation, project breakdown, dispute analysis

**Models Used:**
- **GPT-4:** Advanced reasoning, complex tasks
- **GPT-3.5-turbo:** Fast, cost-effective for simple tasks

**Use Cases:**
- **AI Post Generation:** User describes need in 1-2 sentences → AI generates detailed post
- **Project Breakdown:** User describes large project → AI breaks into milestones
- **Dispute Analysis:** AI analyzes evidence, recommends resolution
- **Category Detection:** AI detects category from description

**Example: AI Post Generation**
```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are an assistant helping buyers create detailed service requests. Generate a clear, professional post based on their brief description."
    },
    {
      role: "user",
      content: "My kitchen sink is leaking under the cabinet. Need it fixed ASAP."
    }
  ]
});

// AI generates:
// Title: Kitchen Sink Leak Repair Needed
// Description: I'm experiencing a leak under my kitchen sink cabinet. The leak appears to be constant and has been ongoing for several days. I need a licensed plumber to diagnose the issue and provide a fix as soon as possible. The work will require access to the cabinet under the sink. I'm available for service as early as today or tomorrow morning.
```

**Cost:**
- GPT-4: $0.03 per 1K tokens (input), $0.06 per 1K tokens (output)
- GPT-3.5-turbo: $0.001 per 1K tokens

**Documentation:** https://platform.openai.com/docs

---

## **14. SECURITY & COMPLIANCE (Summary)**

*(This section summarizes the Security Checklist from Section 12)*

### **14.1 Security Summary**

**Authentication & Authorization:**
- JWT tokens with refresh rotation
- bcrypt password hashing (12+ rounds)
- 2FA for high-value transactions (Phase 2)
- OAuth (Google, Apple) in Phase 2

**Data Protection:**
- AES-256 encryption at rest
- TLS 1.2+ encryption in transit
- PII masking and pseudonymization
- GDPR-compliant data retention and deletion

**API Security:**
- Rate limiting (100-1,000 req/hour)
- HTTPS enforcement with HSTS
- CORS with origin whitelisting
- Idempotency keys for critical operations

**Payment Security:**
- PCI-DSS compliant (via Stripe)
- 3D Secure for cards >$100
- Stripe Radar fraud detection
- Escrow with dispute freeze

**Infrastructure Security:**
- Server hardening (firewall, SSH keys)
- DDoS protection (Cloudflare)
- Automated security patches
- Secrets management (AWS Secrets Manager)

**Monitoring & Incident Response:**
- Centralized logging (ELK/Datadog)
- Real-time error tracking (Sentry)
- Uptime monitoring (UptimeRobot)
- Incident response playbook

---

### **14.2 Compliance Summary**

**GDPR (General Data Protection Regulation):**
- Right to access, erasure, portability
- Data breach notification within 72 hours
- Data Processing Agreements with processors

**CCPA (California Consumer Privacy Act):**
- Opt-out of data collection
- Disclosure of data practices
- No selling of user data

**PCI-DSS (Payment Card Industry):**
- Handled by Stripe (platform never touches card data)
- Tokenized payment methods only

**SOC 2 (Phase 3):**
- Security controls audit
- Annual third-party audit

---

## **15. USER STORIES & ACCEPTANCE CRITERIA**

**Description:** Key user stories with acceptance criteria to guide development and testing.

---

### **15.1 Buyer User Stories**

#### **US-B-001: Register as Buyer**
**As a** homeowner needing repairs  
**I want to** create an account  
**So that** I can post requests and receive offers

**Acceptance Criteria:**
- ✅ User can register with email and password
- ✅ Password must meet security requirements (8+ chars, uppercase, number, special char)
- ✅ Email verification sent within 60 seconds
- ✅ User redirected to dashboard after registration
- ✅ Error messages displayed for invalid inputs
- ✅ Duplicate email rejected with clear message

---

#### **US-B-002: Create Service Request Post**
**As a** buyer  
**I want to** post a service request  
**So that** sellers can submit competitive offers

**Acceptance Criteria:**
- ✅ User can select category and subcategory
- ✅ User can enter title (10-100 chars) and description (50-1000 chars)
- ✅ User can upload up to 10 photos (5MB each)
- ✅ Location autocomplete works with Google Places API
- ✅ Budget range is optional ("Open to offers" default)
- ✅ User can set urgency (ASAP, Within 24h, etc.)
- ✅ Post auto-saves as draft every 30 seconds
- ✅ Estimated sellers in area displayed before posting
- ✅ Market insights shown (avg price, avg offers, avg time to first offer)
- ✅ Post goes live immediately after submission

---

#### **US-B-003: View and Compare Offers**
**As a** buyer  
**I want to** view all offers on my post  
**So that** I can compare prices, ratings, and timelines

**Acceptance Criteria:**
- ✅ All offers displayed with seller name, rating, quote, timeline
- ✅ Verification badges visible (email, phone, license, insurance)
- ✅ "Best Match" offer highlighted based on algorithm
- ✅ User can sort by: Lowest price, Highest rating, Closest distance
- ✅ User can filter by: Price range, Rating, Verification level
- ✅ Side-by-side comparison supports up to 3 offers
- ✅ User can click to view full seller profile
- ✅ User can message seller before accepting offer
- ✅ Portfolio photos open in lightbox

---

#### **US-B-004: Accept Offer and Pay**
**As a** buyer  
**I want to** accept an offer and make payment  
**So that** the seller can start work

**Acceptance Criteria:**
- ✅ Cost breakdown displayed (quote, buyer fee, Stripe fee, total)
- ✅ Payment methods supported: Card, Apple Pay, Google Pay
- ✅ 3D Secure modal appears for cards >$100
- ✅ Payment processed in <3 seconds
- ✅ Funds held in escrow (visible status)
- ✅ Seller notified within 60 seconds (push + email + SMS)
- ✅ Other offers auto-declined
- ✅ Post status changed to "Filled"
- ✅ Clear error messages on payment failure with retry option
- ✅ Transaction details immediately visible

---

#### **US-B-005: Track Transaction Progress**
**As a** buyer  
**I want to** track the transaction status  
**So that** I know when work is starting and completed

**Acceptance Criteria:**
- ✅ Transaction page shows current status (Scheduled, On the way, In progress, etc.)
- ✅ Timeline displays all status changes with timestamps
- ✅ Push notifications sent on every status update
- ✅ Seller contact info visible (phone, business name)
- ✅ In-app messaging accessible from transaction page
- ✅ Countdown timer shows time until scheduled appointment
- ✅ Before photos visible when uploaded (Phase 2)
- ✅ Progress photos display with timestamps
- ✅ User can report issue or request cancellation

---

#### **US-B-006: Approve Work and Release Payment**
**As a** buyer  
**I want to** approve completed work  
**So that** the seller receives payment

**Acceptance Criteria:**
- ✅ Notification received when seller marks job complete
- ✅ After photos displayed for review (Phase 2)
- ✅ User can approve or request changes
- ✅ Approval releases escrow within 60 seconds
- ✅ Seller payout initiated immediately
- ✅ Both parties receive email confirmation
- ✅ Review prompt appears immediately after approval
- ✅ User can skip review (60-day window)
- ✅ Request changes pauses auto-release timer
- ✅ Auto-release occurs after 7 days if no action

---

#### **US-B-007: Rate and Review Seller**
**As a** buyer  
**I want to** rate the seller  
**So that** other buyers can make informed decisions

**Acceptance Criteria:**
- ✅ Overall rating required (1-5 stars)
- ✅ Category-specific ratings optional (Quality, Timeliness, etc.)
- ✅ Written review optional (50-500 chars)
- ✅ "Would recommend" toggle required
- ✅ Completion photos auto-attached (Phase 2)
- ✅ Review immutable after submission
- ✅ Seller rating updates immediately
- ✅ Review displays on seller profile with verified badge
- ✅ User can skip and review later (within 60 days)
- ✅ Profanity auto-flagged

---

### **15.2 Seller User Stories**

#### **US-S-001: Register as Seller**
**As a** plumber/contractor  
**I want to** create a seller account  
**So that** I can submit offers on buyer requests

**Acceptance Criteria:**
- ✅ User can register as seller or both (buyer + seller)
- ✅ Phone number required for sellers
- ✅ Email and phone verification required before first offer
- ✅ User redirected to profile creation after registration
- ✅ Stripe Connect onboarding prompt displayed

---

#### **US-S-002: Create Seller Profile**
**As a** seller  
**I want to** create a professional profile  
**So that** buyers can trust me and hire me

**Acceptance Criteria:**
- ✅ Business name optional (defaults to "FirstName LastName")
- ✅ Profile photo required (1MB max)
- ✅ Service radius selectable (5-100 miles)
- ✅ Categories and subcategories multi-select
- ✅ Bio optional (50-500 chars)
- ✅ Portfolio photos uploadable (up to 10, 2MB each)
- ✅ Profile strength score displayed in real-time
- ✅ Verification tier displayed (Tier 1, 2, 3)
- ✅ Max bid amount based on tier
- ✅ Verification badges visible

---

#### **US-S-003: Browse Buyer Requests**
**As a** seller  
**I want to** browse buyer requests in my area  
**So that** I can find jobs to bid on

**Acceptance Criteria:**
- ✅ Feed displays posts matching seller's categories
- ✅ Posts filtered by service radius (default 25 miles)
- ✅ Distance displayed for each post
- ✅ Budget range visible
- ✅ Urgency badge displayed (ASAP, Within 24h)
- ✅ Competition indicator shown (Low, Medium, High)
- ✅ Buyer rating and verification visible
- ✅ Search by keyword works
- ✅ Filters work: Budget, Distance, Urgency, Category
- ✅ Sort by: Newest, Expiring soon, Highest budget, Closest

---

#### **US-S-004: Submit Offer**
**As a** seller  
**I want to** submit a competitive offer  
**So that** I can win the job

**Acceptance Criteria:**
- ✅ Quote amount required ($10-$50,000)
- ✅ Quote within seller tier limit enforced
- ✅ Timeline required (Can start, Completion time)
- ✅ Message required (50-1000 chars)
- ✅ Portfolio photos attachable (up to 10)
- ✅ Earnings calculator shows estimated payout
- ✅ Offer summary displayed before submission
- ✅ Submission completes in <2 seconds
- ✅ Buyer notified within 60 seconds
- ✅ Duplicate offers prevented
- ✅ Seller can edit offer before buyer acceptance
- ✅ Seller can withdraw offer before acceptance

---

#### **US-S-005: Complete Job and Upload Evidence**
**As a** seller  
**I want to** mark the job complete  
**So that** I can receive payment

**Acceptance Criteria:**
- ✅ Seller can update status (On the way, Started, Completed)
- ✅ Buyer receives push notification on status update
- ✅ Progress photos uploadable anytime
- ✅ After photos required to mark complete (Phase 2, 1-5 photos)
- ✅ After photos auto-compress to <1MB
- ✅ Completion notes optional
- ✅ Buyer notified within 60 seconds of completion
- ✅ Estimated payout date displayed
- ✅ Auto-release countdown visible (7 days)

---

#### **US-S-006: Receive Payment**
**As a** seller  
**I want to** receive payment after job approval  
**So that** I get paid for my work

**Acceptance Criteria:**
- ✅ Notification received when buyer approves (push + email)
- ✅ Funds released from escrow within 60 seconds
- ✅ Stripe transfer initiated same day
- ✅ Payout details displayed (gross, fee, net, arrival date)
- ✅ Receipt PDF generated and downloadable
- ✅ Bank deposit arrives in 1-2 business days
- ✅ Earnings dashboard updates in real-time
- ✅ Auto-release after 7 days if buyer unresponsive

---

#### **US-S-007: Connect Stripe Account**
**As a** seller  
**I want to** connect my bank account  
**So that** I can receive payouts

**Acceptance Criteria:**
- ✅ Onboarding link generated in <1 second
- ✅ Seller redirected to Stripe-hosted onboarding
- ✅ Onboarding completes in <10 minutes (typical)
- ✅ Webhook received when onboarding complete
- ✅ Verification status synced to platform
- ✅ Seller can update bank info anytime via Stripe dashboard
- ✅ Unverified sellers cannot receive payouts
- ✅ "Ready to Receive Payouts" badge displayed when verified

---

### **15.3 Platform User Stories**

#### **US-P-001: Search Posts (Seller)**
**As a** seller  
**I want to** search for relevant posts  
**So that** I can find jobs quickly

**Acceptance Criteria:**
- ✅ Search results return in <500ms (PostgreSQL MVP)
- ✅ Keyword search matches title and description
- ✅ Location-based search accurate within 0.1 miles
- ✅ Filters apply instantly
- ✅ Auto-complete suggestions appear after 3 characters
- ✅ Relevance scoring prioritizes best matches
- ✅ Pagination works (20 results per page)

---

#### **US-P-002: In-App Messaging**
**As a** buyer or seller  
**I want to** message the other party  
**So that** I can clarify details

**Acceptance Criteria:**
- ✅ Messages delivered within 5 seconds (HTTP polling MVP)
- ✅ Push notifications sent within 30 seconds
- ✅ Unread badge count accurate
- ✅ Photo attachments supported (up to 5, 5MB each)
- ✅ Message history retained for 90 days post-transaction
- ✅ External payment requests flagged for review
- ✅ Profanity auto-flagged
- ✅ Users can report inappropriate messages

---

#### **US-P-003: Dispute Resolution**
**As a** buyer or seller  
**I want to** open a dispute  
**So that** issues can be resolved fairly

**Acceptance Criteria:**
- ✅ Dispute opens instantly, escrow frozen within 1 second
- ✅ Both parties notified within 60 seconds (push + email)
- ✅ Evidence uploadable (photos, videos, documents; max 10 files, 5MB each)
- ✅ Evidence deadline 48 hours after dispute opened
- ✅ AI analysis completes within 15 minutes (Tier 1)
- ✅ Support agent responds within 24-48 hours (Tier 2)
- ✅ Resolution outcomes processed within 1 hour of acceptance
- ✅ Appeal window open for 72 hours after Tier 2 decision
- ✅ Tier 3 arbitrator decision within 5-7 business days

---

#### **US-P-004: Auto-Release Escrow**
**As the** platform  
**I want to** auto-release escrowed funds  
**So that** sellers get paid even if buyers are unresponsive

**Acceptance Criteria:**
- ✅ Cron job runs daily at 12:00 AM UTC
- ✅ Services: Auto-release 7 days after marked complete
- ✅ Shipped products: Auto-release 3 days after delivery
- ✅ Local platform meetups: Auto-release 1 hour after QR scan
- ✅ B2B inventory: Auto-release 3 days after delivery
- ✅ Jobs milestones: Auto-release 5 days per milestone
- ✅ Disputes pause auto-release indefinitely
- ✅ Both parties notified when auto-released

---

### **15.5 v2.2 Additions — User Stories**

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

## **16. NON-FUNCTIONAL REQUIREMENTS**

**Description:** Performance, scalability, reliability, and usability requirements.

---

### **16.1 Performance Requirements**

#### **Response Time**
- ✅ **API Response Time:** <200ms (median), <500ms (95th percentile)
- ✅ **Page Load Time:** <2 seconds (web), <1.5 seconds (mobile)
- ✅ **Search Results:** <500ms (PostgreSQL MVP), <200ms (Elasticsearch Phase 2)
- ✅ **Payment Processing:** <3 seconds for charge completion
- ✅ **Image Upload:** <5 seconds for 5MB image (with compression)
- ✅ **Database Query Time:** <100ms (95th percentile)

#### **Throughput**
- ✅ **Concurrent Users:** 1,000 (MVP), 10,000 (Phase 2), 50,000 (Phase 3)
- ✅ **API Requests:** 1,000 requests/second (peak)
- ✅ **WebSocket Connections:** 5,000 concurrent (Phase 2)
- ✅ **Database Connections:** 100 max connections (pooled)

#### **Resource Utilization**
- ✅ **Server CPU:** <70% average utilization
- ✅ **Server Memory:** <80% average utilization
- ✅ **Database Storage:** 100 GB (MVP), 500 GB (Phase 2), 2 TB (Phase 3)
- ✅ **CDN Bandwidth:** 1 TB/month (MVP), 5 TB/month (Phase 2)

---

### **16.2 Scalability Requirements**

#### **Horizontal Scaling**
- ✅ **API Servers:** Auto-scale based on CPU >70% or memory >80%
- ✅ **Database:** Read replicas for scaling reads (1 master, 2 replicas Phase 2)
- ✅ **Redis:** Cluster mode for scaling cache (Phase 2)
- ✅ **Load Balancer:** Distribute traffic across multiple API servers

#### **Vertical Scaling**
- ✅ **Database:** Upgrade instance size as data grows (db.t3.medium → db.m5.large)
- ✅ **Redis:** Upgrade cache size as sessions grow (1 GB → 4 GB)

#### **Data Growth**
- ✅ **Users:** 10,000 (MVP), 100,000 (Phase 2), 1,000,000 (Phase 3)
- ✅ **Posts:** 5,000/month (MVP), 50,000/month (Phase 2), 500,000/month (Phase 3)
- ✅ **Transactions:** 1,000/month (MVP), 10,000/month (Phase 2), 100,000/month (Phase 3)
- ✅ **Messages:** 50,000/month (MVP), 500,000/month (Phase 2), 5,000,000/month (Phase 3)
- ✅ **Images:** 100 GB/month (MVP), 500 GB/month (Phase 2), 2 TB/month (Phase 3)

---

### **16.3 Reliability & Availability**

#### **Uptime**
- ✅ **Target Uptime:** 99.9% (MVP) = 8.76 hours downtime/year
- ✅ **Target Uptime:** 99.95% (Phase 2) = 4.38 hours downtime/year
- ✅ **Maintenance Window:** Sundays 2:00-4:00 AM UTC (announced 48h in advance)

#### **Fault Tolerance**
- ✅ **Database:** Automated daily backups with 30-day retention
- ✅ **Database:** Point-in-time recovery (last 7 days)
- ✅ **Multi-AZ Deployment:** Database and cache in multiple availability zones (Phase 2)
- ✅ **Graceful Degradation:** Platform remains functional if non-critical services fail
  - Messaging unavailable → Users can call seller directly (phone visible)
  - Payment unavailable → Show error, retry option
  - Search unavailable → Browse by category (no keyword search)

#### **Disaster Recovery**
- ✅ **RTO (Recovery Time Objective):** <4 hours (restore from backup)
- ✅ **RPO (Recovery Point Objective):** <1 hour (maximum data loss)
- ✅ **Backup Strategy:** Daily automated backups to separate region
- ✅ **Restore Testing:** Quarterly restore drills

#### **Error Handling**
- ✅ **Retry Logic:** Auto-retry failed API requests (max 3 attempts with exponential backoff)
- ✅ **Circuit Breaker:** Prevent cascading failures (open circuit after 5 consecutive failures)
- ✅ **Fallback Mechanisms:** Default to cached data if real-time data unavailable
- ✅ **User-Friendly Errors:** Clear error messages with actionable next steps

---

### **16.4 Usability Requirements**

#### **User Interface**
- ✅ **Responsive Design:** Works on mobile (iOS, Android), tablet, desktop
- ✅ **Cross-Browser Support:** Chrome, Safari, Firefox, Edge (latest 2 versions)
- ✅ **Mobile-First:** Optimized for mobile (80% of traffic expected on mobile)
- ✅ **Touch-Friendly:** Buttons min 44x44 pixels (Apple guidelines)
- ✅ **Dark Mode:** Support system-level dark mode preference (Phase 2)

#### **Accessibility (WCAG 2.1 AA)**
- ✅ **Keyboard Navigation:** All features accessible via keyboard
- ✅ **Screen Reader Support:** Semantic HTML, ARIA labels
- ✅ **Color Contrast:** Minimum 4.5:1 ratio for text
- ✅ **Alt Text:** All images have descriptive alt text
- ✅ **Focus Indicators:** Visible focus states for all interactive elements
- ✅ **Font Size:** Minimum 16px, scalable to 200%

#### **Localization (Phase 3)**
- ✅ **Languages:** English (MVP), Spanish (Phase 3)
- ✅ **Currency:** USD (MVP), multi-currency (Phase 3)
- ✅ **Date/Time:** ISO 8601 format, localized display
- ✅ **Phone Numbers:** E.164 format with country code

#### **Onboarding**
- ✅ **First-Time User Experience:** Guided tour for new users (tooltips, hints)
- ✅ **Empty States:** Helpful messages when no data (e.g., "No posts yet. Create your first post!")
- ✅ **Progress Indicators:** Show completion percentage for profiles, forms
- ✅ **Contextual Help:** Inline help text, FAQ links, support chat (Phase 2)

---

### **16.5 Maintainability & Extensibility**

#### **Code Quality**
- ✅ **Linting:** ESLint (TypeScript) or Pylint (Python) enforced in CI/CD
- ✅ **Code Coverage:** Minimum 70% test coverage (unit + integration tests)
- ✅ **Code Reviews:** All PRs require 1+ approval before merge
- ✅ **Documentation:** Inline code comments, README for each module
- ✅ **API Documentation:** Auto-generated Swagger/OpenAPI docs

#### **Testing**
- ✅ **Unit Tests:** 70% coverage for business logic
- ✅ **Integration Tests:** 20% coverage for end-to-end flows
- ✅ **End-to-End Tests:** 10% coverage for critical user journeys (Playwright/Cypress)
- ✅ **Load Testing:** Simulate 1,000 concurrent users (Apache JMeter or k6)
- ✅ **Security Testing:** OWASP ZAP, Snyk for vulnerability scanning
- ✅ **UAT (User Acceptance Testing):** 20 beta users before launch

#### **CI/CD Pipeline**
- ✅ **Automated Build:** Build triggered on every commit to `develop` branch
- ✅ **Automated Tests:** Run linting, unit, integration tests on every build
- ✅ **Staging Deployment:** Auto-deploy to staging on merge to `develop`
- ✅ **Production Deployment:** Manual approval + canary deployment (10% → 50% → 100%)
- ✅ **Rollback:** One-click rollback to previous version

#### **Monitoring & Observability**
- ✅ **Metrics:** CPU, memory, disk, network, API response time, error rate
- ✅ **Logs:** Centralized logging with search and filtering
- ✅ **Traces:** Distributed tracing for API requests (Jaeger or Datadog APM)
- ✅ **Alerts:** Automated alerts for critical issues (Slack, PagerDuty)
- ✅ **Dashboards:** Real-time dashboards for key metrics (Grafana or Datadog)

---

### **16.6 Security Requirements**

*(See Section 12 Security Checklist for comprehensive details)*

**Summary:**
- ✅ **Authentication:** JWT with refresh token rotation
- ✅ **Authorization:** Role-based access control (RBAC)
- ✅ **Encryption:** AES-256 at rest, TLS 1.2+ in transit
- ✅ **Rate Limiting:** 100-1,000 requests/hour per user
- ✅ **Input Validation:** Server-side validation for all inputs
- ✅ **SQL Injection Prevention:** Parameterized queries only
- ✅ **XSS Prevention:** Output encoding, CSP headers
- ✅ **CSRF Prevention:** CSRF tokens, SameSite cookies
- ✅ **Payment Security:** PCI-DSS compliant via Stripe
- ✅ **Data Privacy:** GDPR and CCPA compliant

---

## **17. RISK ANALYSIS & MITIGATION**

**Description:** Potential risks and mitigation strategies.

---

### **17.1 Technical Risks**

#### **RISK-T-001: Database Performance Degradation**
**Risk:** As data grows, database queries slow down, impacting user experience.

**Likelihood:** Medium  
**Impact:** High  
**Severity:** High

**Mitigation:**
- ✅ **Indexing Strategy:** Create indexes on frequently queried columns (see Section 10)
- ✅ **Query Optimization:** Use EXPLAIN ANALYZE to identify slow queries, optimize
- ✅ **Connection Pooling:** Limit max connections (100) to prevent overload
- ✅ **Read Replicas:** Add read replicas for scaling reads (Phase 2)
- ✅ **Caching:** Cache frequently accessed data in Redis (feeds, search results)
- ✅ **Monitoring:** Track query performance with Datadog or New Relic
- ✅ **Partitioning:** Partition large tables by date (transactions, messages) in Phase 3

---

#### **RISK-T-002: Third-Party Service Outage**
**Risk:** Stripe, Twilio, SendGrid, or other third-party services go down, disrupting platform.

**Likelihood:** Low  
**Impact:** High  
**Severity:** Medium

**Mitigation:**
- ✅ **Fallback Mechanisms:**
  - Stripe down → Queue payments for retry, notify user of delay
  - Twilio down → Fall back to email verification, delay SMS notifications
  - SendGrid down → Queue emails for retry (up to 24 hours)
- ✅ **Status Monitoring:** Subscribe to third-party status pages (Stripe Status, Twilio Status)
- ✅ **Circuit Breaker:** Stop calling failing service after 5 consecutive failures
- ✅ **Graceful Degradation:** Platform remains functional with reduced features
- ✅ **Multi-Provider Strategy (Phase 3):** Consider backup providers (e.g., Mailgun as SendGrid backup)

---

#### **RISK-T-003: Data Loss or Corruption**
**Risk:** Database failure or data corruption leads to permanent data loss.

**Likelihood:** Low  
**Impact:** Critical  
**Severity:** High

**Mitigation:**
- ✅ **Automated Backups:** Daily automated backups with 30-day retention
- ✅ **Point-in-Time Recovery:** AWS RDS supports PITR (last 7 days)
- ✅ **Multi-AZ Deployment:** Database replicated across availability zones (Phase 2)
- ✅ **Backup Testing:** Quarterly restore drills to verify backups work
- ✅ **Soft Deletes:** Use `deleted_at` column instead of hard deletes (30-day grace period)
- ✅ **Audit Logs:** Track all data changes with audit_logs table
- ✅ **Off-Site Backups:** Store backups in separate AWS region

---

#### **RISK-T-004: Security Breach**
**Risk:** Platform hacked, user data exposed, payment information stolen.

**Likelihood:** Medium  
**Impact:** Critical  
**Severity:** Critical

**Mitigation:**
- ✅ **Security Best Practices:** Follow OWASP Top 10, implement security checklist (Section 12)
- ✅ **Penetration Testing:** Annual third-party penetration test
- ✅ **Bug Bounty Program:** Launch bug bounty (Phase 2) to incentivize responsible disclosure
- ✅ **Monitoring & Alerts:** Real-time security alerts (failed logins, unusual activity)
- ✅ **Incident Response Plan:** Defined playbook for breach response (see Section 12.8)
- ✅ **Data Encryption:** AES-256 at rest, TLS 1.2+ in transit
- ✅ **Minimal Data Storage:** Never store card numbers (Stripe handles PCI compliance)
- ✅ **Employee Training:** Security awareness training for all team members

---

### **17.2 Business Risks**

#### **RISK-B-001: Liquidity Problem (No Sellers or No Buyers)**
**Risk:** Not enough sellers to fulfill buyer requests, or not enough buyer demand.

**Likelihood:** High (MVP)  
**Impact:** Critical  
**Severity:** Critical

**Mitigation:**
- ✅ **DFW Focus:** Start with single metro area (DFW) to build density
- ✅ **Three-Category MVP:** Products (free local to drive adoption), Services (revenue), Jobs (B2B revenue)
- ✅ **Dual Marketing Approach:** Social media marketing AND in-person outreach to local businesses simultaneously
- ✅ **Seller Recruitment:**
  - Partner with local trade associations
  - Offer first 100 sellers $0 commission for 90 days
  - Direct outreach to licensed service providers in DFW
  - Sponsor local trade events
- ✅ **Buyer Acquisition:**
  - Google Ads targeting service and product searches in DFW
  - Facebook Ads targeting homeowners in DFW
  - Nextdoor neighborhood marketing
  - Referral program: $25 credit for referrer + referee
  - Free local product listings drive organic user acquisition
- ✅ **Target both buyers and sellers simultaneously** (not one first)
- ✅ **Guarantee First 100 Transactions:** Offer money-back guarantee to build trust
- ✅ **Monitor Supply/Demand Ratio:** Target 5-10 sellers per buyer request

---

#### **RISK-B-002: High Dispute Rate**
**Risk:** Too many disputes erode trust, overwhelm support team, drain escrow.

**Likelihood:** Medium  
**Impact:** High  
**Severity:** High

**Mitigation:**
- ✅ **Mandatory Before/After Photos:** Require photo evidence for services >$500 (Phase 2)
- ✅ **Clear Expectations:** Detailed job descriptions, clear seller quotes
- ✅ **Tiered Verification:** Higher verification for larger transactions reduces fraud
- ✅ **AI-Assisted Dispute Resolution:** Auto-resolve simple disputes (Phase 2)
- ✅ **Dispute Fee:** Charge $50 fee to losing party (Tier 3) to deter frivolous disputes
- ✅ **Proactive Communication:** Encourage in-app messaging to clarify expectations
- ✅ **Seller Coaching:** Provide resources to help sellers deliver quality work
- ✅ **Buyer Education:** Guide buyers on writing clear posts
- ✅ **Target Dispute Rate:** <8% (MVP), <5% (Phase 2)

---

#### **RISK-B-003: Payment Fraud**
**Risk:** Fraudulent buyers use stolen cards, or sellers create fake accounts to siphon funds.

**Likelihood:** Medium  
**Impact:** High  
**Severity:** High

**Mitigation:**
- ✅ **Stripe Radar:** Enable ML-based fraud detection (blocks 99.9% of fraudulent transactions)
- ✅ **3D Secure (SCA):** Required for cards >$100
- ✅ **Velocity Checks:** Max 5 payment attempts/hour, max 3 failed attempts per card
- ✅ **Identity Verification:** Stripe Identity for high-value transactions (Phase 2)
- ✅ **Tiered Verification:** Sellers must verify identity to bid >$500
- ✅ **Escrow Hold:** Funds held for 7+ days to detect chargebacks
- ✅ **Chargeback Monitoring:** Track chargeback rate (<0.5% target)
- ✅ **Seller Verification:** EIN/license verification for Tier 2+ sellers
- ✅ **IP Geolocation:** Flag transactions from high-risk countries

---

#### **RISK-B-004: Regulatory/Legal Issues**
**Risk:** Platform deemed employer of sellers (misclassification), or liable for seller negligence.

**Likelihood:** Medium  
**Impact:** Critical  
**Severity:** High

**Mitigation:**
- ✅ **Terms of Service:** Clear language that platform is facilitator, not employer
- ✅ **Independent Contractor Status:** Sellers set own rates, schedules, methods
- ✅ **Insurance Requirements:** Require liability insurance for Tier 3 sellers (>$5,000 jobs)
- ✅ **Legal Review:** Have attorney review TOS, contractor agreements
- ✅ **State-Specific Compliance:** Research Texas contractor licensing, insurance, tax laws
- ✅ **1099 Reporting:** Issue 1099-K for sellers earning >$600/year (IRS requirement)
- ✅ **Liability Disclaimer:** Platform not liable for seller actions (in TOS)
- ✅ **Dispute Resolution Clause:** Mandatory arbitration for platform disputes
- ✅ **Legal Fund:** Set aside 10% of revenue for legal defense

---

#### **RISK-B-005: Negative Network Effects**
**Risk:** Bad actors (scammers, low-quality sellers) drive away good users.

**Likelihood:** Medium  
**Impact:** High  
**Severity:** High

**Mitigation:**
- ✅ **Tiered Verification:** Higher barriers for higher-value transactions
- ✅ **Seller Background Checks:** Consider for Tier 3 sellers (Phase 2)
- ✅ **Rating & Review System:** Low-rated sellers (<3.0 with 20+ reviews) flagged
- ✅ **Moderation:** AI + human review for posts, offers, messages
- ✅ **Suspension Policy:** Suspend sellers with >15% dispute rate or <3.0 rating
- ✅ **Buyer Protection:** Escrow + mandatory photo evidence reduces fraud
- ✅ **Proactive Support:** Monitor transactions, intervene early if issues detected
- ✅ **Quality Score:** Track seller quality score (acceptance rate, completion rate, rating)

---

### **17.3 Market Risks**

#### **RISK-M-001: Competitors Launch Similar Platform**
**Risk:** Established players (Thumbtack, HomeAdvisor) copy reverse model.

**Likelihood:** High (long-term)  
**Impact:** Medium  
**Severity:** Medium

**Mitigation:**
- ✅ **Speed to Market:** Launch MVP in Q3 2026, iterate quickly
- ✅ **Network Effects:** Build dense supply/demand in DFW before competitors enter
- ✅ **Differentiation:** AI-assisted posting, free local cash, universal categories
- ✅ **Lower Fees:** 3-8% vs. competitors' 15-30%
- ✅ **Brand Loyalty:** Build strong brand with excellent customer service
- ✅ **Category Expansion:** Expand to products, inventory, jobs (unique offering)
- ✅ **Patents/IP:** Consider filing provisional patent for AI-assisted posting (Phase 2)

---

#### **RISK-M-002: Market Too Small**
**Risk:** Not enough demand for reverse marketplace; users prefer traditional model.

**Likelihood:** Medium  
**Impact:** Critical  
**Severity:** High

**Mitigation:**
- ✅ **Market Validation:** Survey 100+ homeowners in DFW before MVP launch
- ✅ **Beta Testing:** Launch with 20 beta users, gather feedback
- ✅ **Pivot Plan:** If reverse model fails, pivot to traditional marketplace or hybrid
- ✅ **Metrics Tracking:** Track post-to-offer fill rate (target >75%)
- ✅ **User Interviews:** Monthly interviews with buyers/sellers to understand pain points
- ✅ **Alternative Models:** Test hybrid model (buyers can also browse seller profiles)

---

#### **RISK-T-005: Budget Field Exposure** *(NEW in v2.2)*
**Risk:** Seller-facing API inadvertently returns buyer budget, enabling price anchoring/gouging.

**Likelihood:** Medium (easy to miss in new endpoint development)
**Impact:** High (undermines competitive pricing model)
**Severity:** High

**Mitigation:**
- ✅ Budget stripping implemented as API middleware (not per-endpoint) — see `stripBudgetForSellers()` in §10.4.4
- ✅ Automated test suite includes budget-exposure tests for all seller-facing endpoints
- ✅ Code review checklist item: "Does this endpoint expose budget to non-owner?"

---

#### **RISK-T-006: Offer Cap Gaming** *(NEW in v2.2)*
**Risk:** Sellers create multiple accounts to submit more than 10 offers per post, defeating the cap.

**Likelihood:** Low
**Impact:** Medium
**Severity:** Medium

**Mitigation:**
- ✅ Offer cap enforced per `seller_id`, not per account
- ✅ Duplicate offer detection checks same seller submitting via multiple profiles linked to same phone/email
- ✅ Rate limiting on offer submission per IP

---

#### **RISK-B-006: Seed Data Exposure** *(NEW in v2.2)*
**Risk:** Users discover that pre-launch buyer posts are seeded (fake), damaging trust in the platform.

**Likelihood:** Low
**Impact:** High
**Severity:** Medium-High

**Mitigation:**
- ✅ Seed posts internally flagged (`is_seed = TRUE`) but never exposed in API responses
- ✅ Seed posts written to be indistinguishable from real posts (realistic language, varied zip codes, realistic budgets)
- ✅ Seed posts wound down gradually as real posts replace them
- ✅ If real seller offers arrive on seed posts, they are gracefully redirected to nearest real buyer match or allowed to expire naturally (decision pending — see Open Question O3)

---

## **18. DEVELOPMENT ROADMAP**

**Description:** Phased development plan with timelines and milestones.

---

### **18.1 Phase 1: MVP (Months 1-3)**

**Target Launch:** Q3 2026 (July-September 2026)  
**Target Market:** DFW Metroplex — Products, Services, and Jobs
**Team Size:** 2-3 developers, 1 designer, 1 product manager

#### **Month 1: Foundation**
**Week 1-2: Infrastructure Setup**
- ✅ Set up development environment (Git, CI/CD, staging)
- ✅ Provision infrastructure (DigitalOcean Droplets, PostgreSQL, Redis)
- ✅ Configure Cloudflare CDN
- ✅ Set up monitoring (Datadog or New Relic, Sentry)
- ✅ Initialize codebase (Node.js + TypeScript or Python + FastAPI)
- ✅ Set up database schema (Section 10)
- ✅ Integrate Stripe Connect (sandbox mode)

**Week 3-4: Core Authentication**
- ✅ User registration (email/password)
- ✅ Email verification (SendGrid)
- ✅ Phone number collection (SMS verification deferred to Phase 2)
- ✅ Login/logout with JWT tokens
- ✅ Password reset flow
- ✅ User profile management

**Deliverables:** Working auth system, database schema, infrastructure

---

#### **Month 2: Core Marketplace Features**
**Week 1-2: Seller & Buyer Flows**
- ✅ Seller profile creation
- ✅ Buyer post creation (AI-assisted + manual form, all MVP categories)
- ✅ Image upload to S3/Cloudinary
- ✅ Location autocomplete (Google Places API)
- ✅ Seller feed/browse (filtered by location, category)
- ✅ Seller offer submission
- ✅ Buyer view/compare offers

**Week 3-4: Payments & Transactions**
- ✅ Stripe Connect seller onboarding
- ✅ Payment processing (escrow via Destination Charges)
- ✅ Offer acceptance → Payment flow
- ✅ Transaction status tracking
- ✅ Transaction completion flow
- ✅ Escrow release to seller
- ✅ Payout records and history

**Deliverables:** End-to-end transaction flow (post → offer → payment → completion → payout)

---

#### **Month 3: Polish & Launch**
**Week 1: Additional Features**
- ✅ In-app messaging (HTTP polling, not WebSockets)
- ✅ Push notifications (Firebase FCM)
- ✅ Rating & review system
- ✅ Basic search (PostgreSQL full-text search)
- ✅ Admin dashboard (basic moderation)

**Week 2: Flutter Apps**
- ✅ Build Flutter iOS app
- ✅ Build Flutter Android app
- ✅ Build Flutter Web app (responsive)
- ✅ App store assets (screenshots, descriptions)
- ✅ Submit to Apple App Store
- ✅ Submit to Google Play Store

**Week 3: Testing & Bug Fixes**
- ✅ UAT with 20 beta users (10 buyers, 10 sellers)
- ✅ Fix critical bugs
- ✅ Load testing (1,000 concurrent users)
- ✅ Security audit (internal)

**Week 4: Launch**
- ✅ Public launch in DFW
- ✅ Marketing campaign (Google Ads, Facebook Ads, Nextdoor)
- ✅ Onboard first 100 sellers (direct outreach)
- ✅ Facilitate first 50 transactions
- ✅ Monitor metrics (supply/demand ratio, dispute rate, rating)

**Deliverables:** Live platform, iOS/Android/Web apps, 100 sellers, 50 transactions

---

### **18.2 Phase 2: Enhanced Platform (Months 4-6)**

**Target:** Add advanced features, optimize existing categories, add shipping integration

**Month 4: Advanced Features**
- ✅ Real-time messaging (Socket.IO WebSockets)
- ✅ Advanced search with Elasticsearch
- ✅ Saved searches with notifications
- ✅ OAuth login (Google, Apple)
- ✅ SMS phone verification (Twilio — enabled as revenue justifies cost)

**Month 5: Verification & Integrations**
- ✅ EIN verification API (Signzy/Middesk)
- ✅ License verification API (state APIs)
- ✅ Stripe Identity for ID verification
- ✅ Improved dispute system with AI photo analysis
- ✅ Shipping integration (Ship Station for shipped products)

**Month 6: Growth Features**
- ✅ Seller analytics dashboard
- ✅ Referral program
- ✅ Inventory/Wholesale (B2B) category
- ✅ Subscription tiers for sellers (Premium Sellers)
- ✅ Recruit additional sellers across all categories

**Deliverables:** Enhanced platform, 600 sellers, 3,000 buyers, 1,500 transactions, advanced features

---

### **18.3 Phase 3: Full Marketplace (Months 7-12)**

**Target:** Geographic expansion, advanced categories, enterprise features

**Months 7-8: New Categories & Expansion**
- ✅ Add Real Estate category (lead generation only — requires attorney review)
- ✅ Geographic expansion to Houston
- ✅ Video consultations for estimates
- ✅ Advanced fraud detection (ML model, device fingerprinting)
- ✅ Real-time job tracking for sellers

**Months 9-10: Advanced Features**
- ✅ Add Junk/Unwanted Items category
- ✅ Interstate/long-distance moving (if FMCSA research cleared)
- ✅ Authenticity verification for collectibles (third-party)
- ✅ Geographic expansion to Austin
- ✅ Staffing agency partnerships for Jobs category

**Months 11-12: Enterprise & Expansion**
- ✅ White-label API for enterprise partners
- ✅ Advanced analytics & insights (Buyer/Seller dashboards)
- ✅ Insurance partnerships (bundled insurance for sellers)
- ✅ Financing options (Affirm, Klarna for high-value items)
- ✅ Instant payout option (1% fee, 15 minutes)
- ✅ Geographic expansion to San Antonio
- ✅ National rollout planning (Q1 2027)

**Deliverables:** Universal marketplace, 10k sellers, 50k buyers, 5k transactions/month, national expansion plan

---

### **18.4 Phase 4: Scale & Optimize (Months 13-18)**

**Target:** Scale to national platform, 1M users, $10M+ monthly GMV

**Features:**
- ✅ Real Estate category (property services, agent matching)
- ✅ Vehicles category (buy/sell/repair)
- ✅ Multi-language support (Spanish)
- ✅ Multi-currency support (CAD, MXN)
- ✅ Advanced fraud detection (custom ML models)
- ✅ Video consultations (Twilio Video)
- ✅ In-app wallet (store credits, referral rewards)
- ✅ SOC 2 Type II compliance
- ✅ Microservices architecture (extract high-traffic services)
- ✅ International expansion (Canada, Mexico)

---

## **19. OPEN QUESTIONS & DECISIONS** *(replaced in v2.2)*

This section is fully replaced as of v2.2 (May 2, 2026). It captures the consolidated state of resolved decisions and remaining unresolved questions after the Apr 14–16 sessions. The legacy v2.1 question groupings (19.1 Branding, 19.2 Business Model, etc.) are superseded by the two unified tables below.

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

## **20. APPENDICES**

**Description:** Supporting documents, glossary, and references.

---

### **20.1 Glossary**

**Buyer:** User posting a request for services, products, or help  
**Seller:** User submitting offers to fulfill buyer requests  
**Post:** Buyer's request for services, products, or help  
**Offer:** Seller's bid on a buyer's post  
**Transaction:** Active job/sale between buyer and seller after offer acceptance  
**Escrow:** Funds held by platform until buyer approves completion  
**Payout:** Transfer of funds from platform to seller after buyer approval  
**Verification Tier:** Level of seller verification (Tier 1, 2, 3) determining bid limits  
**Dispute:** Conflict between buyer and seller requiring resolution  
**Auto-Release:** Automatic release of escrow funds if buyer unresponsive  
**3D Secure (SCA):** Strong Customer Authentication required for card payments >$100  
**JWT:** JSON Web Token for API authentication  
**Stripe Connect:** Stripe's platform payment solution for marketplaces  
**Destination Charges:** Stripe Connect payment flow where platform charges buyer and transfers to seller  
**GDPR:** General Data Protection Regulation (EU data privacy law)  
**CCPA:** California Consumer Privacy Act (California data privacy law)  
**PCI-DSS:** Payment Card Industry Data Security Standard  
**SOC 2:** Security audit standard for service organizations  
**MVP:** Minimum Viable Product (Phase 1)  
**DFW:** Dallas-Fort Worth Metroplex (MVP target market)  
**QR Code:** Quick Response code for local platform meetup verification  

---

### **20.2 Abbreviations**

**API:** Application Programming Interface  
**AWS:** Amazon Web Services  
**CDN:** Content Delivery Network  
**CORS:** Cross-Origin Resource Sharing  
**CRUD:** Create, Read, Update, Delete  
**CSP:** Content Security Policy  
**CSRF:** Cross-Site Request Forgery  
**EIN:** Employer Identification Number  
**FCM:** Firebase Cloud Messaging  
**GDPR:** General Data Protection Regulation  
**GMT:** Greenwich Mean Time  
**HTTP:** HyperText Transfer Protocol  
**HTTPS:** HyperText Transfer Protocol Secure  
**HVAC:** Heating, Ventilation, and Air Conditioning  
**ID:** Identifier  
**JSON:** JavaScript Object Notation  
**JWT:** JSON Web Token  
**KPI:** Key Performance Indicator  
**MVP:** Minimum Viable Product  
**PCI-DSS:** Payment Card Industry Data Security Standard  
**PDF:** Portable Document Format  
**PII:** Personally Identifiable Information  
**PRD:** Product Requirements Document  
**QR:** Quick Response  
**RBAC:** Role-Based Access Control  
**REST:** Representational State Transfer  
**RTO:** Recovery Time Objective  
**RPO:** Recovery Point Objective  
**S3:** Simple Storage Service (AWS)  
**SCA:** Strong Customer Authentication  
**SDK:** Software Development Kit  
**SMS:** Short Message Service  
**SOC:** Service Organization Control  
**SQL:** Structured Query Language  
**SSN:** Social Security Number  
**SSL:** Secure Sockets Layer  
**TLS:** Transport Layer Security  
**TOS:** Terms of Service  
**UAT:** User Acceptance Testing  
**UI:** User Interface  
**URL:** Uniform Resource Locator  
**US:** User Story  
**UTC:** Coordinated Universal Time  
**UUID:** Universally Unique Identifier  
**UX:** User Experience  
**WCAG:** Web Content Accessibility Guidelines  
**XSS:** Cross-Site Scripting  

---

### **20.3 References**

**Technical Documentation:**
- Stripe Connect: https://stripe.com/docs/connect
- Twilio Verify API: https://www.twilio.com/docs/verify/api
- SendGrid API: https://docs.sendgrid.com/
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Google Maps Platform: https://developers.google.com/maps/documentation
- AWS S3: https://docs.aws.amazon.com/s3/
- Cloudinary: https://cloudinary.com/documentation
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Elasticsearch: https://www.elastic.co/guide/
- Flutter: https://docs.flutter.dev/
- Node.js: https://nodejs.org/docs/
- TypeScript: https://www.typescriptlang.org/docs/
- Python: https://docs.python.org/
- FastAPI: https://fastapi.tiangolo.com/

**Standards & Compliance:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- PCI-DSS: https://www.pcisecuritystandards.org/
- GDPR: https://gdpr.eu/
- CCPA: https://oag.ca.gov/privacy/ccpa

**Market Research:**
- IBISWorld Home Services: https://www.ibisworld.com/
- Statista Online Classifieds: https://www.statista.com/
- Mastercard Gig Economy: https://www.mastercard.com/

---

### **20.4 Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-09 | Faisal + Partners | Initial draft |
| 2.0 | 2026-02-11 | Faisal + Partners | Revised with universal categories, complete API specs, security checklist |
| 2.1 | 2026-02-12 | Faisal + Partners | Feb 11 meeting updates: MVP expanded to 3 categories (Products/Services/Jobs), AI-assisted post creation moved to MVP, single account dual buyer/seller view, badge-based verification, auto 5-star reviews, Jobs lead gen model, local products free, purple/white branding, before/after photos required for all services, milestone payments with no minimum, deferred SMS/OAuth to Phase 2, account deactivation/deletion policies, messaging enhancements, drafts support, Coming Soon categories, infrastructure cost expectations |
| 2.2 | 2026-05-02 | Faisal + Partners | Buyer-free fee model; Classic/Business account types; three-day exclusivity window; 10-offer cap with paid batch overflow; budget hidden from sellers; AI chatbot as primary interface; 30-day post duration; post renew feature; buyer discovery feed; low-ball warnings; local fraud prevention; cold-stata (5K–15K posts); promotions deferred; UPC barcode scanning for Business accounts; screen count 43; Sorcyn name/domain confirmed |

---

### **20.5 Contact Information**

**Product Owner:** Faisal  
**Email:** faisal.idris014@gmail.com  
**Development Team:** TBD  
**Legal Counsel:** TBD  
**Security Consultant:** TBD  

---

## **END OF PRD**