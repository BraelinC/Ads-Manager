#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

node - <<'NODE' > /tmp/dco_missing_ids.txt
const fs = require('fs');
const https = require('https');
function post(path,args){
  return new Promise((resolve,reject)=>{
    const body = JSON.stringify({path,args});
    const req = https.request('https://formal-weasel-180.convex.cloud/api/query', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}
    }, res => {
      let data='';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data).value));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
(async()=>{
  const ads = await post('ads:list', {});
  const dcoAds = ads.filter(ad => ad.displayFormat === 'DCO');
  for (const ad of dcoAds) {
    const rows = await post('ads:listDcoVersions', { adArchiveId: ad.adArchiveId });
    if (rows.length === 0) console.log(ad.adArchiveId);
  }
})().catch(err => { console.error(err); process.exit(1); });
NODE

COUNT=$(wc -l < /tmp/dco_missing_ids.txt | tr -d ' ')
echo "Resuming ${COUNT} missing DCO ads..."

while IFS= read -r ad_id; do
  [[ -z "$ad_id" ]] && continue
  "$ROOT_DIR/scripts/extract-dco-to-convex.sh" "$ad_id" || echo "Failed DCO extraction for ${ad_id}" >&2
done < /tmp/dco_missing_ids.txt
