# Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the BCECE College Predictor application to various environments, with primary focus on Vercel deployment as specified in the project requirements.

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** >= 18.x installed
2. **npm** or **pnpm** package manager
3. **Git** for version control
4. **Vercel account** (for Vercel deployment)
5. **Supabase account** (for database)
6. **Groq API key** (for AI predictions)
7. **Upstash Redis account** (optional, for rate limiting and caching)

## Environment Variables

The following environment variables are required for the application to function properly:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `POSTGRES_URL` | Supabase PostgreSQL connection string | Yes | `postgresql://user:pass@host.db.supabase.co:5432/postgres` |
| `POSTGRES_PRISMA_URL` | Prisma-specific PostgreSQL URL | Yes | Same as POSTGRES_URL |
| `POSTGRES_URL_NON_POOLING` | Non-pooled connection for migrations | Yes | Same as POSTGRES_URL with `:5433` port |
| `POSTGRES_USER` | Database username | Yes | `postgres` |
| `POSTGRES_HOST` | Database host | Yes | `db.supabase.co` |
| `POSTGRES_PASSWORD` | Database password | Yes | `your-password` |
| `POSTGRES_DATABASE` | Database name | Yes | `postgres` |
| `GROQ_API_KEY` | Groq API key for AI predictions | Yes | `gsk_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (optional) | No | `https://your-redis-url.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (optional) | No | `your-token` |
| `NEXT_PUBLIC_APP_URL` | Application URL for absolute paths | No | `https://bcece-predictor.vercel.app` |
| `NODE_ENV` | Environment mode | No | `production` |

### Setting Up Environment Variables

#### Local Development
Create a `.env.local` file in the root directory:
```env
POSTGRES_URL=postgresql://user:pass@host.db.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://user:pass@host.db.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host.db.supabase.co:5433/postgres
POSTGRES_USER=postgres
POSTGRES_HOST=db.supabase.co
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=postgres
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### Vercel Deployment
Add environment variables in Vercel Dashboard:
1. Go to your project Settings → Environment Variables
2. Add each variable with its value
3. Ensure they are set for Preview and Production environments

## Local Development Setup

### Step 1: Install Dependencies
```bash
npm install
# or
pnpm install
```

### Step 2: Set Up Database
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Obtain your database connection settings
3. Add them to your `.env.local` file
4. Push Prisma schema to Supabase:
```bash
npx prisma db push
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Seed Database (Optional)
```bash
npx tsx prisma/seed.ts
```

### Step 5: Start Development Server
```bash
npm run dev
# or
pnpm dev
```

Application will be available at `http://localhost:3000`

## Production Deployment (Vercel)

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from project root:
```bash
vercel
```

4. Follow prompts to:
   - Link to existing project or create new
   - Configure environment variables
   - Confirm deployment

### Option 2: Git Integration

1. Push code to GitHub/GitLab/Bitbucket
2. Import repository in Vercel Dashboard
3. Configure environment variables in project settings
4. Vercel will automatically deploy on pushes to main branch

### Option 3: Vercel Web Interface

1. Go to vercel.com/new
2. Import your Git repository
3. Configure build settings (should auto-detect Next.js)
4. Add environment variables
5. Click Deploy

## Build Process

Vercel automatically runs the following build steps:

1. **Installation**: `npm install` or `pnpm install`
2. **Prisma Generation**: `npx prisma generate`
3. **Build**: `next build`
4. **Output**: Optimized Next.js application ready for serving

### Manual Build (for debugging)
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build Next.js application
npm run build
# or
pnpm build
```

## Database Migrations

When making changes to the Prisma schema:

### Development
```bash
# Create migration file
npx prisma migrate dev --name description

# Apply to database
npx prisma migrate dev
```

### Production
```bash
# Push schema changes (recommended for simple changes)
npx prisma db push

# Or use migrations
npx prisma migrate deploy
```

## Health Checks

The application provides several endpoints for monitoring:

- **Health Check**: `GET /api/health` (create if needed)
- **Statistics**: `GET /api/stats` returns database metrics
- **Rate Limit Status**: `GET /api/predict/ai` returns current rate limit status

## Troubleshooting

### Common Deployment Issues

#### 1. Database Connection Errors
- Verify `POSTGRES_URL` is correct
- Ensure Supabase project is active
- Check IP allowlist in Supabase (if enabled)
- Test connection with `psql` or similar tool

#### 2. Prisma Generation Failures
- Run `npx prisma generate` manually to see errors
- Ensure `@prisma/client` version matches schema
- Check TypeScript compatibility

#### 3. AI Prediction Failures
- Verify `GROQ_API_KEY` is valid
- Check rate limits on Groq API
- Ensure network allows outbound calls to api.groq.com
- Check logs for specific error messages

#### 4. Redis Connection Issues (if configured)
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check Upstash service status
- Application degrades gracefully if Redis unavailable

### Logging

- Application logs accessible via Vercel Dashboard → Logs
- Error logging to console with stack traces in development
- Production logs limited to error messages (no stack traces)
- Consider integrating with external logging service for production

## Backup and Recovery

### Database Backups
- Supabase provides automated backups
- Enable point-in-time recovery in Supabase settings
- Consider manual backups via `pg_dump` for critical data

### Configuration Backup
- Keep `.env.example` with required variables (values omitted)
- Document any custom Vercel settings
- Maintain version-controlled infrastructure-as-code if applicable

## Scaling Considerations

### Vertical Scaling
- Vercel automatically scales serverless functions
- Monitor function execution time and memory usage
- Database connection pooling managed by Prisma/Supabase

### Horizontal Scaling
- Multi-region deployment available on Vercel Enterprise
- Database read replicas available in Supabase
- Cache layer (Redis) helps reduce database load

### Performance Optimization
- Enable Vercel Edge Config for feature flags
- Use Vercel Image Optimization for assets
- Consider CDN caching for static assets
- Monitor API response times and optimize slow queries

## Rollback Procedures

### Vercel Deployments
- Vercel keeps history of all deployments
- Rollback to previous deployment via Dashboard
- CLI command: `vercel rollback [deployment-id]`

### Database Changes
- Prisma migrations are tracked and can be reverted
- Backup database before major schema changes
- Test migrations in staging environment first

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel's encrypted environment variable storage
- Rotate API keys periodically

### Dependencies
- Regularly update dependencies: `npm update` or `pnpm update`
- Monitor for security vulnerabilities with `npm audit`
- Keep Node.js version current

### Application Security
- Input validation on all API endpoints
- Rate limiting on AI endpoints
- Browser origin validation prevents API abuse
- Helmet.js equivalent via Next.js headers