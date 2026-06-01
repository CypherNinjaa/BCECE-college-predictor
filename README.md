# BCECE College Predictor 2026

A comprehensive college prediction and counseling assistant for BCECE (Bihar Combined Entrance Competitive Examination) aspirants. This application helps students predict their chances of admission to various engineering and pharmacy colleges in Bihar based on their rank, category, and preferences.

![BCECE College Predictor Homepage](./homepage_screenshot.png)

## Features

- **Rank-Based Predictions**: Calculate admission chances based on historical cutoff data
- **AI-Powered Counseling**: Get personalized advice from Groq's LLM for college selection
- **Category-wise Filtering**: Support for all BCECE categories (UR, BC, EBC, SC, ST)
- **Branch & Institute Selection**: Filter predictions by preferred branches and institutes
- **Chance Level Classification**: HIGH/MODERATE/LOW admission probability with percentage estimates
- **Historical Data Analysis**: Access to real BCECE 2025 allotment records for verification
- **Rate Limiting & Security**: Protected API endpoints with browser validation and rate limiting
- **Responsive Design**: Mobile-friendly interface for on-the-go counseling
- **Vercel Deployed**: Easy deployment and scaling with Vercel platform

## Technology Stack

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Next.js 16** (App Router) | Frontend framework | Improved performance, server components, built-in routing |
| **TypeScript** | Type safety | Catch errors at compile time, better developer experience |
| **Supabase PostgreSQL** | Database | Managed PostgreSQL with generous free tier, easy setup |
| **Prisma ORM** | Database access | Type-safe queries, automatic migration generation |
| **Groq AI** | Counseling recommendations | Fast LLM inference, structured JSON output |
| **Tailwind CSS** | Styling | Utility-first CSS, rapid UI development |
| **Vercel** | Deployment | Seamless Next.js integration, global CDN, serverless functions |
| **Upstash Redis** (Optional) | Caching & rate limiting | Serverless Redis, compatible with Vercel edge functions |

## Installation

### Prerequisites
- Node.js >= 18.x
- npm or pnpm
- Git
- Supabase account
- Groq API key
- Upstash Redis account (optional but recommended for rate limiting)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bcece-college-predictor.git
   cd bcece-college-predictor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database Connection (Supabase)
   POSTGRES_URL=postgresql://user:pass@host.db.supabase.co:5432/postgres
   POSTGRES_PRISMA_URL=postgresql://user:pass@host.db.supabase.co:5432/postgres
   POSTGRES_URL_NON_POOLING=postgresql://user:pass@host.db.supabase.co:5433/postgres
   POSTGRES_USER=postgres
   POSTGRES_HOST=db.supabase.co
   POSTGRES_PASSWORD=your-password
   POSTGRES_DATABASE=postgres
   
   # AI Services
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
   
   # Optional: Redis for rate limiting and caching
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   # Push Prisma schema to Supabase
   npx prisma db push
   
   # Generate Prisma client
   npx prisma generate
   
   # Optional: Seed with initial data
   npx tsx prisma/seed.ts
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | Supabase PostgreSQL connection string | Yes |
| `POSTGRES_PRISMA_URL` | Prisma-specific PostgreSQL URL | Yes |
| `POSTGRES_URL_NON_POOLING` | Non-pooled connection for migrations | Yes |
| `POSTGRES_USER` | Database username | Yes |
| `POSTGRES_HOST` | Database host | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `POSTGRES_DATABASE` | Database name | Yes |
| `GROQ_API_KEY` | Groq API key for AI predictions | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | No (recommended) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | No (recommended) |
| `NEXT_PUBLIC_APP_URL` | Application URL for absolute paths | No |
| `NODE_ENV` | Environment mode (development/production) | No |

## Database Setup

