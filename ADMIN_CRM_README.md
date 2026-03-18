# Sales Pipeline CRM Admin Panel

## Overview

The Sales Pipeline CRM admin panel provides Sean with a centralized interface to manage the sales pipeline for careers.ky. It enables tracking of 500+ employer prospects across multiple stages: not contacted → contacted → demo → trial → paying.

## Features

### 1. **Pipeline Dashboard** (`/admin/pipeline`)
- **Table View**: Browse all 500 employers with key metrics
  - Employer name, score (0-100), segment, status
  - Last contacted date, next followup date
  - One-click status updates via dropdown
  
- **Stats Cards**:
  - Hot leads (score 70+)
  - Warm leads (score 50-69)
  - Demo scheduled count
  - Trial active count
  - Paying customers & conversion rate
  
- **Filters**:
  - Search by employer name
  - Score range (min/max)
  - Segment dropdown
  - Status dropdown
  - Sortable by: score, priority, last contacted, next followup
  
- **Bulk Export**: Download filtered list as CSV for email campaigns

### 2. **Employer Detail Page** (`/admin/pipeline/[id]`)
- **Basic Info**: Name, rank, score, segment, industry, job counts, avg salary
- **Sales Status**:
  - Status dropdown (not_contacted → contacted → demo_scheduled → trial_active → paying → rejected)
  - Contact person name, email, phone
  - Next followup date picker
  - Response received field
  - Notes textarea
  
- **Activity Log**:
  - Record interactions: email sent, call made, demo scheduled, meeting completed, etc.
  - View last 10 contact log entries
  - Auto-timestamps each activity
  
- **Quick Save**: One-click save all changes

### 3. **Stats Dashboard** (`/admin/stats`)
- Overall conversion metrics
- Status breakdown (pie chart data)
- Segment performance analysis
- Top 10 leads by score

## Installation & Setup

### 1. Run Database Migration

```bash
npm run migrate
```

This creates:
- `sales_pipeline` table with 20 columns
- `contact_log` table for tracking activities
- Optimized indices on score, status, segment, priority_rank

### 2. Seed Initial 500 Employers

```bash
npm run seed-pipeline
```

This:
- Reads `/content/sales-pipeline-500-scored.csv`
- Inserts all 500 rows into `sales_pipeline` table
- Sets status to "not_contacted" for all
- Idempotent (skips if already seeded)

### 3. Verify Deployment

```bash
npm run dev  # or deployed on Vercel
```

Then visit: `https://careers.ky/admin/pipeline`

## Database Schema

### `sales_pipeline` Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| employer_name | VARCHAR(255) | Company name (unique) |
| slug | VARCHAR(255) | URL slug |
| priority_rank | INTEGER | Rank 1-500 |
| score | INTEGER | 0-100 score |
| segment | VARCHAR(255) | Industry segment |
| industry | VARCHAR(255) | Industry classification |
| total_jobs | INTEGER | Total jobs posted last year |
| active_jobs | INTEGER | Currently open positions |
| avg_salary | INTEGER | Average salary in KYD |
| recommended_tier | VARCHAR(50) | Pro/Enterprise tier |
| suggested_hook | TEXT | Outreach message template |
| status | VARCHAR(50) | not_contacted / contacted / demo_scheduled / trial_active / paying / rejected |
| last_contacted | TIMESTAMP | When last outreached |
| next_followup | TIMESTAMP | Scheduled next contact |
| notes | TEXT | Internal notes |
| response_received | TEXT | Customer response |
| contact_person | VARCHAR(255) | Name of contact |
| contact_email | VARCHAR(255) | Email address |
| contact_phone | VARCHAR(20) | Phone number |
| created_at | TIMESTAMP | Row creation time |
| updated_at | TIMESTAMP | Last modified time |

### `contact_log` Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| employer_id | INTEGER | Foreign key to sales_pipeline |
| activity_type | VARCHAR(100) | email_sent / call_made / response_received / demo_scheduled / meeting_completed / trial_started / payment_received / note_added |
| notes | TEXT | Details of the activity |
| created_at | TIMESTAMP | When activity occurred |
| created_by | VARCHAR(255) | Who logged it (usually "admin") |

## API Routes

All routes are at `/api/admin/pipeline`:

### List Employers
```
GET /api/admin/pipeline?score_min=50&score_max=100&segment=Hotels&status=contacted&sort_by=score&sort_order=DESC&limit=50&offset=0&search=Marriott
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "employer_name": "Grand Cayman Marriott Beach Resort",
      "score": 79,
      "status": "contacted",
      "last_contacted": "2026-03-17T10:30:00Z",
      ...
    }
  ],
  "pagination": {
    "total": 142,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Employer Detail
```
GET /api/admin/pipeline/3
```

**Response**:
```json
{
  "success": true,
  "data": {
    "employer": { ... },
    "contactLog": [
      {
        "id": 1,
        "activity_type": "email_sent",
        "notes": "Initial outreach",
        "created_at": "2026-03-17T10:30:00Z"
      }
    ]
  }
}
```

### Update Employer
```
PATCH /api/admin/pipeline/3

