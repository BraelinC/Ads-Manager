// Insert Tasty (BuzzFeed) ads into Convex
import { readFileSync } from 'fs';

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";
const COMPETITOR_ID = "j5787jr9nafkaw06w7w5mzj9yh83b78x"; // Tasty

function calculateDaysRunning(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  return Math.floor((today - start) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return undefined;
  return new Date(dateStr).toISOString().split("T")[0];
}

function transformAd(item) {
  const startDate = item.startDateFormatted || item.start_date;
  const daysRunning = calculateDaysRunning(startDate);

  // Handle different field name formats from Apify
  const video = item["snapshot.videos"]?.[0] || item.snapshot?.videos?.[0];
  const image = item["snapshot.images"]?.[0] || item.snapshot?.images?.[0];
  const bodyText = item["snapshot.body.text"] || item.snapshot?.body?.text || "";
  const title = item["snapshot.title"] || item.snapshot?.title;
  const ctaText = item["snapshot.cta_text"] || item.snapshot?.cta_text;
  const displayFormat = item["snapshot.displayFormat"] || item.snapshot?.display_format || "VIDEO";
  const linkUrl = item["snapshot.link_url"] || item.snapshot?.link_url;

  return {
    competitorId: COMPETITOR_ID,
    adArchiveId: item.ad_archive_id || item.adArchiveId || `tasty_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    adLibraryUrl: item.ad_library_url || item.adLibraryUrl || `https://www.facebook.com/ads/library/?id=${item.ad_archive_id || 'unknown'}`,
    headline: title || undefined,
    bodyText: bodyText,
    ctaText: ctaText || undefined,
    displayFormat: displayFormat,
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: image?.resized_image_url || image?.original_image_url || undefined,
    landingPageUrl: linkUrl || undefined,
    platforms: item.publisherPlatform || item.publisher_platform || ["FACEBOOK"],
    startDate: formatDate(startDate) || "2026-03-01",
    endDate: item.endDateFormatted ? formatDate(item.endDateFormatted) : undefined,
    isActive: item.isActive ?? true,
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
  const file = '/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774063668684.txt';
  const data = JSON.parse(readFileSync(file, 'utf8'));

  const items = data.items || [];
  const ads = items.map(item => transformAd(item));

  console.log(`Inserting ${ads.length} Tasty ads...`);

  for (let i = 0; i < ads.length; i += 5) {
    const batch = ads.slice(i, i + 5);
    const ok = await insertBatch(batch);
    if (ok) console.log(`  Batch ${Math.floor(i/5) + 1}/${Math.ceil(ads.length/5)} done`);
    else console.error(`  Batch ${Math.floor(i/5) + 1} failed`);
  }

  console.log(`✓ Inserted ${ads.length} Tasty ads`);
}

main();
