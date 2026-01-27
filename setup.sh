#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Idees Setup Script                            ║${NC}"
echo -e "${BLUE}║  Deploy your own topic suggestion platform                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
echo ""

MISSING=0

check_command "node" || MISSING=1
check_command "npm" || MISSING=1

if ! check_command "supabase"; then
    echo -e "  ${YELLOW}→ Install with: npm install -g supabase${NC}"
    MISSING=1
fi

if ! check_command "wrangler"; then
    echo -e "  ${YELLOW}→ Install with: npm install -g wrangler${NC}"
    MISSING=1
fi

echo ""

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}Please install missing dependencies and run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}All prerequisites installed!${NC}"
echo ""

echo -e "${YELLOW}Step 2: Supabase Configuration${NC}"
echo ""
echo "You need a Supabase project. Create one at: https://supabase.com/dashboard"
echo ""

read -p "Enter your Supabase project reference (e.g., abcdefghijklmnop): " SUPABASE_PROJECT_REF
read -p "Enter your Supabase URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase anon key: " SUPABASE_ANON_KEY

echo ""
echo -e "${YELLOW}Step 3: Site Configuration${NC}"
echo ""

read -p "Enter your site URL (e.g., https://idees.example.com): " SITE_URL
read -p "Enter your site name [Idees]: " SITE_NAME
SITE_NAME=${SITE_NAME:-Idees}

echo ""
echo -e "${YELLOW}Step 4: Optional Configuration${NC}"
echo ""
echo "Press Enter to skip optional fields."
echo ""

read -p "Twitter/X URL (optional): " TWITTER_URL
read -p "YouTube URL (optional): " YOUTUBE_URL
read -p "Blog URL (optional): " BLOG_URL
read -p "Blog domain for link detection (optional): " BLOG_DOMAIN
read -p "SMTP user for email notifications (optional): " SMTP_USER
read -p "SMTP from address (optional): " SMTP_FROM

echo ""
echo -e "${YELLOW}Step 5: Creating wrangler.toml...${NC}"

cat > wrangler.toml << EOF
#:schema node_modules/wrangler/config-schema.json
name = "idees"
main = ".open-next/worker.js"
compatibility_date = "2025-11-17"
compatibility_flags = ["nodejs_compat"]

[placement]
mode = "smart"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[observability.logs]
enabled = true
invocation_logs = true

[vars]
NEXT_PUBLIC_SUPABASE_URL = "${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}"
NEXT_PUBLIC_SITE_URL = "${SITE_URL}"
NEXT_PUBLIC_SITE_NAME = "${SITE_NAME}"
NEXT_PUBLIC_TWITTER_URL = "${TWITTER_URL}"
NEXT_PUBLIC_YOUTUBE_URL = "${YOUTUBE_URL}"
NEXT_PUBLIC_BLOG_URL = "${BLOG_URL}"
NEXT_PUBLIC_BLOG_DOMAIN = "${BLOG_DOMAIN}"
SMTP_HOST = "mail.smtp2go.com"
SMTP_PORT = "2525"
SMTP_USER = "${SMTP_USER}"
SMTP_FROM = "${SMTP_FROM}"
EOF

echo -e "${GREEN}✓${NC} wrangler.toml created"

echo ""
echo -e "${YELLOW}Step 6: Creating .env.local for local development...${NC}"

cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=${SITE_NAME}
NEXT_PUBLIC_TWITTER_URL=${TWITTER_URL}
NEXT_PUBLIC_YOUTUBE_URL=${YOUTUBE_URL}
NEXT_PUBLIC_BLOG_URL=${BLOG_URL}
NEXT_PUBLIC_BLOG_DOMAIN=${BLOG_DOMAIN}
EOF

echo -e "${GREEN}✓${NC} .env.local created"

echo ""
echo -e "${YELLOW}Step 7: Linking to Supabase project...${NC}"
echo ""
echo "You'll be prompted for your database password."
echo "Find it in: Supabase Dashboard → Settings → Database → Database password"
echo ""

supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo ""
echo -e "${YELLOW}Step 8: Running database migrations...${NC}"
echo ""

supabase db push

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Complete!                               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Set Cloudflare secrets (for production):"
echo "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo "   wrangler secret put SMTP2GO_API_KEY  (if using email notifications)"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Run locally:"
echo "   npm run dev"
echo ""
echo "4. Deploy to Cloudflare:"
echo "   npm run build:cloudflare"
echo "   npm run deploy"
echo ""
echo "5. Update Supabase Auth settings:"
echo "   - Go to: Supabase Dashboard → Authentication → URL Configuration"
echo "   - Set Site URL to: ${SITE_URL}"
echo "   - Add Redirect URL: ${SITE_URL}/**"
echo ""
echo "6. Make yourself admin (after signing up):"
echo "   - Go to: Supabase Dashboard → SQL Editor"
echo "   - Run: UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
