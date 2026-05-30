# 🎯 BCECE College Predictor 2026 — Complete Project Roadmap

> **A Next.js + Supabase + Prisma full-stack web application** that predicts college allotments for BCECE-JOINT (PCM/PCB/PCMB) 2026 aspirants, powered by the 2025 1st Round Allotment dataset.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Dataset Analysis & Schema Design](#2-dataset-analysis--schema-design)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Database Design (Supabase + Prisma)](#4-database-design-supabase--prisma)
5. [Prediction Algorithm](#5-prediction-algorithm)
6. [API Design & Rate Limiting](#6-api-design--rate-limiting)
7. [Frontend UI/UX Design System](#7-frontend-uiux-design-system)
8. [Page-by-Page Breakdown](#8-page-by-page-breakdown)
9. [SEO & Performance](#9-seo--performance)
10. [Deployment & DevOps](#10-deployment--devops)
11. [Development Phases & Timeline](#11-development-phases--timeline)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. Project Overview

### 1.1 Problem Statement

Every year, **thousands of Bihar students** appear for BCECE-JOINT entrance exams. After results, the biggest anxiety is:
> *"With my rank, which college and branch can I get?"*

Currently, students manually browse PDF allotment lists — error-prone and confusing. This tool solves that by **predicting probable allotments** from 2025 cutoff data.

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| 🔮 **College Predictor** | Enter rank → get predicted colleges with probability indicators |
| 🏫 **College Explorer** | Browse all 23 institutes, their branches, and historical cutoffs |
| 📊 **Cutoff Analyzer** | View opening/closing ranks per college-branch-category combo |
| 🔍 **Smart Filters** | Filter by category, gender, branch, sub-group (PCM/PCB/PCMB) |
| 📱 **Responsive Design** | Pixel-perfect on mobile, tablet, and desktop |
| ⚡ **Lightning Fast** | Edge caching, API rate limiting, optimized queries |

### 1.3 Data Source Summary

From the 2025 dataset (`REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv`):

| Metric | Value |
|--------|-------|
| **Total Records** | ~1,187 allotments |
| **Institutes** | 23 unique colleges |
| **Branches** | 13 programs |
| **Categories** | UR, BC, EBC (EB), SC, ST |
| **Allotted Categories** | UR, BC, EBC, SC, ST, EWS, RCG, DQ, NRI, SMQ |
| **Seat Types** | GENERAL SEAT, FEMALE SEAT |
| **Sub-Groups** | PCM, PCB, PCMB |
| **Allotment Groups** | PCM, PCB |

---

## 2. Dataset Analysis & Schema Design

### 2.1 CSV Column Mapping

```
page_no          → PDF page number (metadata only)
row_no           → Row within page (metadata only)
roll_no          → Student roll number
reg_no           → Registration number
sub_group        → PCM | PCB | PCMB
name             → Student name
gender           → M | F
category         → UR | BC | EB | SC | ST
pcm_ur_rank      → PCM UR Rank (e.g., "JT.UR- 101")
pcm_cat_rank     → PCM Category Rank (e.g., "JT.BC- 48")
pcm_rcg_rank     → PCM RCG Rank
pcm_dq_rank      → PCM DQ Rank
pcm_smq_rank     → PCM SMQ Rank
pcb_ur_rank      → PCB UR Rank
pcb_cat_rank     → PCB Category Rank
pcb_rcg_rank     → PCB RCG Rank
pcb_dq_rank      → PCB DQ Rank
pcb_smq_rank     → PCB SMQ Rank
institute        → College name
branch           → Program/Branch
allotted_cat     → Allotted under which category
seat_type        → GENERAL SEAT | FEMALE SEAT
remark           → Allotment remark (Against UR seat, JUMP OVER, Compensation etc.)
allotment_group  → PCM | PCB
```

### 2.2 Key Observations

> **⚠️ IMPORTANT: Rank Parsing Required**  
> Ranks are stored as strings like `"JT.UR- 101"` — must be parsed to integers for querying.

- **PCMB students** have BOTH PCM and PCB ranks — they can be allotted to either group
- **Categories mapping**: `EB` in the dataset = `EBC` (Extremely Backward Class) in allotment
- **Seat Types**: Female seats are reserved — gender is a critical filter
- **Special Categories**: RCG (Residential Certificate Gujarat?), DQ (Differently-Abled Quota), SMQ (Small & Minority Quota), NRI
- **Remark patterns**:
  - `"Against UR seat"` — allotted on UR quota
  - `"JUMP OVER ON BC seat"` — UR candidate jumping to category seat
  - `"Compensation Seat BC Against UR"` — compensation mechanism
  - `"Against SC seat (FEMALE)"` — SC female-specific allotment

### 2.3 Institutes (23 Colleges)

| # | Institute | Types of Programs |
|---|-----------|-------------------|
| 1 | B.SC. NURSING COLLEGE, N.M.C.H, PATNA | B.Sc. Nursing |
| 2 | B.SC. NURSING COLLEGE JLNMCH., BHAGALPUR | B.Sc. Nursing |
| 3 | B.SC. NURSING COLLEGE DMCH., DARBHANGA | B.Sc. Nursing |
| 4 | B.SC. NURSING COLLEGE ANMMCH., GAYA | B.Sc. Nursing |
| 5 | B.SC. NURSING COLLEGE SKMCH, MUZAFFARPUR | B.Sc. Nursing |
| 6 | B.SC. NURSING COLLEGE GMCH, BETTIAH | B.Sc. Nursing |
| 7 | B.SC. NURSING COLLEGE GMCH, PURNEA | B.Sc. Nursing |
| 8 | B.SC. NURSING COLLEGE GMCH, SARAN, CHAPRA | B.Sc. Nursing |
| 9 | B.SC. NURSING COLLEGE, B.M.I.M.S., PAWAPURI NALANDA | B.Sc. Nursing |
| 10 | B.C.P.O. PATNA | B.Ph.T., B.Th.O. |
| 11 | P.H.I., PATNA | B. OPTOMETRY, B.R.I.TECH., B.M. LAB TECH, B. O.T. TECH. |
| 12 | B.A.C. SABOUR | Agri Sc. |
| 13 | M.B.A.C. SAHARSA | Agri Sc. |
| 14 | D.K.A.C., ARRABARI, KISHANGANJ | Agri Sc. |
| 15 | V. K. S., COLLEGE OF AGRI. DUMRAO, BUXAR | Agri Sc. |
| 16 | B.P.S. AGRI.COLLEGE, PURNEA | Agri Sc. |
| 17 | G.P.I. GULZARBAGH, PATNA-7 | B.Pharma |
| 18 | M.I.T. MUZAFFARPUR | B.Pharma |
| 19 | C.O.F. KISHANGANJ | B.F.Sc. |
| 20 | C.O.F. KISHANGANJ (SELF FINANCE) | B.F.Sc. |
| 21 | COLLEGE OF AGRICULTURE BIO TECHNOLOGY, SABOUR | Bio-Tech |
| 22 | COLLEGE OF FORESTRY AND ENVIRONMENTAL SCIENCES, MUNGER | Forestry & Environmental Sciences |
| 23 | N.C.O.H. NOORSARAI, NALANDA | B.SC (Horticulture) |

### 2.4 Branches (13 Programs)

```
1.  B.Sc. Nursing
2.  Agri Sc. (Agriculture Science)
3.  B.Pharma (Pharmacy)
4.  B.Ph.T. (Physiotherapy)
5.  B.Th.O. (Occupational Therapy)
6.  B. OPTOMETRY
7.  B.R.I.TECH. (Radiological Imaging Technology)
8.  B.M. LAB TECH (Medical Lab Technology)
9.  B. O.T. TECH. (Operation Theatre Technology)
10. B.F.Sc. (Fisheries Science)
11. Bio-Tech (Biotechnology)
12. Forestry & Environmental Sciences
13. B.SC (Horticulture)
```

---

## 3. Tech Stack & Architecture

### 3.1 Technology Stack

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│  Next.js 15 (App Router) + TypeScript        │
│  Vanilla CSS (Custom Design System)          │
│  Framer Motion (Animations)                  │
│  React Hook Form + Zod (Form Validation)     │
│  Recharts (Charts / Visualizations)          │
│  Lucide React (Icons)                        │
└─────────────┬───────────────────────────────┘
              │ API Routes (Server Components)
┌─────────────▼───────────────────────────────┐
│                  BACKEND                     │
│  Next.js API Routes (Route Handlers)         │
│  Prisma ORM (Type-safe DB access)            │
│  Rate Limiter (upstash/ratelimit)            │
│  Zod (API Input Validation)                  │
└─────────────┬───────────────────────────────┘
              │ Prisma Client
┌─────────────▼───────────────────────────────┐
│                 DATABASE                     │
│  Supabase (PostgreSQL)                       │
│  Prisma Schema → Supabase Migration          │
│  Row Level Security (Public Read-Only)        │
└─────────────────────────────────────────────┘
```

### 3.2 Architecture Diagram

```
                   ┌─────────────────────┐
                   │   Vercel Edge / CDN  │
                   │   (ISR, Caching)     │
                   └──────────┬──────────┘
                              │
        ┌─────────────────────▼─────────────────────┐
        │              Next.js App                   │
        │  ┌──────────────┐  ┌───────────────────┐  │
        │  │ React Server │  │ Client Components │  │
        │  │ Components   │  │ (Interactivity)   │  │
        │  └──────┬───────┘  └────────┬──────────┘  │
        │         │                    │             │
        │  ┌──────▼────────────────────▼──────────┐ │
        │  │         API Route Handlers            │ │
        │  │  ┌─────────┐  ┌──────────────────┐   │ │
        │  │  │Rate Limit│  │ In-Memory Cache  │   │ │
        │  │  └────┬────┘  └───────┬──────────┘   │ │
        │  │       │               │               │ │
        │  │  ┌────▼───────────────▼──────────┐   │ │
        │  │  │       Prisma Client            │   │ │
        │  │  └──────────────┬────────────────┘   │ │
        │  └─────────────────┼────────────────────┘ │
        └────────────────────┼──────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │     Supabase PostgreSQL      │
              │   (Row-Level Security)       │
              └─────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      Upstash Redis           │
              │   (Rate Limit Storage)       │
              └─────────────────────────────┘
```

### 3.3 Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "prisma": "^6.x",
    "@prisma/client": "^6.x",
    "@supabase/supabase-js": "^2.x",
    "framer-motion": "^12.x",
    "recharts": "^2.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "lucide-react": "^0.4x",
    "@upstash/ratelimit": "^2.x",
    "@upstash/redis": "^1.x",
    "lru-cache": "^11.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^22.x",
    "@types/react": "^19.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

---

## 4. Database Design (Supabase + Prisma)

### 4.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ──────────────────────────────
// Core Domain Models
// ──────────────────────────────

model Institute {
  id          String       @id @default(cuid())
  name        String       @unique
  shortName   String?      // Display-friendly short name
  location    String?      // City/District
  type        String?      // Government / Self-Finance
  createdAt   DateTime     @default(now())

  allotments  Allotment[]

  @@map("institutes")
}

model Branch {
  id          String       @id @default(cuid())
  name        String       @unique
  fullName    String?      // Full expanded name
  group       String       // PCM | PCB | BOTH (for mapping)
  createdAt   DateTime     @default(now())

  allotments  Allotment[]

  @@map("branches")
}

model Allotment {
  id              String    @id @default(cuid())
  
  // Student Info (anonymized for prediction)
  subGroup        String    // PCM | PCB | PCMB
  gender          String    // M | F
  category        String    // UR | BC | EB | SC | ST

  // Parsed Numeric Ranks (critical for prediction)
  pcmUrRank       Int?
  pcmCatRank      Int?
  pcmRcgRank      Int?
  pcmDqRank       Int?
  pcmSmqRank      Int?
  pcbUrRank       Int?
  pcbCatRank      Int?
  pcbRcgRank      Int?
  pcbDqRank       Int?
  pcbSmqRank      Int?

  // Allotment Details
  instituteId     String
  institute       Institute @relation(fields: [instituteId], references: [id])
  branchId        String
  branch          Branch    @relation(fields: [branchId], references: [id])
  allottedCat     String    // UR | BC | EBC | SC | ST | EWS | RCG | DQ | NRI | SMQ
  seatType        String    // GENERAL SEAT | FEMALE SEAT
  remark          String?   // Full remark text
  allotmentGroup  String    // PCM | PCB

  // Source metadata
  year            Int       @default(2025)
  round           Int       @default(1)

  createdAt       DateTime  @default(now())

  @@index([allotmentGroup, allottedCat, gender])
  @@index([instituteId, branchId])
  @@index([pcbUrRank])
  @@index([pcmUrRank])
  @@index([allottedCat, seatType])
  @@map("allotments")
}

// ──────────────────────────────
// Precomputed Cutoff Table
// (for fast predictor queries)
// ──────────────────────────────

model Cutoff {
  id              String    @id @default(cuid())
  
  instituteId     String
  branchId        String
  allotmentGroup  String    // PCM | PCB
  allottedCat     String    // UR, BC, EBC, SC, ST, EWS, RCG, DQ, NRI, SMQ
  seatType        String    // GENERAL SEAT | FEMALE SEAT

  openingRank     Int       // Best (lowest) rank allotted
  closingRank     Int       // Worst (highest) rank allotted
  totalSeats      Int       // Count of allotments in this combo

  year            Int       @default(2025)
  round           Int       @default(1)

  @@unique([instituteId, branchId, allotmentGroup, allottedCat, seatType, year, round])
  @@index([allotmentGroup, allottedCat, seatType])
  @@index([closingRank])
  @@map("cutoffs")
}
```

### 4.2 Data Seeding Strategy

```
1. Parse CSV → Extract all unique institutes → Seed `institutes` table
2. Parse CSV → Extract all unique branches → Seed `branches` table
3. Parse CSV → For each row:
   a. Parse rank strings (e.g., "JT.UR- 101" → 101)
   b. Map institute name → institute ID
   c. Map branch name → branch ID
   d. Insert into `allotments` table
4. Aggregate allotments → Compute opening/closing ranks → Seed `cutoffs` table
```

> **💡 TIP:** Create a `prisma/seed.ts` script that reads the CSV and performs all seeding in a single transaction.

### 4.3 Rank Parsing Logic

```typescript
// "JT.UR- 101"  → 101
// "JT.BC- 48"   → 48
// "JT.RCG- 18"  → 18
// ""             → null

function parseRank(rankStr: string): number | null {
  if (!rankStr || rankStr.trim() === '') return null;
  const match = rankStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
```

### 4.4 Supabase Configuration

```
- Project Region: Mumbai (ap-south-1) for lowest latency to Bihar users
- Row Level Security: 
  - All tables: SELECT enabled for anon role (public read)
  - INSERT/UPDATE/DELETE: Disabled for anon (admin only via service_role key)
- Connection Pooling: Transaction mode via Supavisor (for Prisma)
  - DATABASE_URL: pooled connection string (port 6543)
  - DIRECT_URL: direct connection string (port 5432, for migrations)
```

---

## 5. Prediction Algorithm

### 5.1 Core Logic

The predictor works by comparing the student's 2026 rank against the 2025 cutoffs (opening & closing ranks) for each college-branch-category-seat combo.

```
INPUT:
  - rank: number (UR rank or category rank)
  - allotmentGroup: "PCM" | "PCB"
  - category: "UR" | "BC" | "EBC" | "SC" | "ST"
  - gender: "M" | "F"
  - (optional) preferredBranches: string[]
  - (optional) preferredInstitutes: string[]

ALGORITHM:
  1. Determine eligible seat types:
     - Male   → ["GENERAL SEAT"]
     - Female → ["GENERAL SEAT", "FEMALE SEAT"]

  2. Determine eligible allotted categories:
     - UR   → ["UR", "EWS"] (EWS if applicable)
     - BC   → ["UR", "BC"]
     - EBC  → ["UR", "EBC"]
     - SC   → ["UR", "SC"]
     - ST   → ["UR", "ST"]
     Note: Actual eligibility depends on which category the student qualifies for.
     We simplify: students can be allotted on UR + their own category seat.

  3. Query cutoffs WHERE:
     - allotmentGroup = input.allotmentGroup
     - allottedCat IN eligible categories
     - seatType IN eligible seat types
     - closingRank >= input.rank (student qualifies)
     - (optional filters for branch/institute)

  4. For each matching cutoff, compute a "chance" indicator:
     - 🟢 HIGH CHANCE:    rank <= openingRank (better than best allotted)
     - 🟡 MODERATE CHANCE: openingRank < rank <= closingRank (within range)
     - 🔴 LOW CHANCE:     rank is within 10% above closingRank (marginal)

  5. Sort results by:
     - Chance level (HIGH → MODERATE → LOW)
     - Then by institute prestige / closing rank

  6. Return predicted allotment list with:
     - Institute name, Branch name
     - Opening/Closing rank from 2025
     - Chance indicator (HIGH/MODERATE/LOW)
     - Allotted category, seat type
```

### 5.2 Edge Cases

| Scenario | Handling |
|----------|----------|
| PCMB student | Query both PCM and PCB cutoffs, merge results |
| EWS candidate | UR category + EWS allotted_cat seats |
| RCG/DQ/SMQ/NRI | Separate toggle — only show if user selects these |
| No matches | Show "Your rank may not qualify for any seat this year" with nearest cutoffs |
| Category rank input | Allow entering both UR rank and category rank separately |

### 5.3 Prediction Confidence Disclaimer

> **⚠️ CAUTION — Mandatory disclaimer on every prediction page:**  
> *"Predictions are based on BCECE 2025 Round-1 allotment data. Actual 2026 cutoffs may vary based on number of applicants, seat changes, reservation policy updates, and other factors. Use this tool for guidance only — it does not guarantee admission."*

---

## 6. API Design & Rate Limiting

### 6.1 API Routes

| Method | Route | Description | Rate Limit |
|--------|-------|-------------|------------|
| `GET` | `/api/predict` | Main predictor endpoint | 30 req/min/IP |
| `GET` | `/api/colleges` | List all institutes | 60 req/min/IP |
| `GET` | `/api/colleges/[id]` | Single institute detail | 60 req/min/IP |
| `GET` | `/api/branches` | List all branches | 60 req/min/IP |
| `GET` | `/api/cutoffs` | Cutoff data with filters | 30 req/min/IP |
| `GET` | `/api/stats` | Aggregate statistics | 60 req/min/IP |

### 6.2 Predictor API (`/api/predict`)

```typescript
// Request Query Params
interface PredictRequest {
  rank: number;              // Required: UR rank
  categoryRank?: number;     // Optional: Category-specific rank
  allotmentGroup: 'PCM' | 'PCB'; // Required
  category: 'UR' | 'BC' | 'EBC' | 'SC' | 'ST'; // Required
  gender: 'M' | 'F';        // Required
  branches?: string[];       // Optional: Filter by branch IDs
  institutes?: string[];     // Optional: Filter by institute IDs
}

// Response
interface PredictResponse {
  success: boolean;
  data: {
    predictions: Prediction[];
    totalMatches: number;
    disclaimer: string;
  };
}

interface Prediction {
  institute: { id: string; name: string; shortName: string; location: string };
  branch: { id: string; name: string; fullName: string };
  openingRank: number;
  closingRank: number;
  totalSeats: number;
  allottedCategory: string;
  seatType: string;
  chanceLevel: 'HIGH' | 'MODERATE' | 'LOW';
  chancePercentage: number; // 0-100 approximate
}
```

### 6.3 Rate Limiting Implementation

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

// Option A: Upstash Redis (Production — recommended for Vercel)
const redisRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "bcece-predictor",
});

// Option B: In-Memory LRU (Development / self-hosted fallback)
const tokenBuckets = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 60 * 1000,
});

export async function rateLimit(identifier: string): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const result = await redisRatelimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  // Fallback to in-memory
  // ... token bucket implementation
}
```

### 6.4 API Middleware Pattern

```typescript
// middleware.ts (Next.js Middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'anonymous';
    
    const { success, remaining, reset } = await rateLimit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

### 6.5 Caching Strategy

```
┌─────────────┬──────────────┬───────────────────────────┐
│ Layer        │ TTL          │ What's Cached              │
├─────────────┼──────────────┼───────────────────────────┤
│ CDN (Vercel) │ 1 hour       │ Static pages (ISR)         │
│ API Response │ 5 minutes    │ Prediction results         │
│ In-Memory    │ 10 minutes   │ Cutoff queries (LRU)       │
│ Supabase     │ Persistent   │ Source of truth             │
└─────────────┴──────────────┴───────────────────────────┘
```

```typescript
// Cache headers for API responses
export function setCacheHeaders(response: NextResponse, maxAge = 300) {
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  );
  return response;
}
```

---

## 7. Frontend UI/UX Design System

### 7.1 Design Philosophy

> **Light mode, premium, modern, alive.**

- Clean **white & cream** backgrounds with **vibrant accent gradients**
- **Glassmorphism** cards with soft shadows and backdrop blur
- **Micro-animations** on every interaction (hover, click, reveal)
- **Data-dense but scannable** layouts
- **Inter / Outfit** font pairing from Google Fonts
- Color-coded chance indicators (Green/Amber/Red)

### 7.2 Color Palette

```css
:root {
  /* Base */
  --bg-primary: #FAFBFE;       /* Off-white page background */
  --bg-secondary: #F0F2F8;     /* Section backgrounds */
  --bg-card: #FFFFFF;           /* Card backgrounds */
  --bg-card-hover: #F7F8FC;

  /* Text */
  --text-primary: #1A1D2B;     /* Headings */
  --text-secondary: #4A5068;   /* Body text */
  --text-muted: #8B91A8;       /* Captions, labels */
  --text-inverse: #FFFFFF;

  /* Accent Gradient (Brand) */
  --accent-primary: #6366F1;   /* Indigo */
  --accent-secondary: #8B5CF6; /* Violet */
  --accent-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%);

  /* Status Colors */
  --chance-high: #10B981;       /* Emerald Green */
  --chance-high-bg: #ECFDF5;
  --chance-moderate: #F59E0B;   /* Amber */
  --chance-moderate-bg: #FFFBEB;
  --chance-low: #EF4444;        /* Red */
  --chance-low-bg: #FEF2F2;

  /* Borders & Shadows */
  --border-light: #E5E7EB;
  --border-focus: #6366F1;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 36px rgba(0,0,0,0.10);
  --shadow-glow: 0 0 24px rgba(99, 102, 241, 0.15);

  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-blur: 16px;

  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### 7.3 Typography Scale

```css
/* Display / Hero */
.text-hero {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Section Heading */
.text-h1 {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  line-height: 1.2;
}

/* Card Heading */
.text-h2 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
}

/* Body */
.text-body {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Small / Caption */
.text-caption {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
}
```

### 7.4 Component Library (Key Components)

```
📦 components/
├── ui/
│   ├── Button.tsx          → Primary, Secondary, Ghost, Icon variants
│   ├── Card.tsx            → Glass card with hover animation
│   ├── Badge.tsx           → Status badges (HIGH/MODERATE/LOW)
│   ├── Select.tsx          → Custom styled dropdown
│   ├── Input.tsx           → Number input with validation
│   ├── Skeleton.tsx        → Loading skeletons
│   ├── Tooltip.tsx         → Info tooltips
│   ├── Modal.tsx           → Results detail modal
│   └── Pill.tsx            → Category pills
├── predictor/
│   ├── PredictorForm.tsx   → Main prediction form
│   ├── ResultCard.tsx      → Individual prediction result
│   ├── ResultsList.tsx     → Paginated results grid
│   ├── ChanceIndicator.tsx → 🟢🟡🔴 Visual chance badge
│   └── FilterBar.tsx       → Branch/Institute filter chips
├── colleges/
│   ├── CollegeCard.tsx     → College overview card
│   ├── CollegeDetail.tsx   → Full college page layout
│   ├── BranchList.tsx      → Branches within a college
│   └── CutoffTable.tsx     → Sortable cutoff table
├── charts/
│   ├── CutoffChart.tsx     → Bar chart: cutoffs by category
│   └── SeatDistribution.tsx→ Donut chart: seat distribution
├── layout/
│   ├── Header.tsx          → Sticky nav with glassmorphism
│   ├── Footer.tsx          → Links, disclaimer, credits
│   ├── Hero.tsx            → Animated hero section
│   └── Container.tsx       → Max-width wrapper
└── shared/
    ├── Disclaimer.tsx      → Prediction disclaimer banner
    ├── SEOHead.tsx         → Dynamic meta tags
    └── ErrorBoundary.tsx   → Graceful error handling
```

### 7.5 Animation System

```typescript
// lib/animations.ts (Framer Motion variants)

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

export const cardHover = {
  rest: { scale: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
  hover: { 
    scale: 1.02, 
    boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { repeat: Infinity, duration: 1.5 }
  }
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0 rgba(99, 102, 241, 0)",
      "0 0 20px rgba(99, 102, 241, 0.3)",
      "0 0 0 rgba(99, 102, 241, 0)"
    ],
    transition: { repeat: Infinity, duration: 2 }
  }
};
```

### 7.6 Responsive Breakpoints

```css
/* Mobile First */
/* Default: 0 - 639px (Mobile) */
@media (min-width: 640px)  { /* sm: Tablet portrait  */ }
@media (min-width: 768px)  { /* md: Tablet landscape */ }
@media (min-width: 1024px) { /* lg: Desktop          */ }
@media (min-width: 1280px) { /* xl: Large desktop     */ }
```

---

## 8. Page-by-Page Breakdown

### 8.1 Route Structure

```
📁 app/
├── layout.tsx              → Root layout (fonts, global CSS, analytics)
├── page.tsx                → 🏠 Home / Predictor (main landing)
├── colleges/
│   ├── page.tsx            → 🏫 All Colleges listing
│   └── [id]/
│       └── page.tsx        → 📄 College Detail Page
├── cutoffs/
│   └── page.tsx            → 📊 Cutoff Explorer (filter & browse)
├── about/
│   └── page.tsx            → ℹ️ About + Disclaimer
├── api/
│   ├── predict/
│   │   └── route.ts        → Prediction API
│   ├── colleges/
│   │   ├── route.ts        → College listing API
│   │   └── [id]/
│   │       └── route.ts    → College detail API
│   ├── cutoffs/
│   │   └── route.ts        → Cutoffs API
│   └── stats/
│       └── route.ts        → Statistics API
├── not-found.tsx           → Custom 404
├── error.tsx               → Custom Error
├── loading.tsx             → Global loading
├── sitemap.ts              → Dynamic sitemap
└── robots.ts               → Robots.txt
```

### 8.2 Home Page (Predictor) — `page.tsx`

```
┌──────────────────────────────────────────────────────┐
│  ┌─ HEADER ──────────────────────────────────────┐   │
│  │  🎓 BCECE Predictor  │  Colleges  Cutoffs About│  │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ HERO SECTION ────────────────────────────────┐   │
│  │                                                │  │
│  │   🎯 Predict Your College                      │  │
│  │   BCECE-JOINT 2026                             │  │
│  │                                                │  │
│  │   Based on 2025 Round-1 Allotment Data         │  │
│  │   23 Colleges • 13 Branches • 1187 Allotments  │  │
│  │                                                │  │
│  │   ┌─ ANIMATED STATS COUNTER ──────────┐       │  │
│  │   │  🏫 23    📚 13    📋 1187        │       │  │
│  │   │  Colleges  Branches  Records       │       │  │
│  │   └───────────────────────────────────┘       │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ PREDICTOR FORM (Glass Card) ─────────────────┐   │
│  │                                                │  │
│  │  Step 1: Basic Info                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │ Group ▼  │ │ Category▼│ │ Gender ▼ │      │  │
│  │  │ PCB      │ │ BC       │ │ Male     │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘      │  │
│  │                                                │  │
│  │  Step 2: Enter Your Rank                       │  │
│  │  ┌──────────────────┐ ┌──────────────────┐    │  │
│  │  │ UR Rank: [1500]  │ │ Cat Rank: [720]  │    │  │
│  │  └──────────────────┘ └──────────────────┘    │  │
│  │                                                │  │
│  │  Step 3: Preferences (Optional)                │  │
│  │  ┌──────────────────────────────────────┐     │  │
│  │  │ [x] B.Sc. Nursing  [x] B.Pharma     │     │  │
│  │  │ [ ] Agri Sc.       [ ] B.F.Sc.      │     │  │
│  │  │ [x] All Branches                     │     │  │
│  │  └──────────────────────────────────────┘     │  │
│  │                                                │  │
│  │  ┌──────────────────────────────────────┐     │  │
│  │  │     🔮 PREDICT MY COLLEGES           │     │  │
│  │  │    (Gradient button with glow)       │     │  │
│  │  └──────────────────────────────────────┘     │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ RESULTS SECTION (appears after submit) ──────┐   │
│  │                                                │  │
│  │  📊 Found 12 possible allotments               │  │
│  │                                                │  │
│  │  ┌─ RESULT CARD ─────────────────────────┐    │  │
│  │  │ 🟢 HIGH CHANCE                         │    │  │
│  │  │ B.SC. NURSING COLLEGE, N.M.C.H, PATNA │    │  │
│  │  │ B.Sc. Nursing │ BC Seat │ General      │    │  │
│  │  │ Opening: 48  │  Closing: 207           │    │  │
│  │  │ Your Rank: 150  ━━━━━●━━━━  In Range   │    │  │
│  │  └────────────────────────────────────────┘    │  │
│  │                                                │  │
│  │  ┌─ RESULT CARD ─────────────────────────┐    │  │
│  │  │ 🟡 MODERATE                            │    │  │
│  │  │ G.P.I. GULZARBAGH, PATNA-7             │    │  │
│  │  │ B.Pharma │ UR Seat │ General           │    │  │
│  │  │ Opening: 321  │  Closing: 730          │    │  │
│  │  │ Your Rank: 700  ━━━━━━━━●━  Near Edge  │    │  │
│  │  └────────────────────────────────────────┘    │  │
│  │                                                │  │
│  │  ... more results ...                          │  │
│  │                                                │  │
│  │  ⚠️ DISCLAIMER: Predictions based on 2025...   │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ HOW IT WORKS SECTION ────────────────────────┐   │
│  │  1️⃣ Enter Details  2️⃣ We Analyze  3️⃣ Results  │   │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ FAQ SECTION (Accordion) ─────────────────────┐   │
│  │  ▸ What data is this based on?                 │  │
│  │  ▸ How accurate are predictions?               │  │
│  │  ▸ What is UR/BC/EBC/SC/ST?                    │  │
│  │  ▸ What is RCG/DQ/SMQ?                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ FOOTER ──────────────────────────────────────┐   │
│  │  Made with ❤️  │  Disclaimer  │  Data: 2025    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 8.3 Colleges Page — `colleges/page.tsx`

- **Grid layout** of 23 college cards
- Each card shows: Institute name, Location, Available branches, Total seats
- **Search bar** to filter by name
- **Filter chips**: By branch type, by location
- Click → navigate to college detail page

### 8.4 College Detail — `colleges/[id]/page.tsx`

- **College header** with name, location, type
- **Branches offered** with individual cutoff tables
- **Cutoff visualization** — bar chart per category
- **Seat distribution** — donut chart (UR vs BC vs EBC vs SC etc.)
- **Shareable URL** for each college page

### 8.5 Cutoffs Page — `cutoffs/page.tsx`

- **Interactive filter panel**: Group, Category, Seat Type, Branch, Institute
- **Sortable data table** with all cutoff data
- **Export to CSV** button
- **Visual cutoff comparison** — compare 2 colleges side by side

---

## 9. SEO & Performance

### 9.1 SEO Implementation

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | BCECE College Predictor 2026',
    default: 'BCECE College Predictor 2026 — Find Your College by Rank',
  },
  description: 'Predict your college allotment for BCECE-JOINT 2026 based on 2025 cutoff data. Search by rank, category, branch across 23 Bihar colleges.',
  keywords: ['BCECE', 'BCECE 2026', 'college predictor', 'Bihar', 'BCECE cutoff', 
             'BCECE rank predictor', 'nursing college Bihar', 'BCECE allotment'],
  openGraph: {
    type: 'website',
    title: 'BCECE College Predictor 2026',
    description: 'Find which college you can get in BCECE 2026',
    siteName: 'BCECE Predictor',
    locale: 'en_IN',
  },
  robots: { index: true, follow: true },
};
```

### 9.2 Structured Data (JSON-LD)

```typescript
// Add to homepage
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BCECE College Predictor 2026",
  "description": "Predict BCECE-JOINT 2026 college allotments",
  "url": "https://bcece-predictor.vercel.app",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  }
};
```

### 9.3 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** | < 2.5s | Server Components, font preload, image optimization |
| **FID** | < 100ms | Minimal client JS, deferred non-critical scripts |
| **CLS** | < 0.1 | Fixed dimensions, skeleton loaders, font-display swap |
| **TTI** | < 3.5s | Code splitting, dynamic imports, tree shaking |
| **Bundle Size** | < 150KB (first load) | Analyze with `@next/bundle-analyzer` |

### 9.4 Performance Optimizations

```typescript
// 1. ISR for college pages (regenerate every hour)
export const revalidate = 3600;

