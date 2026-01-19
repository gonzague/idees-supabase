# Migration Guide: PocketBase to Supabase

## Overview

This guide walks you through migrating the Idees app from PocketBase to Supabase.

**Time required:** ~30-60 minutes

---

## Step 1: Set Up Supabase Project

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name:** `idees` (or your preferred name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
4. Click **Create new project** and wait ~2 minutes for provisioning

### 1.2 Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them for `.env.local`):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Run Database Migrations

In the Supabase dashboard:

1. Go to **SQL Editor**
2. Run each migration file **in order**:

**Migration 1: Initial Schema**
```sql
-- Copy contents from: supabase/migrations/00001_initial_schema.sql
```

**Migration 2: RLS Policies**
```sql
-- Copy contents from: supabase/migrations/00002_rls_policies.sql
```

**Migration 3: Functions**
```sql
-- Copy contents from: supabase/migrations/00003_functions.sql
```

**Migration 4: Storage**
```sql
-- Copy contents from: supabase/migrations/00004_storage.sql
```

> **Tip:** You can also use the Supabase CLI: `supabase db push`

### 1.4 Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your domain (e.g., `https://idees.gonzague.me`)
5. Add **Redirect URLs**:
   - `https://idees.gonzague.me/*`
   - `http://localhost:3000/*` (for local dev)

---

## Step 2: Test Locally

### 2.1 Configure Environment

```bash
cd /Users/gonzague/GitHub/idees-supabase

# Copy example env file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Required - Site
DOMAIN=localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Idees

# Optional but recommended - SMTP for emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Run Development Server

```bash
npm run dev
```

### 2.4 Test the App

Open [http://localhost:3000](http://localhost:3000) and verify:

- [ ] Homepage loads
- [ ] Can create an account
- [ ] Can log in
- [ ] Can create a suggestion
- [ ] Can vote on a suggestion
- [ ] Can add a comment
- [ ] Admin panel works (if you have admin access)

> **Note:** The database is empty. Create a test user and make them admin via Supabase dashboard:
> 1. Go to **Table Editor** → **profiles**
> 2. Find your user and set `is_admin` to `true`

---

## Step 3: Migrate Data from PocketBase

### 3.1 Prerequisites

- PocketBase running with your existing data
- Supabase project set up (Step 1 complete)

### 3.2 Start PocketBase

In a separate terminal, start your old PocketBase instance:

```bash
cd /Users/gonzague/GitHub/idees/pocketbase
./pocketbase serve
```

Verify it's running at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)

### 3.3 Set Migration Environment Variables

Make sure your `.env.local` has both PocketBase and Supabase URLs:

```env
# Add this for migration
POCKETBASE_URL=http://127.0.0.1:8090

# These should already be set
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 3.4 Install PocketBase SDK

```bash
npm install pocketbase
```

### 3.5 Run the Migration Script

```bash
npx tsx scripts/migrate-data.ts
```

The script will migrate in order:
1. **Users** → Creates Supabase Auth users + profiles
2. **Tags** → Migrates all tags
3. **Suggestions** → Migrates suggestions with tag relationships
4. **Votes** → Migrates all votes
5. **Comments** → Migrates all comments
6. **Follows** → Migrates suggestion follows
7. **Links** → Migrates suggestion links (done content)

### 3.6 Post-Migration Tasks

**Important:** Users are created with temporary passwords!

Option A: **Send password reset emails** (recommended)
```sql
-- In Supabase SQL Editor, get all user emails
SELECT email FROM auth.users;
```
Then use Supabase Auth to send password reset emails.

Option B: **Manual password reset**
Users can use "Forgot Password" on the login page.

### 3.7 Verify Migration

1. Go to Supabase **Table Editor**
2. Check each table has data:
   - `profiles` - User profiles
   - `tags` - Categories
   - `suggestions` - All ideas
   - `votes` - Vote records
   - `comments` - User comments
   - `suggestion_follows` - Follow relationships
   - `suggestion_links` - Done content links

---

## Step 4: Deploy to Production

### 4.1 Update Production Environment

On your server (`ssh debian@54.39.97.152`):

```bash
cd ~/idees-supabase

# Create production env file
nano .env.production
```

Add your production Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

DOMAIN=idees.gonzague.me
NEXT_PUBLIC_SITE_URL=https://idees.gonzague.me
NEXT_PUBLIC_SITE_NAME=Idees

# Add your other production config (SMTP, Turnstile, etc.)
```

### 4.2 Update Docker Compose

The `docker-compose.yml` no longer needs PocketBase. Verify it only has:
- `app` (Next.js)
- `caddy` (reverse proxy)

### 4.3 Deploy

```bash
# Pull latest code
git pull

# Build and deploy
sudo docker compose up -d --build

# Check logs
sudo docker compose logs app --tail 50
```

### 4.4 Verify Production

- [ ] Visit https://idees.gonzague.me
- [ ] Test login with migrated account
- [ ] Verify suggestions and votes appear
- [ ] Test creating new content

---

## Rollback Plan

If something goes wrong:

1. **Keep PocketBase running** until you're confident in Supabase
2. **Don't delete PocketBase data** until migration is verified
3. **DNS/Caddy can be reverted** to point back to PocketBase

---

## Troubleshooting

### "Invalid API key" error
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Ensure no extra spaces or newlines in the key

### "Permission denied" on database operations
- Check RLS policies were applied (Migration 2)
- Verify the user is authenticated

### Users can't log in after migration
- Users need to reset their passwords
- Send password reset emails or have users use "Forgot Password"

### Missing data after migration
- Check migration script output for errors
- Verify PocketBase was running during migration
- Check ID mappings in script logs

---

## Summary

| Step | Description | Time |
|------|-------------|------|
| 1 | Create Supabase project & run migrations | 15 min |
| 2 | Test locally | 15 min |
| 3 | Migrate data from PocketBase | 10 min |
| 4 | Deploy to production | 10 min |

**Total:** ~50 minutes
