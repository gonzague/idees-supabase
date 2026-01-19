#!/bin/bash

# Idees Docker Deployment Assistant
# Fully interactive CLI for production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Compose command (detected later)
COMPOSE_CMD=""

# Configuration variables
DOMAIN=""
SITE_NAME=""
TURNSTILE_KEY=""
TWITTER_URL=""
YOUTUBE_URL=""
BLOG_URL=""
BLOG_DOMAIN=""
WORDPRESS_API_URL=""
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
SMTP_SECURE=""

# ============================================================================
# Output helpers
# ============================================================================

print_header() {
    clear
    echo -e "${CYAN}"
    echo "  ___    _                  "
    echo " |_ _|__| | ___  ___  ___   "
    echo "  | |/ _\` |/ _ \\/ _ \\/ __|  "
    echo "  | | (_| |  __/  __/\\__ \\  "
    echo " |___\\__,_|\\___|\\___|___/   "
    echo -e "${NC}"
    echo -e "${DIM}  Docker Deployment Assistant${NC}"
    echo
    echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
}

print_section() {
    echo
    echo -e "${PURPLE}${BOLD}$1${NC}"
    echo -e "${DIM}────────────────────────────────────────${NC}"
}

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

print_dim() {
    echo -e "${DIM}$1${NC}"
}

# ============================================================================
# Input helpers
# ============================================================================

# Read a single key press
read_key() {
    read -rsn1 key
    echo "$key"
}

# Ask yes/no question, returns 0 for yes, 1 for no
ask_yes_no() {
    local prompt=$1
    local default=${2:-"y"}  # default to yes

    if [[ "$default" == "y" ]]; then
        echo -ne "${BOLD}$prompt${NC} ${DIM}[Y/n]${NC} "
    else
        echo -ne "${BOLD}$prompt${NC} ${DIM}[y/N]${NC} "
    fi

    read -rsn1 response
    echo

    if [[ -z "$response" ]]; then
        response=$default
    fi

    [[ "$response" =~ ^[Yy]$ ]]
}

# Ask for input with optional default
ask_input() {
    local prompt=$1
    local default=$2
    local secret=${3:-false}
    local value=""

    if [[ -n "$default" ]]; then
        if [[ "$secret" == "true" ]]; then
            echo -ne "${BOLD}$prompt${NC} ${DIM}[hidden]${NC}: "
        else
            echo -ne "${BOLD}$prompt${NC} ${DIM}[$default]${NC}: "
        fi
    else
        echo -ne "${BOLD}$prompt${NC}: "
    fi

    if [[ "$secret" == "true" ]]; then
        read -rs value
        echo
    else
        read value
    fi

    if [[ -z "$value" ]]; then
        value="$default"
    fi

    echo "$value"
}

# Show a menu and return selected index (0-based)
show_menu() {
    local title=$1
    shift
    local options=("$@")
    local num_options=${#options[@]}
    local choice

    clear
    echo -e "${CYAN}"
    echo "  ___    _                  "
    echo " |_ _|__| | ___  ___  ___   "
    echo "  | |/ _\` |/ _ \\/ _ \\/ __|  "
    echo "  | | (_| |  __/  __/\\__ \\  "
    echo " |___\\__,_|\\___|\\___|___/   "
    echo -e "${NC}"
    echo -e "${DIM}  Docker Deployment Assistant${NC}"
    echo
    echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo

    if [[ -n "$DOMAIN" ]]; then
        echo -e "  ${DIM}Current domain:${NC} ${BOLD}$DOMAIN${NC}"
        echo
    fi

    if [[ -n "$COMPOSE_CMD" ]]; then
        if $COMPOSE_CMD -f docker-compose.yml ps 2>/dev/null | grep -q "Up\|running"; then
            echo -e "  ${GREEN}Services are running${NC}"
        else
            echo -e "  ${DIM}Services not running${NC}"
        fi
    fi
    echo

    echo -e "${BOLD}$title${NC}\n"

    for i in "${!options[@]}"; do
        local num=$((i + 1))
        echo -e "  ${CYAN}${num})${NC} ${options[$i]}"
    done

    echo
    while true; do
        echo -ne "${BOLD}Enter choice [1-${num_options}]:${NC} "
        read choice
        
        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 ]] && [[ "$choice" -le "$num_options" ]]; then
            MENU_CHOICE=$((choice - 1))
            return 0
        else
            echo -e "${RED}Invalid choice. Please enter 1-${num_options}.${NC}"
        fi
    done
}

