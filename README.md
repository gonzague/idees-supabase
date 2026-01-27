# Idees

<img width="800" height="800" alt="Idees" src="https://github.com/user-attachments/assets/d0df52ec-c07b-4113-a7e9-3c8d790685f9" />

A collaborative topic suggestion platform where users can propose ideas and vote on them. Built with Next.js 15, React 19, and Supabase.

## Features

### For Users
- **User Authentication** - Sign up/sign in with email, secure session management
- **User Profiles** - Customizable username and avatar upload
- **Topic Suggestions** - Propose ideas you want to see covered
- **Voting System** - Upvote suggestions to show interest
- **Follow Suggestions** - Get email notifications when a followed suggestion is completed
- **Comments** - Discuss suggestions with other users
- **Tags** - Filter suggestions by category
- **Search** - Find suggestions by title or content
- **Dark Mode** - System-aware theme switching with manual toggle

### For Admins
- **Dashboard** - Overview stats (total suggestions, votes, users)
- **Suggestion Management** - Edit, delete, or mark suggestions as done
- **Mark as Done** - Link completed suggestions to content (YouTube, blog, etc.) with auto-fetched thumbnails
- **User Management** - View users, toggle admin status, ban users
- **Comment Moderation** - View and delete comments across all suggestions
- **Tag Management** - Create, edit, delete tags with custom icons
- **Content Search** - Search YouTube/web to find related content when marking done

### Technical Features
- **Email Notifications** - Automated emails when suggestions are completed
- **OG Image Generation** - Dynamic social preview images for each suggestion
- **Cloudflare Turnstile** - CAPTCHA protection on forms
- **Responsive Design** - Mobile-first, works on all devices
- **French Localization** - Full French UI

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Cloudflare Pages (via OpenNext)

---

## 🚀 Deploy Your Own Instance

