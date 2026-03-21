#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAX_PER_ACCOUNT="${1:-}"

IDS=$(node - <<'NODE'
const fs=require('fs');
const ads=JSON.parse(fs.readFileSync('/tmp/ads.json','utf8'));
const competitorIds=[...new Set(ads.filter(ad=>ad.displayFormat==='DCO').map(ad=>ad.competitorId))];
for(const id of competitorIds) console.log(id);
NODE
)

SUCCESS=0
FAILED=0
FAILED_ACCOUNTS=()

while IFS= read -r competitor_id; do
  [[ -z "$competitor_id" ]] && continue
  if [[ -n "$MAX_PER_ACCOUNT" ]]; then
    if "$ROOT_DIR/scripts/extract-dco-account-to-convex.sh" "$competitor_id" "$MAX_PER_ACCOUNT"; then
      SUCCESS=$((SUCCESS + 1))
    else
      FAILED=$((FAILED + 1))
      FAILED_ACCOUNTS+=("$competitor_id")
    fi
  else
    if "$ROOT_DIR/scripts/extract-dco-account-to-convex.sh" "$competitor_id"; then
      SUCCESS=$((SUCCESS + 1))
    else
      FAILED=$((FAILED + 1))
      FAILED_ACCOUNTS+=("$competitor_id")
    fi
  fi
done <<< "$IDS"

echo "Full DCO batch complete: ${SUCCESS} accounts succeeded, ${FAILED} accounts failed"
if [[ "$FAILED" -gt 0 ]]; then
  printf '%s
  echo "Failed account IDs saved to /tmp/dco_failed_accounts.txt"
fi
