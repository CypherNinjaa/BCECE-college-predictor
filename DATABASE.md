# Database Documentation

## Entity Descriptions

### Institute
Represents an educational institution participating in BCECE counseling.

**Fields:**
- `id` (String): Unique identifier (cuid)
- `name` (String, unique): Official institute name
- `shortName` (String?): Display-friendly abbreviated name
- `location` (String?): City/district where institute is located
- `type` (String?): Institute type (Government/Self-Finance)
- `createdAt` (DateTime): Timestamp of record creation

**Relationships:**
- One-to-many with `Allotment` (instituteId)
- One-to-many with `Cutoff` (instituteId)

### Branch
Represents an academic discipline or program offered by institutes.

**Fields:**
- `id` (String): Unique identifier (cuid)
- `name` (String, unique): Branch identifier (e.g., "Civil", "CSE")
- `fullName` (String?): Full expanded name (e.g., "Computer Science Engineering")
- `group` (String): Academic group classification (PCM | PCB | BOTH)
- `createdAt` (DateTime): Timestamp of record creation

**Relationships:**
- One-to-many with `Allotment` (branchId)
- One-to-many with `Cutoff` (branchId)

### Allotment
Represents a historical seat allotment from BCECE counseling rounds (anonymized student data).

**Fields:**
- `id` (String): Unique identifier (cuid)
- `subGroup` (String): Student's subject combination (PCM | PCB | PCMB)
- `category` (String): Social category (UR | BC | EBC | SC | ST)
- `pcmUrRank` (Int?): PCM Unreserved Category Rank
- `pcmCatRank` (Int?): PCM Category Rank
- `pcmRcgRank` (Int?): PCM Reservation Category Girls Rank
- `pcmDqRank` (Int?): PCM Disability Quota Rank
- `pcmSmqRank` (Int?): PCM Sports/Music Quota Rank
- `pcbUrRank` (Int?): PCB Unreserved Category Rank
- `pcbCatRank` (Int?): PCB Category Rank
- `pcbRcgRank` (Int?): PCB Reservation Category Girls Rank
- `pcbDqRank` (Int?): PCB Disability Quota Rank
- `pcbSmqRank` (Int?): PCB Sports/Music Quota Rank
- `instituteId` (String): Foreign key to Institute
- `branchId` (String): Foreign key to Branch
- `allottedCat` (String): Allotted category (UR | BC | EBC | SC | ST | EWS | RCG | DQ | NRI | SMQ)
- `seatType` (String): Seat type (GENERAL SEAT | FEMALE SEAT)
- `remark` (String?): Additional remarks from allotment
- `allotmentGroup` (String): Academic group of allotment (PCM | PCB)
- `year` (Int): Counseling year (default 2025)
- `round` (Int): Counseling round (default 1)
- `createdAt` (DateTime): Timestamp of record creation

**Indexes:**
- Composite: `[allotmentGroup, allottedCat]`
- Composite: `[instituteId, branchId]`
- Single: `[pcbUrRank]`
- Single: `[pcmUrRank]`
- Composite: `[allottedCat, seatType]`

### Cutoff
Precomputed table for fast prediction queries, representing historical cutoff data.

**Fields:**
- `id` (String): Unique identifier (cuid)
- `instituteId` (String): Foreign key to Institute
- `branchId` (String): Foreign key to Branch
- `allotmentGroup` (String): Academic group (PCM | PCB)
- `allottedCat` (String): Allotted category (UR | BC | EBC | SC | ST | EWS | RCG | DQ | NRI | SMQ)
- `seatType` (String): Seat type (GENERAL SEAT | FEMALE SEAT)
- `openingRank` (Int): Best (lowest) rank allotted in this combination
- `closingRank` (Int): Worst (highest) rank allotted in this combination
- `totalSeats` (Int): Count of allotments in this institute/branch/category/seat/year/round combination
- `year` (Int): Counseling year (default 2025)
- `round` (Int): Counseling round (default 1)

