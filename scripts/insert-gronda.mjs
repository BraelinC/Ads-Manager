// Insert full Gronda ads into Convex
import { readFileSync } from 'fs';

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";
const COMPETITOR_ID = "j571axfhf85yqb84hzfe2dae8x83a619"; // Gronda

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(item) {
  const daysRunning = calculateDaysRunning(item.start_date);
  const video = item.snapshot?.videos?.[0];
  const image = item.snapshot?.images?.[0];

  return {
    competitorId: COMPETITOR_ID,
    adArchiveId: item.ad_archive_id,
    adLibraryUrl: item.ad_library_url || `https://www.facebook.com/ads/library/?id=${item.ad_archive_id}`,
    headline: item.snapshot?.title || undefined,
    bodyText: item.snapshot?.body?.text || "",
    ctaText: item.snapshot?.cta_text || undefined,
    displayFormat: item.snapshot?.display_format || "UNKNOWN",
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: image?.resized_image_url || image?.original_image_url || undefined,
    landingPageUrl: item.snapshot?.link_url || undefined,
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
  const file = '/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774060771462.txt';
  const data = JSON.parse(readFileSync(file, 'utf8'));

  // Skip first 5 (already inserted)
  const items = data.items.slice(5);
  const ads = items.map(item => transformAd(item));

  console.log(`Inserting ${ads.length} remaining Gronda ads...`);

  for (let i = 0; i < ads.length; i += 5) {
    const batch = ads.slice(i, i + 5);
    const ok = await insertBatch(batch);
    if (ok) console.log(`  Batch ${Math.floor(i/5) + 1}/${Math.ceil(ads.length/5)} done`);
    else console.error(`  Batch ${Math.floor(i/5) + 1} failed`);
  }

  console.log(`✓ Inserted ${ads.length} Gronda ads`);
}

main();
