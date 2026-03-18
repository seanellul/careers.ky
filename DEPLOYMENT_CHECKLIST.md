# Sales Pipeline CRM - Deployment Checklist

## ✅ What's Built

### 1. Database Layer
- [x] Migration file: `app/api/migrations/add-sales-pipeline.js`
  - Creates `sales_pipeline` table (20 columns)
  - Creates `contact_log` table (8 columns)
  - Indices on: score, status, segment, priority_rank
  - Migration tracking table

- [x] Seeding script: `scripts/seed-pipeline.js`
  - Reads 500 employers from CSV
  - Inserts into database
  - Idempotent (safe to run multiple times)
  - npm command: `npm run seed-pipeline`

### 2. API Routes
- [x] `GET /api/admin/pipeline` - List with filters
  - Query params: score_min, score_max, segment, status, search, sort_by, sort_order, limit, offset
  - Returns paginated results with total count

- [x] `GET /api/admin/pipeline/:id` - Employer detail
  - Returns employer info + last 10 contact log entries

- [x] `PATCH /api/admin/pipeline/:id` - Update employer
  - Can update: status, notes, contact_person, contact_email, contact_phone, next_followup, response_received

- [x] `POST /api/admin/pipeline/:id/contact-log` - Log activity
  - Activity types: email_sent, call_made, response_received, demo_scheduled, meeting_completed, trial_started, payment_received, note_added

- [x] `GET /api/admin/pipeline/stats` - Dashboard stats
  - Returns: counts by status, by segment, avg score, hot/warm/paying leads

- [x] `GET /api/admin/pipeline/export` - CSV export
  - Returns filtered list as downloadable CSV file

### 3. Admin UI Pages
- [x] `/admin/layout.jsx` - Admin layout wrapper
- [x] `/admin/pipeline/page.jsx` - Main dashboard (table view with filters)
- [x] `/admin/pipeline/[id]/page.jsx` - Detail page (edit/log activities)
- [x] `/admin/stats/page.jsx` - Stats dashboard

### 4. Configuration
- [x] Updated `package.json` with `seed-pipeline` command
- [x] Updated `scripts/migrate.js` to include pipeline migration
- [x] Documentation: `ADMIN_CRM_README.md`

---

## 🚀 Deployment Steps

### Step 1: Push to Vercel
```bash
cd /home/node/.openclaw/workspace/careers-ky
git add .
git commit -m "feat: add sales pipeline CRM admin panel"
git push origin main
```
Vercel will auto-deploy on push.

### Step 2: Verify Environment
Vercel project settings → Environment Variables
- ✓ `DATABASE_URL` is already set (Neon Postgres)
- ✓ `DATABASE_URL` contains credentials for neondb

### Step 3: Run Database Migration
SSH into Vercel or run locally with production DB:
```bash
npm run migrate
```

This creates:
- migrations tracking table
- sales_pipeline table
- contact_log table
- All indices

Output: `✓ Migration add_sales_pipeline_table applied successfully`

### Step 4: Seed Initial 500 Employers
```bash
npm run seed-pipeline
```

Output:
```
🚀 Starting pipeline seed...
📦 Running database migration...
✓ Migration complete

📄 Reading CSV from /home/node/.openclaw/workspace/careers-ky/content/sales-pipeline-500-scored.csv...
✓ Found header with 12 columns
✓ Parsed 500 records from CSV

💾 Inserting records into database...
  ✓ 100 records inserted...
  ✓ 200 records inserted...
  ✓ 300 records inserted...
  ✓ 400 records inserted...
  ✓ 500 records inserted...

✓ Seeding complete!
  - Inserted: 500 records
  - Failed: 0 records
  - Total: 500 records processed
```

### Step 5: Verify Deployment
Navigate to: `https://careers.ky/admin/pipeline`

Expected:
- [ ] Page loads (no 404)
- [ ] See 500 employers in table
- [ ] Stats cards show correct totals
- [ ] Filters work (try searching for "Marriott")
- [ ] Click an employer to view detail page
- [ ] Detail page shows: info, status dropdown, notes, contact log area

