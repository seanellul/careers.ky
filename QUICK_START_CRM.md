# Sales Pipeline CRM - Quick Start (5 mins)

## What You Just Got

A complete admin panel for managing 500 employer prospects. Track them from "not contacted" → "demo scheduled" → "paying".

## Access It

```
https://careers.ky/admin/pipeline
```

## Set It Up (2 minutes)

### 1. Migrate Database
```bash
npm run migrate
```

### 2. Seed 500 Employers
```bash
npm run seed-pipeline
```

That's it! You now have all 500 employers in the CRM.

---

## How to Use (Main Workflows)

### ⭐ Workflow 1: Browse & Filter Hot Leads

1. Go to `/admin/pipeline`
2. See your 500 employers in a table
3. **Filter by:**
   - Score range: `70+` = hot leads, `50-69` = warm
   - Segment: Financial, Hotels, Tech, etc.
   - Status: not_contacted, contacted, demo_scheduled, etc.
4. **Sort by:** Score (high to low), Last contacted, Next followup
5. **Watch the stats cards** - see how many are hot, warm, etc.

### ⭐ Workflow 2: Reach Out to an Employer

1. Click any employer name in the table
2. You're on their detail page
3. **Update status** (dropdown): Mark as "contacted"
4. **Add contact info:**
   - Name of decision-maker
   - Their email
   - Their phone
5. **Add notes:** Why they're a fit, what they said, etc.
6. **Set next followup date:** When to check back in
7. **Click "Save Changes"** - done

### ⭐ Workflow 3: Log Activities

On the employer detail page, right sidebar:

1. **Log Activity** section
2. Select activity type:
   - Email Sent
   - Call Made
   - Response Received
   - Demo Scheduled
   - Meeting Completed
   - Trial Started
   - Payment Received
3. Add details in "Notes"
4. Click "Log Activity"
5. **See it appear** in Contact History below

### ⭐ Workflow 4: Export for Email Campaigns

1. On list page, set your filters (e.g., "segment = Hotels & score > 70")
2. Click **"Export CSV"** button
3. Download opens → use for bulk outreach

---

## Quick Reference

### Status Flow
```
not_contacted → contacted → demo_scheduled → trial_active → paying
                                                          ↓
                                                        rejected
```

### Key Metrics (on Stats Cards)
- **Hot Leads**: Score 70+ (your best targets)
- **Warm Leads**: Score 50-69 (follow up)
- **Demo Scheduled**: Next stage leads
- **Paying**: Revenue generating!

### Color Coding (Status Badges)
- 🔘 Gray = not contacted
- 🟠 Amber = contacted
- 🟡 Yellow = demo scheduled
- 🔵 Blue = trial active
- 🟢 Green = paying
- 🔴 Red = rejected

---

## Data You Captured

Each employer has:
- Name, industry, segment
- Total jobs posted, active jobs, avg salary
- "Hook" - recommended pitch
- Score (0-100) - how good a fit
- Your contact: name, email, phone
- Status tracking
- Notes (for next time you talk to them)
- Full activity log (emails, calls, demos, etc.)
- Next followup reminder date

---

## Useful URLs

- **Main Pipeline**: `/admin/pipeline` (90% of your time here)
- **Detail Page**: `/admin/pipeline/[id]` (edit status, notes, log activities)
- **Stats Dashboard**: `/admin/stats` (see trends, top leads)
- **CSV Export**: Click "Export" on pipeline page

---

## Pro Tips

1. **Bulk Update**: Filter down your segment/score, then click each status dropdown to update multiple at once
2. **Next Followup**: Set this so you get reminders (future: notifications)
3. **Notes Matter**: Future you will appreciate the context you save here
4. **Activity Log**: It's a CRM - log EVERY touchpoint. Emails, calls, responses, everything.
5. **Score-Based Prioritization**: Sort by score to tackle hot leads first

---

## Example: Your First Campaign

### Scenario: Email all Hotels in segment with 70+ score

1. Go to `/admin/pipeline`
2. Filter:
   - Segment: "Hotels & Resorts"
   - Min Score: 70
3. Click "Export CSV"
4. Open in email tool (Mailchimp, Constant Contact, etc.)
5. Send campaign
6. Log activities in CRM: "Email Sent" when done
7. Track responses in Contact History

---

## What's Behind the Scenes

- **Database**: Neon Postgres (same as rest of careers.ky)
- **API**: 6 admin routes fetching/updating data
- **UI**: React + Tailwind, matching careers.ky dark theme
- **Real-time Updates**: Status changes save immediately

---

## Stuck?

- **Page won't load?** Check DATABASE_URL is set
- **Table empty?** Run `npm run seed-pipeline` again
- **Status won't save?** Check browser console (F12) for errors
- **Details?** Read `ADMIN_CRM_README.md`
- **Deployment?** Read `DEPLOYMENT_CHECKLIST.md`

---

## Next Level (Optional)

Coming soon:
- [ ] Email templates (auto-draft outreach)
- [ ] Calendar sync (see next followup on your calendar)
- [ ] Notifications (alert when someone responds)
- [ ] Bulk status updates (check 10 boxes, change all to "demo_scheduled")
- [ ] Advanced analytics (which segments convert best?)

---

## TL;DR

```bash
# Setup (once)
npm run migrate
npm run seed-pipeline

# Use it
1. Go to https://careers.ky/admin/pipeline
2. Find an employer
3. Update status as you progress through sales
4. Log activities
5. Export filtered lists for campaigns
```

That's it! You've got a full CRM for 500 prospects. Happy selling! 🚀

---

**Version**: 1.0.0
**Date**: Mar 17, 2026