{
  "status": "demo_scheduled",
  "notes": "Good fit for Enterprise tier",
  "contact_person": "John Smith",
  "contact_email": "john@marriott.com",
  "contact_phone": "+1-555-0123",
  "next_followup": "2026-03-25T00:00:00Z",
  "response_received": "Interested in a demo"
}
```

### Log Activity
```
POST /api/admin/pipeline/3/contact-log

{
  "activity_type": "demo_scheduled",
  "notes": "Scheduled for March 20th at 2 PM KY time"
}
```

### Get Stats
```
GET /api/admin/pipeline/stats
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "hot_leads": 145,
    "warm_leads": 203,
    "contacted": 89,
    "demo_scheduled": 23,
    "trial_active": 8,
    "paying": 3,
    "rejected": 12,
    "not_contacted": 420,
    "total": 500,
    "avg_score": 54.2,
    "max_score": 85,
    "min_score": 20
  },
  "breakdown": {
    "bySegment": [
      {
        "segment": "Financial and Insurance Activities",
        "count": 145,
        "avg_score": 58.3
      }
    ],
    "byStatus": [ ... ]
  },
  "topLeads": [ ... ]
}
```

### Export as CSV
```
GET /api/admin/pipeline/export?score_min=70&segment=Hotels
```

Returns CSV file download with all matching records.

## Design System

### Colors (Dark Navy Theme)
- **Background**: `#0a0f1e` (slate-900)
- **Accent**: `#00d4aa` (cyan-500)
- **Success**: `#10b981` (emerald-500)
- **Alert**: `#ef4444` (red-500)

### Status Badges
- `not_contacted` - Gray (`bg-slate-600`)
- `contacted` - Amber (`bg-amber-600`)
- `demo_scheduled` - Yellow (`bg-yellow-600`)
- `trial_active` - Blue (`bg-blue-600`)
- `paying` - Green (`bg-emerald-600`)
- `rejected` - Red (`bg-red-600`)

## Usage Tips

### Workflow
1. Start at `/admin/pipeline` to see all leads
2. Filter by score (70+ = hot leads) or segment
3. Click an employer to open detail page
4. Update status as you progress through sales cycle
5. Log activities (emails, calls, demos)
6. Add notes for context
7. Set next followup date
8. Export filtered list for email campaigns

### Best Practices
- **Update status immediately**: Mark "contacted" when you reach out
- **Log activities**: Each email, call, or response goes in the log
- **Set followup dates**: Plan next contact in advance
- **Add contact info**: Record name, email, phone of key contact
- **Use notes**: Document reasons for status changes or objections

### Bulk Operations
- Export filtered lists as CSV for:
  - Email campaigns to segment-specific employers
  - Cold outreach templates
  - Analytics/reporting
- Use sort by score to prioritize hot leads

## Deployment

### Vercel (Current Setup)

1. **Environment Variables**
   - Ensure `DATABASE_URL` is set in Vercel project settings
   - Points to Neon Postgres

2. **Auto-Migration**
   - On first admin panel visit, run: `npm run migrate`
   - Creates all tables automatically

3. **Manual Seeding**
   - SSH into Vercel or run locally:
     ```bash
     npm run seed-pipeline
     ```
   - Inserts 500 employers from CSV

4. **Access Control**
   - Currently: API routes accept all requests (TODO: add auth)
   - UI pages: Protected by next-auth session (TODO: implement)

## Future Enhancements

- [ ] Proper authentication (API key, session-based)
- [ ] Email template integration (send via Resend)
- [ ] Calendar integration (sync next_followup to Google Calendar)
- [ ] Bulk status updates (multi-select)
- [ ] Advanced analytics dashboard
- [ ] Automated followup reminders
- [ ] Integration with Salesforce/Pipedrive
- [ ] Candidate profile matching

## Troubleshooting

### "Migration already applied" on load
- Expected behavior - safe to ignore
- If you see errors, check DATABASE_URL is correct

### CSV export is empty
- Check filters aren't too restrictive
- Try resetting filters to show all 500 records

### Status change not saving
- Check browser console for errors
- Verify DATABASE_URL is set
- Try refreshing page

## Contact

For questions or issues with the CRM:
1. Check this README
2. Review database schema
3. Check browser console for API errors
4. Verify DATABASE_URL env var

---

**Version**: 1.0.0 (Mar 17, 2026)
**Last Updated**: MVP Launch
