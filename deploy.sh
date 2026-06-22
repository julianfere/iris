#!/usr/bin/env bash
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'

step()  { echo -e "\n${BLUE}▶${NC} ${BOLD}$*${NC}"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
die()   { echo -e "${RED}✗${NC} $*"; exit 1; }
timing(){ echo -e "${DIM}  ($1s)${NC}"; }

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/carrete-app"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml"

cd "$SCRIPT_DIR"

t() { date +%s; }

# ── Check for remote changes ──────────────────────────────────────────────────
step "Checking for updates..."
git fetch --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "@{u}" 2>/dev/null || echo "")

if [[ -z "$REMOTE" ]]; then
  warn "No upstream branch configured. Deploying current local state."
elif [[ "$LOCAL" = "$REMOTE" ]]; then
  warn "Already up to date ($(git rev-parse --short HEAD))."
  printf "Deploy anyway? [y/N] "
  read -r answer
  [[ "$answer" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
else
  COMMITS=$(git rev-list --count HEAD..@{u})
  echo -e "\n${BOLD}$COMMITS commit$([ "$COMMITS" -gt 1 ] && echo s) to deploy:${NC}"
  git log HEAD..@{u} --oneline --color=always | sed 's/^/  /'
  echo ""
fi

# ── Pull ─────────────────────────────────────────────────────────────────────
step "Pulling changes..."
git pull --quiet
ok "Now at $(git rev-parse --short HEAD) — $(git log -1 --format='%s')"

# ── Tag current image for rollback ───────────────────────────────────────────
step "Saving rollback snapshot..."
if docker image inspect carrete:latest &>/dev/null; then
  docker tag carrete:latest carrete:rollback
  ok "Rollback snapshot saved"
else
  warn "No existing image — skipping rollback snapshot (first deploy)"
fi

# ── Build ────────────────────────────────────────────────────────────────────
step "Building new image..."
T0=$(t)
$COMPOSE build --quiet
timing $(($(t) - T0))
ok "Image built"

# ── Swap ─────────────────────────────────────────────────────────────────────
step "Swapping container..."
T0=$(t)
$COMPOSE up -d

# Poll /api/health every second instead of waiting on docker's slow interval
MAX_WAIT=90
echo -ne "  Waiting for health"
HEALTHY=false
for i in $(seq 1 $MAX_WAIT); do
  if wget -qO- http://localhost:3000/api/health &>/dev/null; then
    HEALTHY=true
    break
  fi
  echo -ne "."
  sleep 1
done
echo ""

if $HEALTHY; then
  timing $(($(t) - T0))
  ok "Container is healthy"
else
  warn "Container didn't respond after ${MAX_WAIT}s — rolling back..."
  if docker image inspect carrete:rollback &>/dev/null; then
    docker tag carrete:rollback carrete:latest
    $COMPOSE up -d
    die "Rolled back. Check logs: docker logs carrete"
  else
    die "No rollback snapshot. Check logs: docker logs carrete"
  fi
fi

# ── Cleanup ──────────────────────────────────────────────────────────────────
step "Cleaning up dangling images..."
docker image prune -f --quiet

# ── Summary ──────────────────────────────────────────────────────────────────
CONTAINER_STATUS=$(docker ps --filter name=carrete --format '{{.Status}}' | head -1)
echo ""
echo -e "${GREEN}${BOLD}✓ Deployed successfully${NC}"
echo -e "  ${DIM}Commit : $(git rev-parse --short HEAD)${NC}"
echo -e "  ${DIM}Status : $CONTAINER_STATUS${NC}"
