# Quick Start Guide - 5 Minutes to Live CRM

## Step 1: Run the Migration (2 minutes)

1. Open https://supabase.com/dashboard/project/fnesqroqxppkyibmoykr
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy entire contents of: `supabase/migrations/20251207000000_initial_schema.sql`
5. Paste into SQL Editor
6. Click **Run** (or Cmd/Ctrl + Enter)
7. Wait for "Success" message

## Step 2: Verify (30 seconds)

```bash
node scripts/verify-database.js
```

You should see:

```
✅ users: Ready
✅ leads: Ready
✅ lead_activities: Ready
🎉 Database is set up correctly!
```

## Step 3: Create Admin User (1 minute)

1. In Supabase Dashboard, click **Authentication**
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: your-email@example.com
   - Password: (create a strong password)
   - ✅ Check "Auto Confirm User"
4. Click **Create user**

## Step 4: Test Login (1 minute)

```bash
pnpm dev
```

1. Go to http://localhost:3000/login
2. Sign in with your credentials
3. You should see the admin dashboard!

## Step 5: Test Lead Capture (1 minute)

1. Go to http://localhost:3000/contact
2. Fill out contact form
3. Submit
4. Check:
   - ✅ Admin dashboard shows new lead
   - ✅ Email arrives in inbox

---

## Done! 🎉

Your CRM is now live and collecting leads.

**Next**: Read [SETUP_COMPLETE.md](SETUP_COMPLETE.md) for full documentation

**Need help?** See the Troubleshooting section in SETUP_COMPLETE.md
