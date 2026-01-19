#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.test.yml"
BASE_URL="http://localhost:8080"
TIMEOUT=120

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Idees Deployment Test Suite${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILED=1; }
info() { echo -e "  ${YELLOW}→${NC} $1"; }

cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
    rm -rf docker-data/test_pb_data 2>/dev/null || true
}

wait_for_healthy() {
    local service=$1
    local max_wait=$2
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        if docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "(healthy)"; then
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
    done
    return 1
}

FAILED=0

print_header

if [ "$1" = "--cleanup" ]; then
    cleanup
    echo -e "${GREEN}Cleanup complete${NC}"
    exit 0
fi

trap cleanup EXIT

echo -e "${BLUE}[1/6] Prerequisites${NC}"
if command -v docker &> /dev/null && docker info &> /dev/null; then
    pass "Docker available"
else
    fail "Docker not available"
    exit 1
fi

if docker compose version &> /dev/null; then
    pass "Docker Compose available"
else
    fail "Docker Compose not available"
    exit 1
fi

if [ -f "$COMPOSE_FILE" ]; then
    pass "Test compose file exists"
else
    fail "Missing $COMPOSE_FILE"
    exit 1
fi

if [ -f "Caddyfile.test" ]; then
    pass "Test Caddyfile exists"
else
    fail "Missing Caddyfile.test"
    exit 1
fi

echo -e "\n${BLUE}[2/6] Building Images${NC}"
info "Building all services..."
echo -e "${DIM}"

if docker compose -f "$COMPOSE_FILE" build 2>&1; then
    echo -e "${NC}"
    pass "All images built successfully"
else
    echo -e "${NC}"
    fail "Image build failed"
    exit 1
fi

echo -e "\n${BLUE}[3/6] Starting Services${NC}"
info "Starting containers..."
echo -e "${DIM}"
docker compose -f "$COMPOSE_FILE" up -d 2>&1
echo -e "${NC}"

info "Waiting for PocketBase to be healthy..."
if wait_for_healthy "pocketbase" 60; then
    pass "PocketBase healthy"
else
    fail "PocketBase failed to become healthy"
    docker compose -f "$COMPOSE_FILE" logs pocketbase
fi

info "Creating test admin account..."
TEST_EMAIL="admin@test.local"
TEST_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)
if docker compose -f "$COMPOSE_FILE" exec -T pocketbase /pocketbase superuser upsert "$TEST_EMAIL" "$TEST_PASS" >/dev/null 2>&1; then
    pass "Test admin created: $TEST_EMAIL"
else
    info "Admin account may already exist or failed to create"
fi

info "Waiting for App to be healthy..."
if wait_for_healthy "app" 90; then
    pass "App healthy"
else
    fail "App failed to become healthy"
    docker compose -f "$COMPOSE_FILE" logs app
fi

info "Waiting for Caddy to be healthy..."
if wait_for_healthy "caddy" 30; then
    pass "Caddy healthy"
else
    fail "Caddy failed to become healthy"
    docker compose -f "$COMPOSE_FILE" logs caddy
fi

echo -e "\n${BLUE}[4/6] Health Endpoints${NC}"

sleep 3

response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    pass "Next.js health endpoint returns 200"
else
    fail "Next.js health endpoint returned $response (expected 200)"
fi

health_json=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo "{}")
if echo "$health_json" | grep -q '"pocketbase":"healthy"'; then
    pass "PocketBase connectivity verified via health endpoint"
else
    fail "PocketBase not healthy in response: $health_json"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    pass "PocketBase API routed correctly via /api/health"
else
    fail "PocketBase API routing failed (returned $response)"
fi

echo -e "\n${BLUE}[5/6] Page Routing${NC}"

response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    pass "Homepage loads (200)"
else
    fail "Homepage failed ($response)"
fi

homepage=$(curl -s "$BASE_URL/" 2>/dev/null || echo "")
if echo "$homepage" | grep -qi "idees\|suggestion"; then
    pass "Homepage contains expected content"
else
    fail "Homepage missing expected content"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/_/" 2>/dev/null || echo "000")
if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
    pass "PocketBase admin route accessible ($response)"
else
    fail "PocketBase admin route failed ($response)"
fi

echo -e "\n${BLUE}[6/6] Container Status${NC}"

for service in app pocketbase caddy; do
    running=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -c "\"$service\".*running" || echo "0")
    if [ "$running" -ge 1 ]; then
        pass "$service container running"
    else
        fail "$service container not running"
    fi
done

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}  All tests passed! Deployment is working correctly.${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    echo -e "${BOLD}URLs to test manually:${NC}"
    echo -e "  ${CYAN}Homepage:${NC}         $BASE_URL/"
    echo -e "  ${CYAN}Health check:${NC}     $BASE_URL/api/health"
    echo -e "  ${CYAN}PocketBase Admin:${NC} $BASE_URL/_/"
    echo
    echo -e "${BOLD}PocketBase Admin credentials:${NC}"
    echo -e "  ${CYAN}Email:${NC}    $TEST_EMAIL"
    echo -e "  ${CYAN}Password:${NC} $TEST_PASS"
    echo
    
    echo -ne "${BOLD}Keep services running to test manually? [y/N]:${NC} "
    read -r keep_running
    
    if [[ "$keep_running" =~ ^[Yy]$ ]]; then
        trap - EXIT
        echo
        echo -e "${GREEN}Services are running!${NC}"
        echo -e "Test your app at: ${CYAN}$BASE_URL/${NC}"
        echo
        echo -e "${DIM}Press Enter when done to cleanup...${NC}"
        read -r
        cleanup
    fi
    exit 0
else
    echo -e "${RED}  Some tests failed. Check logs above.${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    docker compose -f "$COMPOSE_FILE" logs
    exit 1
fi
