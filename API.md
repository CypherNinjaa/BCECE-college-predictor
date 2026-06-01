# API Documentation

## Overview

The BCECE College Predictor exposes RESTful API routes under `/src/app/api/` using Next.js App Router. All API endpoints return JSON responses with a consistent structure.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // endpoint-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {} // optional, validation details
}
```

### Rate Limit Headers (AI Endpoints Only)
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds until reset (when rate limited)

## Endpoints

### Prediction API (`/api/predict`)

**Method**: `POST`

**Description**: Generate college predictions based on user rank, category, and preferences.

#### Request Schema
```typescript
{
  subGroup?: "PCM" | "PCB" | "PCMB"; // Optional subject combination
  category: "UR" | "BC" | "EBC" | "SC" | "ST"; // Social category
  rankType: "PCM" | "PCB"; // Rank type to use for prediction
  rankSubCategory: "UR" | "CAT" | "RCG" | "DQ" | "SMQ"; // Rank sub-category
  rankValue: number; // Numeric rank value (positive integer)
  branches?: string[]; // Optional array of branch IDs to filter by
  institutes?: string[]; // Optional array of institute IDs to filter by
}
```

#### Validation Rules
- All fields except `subGroup`, `branches`, and `institutes` are required
- `rankValue` must be a positive integer
- `subGroup` defaults to null if not provided (considers all branches)
- Empty arrays for `branches`/`institutes` are ignored

#### Response Schema
```typescript
{
  success: true;
  data: {
    predictions: Array<{
      id: string;
      institute: {
        id: string;
        name: string;
        shortName: string;
        location?: string;
        type?: string;
      };
      branch: {
        id: string;
        name: string;
        fullName?: string;
      };
      openingRank: number;
      closingRank: number;
      totalSeats: number;
      allottedCategory: string;
      seatType: string;
      chanceLevel: "HIGH" | "MODERATE" | "LOW";
      chancePercentage: number; // 5-99
    }>;
    totalMatches: number;
    disclaimer: string;
  };
}
```

#### Chance Level Calculation
- **HIGH**: `rankValue ≤ openingRank` → 90-99% chance
- **MODERATE**: `openingRank < rankValue ≤ closingRank` → 40-89% chance
- **LOW**: `closingRank < rankValue ≤ closingRank × 1.10` → 10-39% chance
- Excluded: `rankValue > closingRank × 1.10`

#### Error Responses
- `400 Bad Request`: Invalid request data (validation fails)
- `500 Internal Server Error`: Unexpected server error

#### Example Request
```json
{
  "category": "UR",
  "rankType": "PCM",
  "rankSubCategory": "UR",
  "rankValue": 1000,
  "branches": ["branch-id-1", "branch-id-2"],
  "institutes": ["institute-id-1"]
}
```

#### Example Response
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

### AI Prediction API (`/api/predict/ai`)

**Method**: `POST`

**Description**: Generate AI-powered counseling advice using Groq LLM with historical data context.

#### Request Schema
```typescript
{
  subGroup?: "PCM" | "PCB" | "PCMB"; // Optional subject combination
  category: "UR" | "BC" | "EBC" | "SC" | "ST"; // Social category
  rankType: "PCM" | "PCB"; // Rank type to use for prediction
  rankSubCategory: "UR" | "CAT" | "RCG" | "DQ" | "SMQ"; // Rank sub-category
  rankValue: number; // Numeric rank value (positive integer)
  predictions: Array<any>; // Standard prediction results (from /api/predict)
}
```

#### Validation Rules
- Same as prediction API plus:
- `predictions` must be an array (validated but not deeply inspected)

#### Rate Limiting
- Limit: 3 requests per minute per IP address
- Window: 60 seconds
- Headers: Standard rate limit headers included in response
- 429 Too Many Requests when limit exceeded

#### Browser Origin Validation
- Requests must originate from allowed domains:
  - `http://localhost:3000` (development)
  - `http://localhost:3001` (alternative development)
  - `https://bcece-predictor.vercel.app` (production)
  - `https://studywithritesh.in` and subdomains
  - `https://predictor-swr.vercel.app` (alternative production)
- Same-origin requests always allowed
- Development mode bypasses origin validation

#### Response Schema
```typescript
{
  success: true;
  data: {
    profileAnalysis: string; // Markdown formatted analysis (3-5 sentences)
    choiceFillingList: Array<{
      priority: number; // 1-based priority ranking
      institute: string; // Short institute name
      branch: string; // Full branch name
      reason: string; // One-line factual reason
    }>;
    counselingTips: Array<string>; // 3-5 actionable tips
  };
  fallback?: boolean; // true if using local fallback
  fromCache?: boolean; // true if served from Redis cache
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: number; // timestamp
  };
}
```

#### Fallback Response (when Groq API unavailable)
Same structure as above with:
- `fallback: true`
- Locally generated advice based on historical data
- Standard counseling tips

#### Error Responses
- `400 Bad Request`: Invalid request data
- `403 Forbidden`: Invalid browser origin (non-browser access)
- `429 Too Many Requests`: Rate limit exceeded (includes retry-after header)
- `500 Internal Server Error`: Unexpected server error

