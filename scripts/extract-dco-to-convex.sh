#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AD_ARCHIVE_ID="${1:-}"
TOTAL_VERSIONS="${2:-}"
MIN_WAIT="${DCO_WAIT_MIN:-1}"
MAX_WAIT="${DCO_WAIT_MAX:-5}"

random_sleep() {
  local min="$1"
  local max="$2"
  local span=$((max - min + 1))
  local delay=$((RANDOM % span + min))
  sleep "$delay"
}

if [[ -z "$AD_ARCHIVE_ID" ]]; then
  echo "Usage: scripts/extract-dco-to-convex.sh <ad_archive_id> [total_versions]" >&2
  exit 1
fi

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.local"
  set +a
fi

CONVEX_URL="${CONVEX_URL:-${NEXT_PUBLIC_CONVEX_URL:-}}"

if [[ -z "$CONVEX_URL" ]]; then
  echo "Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL" >&2
  exit 1
fi

PAYLOAD_FILE="/tmp/dco_capture_${AD_ARCHIVE_ID}.json"

EXISTING_COUNT=$(node - <<'NODE' "$CONVEX_URL" "$AD_ARCHIVE_ID"
const https = require('https');
const url = process.argv[2];
const adArchiveId = process.argv[3];
const body = JSON.stringify({ path: 'ads:listDcoVersions', args: { adArchiveId } });
const req = https.request(`${url}/api/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    process.stdout.write(String((parsed.value || []).length));
  });
});
req.on('error', (err) => { console.error(err); process.exit(1); });
req.write(body);
req.end();
NODE
)

if [[ "$EXISTING_COUNT" != "0" && "${FORCE_DCO_REEXTRACT:-0}" != "1" ]]; then
  echo "Skipping ${AD_ARCHIVE_ID}: already has ${EXISTING_COUNT} stored DCO version rows"
  exit 0
fi

echo "Capturing DCO versions for ${AD_ARCHIVE_ID}..."
random_sleep "$MIN_WAIT" "$MAX_WAIT"
node "$ROOT_DIR/scripts/live-dco-browser.js" "https://www.facebook.com/ads/library/?id=${AD_ARCHIVE_ID}" open-new >/tmp/dco_open_${AD_ARCHIVE_ID}.json
random_sleep "$MIN_WAIT" "$MAX_WAIT"
node "$ROOT_DIR/scripts/open-dco-ad-details.js" "$AD_ARCHIVE_ID" >/tmp/dco_details_${AD_ARCHIVE_ID}.json
random_sleep "$MIN_WAIT" "$MAX_WAIT"

if [[ -n "$TOTAL_VERSIONS" ]]; then
  node "$ROOT_DIR/scripts/capture-live-dco-versions.js" "$AD_ARCHIVE_ID" "$TOTAL_VERSIONS" > "$PAYLOAD_FILE"
else
  node "$ROOT_DIR/scripts/capture-live-dco-versions.js" "$AD_ARCHIVE_ID" > "$PAYLOAD_FILE"
fi

echo "Upserting captured versions into Convex..."
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(JSON.stringify({path:'ads:upsertDcoVersions', args:data, format:'json'}));" "$PAYLOAD_FILE" \
  | curl -sS -X POST "${CONVEX_URL}/api/mutation" -H "Content-Type: application/json" --data-binary @-

curl -sS -X POST "${CONVEX_URL}/api/mutation" \
  -H "Content-Type: application/json" \
  --data "{\"path\":\"ads:dedupeDcoVersions\",\"args\":{\"adArchiveIds\":[\"${AD_ARCHIVE_ID}\"]},\"format\":\"json\"}" >/tmp/dco_dedupe_${AD_ARCHIVE_ID}.json

echo
echo "Stored payload: $PAYLOAD_FILE"