The easiest way to deploy your own Idees instance:

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- A [Supabase](https://supabase.com) account (free tier works)
- A [Cloudflare](https://cloudflare.com) account (free tier works)

### One-Command Setup

```bash
git clone https://github.com/gonzague/idees-supabase.git
cd idees-supabase
npm install
./setup.sh
```

The setup script will:
1. ✅ Check all prerequisites
2. ✅ Guide you through configuration
3. ✅ Create your `wrangler.toml` config
4. ✅ Link to your Supabase project
5. ✅ Run all database migrations automatically

After setup, deploy with:
```bash
npm run build:cloudflare
npm run deploy
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- A Supabase account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/gonzague/idees-supabase.git
cd idees-supabase
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization, name your project, set a database password, select region
4. Wait for project to be ready (~2 minutes)

### 3. Get Your Supabase Credentials

From your project dashboard, go to **Settings > API**:

| Credential | Where to find it |
|------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret!) |

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Idees
```

### 5. Run Database Migrations

**Option A: Using Supabase CLI (Recommended)**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

This automatically applies all migrations and tracks which ones have been run.

**Option B: Manual (via SQL Editor)**

In Supabase Dashboard, go to **SQL Editor** and run these files in order:

1. `supabase/migrations/20250101000001_initial_schema.sql`
2. `supabase/migrations/20250101000002_rls_policies.sql`
3. `supabase/migrations/20250101000003_functions.sql`
4. `supabase/migrations/20250101000004_storage.sql`
5. `supabase/migrations/20250101000005_remove_profile_user_fields.sql`
6. `supabase/migrations/20250101000006_add_done_comment.sql`
7. `supabase/migrations/20250101000007_add_vote_count.sql`

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create Admin User

1. Sign up through the app
2. In Supabase Dashboard > SQL Editor, run:

```sql
UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';
```

(Find your user ID in Authentication > Users)

---

## Supabase Configuration

### Storage Buckets

The migration creates two storage buckets automatically:
- **avatars** - User profile pictures
- **thumbnails** - Suggestion thumbnails

If you need to create them manually:

1. Go to **Storage** in Supabase Dashboard
2. Create bucket `avatars` (public)
3. Create bucket `thumbnails` (public)

### Email Configuration (Authentication)

Supabase handles auth emails (confirmation, password reset). To customize:

1. Go to **Authentication > Email Templates**
2. Customize the templates as needed
3. For production, configure a custom SMTP:
   - Go to **Settings > Auth > SMTP Settings**
   - Enable "Custom SMTP"
   - Enter your SMTP credentials

### Email Configuration (App Notifications)

The app sends email notifications when suggestions are completed. Configure SMTP:

```env
SMTP2GO_API_KEY=your-api-key
SMTP_FROM=noreply@yourdomain.com
```

We use [SMTP2Go](https://www.smtp2go.com/) (free tier: 1000 emails/month), but any SMTP service works.

---

## Production Deployment (Cloudflare Pages)

### Prerequisites

- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### 1. Build for Cloudflare

```bash
npm run build:cloudflare
```

This uses [OpenNext](https://opennext.js.org/) to build a Cloudflare-compatible bundle.

### 2. Configure wrangler.toml

Edit `wrangler.toml` with your settings:

```toml
name = "idees"
main = ".open-next/worker.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[placement]
mode = "smart"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[vars]
NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"
NEXT_PUBLIC_SITE_URL = "https://yourdomain.com"
NEXT_PUBLIC_SITE_NAME = "Your Site Name"
```

### 3. Set Secret Environment Variables

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key when prompted

wrangler secret put SMTP2GO_API_KEY
# Paste your SMTP API key when prompted
```

### 4. Deploy

```bash
npm run deploy
```

Or manually:

```bash
wrangler deploy
```

### 5. Configure Custom Domain (Optional)

1. In Cloudflare Dashboard > Workers & Pages > your project
2. Go to **Custom Domains**
3. Add your domain
4. Update DNS as instructed

### 6. Update Supabase Settings

After deployment, update your Supabase project:

1. **Authentication > URL Configuration**:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: Add `https://yourdomain.com/**`

2. **Authentication > Email Templates**:
   - Update any hardcoded URLs to your domain

---

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Your site's public URL |
| `NEXT_PUBLIC_SITE_NAME` | Display name for your site |

### Optional - Social Links (shown in footer)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TWITTER_URL` | Your Twitter/X profile URL |
| `NEXT_PUBLIC_YOUTUBE_URL` | Your YouTube channel URL |
| `NEXT_PUBLIC_BLOG_URL` | Your blog/website URL |
| `NEXT_PUBLIC_BLOG_DOMAIN` | Domain for blog link detection |

### Optional - Integrations

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `YOUTUBE_API_KEY` | YouTube Data API key (for content search) |
| `YOUTUBE_CHANNEL_ID` | Your YouTube channel ID |
| `SMTP2GO_API_KEY` | SMTP2Go API key for notifications |
| `SMTP_FROM` | From address for notification emails |
| `WORDPRESS_API_URL` | WordPress REST API URL (for blog search) |

---

## Project Structure

```
idees-supabase/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin routes
│   │   ├── (public)/          # Public routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── admin/            # Admin components
│   │   ├── auth/             # Auth components
│   │   ├── layout/           # Layout components
│   │   ├── suggestions/      # Suggestion components
│   │   └── ui/               # UI primitives
│   └── lib/
│       ├── actions/          # Server actions
│       ├── supabase/         # Supabase clients
│       ├── types/            # TypeScript types
│       └── utils/            # Helper functions
├── supabase/
│   └── migrations/           # SQL migration files
├── wrangler.toml             # Cloudflare Workers config
└── open-next.config.ts       # OpenNext config
```

---

## Troubleshooting

### "Invalid API key" errors
- Verify your Supabase URL and keys in `.env.local`
- Make sure you're using the correct key (anon for client, service_role for server)

### Auth not persisting
- Check that your `NEXT_PUBLIC_SITE_URL` matches your actual URL
- Verify Supabase Auth URL Configuration includes your domain

### Storage upload fails
- Check storage bucket policies in Supabase Dashboard
- Ensure the bucket exists and is set to public

### Emails not sending
- Verify SMTP credentials
- Check Supabase Auth email settings for confirmation emails
- For app notifications, verify `SMTP2GO_API_KEY` and `SMTP_FROM`

---

## License

MIT