// 2. Dynamic imports for heavy components
const CutoffChart = dynamic(() => import('@/components/charts/CutoffChart'), {
  loading: () => <Skeleton height={300} />,
  ssr: false,
});

// 3. Font optimization
// app/layout.tsx
import { Inter, Outfit } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

// 4. API Response Compression (built-in with Next.js on Vercel)

// 5. Database Query Optimization
// - Precomputed cutoffs table (no runtime aggregation)
// - Indexed columns for all filter queries
// - Connection pooling via Supabase Supavisor
```

---

## 10. Deployment & DevOps

### 10.1 Deployment Architecture

```
GitHub Repository
      │
      ▼ (push to main)
Vercel CI/CD Pipeline
      │
      ├── Build Next.js
      ├── Run Prisma Generate
      ├── Deploy to Edge Network
      │
      ▼
┌────────────────┐     ┌──────────────────┐
│ Vercel Edge    │────▶│ Supabase         │
│ (Frontend +   │     │ (PostgreSQL +    │
│  API Routes)  │     │  Connection Pool) │
└────────────────┘     └──────────────────┘
       │
       ▼
┌────────────────┐
│ Upstash Redis  │
│ (Rate Limiting │
│  + Caching)    │
└────────────────┘
```

### 10.2 Environment Variables

```env
# Supabase
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://[slug].upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX..."