# ============================================================================
# Validation helpers
# ============================================================================

validate_domain() {
    local domain=$1
    [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$ ]]
}

validate_url() {
    local url=$1
    [[ $url =~ ^https?:// ]]
}

validate_email() {
    local email=$1
    [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]
}

# ============================================================================
# Configuration - All values stored in .env (single source of truth)
# ============================================================================

get_env_value() {
    local key=$1
    local value=""
    
    if [[ -f ".env" ]]; then
        value=$(grep -E "^${key}=" .env 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' || true)
    fi
    
    echo "$value"
}

set_env_value() {
    local key=$1
    local value=$2
    
    touch .env
    
    if grep -q "^${key}=" .env 2>/dev/null; then
        if [[ "$(uname)" == "Darwin" ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" .env
        else
            sed -i "s|^${key}=.*|${key}=${value}|" .env
        fi
    else
        echo "${key}=${value}" >> .env
    fi
}

load_current_config() {
    DOMAIN=$(get_env_value "DOMAIN")
    SITE_NAME=$(get_env_value "NEXT_PUBLIC_SITE_NAME")
    TURNSTILE_KEY=$(get_env_value "NEXT_PUBLIC_TURNSTILE_SITE_KEY")
    TWITTER_URL=$(get_env_value "NEXT_PUBLIC_TWITTER_URL")
    YOUTUBE_URL=$(get_env_value "NEXT_PUBLIC_YOUTUBE_URL")
    BLOG_URL=$(get_env_value "NEXT_PUBLIC_BLOG_URL")
    BLOG_DOMAIN=$(get_env_value "NEXT_PUBLIC_BLOG_DOMAIN")
    WORDPRESS_API_URL=$(get_env_value "WORDPRESS_API_URL")
    SMTP_HOST=$(get_env_value "SMTP_HOST")
    SMTP_PORT=$(get_env_value "SMTP_PORT")
    SMTP_USER=$(get_env_value "SMTP_USER")
    SMTP_PASS=$(get_env_value "SMTP_PASS")
    SMTP_FROM=$(get_env_value "SMTP_FROM")
    SMTP_SECURE=$(get_env_value "SMTP_SECURE")

    # Fallback: extract domain from NEXT_PUBLIC_SITE_URL if DOMAIN not set
    if [[ -z "$DOMAIN" ]]; then
        local site_url=$(get_env_value "NEXT_PUBLIC_SITE_URL")
        if [[ -n "$site_url" ]]; then
            DOMAIN=$(echo "$site_url" | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1)
        fi
    fi

    # Set defaults
    [[ -z "$SITE_NAME" ]] && SITE_NAME="Idees" || true
    [[ -z "$SMTP_PORT" ]] && SMTP_PORT="587" || true
    [[ -z "$SMTP_SECURE" ]] && SMTP_SECURE="false" || true
}

# ============================================================================
# System checks
# ============================================================================

check_prerequisites() {
    print_section "Checking prerequisites"

    # Check Docker
    echo -n "  Docker............ "
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        print_success "OK"
    else
        print_error "NOT FOUND"
        echo
        print_error "Docker is not installed or not running."
        print_info "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # Check Docker Compose
    echo -n "  Docker Compose.... "
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        print_success "OK"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_success "OK (legacy)"
    else
        print_error "NOT FOUND"
        echo
        print_error "Docker Compose is not available."
        exit 1
    fi

    # Check required files
    echo -n "  docker-compose.yml "
    if [[ -f "docker-compose.yml" ]]; then
        print_success "OK"
    else
        print_error "NOT FOUND"
        echo
        print_error "docker-compose.yml not found. Are you in the project directory?"
        exit 1
    fi

    echo -n "  Caddyfile......... "
    if [[ -f "Caddyfile" ]]; then
        print_success "OK"
    else
        print_error "NOT FOUND"
        echo
        print_error "Caddyfile not found."
        exit 1
    fi

    echo
}

create_directories() {
    print_info "Creating data directories..."
    mkdir -p docker-data/pb_data docker-data/pb_public docker-data/caddy_data docker-data/caddy_config
    print_success "Directories ready"
}

# ============================================================================
# Configuration wizards
# ============================================================================

configure_domain() {
    print_section "Domain Configuration"

    if [[ -n "$DOMAIN" ]]; then
        print_info "Current domain: $DOMAIN"
        echo
        if ask_yes_no "Keep this domain?"; then
            return
        fi
    fi

    while true; do
        DOMAIN=$(ask_input "Enter your domain (e.g., idees.example.com)" "$DOMAIN")

        if validate_domain "$DOMAIN"; then
            print_success "Domain set to: $DOMAIN"
            break
        else
            print_error "Invalid domain format. Please try again."
        fi
    done
}

configure_site() {
    print_section "Site Configuration"

    SITE_NAME=$(ask_input "Site name" "$SITE_NAME")

    echo
    print_dim "Cloudflare Turnstile protects your forms from spam bots."
    print_dim "Get a free key at: https://dash.cloudflare.com/turnstile"
    echo

    if ask_yes_no "Configure Turnstile CAPTCHA?" "n"; then
        TURNSTILE_KEY=$(ask_input "Turnstile site key" "$TURNSTILE_KEY")
    else
        TURNSTILE_KEY=""
    fi
}

configure_social() {
    print_section "Social Media Links (Optional)"

    print_dim "These will appear in your site footer."
    echo

    TWITTER_URL=$(ask_input "Twitter/X URL (leave empty to skip)" "$TWITTER_URL")
    YOUTUBE_URL=$(ask_input "YouTube URL (leave empty to skip)" "$YOUTUBE_URL")
}

configure_blog() {
    print_section "Blog Integration"

    print_dim "Connect your WordPress blog to show recent posts."
    echo

    if [[ -z "$BLOG_URL" ]]; then
        BLOG_URL="https://$DOMAIN"
    fi

    BLOG_URL=$(ask_input "Blog URL" "$BLOG_URL")
    BLOG_DOMAIN=$(echo "$BLOG_URL" | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1)

    if [[ -z "$WORDPRESS_API_URL" ]]; then
        WORDPRESS_API_URL="$BLOG_URL/wp-json/wp/v2/posts"
    fi

    WORDPRESS_API_URL=$(ask_input "WordPress API URL" "$WORDPRESS_API_URL")
}

configure_smtp() {
    print_section "Email Configuration (SMTP)"

    print_dim "Required for email notifications (password reset, follow updates)."
    echo

    if ask_yes_no "Configure SMTP now?" "y"; then
        SMTP_HOST=$(ask_input "SMTP host" "$SMTP_HOST")
        SMTP_PORT=$(ask_input "SMTP port" "$SMTP_PORT")
        SMTP_USER=$(ask_input "SMTP username" "$SMTP_USER")
        SMTP_PASS=$(ask_input "SMTP password" "$SMTP_PASS" true)
        SMTP_FROM=$(ask_input "From email address" "$SMTP_FROM")

        if ask_yes_no "Use TLS/SSL?" "n"; then
            SMTP_SECURE="true"
        else
            SMTP_SECURE="false"
        fi
    else
        print_warning "Skipping SMTP. Email features will be disabled."
    fi
}

show_config_summary() {
    print_section "Configuration Summary"

    echo -e "  ${BOLD}Domain:${NC}      $DOMAIN"
    echo -e "  ${BOLD}Site Name:${NC}   $SITE_NAME"

    if [[ -n "$TURNSTILE_KEY" ]]; then
        echo -e "  ${BOLD}Turnstile:${NC}   ${GREEN}Enabled${NC}"
    else
        echo -e "  ${BOLD}Turnstile:${NC}   ${DIM}Disabled${NC}"
    fi

    if [[ -n "$TWITTER_URL" ]]; then
        echo -e "  ${BOLD}Twitter:${NC}     $TWITTER_URL"
    fi

    if [[ -n "$YOUTUBE_URL" ]]; then
        echo -e "  ${BOLD}YouTube:${NC}     $YOUTUBE_URL"
    fi

    echo -e "  ${BOLD}Blog URL:${NC}    $BLOG_URL"

    if [[ -n "$SMTP_HOST" ]]; then
        echo -e "  ${BOLD}SMTP:${NC}        $SMTP_HOST:$SMTP_PORT"
    else
        echo -e "  ${BOLD}SMTP:${NC}        ${DIM}Not configured${NC}"
    fi

    echo
}

# ============================================================================
# File updates - .env is the single source of truth, Caddyfile needs domain
# ============================================================================

save_env_config() {
    print_info "Saving configuration to .env..."

    set_env_value "DOMAIN" "$DOMAIN"
    set_env_value "NEXT_PUBLIC_SITE_NAME" "$SITE_NAME"
    set_env_value "NEXT_PUBLIC_TURNSTILE_SITE_KEY" "$TURNSTILE_KEY"
    set_env_value "NEXT_PUBLIC_TWITTER_URL" "$TWITTER_URL"
    set_env_value "NEXT_PUBLIC_YOUTUBE_URL" "$YOUTUBE_URL"
    set_env_value "NEXT_PUBLIC_BLOG_URL" "$BLOG_URL"
    set_env_value "NEXT_PUBLIC_BLOG_DOMAIN" "$BLOG_DOMAIN"
    set_env_value "WORDPRESS_API_URL" "$WORDPRESS_API_URL"
    
    if [[ -n "$SMTP_HOST" ]]; then
        set_env_value "SMTP_HOST" "$SMTP_HOST"
        set_env_value "SMTP_PORT" "$SMTP_PORT"
        set_env_value "SMTP_USER" "$SMTP_USER"
        set_env_value "SMTP_PASS" "$SMTP_PASS"
        set_env_value "SMTP_FROM" "$SMTP_FROM"
        set_env_value "SMTP_SECURE" "$SMTP_SECURE"
    fi

    print_success ".env updated"
}

update_caddyfile() {
    print_info "Updating Caddyfile..."

    cp Caddyfile Caddyfile.backup

    if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "1s/^[^{]*{/$DOMAIN {/" Caddyfile
    else
        sed -i "1s/^[^{]*{/$DOMAIN {/" Caddyfile
    fi

    print_success "Caddyfile updated"
}

# ============================================================================
# PocketBase SMTP Configuration
# ============================================================================

configure_pocketbase_smtp() {
    print_section "Configure PocketBase SMTP"
    
    load_current_config
    
    if [[ -z "$SMTP_HOST" ]]; then
        print_error "No SMTP configuration found in .env"
        print_info "Please configure SMTP first using 'Configure settings' option."
        return 1
    fi
    
    print_info "This will sync your .env SMTP settings to PocketBase."
    print_dim "PocketBase uses these for password reset and email verification."
    echo
    print_info "Current SMTP settings from .env:"
    echo -e "  Host: ${BOLD}$SMTP_HOST:$SMTP_PORT${NC}"
    echo -e "  User: ${BOLD}$SMTP_USER${NC}"
    echo -e "  From: ${BOLD}$SMTP_FROM${NC}"
    echo
    
    local pb_url="https://$DOMAIN"
    
    if ! $COMPOSE_CMD -f docker-compose.yml ps 2>/dev/null | grep -q "pocketbase.*Up\|pocketbase.*running"; then
        print_error "PocketBase is not running. Please deploy first."
        return 1
    fi
    
    print_info "Enter your PocketBase admin credentials:"
    local admin_email=$(ask_input "Admin email" "")
    local admin_pass=$(ask_input "Admin password" "" true)
    
    if [[ -z "$admin_email" || -z "$admin_pass" ]]; then
        print_error "Admin credentials required."
        return 1
    fi
    
    print_info "Authenticating with PocketBase..."
    
    local auth_response=$(curl -s -X POST "${pb_url}/api/admins/auth-with-password" \
        -H "Content-Type: application/json" \
        -d "{\"identity\":\"${admin_email}\",\"password\":\"${admin_pass}\"}" 2>/dev/null)
    
    local token=$(echo "$auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [[ -z "$token" ]]; then
        print_error "Authentication failed. Check your credentials."
        print_dim "Response: $auth_response"
        return 1
    fi
    
    print_success "Authenticated successfully"
    print_info "Updating PocketBase SMTP settings..."
    
    local tls_enabled="false"
    [[ "$SMTP_SECURE" == "true" ]] && tls_enabled="true"
    
    local sender_name="$SITE_NAME"
    [[ -z "$sender_name" ]] && sender_name="Idees"
    
    local settings_payload=$(cat <<EOF
{
    "smtp": {
        "enabled": true,
        "host": "$SMTP_HOST",
        "port": $SMTP_PORT,
        "username": "$SMTP_USER",
        "password": "$SMTP_PASS",
        "tls": $tls_enabled,
        "authMethod": "",
        "localName": ""
    },
    "meta": {
        "senderName": "$sender_name",
        "senderAddress": "$SMTP_FROM"
    }
}
EOF
)
    
    local update_response=$(curl -s -X PATCH "${pb_url}/api/settings" \
        -H "Content-Type: application/json" \
        -H "Authorization: $token" \
        -d "$settings_payload" 2>/dev/null)
    
    if echo "$update_response" | grep -q '"smtp"'; then
        print_success "PocketBase SMTP configured successfully!"
        echo
        print_info "PocketBase will now use:"
        echo -e "  Server: ${BOLD}$SMTP_HOST:$SMTP_PORT${NC}"
        echo -e "  Sender: ${BOLD}$sender_name <$SMTP_FROM>${NC}"
        echo
        print_dim "You can verify in PocketBase Admin: ${pb_url}/_/#/settings/mail"
    else
        print_error "Failed to update settings."
        print_dim "Response: $update_response"
        return 1
    fi
}

# ============================================================================
# Deployment
# ============================================================================

deploy() {
    print_section "Deploying"

    print_info "Building and starting containers (app, pocketbase, caddy)..."
    print_dim "This may take several minutes on first run..."
    echo

    # Use -f to explicitly use only docker-compose.yml (ignore override for production)
    if $COMPOSE_CMD -f docker-compose.yml up -d --build; then
        echo
        print_success "Deployment successful!"
    else
        echo
        print_error "Deployment failed. Check the output above."
        exit 1
    fi
}

show_status() {
    print_section "Service Status"
    if [[ -n "$COMPOSE_CMD" ]]; then
        $COMPOSE_CMD -f docker-compose.yml ps
    else
        print_error "Docker Compose not available"
    fi
}

show_logs() {
    print_section "Recent Logs"
    if [[ -n "$COMPOSE_CMD" ]]; then
        $COMPOSE_CMD -f docker-compose.yml logs --tail=50
    else
        print_error "Docker Compose not available"
    fi
}

show_completion() {
    echo
    echo -e "${GREEN}${BOLD}"
    echo "  Deployment Complete!"
    echo -e "${NC}"

    echo -e "  ${BOLD}Your site:${NC}       https://$DOMAIN"
    echo -e "  ${BOLD}PocketBase Admin:${NC} https://$DOMAIN/_/"
    echo

    print_dim "  On first visit to PocketBase Admin, you'll create your superuser account."
    echo

    print_section "Useful Commands"
    echo "  View logs:     $COMPOSE_CMD -f docker-compose.yml logs -f"
    echo "  Stop:          $COMPOSE_CMD -f docker-compose.yml down"
    echo "  Restart:       $COMPOSE_CMD -f docker-compose.yml restart"
    echo "  Update:        git pull && $COMPOSE_CMD -f docker-compose.yml up -d --build"
    echo
}

# ============================================================================
# Main menu
# ============================================================================

main_menu() {
    while true; do
        show_menu "What would you like to do?" \
            "Deploy / Redeploy" \
            "Test deployment locally" \
            "Configure settings" \
            "Configure PocketBase SMTP" \
            "View service status" \
            "View logs" \
            "Stop services" \
            "Exit"
        local choice=$MENU_CHOICE

        case $choice in
            0) # Deploy
                print_header
                check_prerequisites
                create_directories

                if [[ -z "$DOMAIN" ]]; then
                    load_current_config
                fi

                if [[ -z "$DOMAIN" ]]; then
                    # First time setup - run full wizard
                    configure_domain
                    configure_site
                    configure_social
                    configure_blog
                    configure_smtp
                else
                    # Already configured - ask if they want to reconfigure
                    show_config_summary
                    if ask_yes_no "Reconfigure before deploying?" "n"; then
                        configure_domain
                        configure_site
                        configure_social
                        configure_blog
                        configure_smtp
                    fi
                fi

                show_config_summary

                if ask_yes_no "Proceed with deployment?"; then
                    save_env_config
                    update_caddyfile
                    deploy
                    show_completion

                    echo
                    read -p "Press Enter to continue..."
                fi
                ;;
            1) # Test deployment
                print_header
                if [[ -f "./test-deployment.sh" ]]; then
                    print_section "Running Deployment Tests"
                    print_dim "This will build and test the full Docker stack locally using HTTP."
                    print_dim "No HTTPS certificates needed - tests run on localhost:8080."
                    echo
                    if ask_yes_no "Run deployment tests now?"; then
                        ./test-deployment.sh
                        echo
                        read -p "Press Enter to continue..."
                    fi
                else
                    print_error "test-deployment.sh not found"
                    echo
                    read -p "Press Enter to continue..."
                fi
                ;;
            2) # Configure
                print_header
                load_current_config
                configure_domain
                configure_site
                configure_social
                configure_blog
                configure_smtp
                show_config_summary

                if ask_yes_no "Save configuration?"; then
                    save_env_config
                    update_caddyfile
                    print_success "Configuration saved!"
                fi

                echo
                read -p "Press Enter to continue..."
                ;;
            3) # Configure PocketBase SMTP
                print_header
                configure_pocketbase_smtp
                echo
                read -p "Press Enter to continue..."
                ;;
            4) # Status
                print_header
                show_status
                echo
                read -p "Press Enter to continue..."
                ;;
            5) # Logs
                print_header
                show_logs
                echo
                read -p "Press Enter to continue..."
                ;;
            6) # Stop
                print_header
                if ask_yes_no "Stop all services?"; then
                    $COMPOSE_CMD -f docker-compose.yml down
                    print_success "Services stopped"
                fi
                echo
                read -p "Press Enter to continue..."
                ;;
            7) # Exit
                echo
                print_info "Goodbye!"
                exit 0
                ;;
        esac
    done
}

# ============================================================================
# Quick deploy mode (non-interactive, for CI/CD or SSH one-liners)
# ============================================================================

quick_deploy() {
    print_header
    check_prerequisites
    create_directories
    load_current_config

    if [[ -z "$DOMAIN" ]]; then
        print_error "No configuration found. Run interactively first: ./deploy.sh"
        exit 1
    fi

    print_info "Quick deploy using existing configuration..."
    show_config_summary

    deploy
    show_completion
}

# ============================================================================
# Entry point
# ============================================================================

# Trap to restore cursor on exit
trap 'tput cnorm 2>/dev/null' EXIT

# Check for quick deploy flag
if [[ "$1" == "--quick" || "$1" == "-q" ]]; then
    quick_deploy
    exit 0
fi

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Idees Docker Deployment Assistant"
    echo
    echo "Usage:"
    echo "  ./deploy.sh          Interactive deployment wizard"
    echo "  ./deploy.sh --quick  Quick deploy using saved config"
    echo "  ./deploy.sh --help   Show this help"
    echo
    exit 0
fi

# Detect docker compose command early
detect_compose_cmd() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD=""
    fi
}

# Load existing config
load_current_config

# Detect compose command
detect_compose_cmd

# Run interactive menu
main_menu
