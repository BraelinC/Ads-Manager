---
name: competitor-research
description: Complete competitor intelligence pipeline. Given a Facebook Page URL or niche, scrapes page info + all ads via Apify and stores everything in Convex. Handles large datasets with chunking.
---

# Competitor Research — Full Pipeline

Add competitors and their ads to Convex in one automated flow. Works with a Facebook Page URL or niche research.

**What this skill does:**
1. Scrapes Facebook Page info (ID, logo, socials) via Apify
2. Creates competitor record in Convex
3. Scrapes all their ads from Meta Ad Library via Apify
4. Uploads ads to Convex with proper chunking for large datasets

---

## Prerequisites

Required MCP tools:
- **Apify MCP** — `mcp__apify__*` tools must be available
- **Convex backend** — deployed at `https://formal-weasel-180.convex.cloud`

If Apify tools are not available, tell the user to configure the Apify MCP server and stop.

---

## Convex API Reference

**Base URL:** `https://formal-weasel-180.convex.cloud`

### Create competitor
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "competitors:create",
    "args": {
      "name": "Company Name",
      "category": "Ad Leader",
      "nicheIndustry": "Food/recipe content",
      "description": "What they do...",
      "status": "Active",
      "facebookPageUrl": "https://facebook.com/pagename",
      "facebookPageId": "AD_LIBRARY_ID_HERE",
      "adLibraryUrl": "https://facebook.com/ads/library/?...",
      "website": "https://example.com",
      "instagramUrl": "https://instagram.com/handle",
      "youtubeUrl": "https://youtube.com/@channel",
      "tiktokUrl": "https://tiktok.com/@handle",
      "dateAdded": "2026-03-20",
      "logoUrl": "https://..."
    },
    "format": "json"
  }'
```
**Returns:** `{"status":"success","value":"COMPETITOR_ID"}`

### Create ads (batch)
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ads:createMany",
    "args": {
      "ads": [
        {
          "competitorId": "COMPETITOR_ID",
          "adArchiveId": "123456789",
          "adLibraryUrl": "https://facebook.com/ads/library/?id=123456789",
          "headline": "Ad headline",
          "bodyText": "Ad body text",
          "ctaText": "Learn More",
          "displayFormat": "VIDEO",
          "videoHdUrl": "https://...",
          "videoSdUrl": "https://...",
          "thumbnailUrl": "https://...",
          "imageUrl": "https://...",
          "landingPageUrl": "https://...",
          "platforms": ["FACEBOOK", "INSTAGRAM"],
          "startDate": "2026-03-01",
          "isActive": true,
          "isWinner": true,
          "daysRunning": 45,
          "position": 1
        }
      ]
    },
    "format": "json"
  }'
```

### Get ad stats
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -d '{"path": "ads:getStats", "args": {}}'
```

---

## Pipeline Steps

### Step 1: Parse Input

The user provides either:
- **Facebook Page URL** (e.g., `https://www.facebook.com/buzzfeedtasty`)
- **Niche/industry** to research competitors

If URL provided, extract the page slug (e.g., `buzzfeedtasty`).

---

### Step 2: Scrape Facebook Page Info

Use Apify Facebook Pages Scraper:

```
mcp__apify__call-actor
actor: "apify/facebook-pages-scraper"
input: {
  "startUrls": [{"url": "https://www.facebook.com/PAGE_SLUG/"}]
}
```

**Extract from response:**
```
name = item.title
ad_library_id = item.pageAdLibrary.id    # CRITICAL: Use this, NOT pageId
logo_url = item.profilePictureUrl
website = item.website
instagram = item.instagram[0].url
youtube = item.youtube[0].url
tiktok = item.tiktok[0].url
followers = item.followers
```

**IMPORTANT:** Facebook has TWO IDs:
- `pageId` (100...) — Profile ID, does NOT work for Ad Library
- `pageAdLibrary.id` — This is the correct ID for Ad Library URLs

Build Ad Library URL:
```
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id={ad_library_id}
```

---

### Step 3: Create Competitor in Convex

Use Bash to call the Convex API:

