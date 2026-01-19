# Idees

<img width="800" height="800" alt="Idees-Gonzague" src="https://github.com/user-attachments/assets/d0df52ec-c07b-4113-a7e9-3c8d790685f9" />

A collaborative topic suggestion platform where users can propose ideas and vote on them. Built with Next.js 16 and PocketBase.

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
- **Email Notifications** - Automated emails when suggestions are completed (to author and followers)
- **OG Image Generation** - Dynamic social preview images for each suggestion
- **Cloudflare Turnstile** - CAPTCHA protection on forms
- **Responsive Design** - Mobile-first, works on all devices
- **French Localization** - Full French UI

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: PocketBase (SQLite)
- **Deployment**: Docker, Caddy (HTTPS)

## Local Development

### Prerequisites

- Node.js 20+
- PocketBase binary

### Setup

1. Clone the repository:
```bash
git clone https://github.com/gonzague/idees.git
cd idees
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env.local
```

4. Start PocketBase:
```bash
cd pocketbase
./pocketbase serve
```

5. Start Next.js development server:
```bash
npm run dev
```

6. Open http://localhost:3000

### First-Time Setup

1. Go to http://127.0.0.1:8090/_/ to access PocketBase Admin
2. Create an admin account
3. The migrations will auto-apply on first run

## Production Deployment

### Using Docker Compose

#### Quick Deploy (Recommended)

Use the interactive deployment assistant:

```bash
git clone https://github.com/gonzague/idees.git
cd idees
./deploy.sh
```

The interactive menu provides:
- **Deploy / Redeploy** - Full deployment with configuration wizard
- **Test deployment locally** - Test the full Docker stack on localhost
- **Configure settings** - Update domain, SMTP, Turnstile, etc.
- **View service status** - Check running containers
- **View logs** - See recent container logs
- **Stop services** - Shutdown all containers

**CLI Options:**
- `./deploy.sh --quick` - Quick deploy using saved configuration
- `./deploy.sh --help` - Show help

The assistant will:
- Check prerequisites (Docker, Docker Compose)
- Create required data directories
- Guide you through configuration (domain, site name, SMTP, Turnstile, etc.)
- Update configuration files automatically
- Build and deploy all services (Next.js, PocketBase, Caddy)

#### Testing Deployment Locally

Before deploying to production, you can test the full Docker stack locally:

```bash
./deploy.sh
# Select option 2: "Test deployment locally"
```

Or run directly:
```bash
npm run test:deploy
```

This will:
- Build all Docker images (Next.js, PocketBase, Caddy)
- Start containers with health checks
- Run automated tests (health endpoints, routing, connectivity)
- Show URLs to test manually at `http://localhost:8080`
- Optionally keep services running for manual testing
- Clean up automatically when done

#### Manual Setup

1. Clone to your server:
```bash
git clone https://github.com/gonzague/idees.git
cd idees
```

2. Create data directories:
```bash
mkdir -p docker-data/pb_data docker-data/pb_public docker-data/caddy_data docker-data/caddy_config
```

3. Update domain in files (if not already set):
   - `docker-compose.yml` - Update `NEXT_PUBLIC_POCKETBASE_URL` build arg and environment variable, and PocketBase origins in the command.
   - `Caddyfile` - Update domain name.

4. Deploy:
```bash
docker compose -f docker-compose.yml up -d --build
```

> **Note:** The `-f docker-compose.yml` flag ensures Caddy is included. Without it, Docker may use a local override file that disables Caddy for development.

5. Set up PocketBase admin:
   - Visit https://yourdomain.com/_/
   - Create admin account
   - Verify collections are created

### Architecture

```
                    +-------------+
                    |   Caddy     |
                    |  (HTTPS)    |
                    |   :80/:443  |
                    +------+------+
                           |
           +---------------+---------------+
           |               |               |
           v               v               v
    +----------+    +----------+    +----------+
    |  Next.js |    |   /api/* |    |   /_/*   |
    |   :3000  |    |          |    |          |
    +----------+    +----+-----+    +----+-----+
                         |               |
                         v               v
                    +---------------------+
                    |     PocketBase      |
                    |       :8090         |
                    +---------------------+
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_POCKETBASE_URL` | PocketBase API URL | `http://127.0.0.1:8090` |
| `NODE_ENV` | Environment mode | `development` |

### Health Check

The application exposes a health endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "app": "healthy",
    "pocketbase": "healthy"
  }
}
```

## Project Structure

```
idees/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── (admin)/        # Admin routes
│   │   ├── (public)/       # Public routes
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── admin/         # Admin components
│   │   ├── auth/          # Auth components
│   │   ├── layout/        # Layout components
│   │   ├── suggestions/   # Suggestion components
│   │   └── ui/            # UI primitives
│   └── lib/               # Utilities
│       ├── actions/       # Server actions
│       ├── i18n/          # Translations
│       ├── pocketbase/    # PocketBase client
│       ├── types/         # TypeScript types
│       └── utils/         # Helper functions
├── pocketbase/
│   └── pb_migrations/     # Database migrations
├── docker-compose.yml     # Production Docker config
├── docker-compose.test.yml # Local testing config (HTTP)
├── Dockerfile            # Next.js container
├── Dockerfile.pocketbase # PocketBase container
├── Caddyfile            # Production Caddy config (HTTPS)
├── Caddyfile.test       # Test Caddy config (HTTP)
├── deploy.sh            # Interactive deployment CLI
└── test-deployment.sh   # Automated deployment tests
```

## Security Features

- **HTTP-only cookies** for authentication
- **CSRF protection** via Next.js server actions
- **XSS protection** headers via Caddy and Next.js
- **Rate limiting** on sensitive endpoints
- **Input sanitization** for user content
- **Content Security Policy** headers

## License

MIT
