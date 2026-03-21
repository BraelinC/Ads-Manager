// Insert all competitor ads into Convex
import { readFileSync, readdirSync, existsSync } from 'fs';

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";

const COMPETITOR_MAP = {
  "0fyCMPCZYGDLnfazs": "j576w4b8wbrxpwd95veethb4j983ahff", // Cal AI
};

const TOOL_RESULTS_DIR = '/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results';

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(item, competitorId) {
  const daysRunning = calculateDaysRunning(item.start_date);
  const video = item["snapshot.videos"]?.[0];

  return {
    competitorId,
    adArchiveId: item.ad_archive_id,
    adLibraryUrl: item.ad_library_url,
    headline: item["snapshot.title"] || undefined,
    bodyText: item["snapshot.body.text"] || "",
    ctaText: item["snapshot.cta_text"] || undefined,
    displayFormat: item["snapshot.display_format"] || "VIDEO",
    videoHdUrl: video?.video_hd_url,
    videoSdUrl: video?.video_sd_url,
    thumbnailUrl: video?.video_preview_image_url,
    landingPageUrl: item["snapshot.link_url"] || undefined,
    platforms: item.publisher_platform || [],
    startDate: formatDate(item.start_date),
    endDate: item.end_date ? formatDate(item.end_date) : undefined,
    isActive: item.is_active ?? true,
    isWinner: daysRunning >= 30,
    daysRunning,
    position: item.position,
  };
}

async function insertBatch(ads) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: "ads:createMany", args: { ads }, format: "json" })
  });
  return response.ok;
}

async function main() {
  // Process Cal AI (from the latest file)
  const calAiFile = TOOL_RESULTS_DIR + '/mcp-apify-get-actor-output-1774059392215.txt';

  if (existsSync(calAiFile)) {
    const data = JSON.parse(readFileSync(calAiFile, 'utf8'));
    const competitorId = "j576w4b8wbrxpwd95veethb4j983ahff";
    const ads = data.items.map(item => transformAd(item, competitorId));

    console.log(`Inserting ${ads.length} Cal AI ads...`);

    for (let i = 0; i < ads.length; i += 5) {
      const batch = ads.slice(i, i + 5);
      const ok = await insertBatch(batch);
      if (ok) console.log(`  Batch ${Math.floor(i/5) + 1}/${Math.ceil(ads.length/5)} done`);
      else console.error(`  Batch ${Math.floor(i/5) + 1} failed`);
    }
  }

  console.log('Cal AI complete!');
}

main();