#### Example Request
```json
{
  "category": "BC",
  "rankType": "PCM",
  "rankSubCategory": "CAT",
  "rankValue": 1500,
  "predictions": [/* array from /api/predict response */]
}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "profileAnalysis": "### Profile Analysis\nBased on your **PCM Rank 1500** under the **BC** category, you have moderate chances for admission in several government colleges. Your rank falls within the competitive range for branches like Civil and Mechanical Engineering in top government institutions.\n\n### Recommendations\nFocus on colleges with closing ranks between 1400-1600 for BC category. Consider both GENERAL SEAT and FEMALE SEAT options based on your eligibility.",
    "choiceFillingList": [
      {
        "priority": 1,
        "institute": "GEC",
        "branch": "Civil Engineering",
        "reason": "Historical closing cutoff is 1480 for BC category. Stable option for your profile."
      },
      {
        "priority": 2,
        "institute": "BCE",
        "branch": "Mechanical Engineering",
        "reason": "Closing rank of 1520 provides moderate chance with good placement records."
      }
    ],
    "counselingTips": [
      "Keep all documents ready: BCECE Admit Card, Rank Card, 10th/12th Marks sheets, Category Certificate, Domicile certificate.",
      "List Government colleges above Self-Finance/Private colleges in choice filling to secure lower fee structure.",
      "Submit choices within the specified registration window. Late submissions are not accepted."
    ]
  },
  "rateLimit": {
    "limit": 3,
    "remaining": 2,
    "resetAt": 1717023600000
  }
}
```

### Colleges API (`/api/colleges`)

**Method**: `GET`

**Description**: Retrieve list of all colleges/institutes.

#### Response Schema
```typescript
{
  success: true;
  data: Array<{
    id: string;
    name: string;
    shortName?: string;
    location?: string;
    type?: string;
    createdAt: string; // ISO date string
  }>;
}
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "institute-id-1",
      "name": "Government Engineering College",
      "shortName": "GEC",
      "location": "Patna",
      "type": "Government",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### College Details API (`/api/colleges/[id]`)

**Method**: `GET`

**Description**: Retrieve detailed information about a specific college.

#### Path Parameters
- `id`: College ID (string)

#### Response Schema
```typescript
{
  success: true;
  data: {
    id: string;
    name: string;
    shortName?: string;
    location?: string;
    type?: string;
    createdAt: string; // ISO date string
    branches: Array<{
      id: string;
      name: string;
      fullName?: string;
      group: string; // PCM | PCB | BOTH
      createdAt: string;
    }>;
  };
}
```

#### Error Responses
- `404 Not Found`: College with specified ID not found
- `500 Internal Server Error`: Unexpected server error

### Branches API (`/api/branches`)

**Method**: `GET`

**Description**: Retrieve list of all academic branches/programs.

#### Response Schema
```typescript
{
  success: true;
  data: Array<{
    id: string;
    name: string;
    fullName?: string;
    group: string; // PCM | PCB | BOTH
    createdAt: string; // ISO date string
  }>;
}
```

### Cutoffs API (`/api/cutoffs`)

**Method**: `GET`

**Description**: Retrieve cutoff data with optional filtering.

#### Query Parameters
- `instituteId`: Filter by institute ID (optional)
- `branchId`: Filter by branch ID (optional)
- `allotmentGroup`: Filter by group (PCM | PCB) (optional)
- `allottedCat`: Filter by category (optional)
- `seatType`: Filter by seat type (optional)
- `year`: Filter by year (optional, default 2025)
- `round`: Filter by round (optional, default 1)

#### Response Schema
```typescript
{
  success: true;
  data: Array<{
    id: string;
    instituteId: string;
    branchId: string;
    allotmentGroup: string;
    allottedCat: string;
    seatType: string;
    openingRank: number;
    closingRank: number;
    totalSeats: number;
    year: number;
    round: number;
  }>;
}
```

### Statistics API (`/api/stats`)

**Method**: `GET`

**Description**: Get overall statistics about the dataset.

#### Response Schema
```typescript
{
  success: true;
  data: {
    totalInstitutes: number;
    totalBranches: number;
    totalAllotments: number;
    totalCutoffs: number;
    yearRange: {
      min: number;
      max: number;
    };
    rounds: number[];
  };
}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "totalInstitutes": 45,
    "totalBranches": 12,
    "totalAllotments": 8420,
    "totalCutoffs": 540,
    "yearRange": {
      "min": 2025,
      "max": 2025
    },
    "rounds": [1]
  }
}
```

## Security Considerations

### Input Validation
- All API endpoints use Zod schemas for request validation
- Prevents injection attacks and malformed data
- Specific validation rules per endpoint as documented

### Rate Limiting
- AI endpoints protected by Upstash Redis rate limiting
- 3 requests per minute per IP to prevent abuse
- Graceful degradation when Redis unavailable

### Browser Origin Validation
- AI endpoints validate requests originate from allowed domains
- Prevents direct API abuse and unauthorized programmatic access
- Development mode allows all origins for convenience

### Error Handling
- Consistent error response format
- Stack traces never exposed to clients
- Generic error messages prevent information leakage
- Specific validation errors include field-level details

## Performance Characteristics

### Prediction API (`/api/predict`)
- Average response time: 100-300ms (cached cutoffs)
- Database query uses indexed fields for efficient filtering
- Results sorted in application memory after DB fetch
- Scales linearly with matching cutoff records

### AI Prediction API (`/api/predict/ai`)
- Average response time: 2-5 seconds (with Groq API)
- Rate limited to 3 requests/minute per IP
- Redis caching reduces repeated requests to milliseconds
- CSV parsing adds ~100ms overhead for historical context
- Fallback to local advice ensures availability during API outages

### Caching Strategy
- Cutoff data: Relies on database indexing (infrequent changes)
- AI responses: Redis cached for 24 hours (identical requests)
- CSV data: Loaded on demand with file system caching
- Static assets: Handled by Next.js/Vercel CDN

## Versioning
- Current API version: implicit v1 (no versioning in path)
- Breaking changes would require new endpoint paths
- Backward compatibility maintained within same endpoint
- Schema changes documented in release notes