**Constraints:**
- Unique: `[instituteId, branchId, allotmentGroup, allottedCat, seatType, year, round]`

**Indexes:**
- Composite: `[allotmentGroup, allottedCat, seatType]`
- Single: `[closingRank]`

## Relationships

```
Institute ||--o{ Allotment : "has"
Institute ||--o{ Cutoff : "has"
Branch ||--o{ Allotment : "has"
Branch ||--o{ Cutoff : "has"
Allotment }o--|| Institute : "belongs to"
Allotment }o--|| Branch : "belongs to"
Cutoff }o--|| Institute : "belongs to"
Cutoff }o--|| Branch : "belongs to"
```

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    INSTITUTE {
        string id PK
        string name UK
        string? shortName
        string? location
        string? type
        datetime createdAt
    }
    BRANCH {
        string id PK
        string name UK
        string? fullName
        string group
        datetime createdAt
    }
    ALLOTMENT {
        string id PK
        string subGroup
        string category
        int? pcmUrRank
        int? pcmCatRank
        int? pcmRcgRank
        int? pcmDqRank
        int? pcmSmqRank
        int? pcbUrRank
        int? pcbCatRank
        int? pcbRcgRank
        int? pcbDqRank
        int? pcbSmqRank
        string instituteId FK
        string branchId FK
        string allottedCat
        string seatType
        string? remark
        string allotmentGroup
        int year
        int round
        datetime createdAt
    }
    CUTOFF {
        string id PK
        string instituteId FK
        string branchId FK
        string allotmentGroup
        string allottedCat
        string seatType
        int openingRank
        int closingRank
        int totalSeats
        int year
        int round
    }
    INSTITUTE ||--o{ ALLOTMENT : "has"
    INSTITUTE ||--o{ CUTOFF : "has"
    BRANCH ||--o{ ALLOTMENT : "has"
    BRANCH ||--o{ CUTOFF : "has"
    ALLOTMENT }o--|| INSTITUTE : "belongs to"
    ALLOTMENT }o--|| BRANCH : "belongs to"
    CUTOFF }o--|| INSTITUTE : "belongs to"
    CUTOFF }o--|| BRANCH : "belongs to"
```

## Data Flow

1. **Data Ingestion**: Historical allotment data is processed from official BCECE PDFs/CSVs
2. **Storage**: Raw allotments stored in `Allotment` table for detailed analysis
3. **Aggregation**: Precomputed `Cutoff` table generated from `Allotment` for:
   - Opening rank (minimum rank allotted)
   - Closing rank (maximum rank allotted)
   - Total seats (count of allotments)
   - Grouped by institute, branch, category, seat type, year, round
4. **Prediction Query**: 
   - User inputs rank, category, group
   - System determines eligible categories based on BCECE rules
   - Queries `Cutoff` table for matching records where:
     - `closingRank >= userRank / 1.10` (minimum eligibility threshold)
     - `allottedCat` in eligible categories
     - Appropriate group and seat type filters
   - Results processed to calculate admission chances:
     - HIGH: userRank ≤ openingRank (90-99% probability)
     - MODERATE: openingRank < userRank ≤ closingRank (40-89% probability)
     - LOW: closingRank < userRank ≤ closingRank × 1.10 (10-39% probability)
5. **Caching**: Frequent queries cached in Redis for performance

## Constraints and Validation

- **Data Integrity**: 
  - Foreign key constraints ensure referential integrity between tables
  - Unique constraints prevent duplicate cutoff combinations
  - Indexes optimize query performance for prediction lookups
- **Business Rules**:
  - Allotment group must match student's PCM/PCB eligibility
  - Special categories (RCG, DQ, SMQ) only accessible with matching rank subcategory
  - UR candidates eligible for EWS seats
  - Seat type restrictions apply based on gender/reservation policies
- **Temporal Data**: 
  - Year and round fields enable historical analysis
  - Default values set to 2025 Round 1 for current predictions