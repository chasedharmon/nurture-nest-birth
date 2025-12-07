# Phase 2 - Lead Management Implementation Plan

## Goals

Build comprehensive lead management UI to track and manage client relationships through the sales pipeline.

## Features to Build

### 1. Lead Detail Page

- **Route**: `/admin/leads/[id]`
- **Features**:
  - Full lead information display
  - Contact details, due date, service interest
  - Message from contact form
  - Activity timeline
  - Quick actions (call, email, update status)

### 2. Status Management

- **Update lead status** with dropdown or buttons
- **Status pipeline**: new → contacted → scheduled → client (or lost)
- **Automatic activity logging** when status changes (already in DB trigger)
- **Visual status indicators** with colors

### 3. Activity/Notes System

- **Add notes** to any lead
- **Log activities**: calls, meetings, emails sent
- **Activity timeline** showing chronological history
- **Automatic activities**: status changes, lead created

### 4. Search & Filter

- **Search** by name or email
- **Filter** by:
  - Status (new, contacted, scheduled, client, lost)
  - Source (contact_form, newsletter, manual)
  - Date range
- **Sort** by date, name, status

### 5. Enhanced Leads Table

- **Pagination** (10 leads per page)
- **Click row** to go to lead detail
- **Quick actions** in table (update status, add note)
- **Better formatting** for dates and data

## Technical Implementation

### New Files to Create

```
src/app/admin/leads/
├── [id]/
│   └── page.tsx                    # Lead detail page
├── page.tsx                        # All leads page (with search/filter)

src/app/actions/
├── leads.ts                        # Lead CRUD operations
└── activities.ts                   # Activity/note operations

src/components/admin/
├── lead-detail.tsx                 # Lead detail component
├── lead-status-badge.tsx           # Status badge component
├── status-update-dropdown.tsx      # Status update UI
├── activity-timeline.tsx           # Activity timeline
├── add-activity-form.tsx           # Add note/activity
├── leads-search.tsx                # Search input
└── leads-filters.tsx               # Filter controls
```

### Database Schema

Already have everything we need:

- ✅ `leads` table with status field
- ✅ `lead_activities` table for notes/activities
- ✅ Triggers for automatic status logging

### Server Actions Needed

**leads.ts**:

- `getLeadById(id)` - Fetch single lead
- `updateLeadStatus(id, status)` - Update status
- `updateLead(id, data)` - Update lead details
- `searchLeads(query, filters)` - Search and filter

**activities.ts**:

- `getLeadActivities(leadId)` - Get all activities for a lead
- `addActivity(leadId, type, content)` - Add note/activity

## UI/UX Design

### Lead Detail Layout

```
┌─────────────────────────────────────┐
│ ← Back to Leads    [Update Status]  │
├─────────────────────────────────────┤
│                                     │
│  Lead Information                   │
│  • Name, Email, Phone               │
│  • Due Date, Service Interest       │
│  • Source, Created Date             │
│                                     │
│  Original Message                   │
│  [Message content here]             │
│                                     │
│  Quick Actions                      │
│  [Email] [Call] [Add Note]          │
│                                     │
│  Activity Timeline                  │
│  ┌───────────────────────────────┐  │
│  │ • Status changed to contacted │  │
│  │ • Note added: "Called..."     │  │
│  │ • Lead created                │  │
│  └───────────────────────────────┘  │
│                                     │
│  Add Activity                       │
│  [Type] [Note textarea] [Save]      │
│                                     │
└─────────────────────────────────────┘
```

### Enhanced Leads Table

```
┌─────────────────────────────────────────────┐
│ [Search...] [Status ▼] [Source ▼] [Export] │
├─────────────────────────────────────────────┤
│ Name    Email      Status      Created      │
│ ────────────────────────────────────────    │
│ John    john@...   [contacted] 2 days ago   │
│ Sarah   sarah@...  [new]       1 hour ago   │
│ ...                                         │
├─────────────────────────────────────────────┤
│ « Previous  1 2 3  Next »                   │
└─────────────────────────────────────────────┘
```

## Implementation Order

1. **Server Actions** (foundation)
   - leads.ts with CRUD operations
   - activities.ts for notes

2. **Lead Detail Page** (MVP)
   - Basic layout
   - Display lead info
   - Activity timeline

3. **Status Management**
   - Status update dropdown
   - Visual feedback
   - Verify automatic logging

4. **Activity System**
   - Add note form
   - Activity display
   - Timeline formatting

5. **Search & Filter**
   - Search input
   - Filter dropdowns
   - Integrate with table

6. **Polish & Testing**
   - Loading states
   - Error handling
   - E2E tests

## Success Criteria

- ✅ Can click a lead to see full details
- ✅ Can update lead status from detail page
- ✅ Can add notes/activities to leads
- ✅ Activity timeline shows all interactions
- ✅ Can search leads by name/email
- ✅ Can filter leads by status/source
- ✅ Status changes automatically create activities
- ✅ All changes persist to database
- ✅ UI is clean and professional

## Timeline Estimate

- Server Actions: 30 min
- Lead Detail Page: 45 min
- Status Management: 30 min
- Activity System: 45 min
- Search & Filter: 45 min
- Polish & Testing: 30 min

**Total: ~3.5 hours**

---

Starting implementation now...