```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "competitors:create",
    "args": {
      "name": "...",
      "category": "Ad Leader",
      "nicheIndustry": "...",
      "description": "...",
      "status": "Active",
      "facebookPageUrl": "https://www.facebook.com/PAGE_SLUG/",
      "facebookPageId": "AD_LIBRARY_ID",
      "adLibraryUrl": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=AD_LIBRARY_ID",
      "website": "...",
      "instagramUrl": "...",
      "youtubeUrl": "...",
      "tiktokUrl": "...",
      "dateAdded": "YYYY-MM-DD",
      "logoUrl": "..."
    },
    "format": "json"
  }'
```

**Save the returned COMPETITOR_ID** — you need it for ads.

---

### Step 4: Scrape Ads from Ad Library

Use Apify Facebook Ads Scraper:

```
mcp__apify__call-actor
actor: "apify/facebook-ads-scraper"
input: {
  "startUrls": [{"url": "AD_LIBRARY_URL"}],
  "resultsLimit": 100
}
```

**CRITICAL: Handle Large Outputs**

Apify returns a `datasetId`. Use `mcp__apify__get-actor-output` to fetch data IN CHUNKS:

```
mcp__apify__get-actor-output
datasetId: "DATASET_ID"
offset: 0
limit: 10   # Start small to avoid token limits
```

If output exceeds token limits, it saves to a file. You MUST:
1. Note the file path from the error message
2. Create a Node.js script to process the file
3. Run the script to insert ads

---

### Step 5: Transform & Upload Ads

**Option A: Small dataset (< 20 ads)**

Transform each ad inline and use Bash + curl to call `ads:createMany`.

**Option B: Large dataset (20+ ads) — USE THIS APPROACH**

Create a Node.js script in `/home/braelin/competitor-dashboard/scripts/`:

```javascript
// insert-COMPETITOR.mjs
import { readFileSync } from 'fs';

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";
const COMPETITOR_ID = "PASTE_COMPETITOR_ID_HERE";

function calculateDaysRunning(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  return Math.floor((today - start) / (1000 * 60 * 60 * 24));
}

function transformAd(item, position) {
  const startDate = item.start_date || item.startDateFormatted;
  const daysRunning = calculateDaysRunning(startDate);

  // Handle nested fields (Apify uses dot notation in keys)
  const video = item["snapshot.videos"]?.[0] || item.snapshot?.videos?.[0];
  const image = item["snapshot.images"]?.[0] || item.snapshot?.images?.[0];
  const bodyText = item["snapshot.body.text"] || item.snapshot?.body?.text || "";
  const title = item["snapshot.title"] || item.snapshot?.title;
  const ctaText = item["snapshot.cta_text"] || item.snapshot?.cta_text;
  const displayFormat = item["snapshot.displayFormat"] || item.snapshot?.display_format || "VIDEO";
  const linkUrl = item["snapshot.link_url"] || item.snapshot?.link_url;

  return {
    competitorId: COMPETITOR_ID,
    adArchiveId: item.ad_archive_id || item.adArchiveId || `gen_${Date.now()}_${position}`,
    adLibraryUrl: item.ad_library_url || item.adLibraryUrl ||
      `https://www.facebook.com/ads/library/?id=${item.ad_archive_id || 'unknown'}`,
    headline: title || undefined,
    bodyText: bodyText || "No body text",
    ctaText: ctaText || undefined,
    displayFormat: displayFormat,
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: image?.resized_image_url || image?.original_image_url || undefined,
    landingPageUrl: linkUrl || undefined,
    platforms: item.publisherPlatform || item.publisher_platform || ["FACEBOOK"],
    startDate: startDate ? new Date(startDate).toISOString().split("T")[0] : "2026-01-01",
    isActive: item.isActive ?? item.is_active ?? true,
    isWinner: daysRunning >= 30,
    daysRunning,
    position,
  };
}

async function insertBatch(ads) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: "ads:createMany", args: { ads }, format: "json" })
  });
  if (!response.ok) {
    console.error('Batch failed:', await response.text());
    return false;
  }
  return true;
}

async function main() {
  // Read the Apify output file
  const file = 'PASTE_FILE_PATH_HERE';
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const items = data.items || data;

  console.log(`Processing ${items.length} ads...`);

  // Transform all ads
  const ads = items.map((item, i) => transformAd(item, i + 1));

  // Insert in batches of 5 (Convex has limits)
  const BATCH_SIZE = 5;
  let inserted = 0;

  for (let i = 0; i < ads.length; i += BATCH_SIZE) {
    const batch = ads.slice(i, i + BATCH_SIZE);
    const ok = await insertBatch(batch);
    if (ok) {
      inserted += batch.length;
      console.log(`  Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(ads.length/BATCH_SIZE)} done (${inserted}/${ads.length})`);
    }
  }

  console.log(`✓ Inserted ${inserted} ads for competitor`);
}

