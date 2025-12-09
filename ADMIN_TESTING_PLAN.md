# Admin Portal E2E Test & UI/UX Remediation Plan

## Overview

Comprehensive testing plan for the Nurture Nest Birth admin portal covering functionality, UI/UX consistency, and bug remediation.

---

## Phase 1: Authentication & Navigation

### Functionality

- [ ] Login redirect for unauthenticated users to `/login`
- [ ] Login form validation (email format, required fields)
- [ ] Successful login redirects to `/admin`
- [ ] Sign out functionality works
- [ ] Session persistence across page refreshes

### UI/UX

- [ ] Login page layout and spacing
- [ ] Error message styling (red alert box)
- [ ] Loading states on submit button
- [ ] Button feedback (hover, active states)
- [ ] Mobile responsiveness

---

## Phase 2: Main Dashboard (`/admin`)

### Functionality

- [ ] All KPI cards load with correct data
- [ ] Lead Pipeline funnel chart renders
- [ ] Revenue Trend chart renders with 6-month data
- [ ] Lead Sources pie chart renders
- [ ] Recent Leads list is clickable (links to detail)
- [ ] Upcoming Births list displays correctly
- [ ] All navigation buttons work (Leads, Team, Reports, Dashboards, Setup)

### UI/UX

- [ ] Card spacing and padding consistency
- [ ] Typography hierarchy (headings, subtext)
- [ ] Chart sizing and responsiveness
- [ ] Empty state handling (what if no data?)
- [ ] Loading skeletons present
- [ ] Color consistency across cards
- [ ] Mobile layout stacking

---

## Phase 3: Leads Management

### Leads List (`/admin/leads`)

#### Functionality

- [ ] List displays with data
- [ ] Search by name works
- [ ] Filter by status works
- [ ] Filter by source works
- [ ] Filter by lifecycle_stage works
- [ ] Sorting (asc/desc) works
- [ ] Pagination works (50 per page)
- [ ] Saved views dropdown works
- [ ] Create new lead button works

#### UI/UX

- [ ] Table column widths appropriate
- [ ] Filter panel layout
- [ ] Search input styling
- [ ] Badge styling consistency
- [ ] Mobile table responsiveness (horizontal scroll or card view)

### Lead Detail (`/admin/leads/[id]`)

#### Functionality

- [ ] All tabs render: Overview, Services, Meetings, Documents, Payments, Invoices, Contracts, Team
- [ ] Status update dropdown works
- [ ] Activity timeline displays
- [ ] Team assignments work
- [ ] "Login as Client" button works

#### UI/UX

- [ ] Tab navigation UX
- [ ] Form layouts in each tab
- [ ] Card padding consistency
- [ ] Section spacing

---

## Phase 4: Setup Hub (`/admin/setup`)

### Setup Overview Page

- [ ] All category cards display
- [ ] Navigation links work
- [ ] Card grid layout correct

### Users (`/admin/setup/users`)

#### Functionality

- [ ] Users table displays
- [ ] Create User dialog opens and submits
- [ ] Invite User dialog opens and submits
- [ ] Role assignment works
- [ ] Activate/deactivate toggle works
- [ ] Invitations tab shows pending invitations
- [ ] Resend/Revoke invitation works

#### UI/UX

- [ ] Stats cards layout
- [ ] Dialog sizing (not cramped)
- [ ] Form field alignment
- [ ] Table styling consistency

### Roles (`/admin/setup/roles`)

#### Functionality

- [ ] Roles table displays with hierarchy level
- [ ] Create Role wizard works (all 4 steps)
- [ ] Role presets populate correctly
- [ ] Edit role works
- [ ] Delete role works (non-system roles)

#### UI/UX

- [ ] Wizard step indicators clear
- [ ] Permission matrix readable
- [ ] Dialog/page not cramped or scrolling oddly

### Company (`/admin/setup/company`)

#### Functionality

- [ ] Settings form loads with existing data
- [ ] All fields editable
- [ ] Save persists changes

#### UI/UX

- [ ] Form sections well organized
- [ ] Color picker works
- [ ] Consistent padding

### Services (`/admin/setup/services`)

#### Functionality

- [ ] Packages table displays
- [ ] Create package dialog works
- [ ] Toggle active/featured works
- [ ] Edit package works
- [ ] Delete package works

#### UI/UX

- [ ] Table layout
- [ ] Dialog form layout
- [ ] Price formatting

### Contracts (`/admin/setup/contracts`)

#### Functionality

- [ ] Templates table displays
- [ ] Template editor loads
- [ ] Create/edit template works

#### UI/UX

- [ ] Editor layout
- [ ] Preview functionality

### Intake Forms (`/admin/setup/intake-forms`)

#### Functionality

- [ ] Forms table displays
- [ ] Toggle active works
- [ ] "New Form" button (Coming Soon badge)

#### UI/UX

- [ ] Coming Soon state clear

### Integrations (`/admin/setup/integrations`)

#### Functionality

- [ ] Integration status displays correctly
- [ ] Environment variable detection works

#### UI/UX

