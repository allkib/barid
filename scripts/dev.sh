#!/usr/bin/env bash
set -euo pipefail

# Kill any stale Next.js dev servers on port 3000
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "Stopping existing dev server on port 3000..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

# Production build output (BUILD_ID) conflicts with next dev — always wipe it
if [[ -f .next/BUILD_ID ]] || [[ "${1:-}" == "--clean" ]]; then
  echo "Cleaning .next cache (required after npm run build)..."
  rm -rf .next node_modules/.cache
fi

exec npx next dev