main().catch(console.error);
```

**Run the script:**
```bash
cd /home/braelin/competitor-dashboard && node scripts/insert-COMPETITOR.mjs
```

---

### Step 6: Handle Chunked Apify Output

When `get-actor-output` returns too much data, it saves to a file like:
```
/home/braelin/.claude/projects/.../tool-results/mcp-apify-get-actor-output-TIMESTAMP.txt
```

To process ALL data, call `get-actor-output` multiple times with offset:

```
# First batch
mcp__apify__get-actor-output
datasetId: "..."
offset: 0
limit: 10

# Second batch
mcp__apify__get-actor-output
datasetId: "..."
offset: 10
limit: 10

# Continue until you have all items
```

Or create one script that reads the saved file directly (the file contains the full JSON).

---

### Step 7: Verify

Check the stats:

```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -d '{"path": "ads:getStats", "args": {}}'
```

Expected output:
```json
{
  "totalAds": 307,
  "winnerAds": 147,
  "videoAds": 131,
  "imageAds": 17,
  "activeAds": 307
}
```

---

## Quick Reference: Ad Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| competitorId | Id<"competitors"> | Yes | Convex competitor ID |
| adArchiveId | string | Yes | Facebook's ad archive ID |
| adLibraryUrl | string | Yes | Link to ad in library |
| headline | string | No | Ad headline/title |
| bodyText | string | Yes | Main ad text |
| ctaText | string | No | Call-to-action text |
| displayFormat | string | Yes | VIDEO, IMAGE, DCO, DPA |
| videoHdUrl | string | No | HD video URL |
| videoSdUrl | string | No | SD video URL |
| thumbnailUrl | string | No | Video thumbnail |
| imageUrl | string | No | Image URL |
| landingPageUrl | string | No | Destination URL |
| platforms | string[] | Yes | FACEBOOK, INSTAGRAM, etc |
| startDate | string | Yes | YYYY-MM-DD format |
| isActive | boolean | Yes | Currently running |
| isWinner | boolean | Yes | Running 30+ days |
| daysRunning | number | Yes | Days since start |
| position | number | No | Position in results |

---

## Competitor Schema

| Field | Type | Description |
|-------|------|-------------|
| name | string | Company/brand name |
| category | "Micro-Niche" \| "Macro-Niche" \| "Ad Leader" | Tier |
| nicheIndustry | string | What space they're in |
| description | string | What they sell |
| status | "Active" \| "Inactive" | Current status |
| facebookPageUrl | string | Facebook page URL |
| facebookPageId | string | **Ad Library ID** (from pageAdLibrary.id) |
| adLibraryUrl | string | Direct Ad Library link |
| website | string | Main website |
| instagramUrl | string | Instagram profile |
| youtubeUrl | string | YouTube channel |
| tiktokUrl | string | TikTok profile |
| linkedinUrl | string | LinkedIn page |
| dateAdded | string | YYYY-MM-DD |
| logoUrl | string | Profile picture URL |

---

## Common Issues & Fixes

### "No ads found for competitor"
The competitorId in ads doesn't match. Check:
1. The competitor was created and you have the correct ID
2. Ads were inserted with that exact ID

### Apify output too large
Use chunked fetching with offset/limit, or read from the saved file directly.

### Ad Library URL returns empty
You used the wrong Facebook ID. Always use `pageAdLibrary.id`, NOT `pageId`.

### Batch insert fails
Reduce batch size from 5 to 3. Convex has payload limits.

---

## Example: Full Pipeline for One Competitor

```
User: https://www.facebook.com/buzzfeedtasty

1. Call apify/facebook-pages-scraper with that URL
   → Get: name="Tasty", adLibraryId="1614251518827491", logo, socials

2. Call Convex competitors:create
   → Get: competitorId="j5787jr9nafkaw06w7w5mzj9yh83b78x"

3. Call apify/facebook-ads-scraper with Ad Library URL
   → Get: datasetId="iRnssO2FUSxSiLJT6", 49 ads

4. Call get-actor-output with offset=0, limit=10
   → If file saved, create insert script

5. Run insert script
   → Ads uploaded to Convex

6. Verify with ads:getStats
   → Done!
```