- [ ] Connected/Not Configured badges clear
- [ ] Coming Soon section distinct

---

## Phase 5: Team Management (`/admin/team`)

### Functionality

- [ ] Dashboard tab shows stats
- [ ] Team Members tab shows table
- [ ] Client Assignments tab shows matrix
- [ ] Time Tracking tab works (log entry, view entries)
- [ ] On-Call Schedule tab works
- [ ] Add team member dialog works
- [ ] Edit team member works

### UI/UX

- [ ] Tab panel padding
- [ ] Stats cards layout
- [ ] Table styling
- [ ] Form layouts
- [ ] Assignment matrix readability
- [ ] Time entry form layout

---

## Phase 6: Reports & Dashboards

### Reports List (`/admin/reports`)

#### Functionality

- [ ] Reports grid displays
- [ ] Filter by type works
- [ ] Create new report button works

#### UI/UX

- [ ] Grid card layout
- [ ] Empty state

### Report Builder (`/admin/reports/new`)

#### Functionality

- [ ] Step 1: Data source selection works
- [ ] Step 2: Field selection works
- [ ] Step 3: Filter builder works
- [ ] Step 4: Grouping works
- [ ] Step 5: Aggregations work
- [ ] Step 6: Chart config works
- [ ] Preview updates in real-time
- [ ] Save creates report

#### UI/UX

- [ ] Wizard step layout
- [ ] Form field spacing
- [ ] Preview panel sizing

### Report Viewer (`/admin/reports/[id]`)

#### Functionality

- [ ] Report data displays
- [ ] Aggregation cards show
- [ ] Chart renders (if chart type)
- [ ] Data table displays
- [ ] Edit/Delete buttons work

#### UI/UX

- [ ] Layout spacing
- [ ] Chart container sizing

### Dashboards List (`/admin/dashboards`)

#### Functionality

- [ ] Dashboard cards display
- [ ] Widget count shows
- [ ] Create new dashboard button works

#### UI/UX

- [ ] **KNOWN ISSUE: Padding/spacing needs fixing**
- [ ] Card grid layout
- [ ] Empty state

### Dashboard Builder (`/admin/dashboards/new`)

#### Functionality

- [ ] Drag-and-drop grid works
- [ ] All widget types available
- [ ] Widget configuration works
- [ ] Data source selection works
- [ ] Save creates dashboard

#### UI/UX

- [ ] Drag-and-drop feedback
- [ ] Widget card styling
- [ ] Grid responsiveness

### Dashboard Viewer (`/admin/dashboards/[id]`)

#### Functionality

- [ ] Widgets render with data
- [ ] Set as default works
- [ ] Edit button works
- [ ] Delete button works

#### UI/UX

- [ ] Widget layout
- [ ] Chart sizing

---

## Phase 7: Global UI/UX Consistency Review

### Spacing Standards

- [ ] Page padding: `px-4 py-8 sm:px-6 lg:px-8`
- [ ] Max width: `max-w-7xl mx-auto`
- [ ] Card padding: `p-6` or CardContent default
- [ ] Section spacing: `space-y-6` or `gap-6`

### Typography

- [ ] Heading hierarchy consistent (h1 for page title, h2 for sections)
- [ ] Font sizes consistent
- [ ] Line heights appropriate

### Colors

- [ ] Badge colors consistent across pages
- [ ] Status colors uniform (green=active, gray=inactive, etc.)
- [ ] Hover states present

### Components

- [ ] Button styles consistent
- [ ] Card styles consistent
- [ ] Table styles consistent
- [ ] Form input styles consistent

### Responsive

- [ ] Mobile breakpoints work
- [ ] Touch targets adequate (44px min)
- [ ] Navigation collapsible on mobile

### States

- [ ] Loading states present
- [ ] Empty states helpful
- [ ] Error states clear
- [ ] Success feedback present (toasts)

### Accessibility

- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Keyboard navigation works

---

## Phase 8: Bug Fixes & Remediation

Track all issues found during testing and fix systematically.

### Issue Template

```
**Page:** /admin/...
**Type:** Bug / UI/UX
**Description:**
**Expected:**
**Actual:**
**Fix:**
```

---

## Testing Approach

1. Navigate to each page using Playwright
2. Take screenshot for visual review
3. Test all interactive elements
4. Document issues found
5. Fix issues in real-time or batch at end
6. Re-test after fixes
7. Commit fixes with descriptive messages

---

## Progress Tracking

| Phase                 | Status      | Issues Found | Issues Fixed |
| --------------------- | ----------- | ------------ | ------------ |
| 1. Auth & Nav         | Not Started | 0            | 0            |
| 2. Dashboard          | Not Started | 0            | 0            |
| 3. Leads              | Not Started | 0            | 0            |
| 4. Setup Hub          | Not Started | 0            | 0            |
| 5. Team               | Not Started | 0            | 0            |
| 6. Reports/Dashboards | Not Started | 0            | 0            |
| 7. Global UI/UX       | Not Started | 0            | 0            |
| 8. Remediation        | Not Started | 0            | 0            |
