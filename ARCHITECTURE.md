# System Architecture

## High-Level Architecture Diagram (ASCII)

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   User Browser  │    │   Vercel Edge    │    │   Supabase DB      │
│ (Next.js App)   │◄──►│   (API Routes)   │◄──►│ (PostgreSQL + Prisma)│
└─────────────────┘    └──────────────────┘    └────────────────────┘
          │                         ▲                      │
          │                         │                      │
          ▼                         │                      ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   Redis Cache   │    │   Groq AI API    │    │   CSV Data Files   │
│ (Upstash)       │◄──►│   (LLM Service)  │    │   (Static Assets)  │
└─────────────────┘    └──────────────────┘    └────────────────────┘
```

## Data Flow

1. **User Interaction**: User accesses the application through a web browser
2. **Frontend Processing**: Next.js App Router handles routing and UI rendering
3. **API Layer**: Client requests are processed by API routes in `/src/app/api/`
4. **Data Access**: 
   - Primary data: Supabase PostgreSQL via Prisma ORM
   - Caching: Upstash Redis (optional)
   - Static data: Local CSV files for historical allotment verification
5. **AI Processing**: Groq API provides intelligent counseling recommendations
6. **Response**: Data flows back through the same layers to the user

## Request Lifecycle

### Standard Prediction Request (`/api/predict`)
1. User submits rank, category, and preferences via frontend form
2. Request validated by `predictRequestSchema` (Zod validation)
3. Eligibility logic determines valid seat categories based on rules:
   - Everyone can compete for UR seats
   - Category-based eligibility (BC, EBC, SC, ST)
   - UR candidates can compete for EWS
   - Special categories (RCG, DQ, SMQ) add eligibility
4. Database query filters Cutoff records based on:
   - Eligible categories
   - Seat type (GENERAL SEAT or FEMALE SEAT)
   - Group restrictions (PCM/PCB with branch exceptions)
   - Optional branch/institute filters
   - Rank thresholds (closingRank >= rankValue / 1.10)
5. Results processed to calculate chance levels:
   - HIGH: rankValue ≤ openingRank (90-99% chance)
   - MODERATE: openingRank < rankValue ≤ closingRank (40-89% chance)
   - LOW: closingRank < rankValue ≤ closingRank × 1.10 (10-39% chance)
6. Predictions sorted by chance level (HIGH→MODERATE→LOW) then by closingRank
7. Response includes disclaimer about prediction limitations

### AI Prediction Request (`/api/predict/ai`)
1. Browser origin validation prevents non-browser API access
2. Rate limiting: 3 requests per minute per IP (Upstash Redis)
3. Request validation via Zod schema
4. Cache lookup: 24-hour TTL for identical requests
5. CSV analysis: Historical allotment verification from local files
6. Groq API call with:
   - System prompt enforcing JSON-only response
   - Context from database cutoff matches
   - Context from historical CSV allotments
   - Strict formatting requirements to prevent hallucination
7. Response normalization and emoji stripping
8. Result caching in Redis
9. Fallback to local advice generator on API failures

## Key Architectural Decisions

### Next.js 16 App Router
- Chosen for improved performance and routing capabilities
- Server Components reduce client-side JavaScript
- Built-in routing eliminates need for external router

### Supabase PostgreSQL
- Provides managed PostgreSQL with generous free tier
- Real-time capabilities available for future features
- Built-in authentication (though not currently used)

### Prisma ORM
- Type-safe database access
- Automatic migration generation
- Reduces boilerplate SQL queries

### Upstash Redis (Optional)
- Serverless Redis compatible with Vercel edge functions
- Used for rate limiting and AI response caching
- Graceful degradation when not configured

### Groq AI Integration
- Fast LLM inference for counseling recommendations
- Structured output via JSON mode prevents parsing issues
- Temperature control (0.2) ensures consistent, factual responses

### Security Measures
- Browser origin validation prevents direct API abuse
- Rate limiting protects AI service quotas
- Input validation prevents injection attacks
- Environment variable protection for API keys