### Step 6: Test Core Flows
- [ ] List view: Apply filters, sort, export CSV
- [ ] Detail page: Update status, add notes, log activity
- [ ] Activity log: Verify activities appear in real-time
- [ ] CSV export: Download and verify columns

### Step 7: Document Access
Create/update team docs:
- [ ] Link to admin panel: https://careers.ky/admin/pipeline
- [ ] Link to CRM README: See `ADMIN_CRM_README.md`
- [ ] Share with Sean
- [ ] Add to career.ky wiki/docs

---

## 📋 Pre-Launch Checklist

### Database
- [ ] Migration ran successfully (tables created)
- [ ] 500 employers seeded with no errors
- [ ] Can query via admin panel (all 500 show up)

### API Routes
- [ ] GET /api/admin/pipeline returns data
- [ ] GET /api/admin/pipeline/1 returns single record
- [ ] PATCH /api/admin/pipeline/1 updates status
- [ ] POST /api/admin/pipeline/1/contact-log logs activity
- [ ] GET /api/admin/pipeline/stats returns metrics
- [ ] GET /api/admin/pipeline/export downloads CSV

### UI
- [ ] /admin/pipeline loads and displays table
- [ ] /admin/pipeline/1 loads detail page
- [ ] /admin/stats loads stats dashboard
- [ ] All filters functional
- [ ] Status dropdown saves immediately
- [ ] Activity log button works

### Performance
- [ ] Page loads < 2s with all 500 records
- [ ] Filters apply instantly
- [ ] CSV export completes in < 5s
- [ ] No console errors

### Security
- [ ] API routes don't leak sensitive data (check response)
- [ ] CSV export doesn't include internal columns
- [ ] TODO: Add authentication before public launch

---

## 📊 Success Metrics

After deployment, verify:
1. **Data Integrity**: All 500 employers visible
2. **Performance**: Table view loads in < 2 seconds
3. **Usability**: Can perform main workflow in < 5 clicks
4. **Conversion**: Can track employer status → paying

---

## 🆘 Troubleshooting

### Migration fails with "DATABASE_URL not set"
```bash
# Local testing:
export DATABASE_URL="postgresql://..."
npm run migrate

# Vercel: Check environment variables in project settings
```

### Seeding fails with "UNIQUE constraint violation"
```bash
# If running seed-pipeline twice:
# The script is idempotent - it checks if data exists first
# Safe to re-run

# If you need to reset:
# Delete all records from sales_pipeline table, then re-seed
```

### Admin page shows empty table
1. Check migration ran: `SELECT COUNT(*) FROM sales_pipeline;`
2. Check seeding completed: Should show 500 rows
3. Check /api/admin/pipeline returns data
4. Browser console for errors

### CSV export is blank
1. Verify records exist in database
2. Try without filters
3. Check network tab for API response
4. Verify /api/admin/pipeline/export endpoint works

---

## 🎯 Next Steps

After successful deployment, consider:

1. **Authentication**: Add API key or next-auth session protection
2. **Email Integration**: Connect Resend to send outreach templates
3. **Notifications**: Alert when next_followup date arrives
4. **Automation**: Auto-send follow-up emails based on status
5. **Analytics**: Track conversion metrics over time
6. **Integration**: Sync with Salesforce/Pipedrive for larger scale

---

## 📞 Support

Documentation:
- Admin CRM README: `ADMIN_CRM_README.md`
- Database Schema: See `app/api/migrations/add-sales-pipeline.js`
- API Docs: See each route.js file for parameters/response

Code locations:
- Migrations: `app/api/migrations/`
- API Routes: `app/api/admin/pipeline/`
- UI Pages: `app/admin/pipeline/`
- Scripts: `scripts/seed-pipeline.js`

---

**Status**: ✅ Ready for Deployment
**Built**: Mar 17, 2026
**Deliverables**: 1 migration + 1 seed script + 6 API routes + 4 UI pages