### Supabase Configuration
1. Create a new project at [supabase.com](https://supabase.com)
2. Note your database credentials from Settings → Database
3. Add the connection string to your `.env.local` file:
   ```
   POSTGRES_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
   ```

### Prisma Schema
The application uses the following core models:
- **Institute**: Educational institutions participating in BCECE
- **Branch**: Academic programs offered by institutes
- **Allotment**: Historical seat allotments (anonymized)
- **Cutoff**: Precomputed cutoff data for fast predictions

### Migrations
To update the database schema:
```bash
# Create a new migration
npx prisma migrate dev --name description

# Apply to database
npx prisma migrate dev

# Push changes directly (for development)
npx prisma db push
```

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables (see above)

# Initialize database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

   Follow the prompts to link your project and configure environment variables.

### Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in Vercel Dashboard
3. Configure environment variables in project settings
4. Vercel will automatically deploy on pushes to main branch

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. Deploy the `.next` output directory to your preferred hosting provider

## API Documentation

### Prediction Endpoint (`/api/predict`)
**Method**: `POST`

Generate college predictions based on user inputs.

**Request Body**:
```json
{
  "subGroup": "PCM",
  "category": "UR",
  "rankType": "PCM",
  "rankSubCategory": "UR",
  "rankValue": 1000,
  "branches": ["branch-id-1"],
  "institutes": ["institute-id-1"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "cutoff-id-1",
        "institute": {
          "id": "institute-id-1",
          "name": "Government Engineering College",
          "shortName": "GEC",
          "location": "Patna",
          "type": "Government"
        },
        "branch": {
          "id": "branch-id-1",
          "name": "CSE",
          "fullName": "Computer Science Engineering"
        },
        "openingRank": 850,
        "closingRank": 1200,
        "totalSeats": 50,
        "allottedCategory": "UR",
        "seatType": "GENERAL SEAT",
        "chanceLevel": "MODERATE",
        "chancePercentage": 65
      }
    ],
    "totalMatches": 1,
    "disclaimer": "Predictions are based on BCECE 2025 Round-1 allotment data. Actual 2026 cutoffs may vary based on number of applicants, seat changes, reservation policy updates, and other factors. Use this tool for guidance only — it does not guarantee admission."
  }
}
```

### AI Prediction Endpoint (`/api/predict/ai`)
**Method**: `POST`

Get AI-powered counseling advice using Groq LLM.

**Rate Limits**: 3 requests per minute per IP address

**Request Body** (same as prediction endpoint plus):
```json
{
  "predictions": [/* response from /api/predict */]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "profileAnalysis": "### Profile Analysis\nBased on your PCM Rank 1000 under UR category...",
    "choiceFillingList": [
      {
        "priority": 1,
        "institute": "GEC",
        "branch": "Computer Science Engineering",
        "reason": "Historical closing cutoff is 950 for UR category."
      }
    ],
    "counselingTips": [
      "Keep all documents ready: BCECE Admit Card, Rank Card, 10th/12th Marks sheets...",
      "List Government colleges above Self-Finance/Private colleges in choice filling...",
      "Submit choices within the specified registration window..."
    ]
  },
  "rateLimit": {
    "limit": 3,
    "remaining": 2,
    "resetAt": 1717023600000
  }
}
```

See [API.md](./API.md) for complete API documentation.

## Prediction Engine

### How Cutoffs Are Calculated
The prediction engine uses historical allotment data to determine:

1. **Opening Rank**: The best (lowest) rank that received an allotment in a specific institute/branch/category/seat combination
2. **Closing Rank**: The worst (highest) rank that received an allotment in the same combination
3. **Total Seats**: The number of allotments made in that combination

### Chance Level Classification
Based on user rank compared to historical cutoffs:

- **HIGH Chance** (90-99%): User rank ≤ Opening Rank
  - Formula: `chancePercentage = 90 + 9 * (openingRank - userRank) / openingRank`
  
- **MODERATE Chance** (40-89%): Opening Rank < User rank ≤ Closing Rank
  - Formula: `chancePercentage = 40 + 49 * (closingRank - userRank) / (closingRank - openingRank)`
  
- **LOW Chance** (10-39%): Closing Rank < User rank ≤ Closing Rank × 1.10
  - Formula: `chancePercentage = 10 + 29 * (closingRank × 1.10 - userRank) / (closingRank × 0.10)`
  
- **EXCLUDED**: User rank > Closing Rank × 1.10 (less than 10% chance)

### Safe/Likely/Borderline Classification
The application uses these chance levels to provide guidance:
- **HIGH (90-99%)**: Safe choice - very likely to get admission
- **MODERATE (40-89%)**: Likely choice - reasonable chance with competition
- **LOW (10-39%)**: Borderline choice - possible but uncertain

## AI Prediction Mode

### Architecture
The AI prediction mode follows this flow:
1. Browser origin validation → Rate limiting → Request validation
2. Redis cache lookup → Historical CSV analysis → Database context gathering
3. Prompt construction → Groq API call → Response normalization
4. Response caching → Return to user

### Features
- **Context Grounding**: Uses both database cutoff matches and historical CSV data
- **Hallucination Prevention**: Strict system prompt prohibits fabricating information
- **JSON-Mode Responses**: Ensures valid, parseable responses from LLM
- **Fallback Mechanism**: Local advice generator if Groq API is unavailable
- **Rate Limiting**: Protects API quotas with 3 requests/minute/IP limit
- **Browser Validation**: Prevents direct API abuse
- **Caching**: 24-hour TTL for identical requests in Redis

### Prompt Engineering
The system prompt enforces:
- JSON-only response format
- No emojis or extraneous text
- Professional, concise counseling advice (3-5 sentences per section)
- Use of only provided data (no external knowledge)
- Clear statement when data is insufficient
- Objective, unbiased recommendations

See [AI_MODE.md](./AI_MODE.md) for detailed architecture and implementation.

## Caching Layer

### Redis Usage
When configured with Upstash Redis, the application uses caching for:

1. **Rate Limiting**: Tracking requests per IP address (3/minute)
2. **AI Response Caching**: Storing AI counseling advice for 24 hours
3. **Cache Keys**: 
   - Rate limit: `rate-limit:ai-predict:{ip-address}`
   - AI responses: `swr:ai:cache:{subGroup}:{category}:{rankType}:{rankSubCategory}:{rankValue}`

### Performance Benefits
- **Cache Hits**: 50-150ms response time
- **Cache Misses**: 2,000-5,000ms (includes Groq API latency)
- **Rate Limiting Protection**: Prevents API quota exhaustion
- **Graceful Degradation**: Functions normally when Redis is unavailable

## Security

### API Abuse Prevention
- **Browser Origin Validation**: Requests must originate from whitelisted domains
- **Rate Limiting**: 3 AI requests per minute per IP address
- **Input Validation**: Zod schemas validate all API inputs
- **Error Handling**: Generic error messages prevent information leakage

### Data Protection
- **SQL Injection Protection**: Prisma ORM uses parameterized queries
- **Environment Variable Security**: API keys stored securely in Vercel
- **Historical Data Anonymization**: Allotment data contains no personal identifiers
- **Secure Headers**: Next.js provides built-in security headers

### Deployment Security
- **Vercel Environment Variables**: Encrypted storage for secrets
- **GitHub Secrets**: For CI/CD pipelines if used
- **Dependency Scanning**: Regular npm audit checks

## Monitoring & Maintenance

### Logging
- **Development**: Detailed console logs with stack traces
- **Production**: Error logging only (no stack traces exposed)
- **Vercel Logs**: Accessible via Vercel Dashboard

### Analytics
- **Built-in**: Next.js analytics via Vercel
- **Custom**: Application logs key events (predictions, AI requests)
- **Database Stats**: `/api/stats` endpoint provides dataset metrics

### Error Tracking
- **Console Errors**: Captured in development
- **Production Errors**: Logged to console in Vercel
- **User Feedback**: Manual reporting through issue tracker

### Backup Strategy
- **Database**: Supabase provides automated backups
- **Configuration**: Environment variables backed up in Vercel
- **Code**: Git repository serves as primary backup
- **Manual**: `pg_dump` available for custom backups

## Future Roadmap

### Planned Enhancements
1. **AI Counsellor**: Interactive chatbot for personalized guidance
2. **Choice Filling Assistant**: Optimized preference list generation based on rank and preferences
3. **Multi-Year Trend Analysis**: Historical cutoff trends for better predictions
4. **Cutoff Prediction**: ML-based forecasting of 2026 cutoffs
5. **Student Dashboard**: Personalized tracking of predictions and choices
6. **Multi-Language Support**: Hindi and other regional languages
7. **Offline Mode**: PWA capabilities for limited connectivity areas

### Technical Improvements
1. **Vector Embeddings**: Semantic search using Supabase pgvector
2. **WebSocket Integration**: Real-time updates during counseling season
3. **Progressive Web App**: Installable mobile experience
4. **Analytics Dashboard**: Admin view of usage patterns
5. **Accessibility Improvements**: WCAG 2.1 compliance enhancements

## Contributing

We welcome contributions to improve the BCECE College Predictor! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows:
- TypeScript best practices
- Existing code style and conventions
- Includes appropriate tests
- Updates documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- BCECE Examination Board for providing historical data
- Supabase for managed PostgreSQL hosting
- Vercel for seamless Next.js deployment
- Groq for fast LLM inference
- The open-source community for various libraries and tools

---

*Made with ❤️ for BCECE aspirants in Bihar*