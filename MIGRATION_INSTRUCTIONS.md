# Database Migration Instructions

## Quick Start - Apply the Migration

Follow these simple steps to set up your CRM database:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fnesqroqxppkyibmoykr
2. Click on **"SQL Editor"** in the left sidebar (database icon)
3. Click the **"New Query"** button

### Step 2: Copy and Paste the Migration

1. Open the migration file: `supabase/migrations/20251207000000_initial_schema.sql`
2. **Copy the entire contents** (Cmd+A, Cmd+C or Ctrl+A, Ctrl+C)
3. **Paste** into the SQL Editor query window

### Step 3: Run the Migration

1. Click the **"Run"** button (or press Cmd/Ctrl + Enter)
2. Wait for execution to complete (should take 2-3 seconds)
3. You should see a success message

### Step 4: Verify Success

After running the migration, you should see three new tables in your database:

- `users` - Admin user profiles
- `leads` - Contact form submissions and newsletter signups
- `lead_activities` - Activity log for each lead

You can verify by:

1. Click **"Table Editor"** in the left sidebar
2. You should see the three tables listed

---

## What the Migration Creates

### Tables

#### 1. `users` Table

Extends Supabase Auth with custom user data:

- `id` - UUID (links to auth.users)
- `email` - User email
- `full_name` - User's full name
- `created_at` - Account creation timestamp
- `role` - 'admin' or 'viewer'

#### 2. `leads` Table

Stores all lead information:

- `id` - Unique lead identifier
- `created_at`, `updated_at` - Timestamps
- `source` - 'contact_form', 'newsletter', or 'manual'
- `status` - Pipeline status: 'new' → 'contacted' → 'scheduled' → 'client' or 'lost'
- `name`, `email`, `phone` - Contact information
- `due_date` - Expected due date (if applicable)
- `service_interest` - Which service they're interested in
- `message` - Their message from contact form
- `email_domain` - Auto-extracted from email
- `assigned_to_user_id` - Which admin owns this lead

#### 3. `lead_activities` Table

Activity log for audit trail:

- `id` - Unique activity identifier
- `lead_id` - Links to leads table
- `created_at` - When activity occurred
- `created_by_user_id` - Who created the activity
- `activity_type` - 'note', 'email_sent', 'call', 'meeting', or 'status_change'
- `content` - Activity description
- `metadata` - Flexible JSON field for additional data

### Automated Features

The migration includes several automated features:

1. **Auto-updating timestamps**: The `updated_at` field updates automatically
2. **Email domain extraction**: Automatically extracts domain from email addresses
3. **Status change logging**: Automatically logs when lead status changes
4. **User profile creation**: Automatically creates user profile when someone signs up

### Security (Row Level Security)

All tables have RLS policies enabled:

- **Authenticated users** (admins) can view, create, update, and delete leads
- **Users can only edit their own activities**
- **Privacy-focused**: No data accessible without authentication

### Performance

Indexes created for fast queries on:

- Lead email, status, source
- Lead creation date (for sorting)
- Activity timestamps
- Foreign key relationships

---

## Troubleshooting

### Error: "type already exists"

If you see this error, it means you've run the migration before. You can:

1. Drop the existing tables first (dangerous - you'll lose data)
2. Or skip running it again

### Error: "permission denied"

Make sure you're using the service role key in your environment variables.

### Tables not showing up

Refresh the Table Editor page or check the "public" schema filter.

---

## Next Steps After Migration

Once the migration is successful:

1. ✅ Create your admin user account
2. ✅ Test the database by adding a sample lead
3. ✅ Build the admin dashboard UI
4. ✅ Update contact form to save to database
5. ✅ Update newsletter signup to save to database