# App
NEXT_PUBLIC_APP_URL="https://bcece-predictor.vercel.app"
NODE_ENV="production"
```

### 10.3 CI/CD Pipeline

```
# Vercel auto-deploys from GitHub, but we add:

# 1. Pre-deploy: Prisma migrations
# 2. Post-deploy: Seed data (only on first deploy)
# 3. Preview deployments for PRs
# 4. Branch protection on main
```

---

## 11. Development Phases & Timeline

### Phase 1: Foundation (Days 1-2)

- [x] Analyze dataset & create roadmap
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase project (Mumbai region)
- [ ] Create Prisma schema & run migrations
- [ ] Build CSV parser & seed script
- [ ] Seed database with 2025 data
- [ ] Verify data integrity with test queries

### Phase 2: Backend & API (Days 3-4)

- [ ] Implement Prisma client singleton
- [ ] Build `/api/predict` route with full algorithm
- [ ] Build `/api/colleges`, `/api/cutoffs`, `/api/stats` routes
- [ ] Add Zod validation for all API inputs
- [ ] Implement rate limiting (Upstash or in-memory)
- [ ] Add response caching layer
- [ ] Write API tests

### Phase 3: Design System & Layout (Day 5)

- [ ] Set up global CSS design system (colors, typography, spacing)
- [ ] Import Google Fonts (Inter + Outfit)
- [ ] Build core UI components (Button, Card, Input, Select, Badge)
- [ ] Build layout components (Header, Footer, Container)
- [ ] Implement responsive grid system
- [ ] Set up Framer Motion animation variants

### Phase 4: Predictor Page (Days 6-7)

- [ ] Build Hero section with animated counters
- [ ] Build PredictorForm with multi-step UX
- [ ] Build ResultCard with chance indicators
- [ ] Build ResultsList with sorting & filtering
- [ ] Add rank range visualization (progress bar)
- [ ] Add loading skeletons
- [ ] Build "How It Works" section
- [ ] Build FAQ accordion
- [ ] Add disclaimer banner

### Phase 5: College & Cutoff Pages (Days 8-9)

- [ ] Build Colleges grid page
- [ ] Build College Detail page with cutoff tables
- [ ] Build Cutoff Explorer with filters
- [ ] Add Recharts visualizations (bar chart, donut chart)
- [ ] Implement search & filter functionality
- [ ] Add dynamic meta tags for each page

### Phase 6: Polish & Optimize (Day 10)

- [ ] Add micro-animations throughout
- [ ] Cross-device testing (mobile, tablet, desktop)
- [ ] Lighthouse audit → fix issues
- [ ] Add error boundaries & 404 page
- [ ] Add sitemap.xml & robots.txt
- [ ] Add OpenGraph images
- [ ] Final performance optimization
- [ ] Deploy to Vercel production

---

## 12. Testing Strategy

### 12.1 Unit Tests

```
- Rank parsing logic (parseRank function)
- Prediction algorithm (chance calculation)
- API input validation (Zod schemas)
- Cutoff computation (opening/closing ranks)
```

### 12.2 Integration Tests

```
- API endpoints return correct data shape
- Rate limiter blocks after threshold
- Database queries return expected results
- Seed script correctly populates all tables
```

### 12.3 E2E Tests (Manual Checklist)

```
- [ ] Enter valid rank → see predictions
- [ ] Enter invalid rank → see validation error
- [ ] Filter by branch → results update
- [ ] Mobile view → form is usable
- [ ] Rate limit → see 429 error message
- [ ] College page → cutoff table loads
- [ ] Cutoff filter → table updates
- [ ] Navigate back/forward → state preserved
```

### 12.4 Browser Testing Matrix

| Browser | Mobile | Desktop |
|---------|--------|---------|
| Chrome | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Firefox | - | ✅ |
| Edge | - | ✅ |
| Samsung Internet | ✅ | - |

---

## 📝 Notes

> **ℹ️ NOTE:**
> - **No authentication required** — fully public, read-only website
> - **Data is static** — seeded once from 2025 CSV, no runtime data ingestion
> - **Privacy** — student names/roll numbers from the dataset are NOT exposed in the UI; only aggregate cutoff data is used for predictions
> - This project uses the **1st Round** data only; if 2nd round data becomes available, the seed script can be re-run

> **⚠️ WARNING:**  
> **Legal Disclaimer**: This is an **unofficial** tool. It is not affiliated with BCECE Board. All data is sourced from publicly available allotment lists. Predictions are approximations and should not be considered official counseling advice.

---

*Built with ❤️ for Bihar's students*
