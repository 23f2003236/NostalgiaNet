#!/usr/bin/env bash
# NostalgiaNet smoke test — verifies the /api/upload route is alive.
#
# This route has been deleted and restored 4+ times by accident during
# narrow-scoped tasks that didn't touch upload code directly. Lint and
# tsc don't catch a missing route file — only a runtime 404 does.
#
# Run this after ANY change to the api/ folder structure, or before
# declaring the app "production-ready".
#
# Usage: bun run smoke   (or: bash scripts/smoke-test-upload.sh)
#
# Exit codes:
#   0 — all checks passed, route is alive
#   1 — file missing or route returns 404 (broken)
#   2 — dev server not running (curl failed)

set -euo pipefail

ROUTE_FILE="src/app/api/upload/route.ts"
UPLOAD_DIR="public/uploads"
URL="${BASE_URL:-http://localhost:3000}"

echo "── NostalgiaNet smoke test ──"
echo ""

# 1) Check the route file exists on disk
if [[ ! -f "$ROUTE_FILE" ]]; then
  echo "❌ FAIL: $ROUTE_FILE is missing!"
  echo "   This route has been deleted by accident multiple times."
  echo "   Restore it from git history or recreate it."
  exit 1
fi
echo "✓ Route file exists: $ROUTE_FILE ($(wc -l < "$ROUTE_FILE") lines)"

# 2) Check the uploads directory exists (where files get written)
if [[ ! -d "$UPLOAD_DIR" ]]; then
  echo "⚠️  Warning: $UPLOAD_DIR doesn't exist yet."
  echo "   It will be auto-created on first upload, but you may want to"
  echo "   commit an empty .gitkeep in it for production deploys."
else
  echo "✓ Uploads directory exists: $UPLOAD_DIR"
fi

# 3) Hit the endpoint and check it returns 401 (NOT 404).
#    401 = route exists, just needs auth → good
#    404 = route missing → BAD (the recurring bug)
#    000 = server unreachable → also bad
echo ""
echo "Hitting $URL/api/upload (POST, no auth)..."

# IMPORTANT: do NOT use `|| echo "000"` as a fallback here.
# curl with -w "%{http_code}" already writes "000" to stdout on connection
# failure, AND exits non-zero. If we add `|| echo "000"`, bash concatenates
# both outputs ("000000"), which never matches any of our checks below and
# silently falls through to "probably fine" + exit 0 — exactly the false
# confidence that caused the upload route to be silently broken 4 times.
#
# Also: this script uses `set -e` at the top. We need to temporarily disable
# it for this curl call, otherwise curl's non-zero exit on connection failure
# would kill the script before we can print a helpful message.
set +e
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/upload" 2>/dev/null)
set -e

if [[ -z "$STATUS" || "$STATUS" == "000" ]]; then
  echo "❌ FAIL: Couldn't reach $URL — is the dev server running?"
  echo "   Start it with: bun run dev"
  exit 2
fi

if [[ "$STATUS" == "404" ]]; then
  echo "❌ FAIL: /api/upload returned 404 — route is missing at runtime!"
  echo "   The file exists on disk but Next.js isn't seeing it."
  echo "   Try restarting the dev server, or check for typos in the path."
  exit 1
fi

if [[ "$STATUS" == "401" ]]; then
  echo "✓ Route is alive — returned 401 (needs auth, which is correct)"
elif [[ "$STATUS" == "405" ]]; then
  echo "✓ Route is alive — returned 405 (method not allowed, still alive)"
else
  echo "⚠️  Route returned HTTP $STATUS — check the dev log, but probably fine"
fi

echo ""
echo "── Smoke test passed ✓ ──"
echo ""
echo "Reminder: the upload route is the app's core feature."
echo "If you touched api/ folder structure, run this again after restarting the dev server."
