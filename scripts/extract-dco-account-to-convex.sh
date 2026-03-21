#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPETITOR_ID="${1:-}"
MAX_ADS="${2:-}"

if [[ -z "$COMPETITOR_ID" ]]; then
  echo "Usage: scripts/extract-dco-account-to-convex.sh <competitor_id> [max_ads]" >&2
  exit 1
fi

TMP_FILE="/tmp/dco_account_${COMPETITOR_ID}.json"

node - <<'NODE' "$COMPETITOR_ID" "$TMP_FILE"
const fs = require('fs');
const https = require('https');
const competitorId = process.argv[2];
const outFile = process.argv[3];
const body = JSON.stringify({ path: 'ads:listDcoAdsByCompetitor', args: { competitorId } });
const req = https.request('https://formal-weasel-180.convex.cloud/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync(outFile, data);
  });
});
req.on('error', (err) => { console.error(err); process.exit(1); });
req.write(body);
req.end();
NODE

COUNT=$(node -e "const fs=require('fs'); const payload=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const rows=payload.value||[]; const max=process.argv[2] ? Number(process.argv[2]) : rows.length; process.stdout.write(String(Math.min(rows.length, max)));" "$TMP_FILE" "$MAX_ADS")

echo "Running DCO extraction for ${COUNT} ads under competitor ${COMPETITOR_ID}..."

SUCCESS=0
FAILED=0
FAILED_IDS=()

node - <<'NODE' "$TMP_FILE" "$MAX_ADS" > /tmp/dco_account_ids_${COMPETITOR_ID}.txt
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const max = process.argv[3] ? Number(process.argv[3]) : undefined;
const rows = payload.value || [];
for (const row of rows.slice(0, max ?? rows.length)) {
  console.log(row.adArchiveId);
}
NODE

while IFS= read -r ad_id; do
  [[ -z "$ad_id" ]] && continue
  if "$ROOT_DIR/scripts/extract-dco-to-convex.sh" "$ad_id"; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAILED=$((FAILED + 1))
    FAILED_IDS+=("$ad_id")
    echo "Failed DCO extraction for ${ad_id}" >&2
  fi
done < "/tmp/dco_account_ids_${COMPETITOR_ID}.txt"

echo "Account ${COMPETITOR_ID} complete: ${SUCCESS} succeeded, ${FAILED} failed"
if [[ "$FAILED" -gt 0 ]]; then
  printf '%s
  echo "Failed IDs saved to /tmp/dco_account_failed_${COMPETITOR_ID}.txt"
fi
