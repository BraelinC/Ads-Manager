import { readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const COMPETITOR_MAP = {
  "129214221876606": "j57fw9g67hx7bcw5dhttqb7sfs83b838", // ReciMe
  "311353912066626": "j576w4b8wbrxpwd95veethb4j983ahff", // Cal AI
  "289957738535956": "j571axfhf85yqb84hzfe2dae8x83a619", // Gronda
  "1073163302706391": "j572d0z3fz3vf3qdkjqqe2pf0n83a211", // Flashfood
  "2198288203519034": "j5772sh9fwq50dm5brgs2763tn83br55", // Misfits
  "1400927463555875": "j57dkcdr6dpdvhntsb06zmp3cn83b58z", // Imperfect
  "116482854782233": "j575w04scfrr7d8c5npeagr1px83av0q", // Hormozi
  "534754226586678": "j57dmnr3eh3f41css1b4k0jq2d83addc", // DoorDash
};

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(ad) {
  const pageId = ad.page_id;
  const competitorId = COMPETITOR_MAP[pageId];
  if (!competitorId) {
    console.error(`Unknown page ID: ${pageId}`);
    return null;
  }
  
  const daysRunning = calculateDaysRunning(ad.start_date);
  const video = ad.snapshot?.videos?.[0];
  const image = ad.snapshot?.images?.[0];

  return {
    competitorId,
    adArchiveId: ad.ad_archive_id,
    adLibraryUrl: ad.ad_library_url || `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`,
    headline: ad.snapshot?.title || undefined,
    bodyText: ad.snapshot?.body?.text || "",
    ctaText: ad.snapshot?.cta_text || undefined,
    ctaType: ad.snapshot?.cta_type || undefined,
    displayFormat: ad.snapshot?.display_format || "UNKNOWN",
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: image?.resized_image_url || image?.original_image_url || undefined,
    landingPageUrl: ad.snapshot?.link_url || undefined,
    platforms: ad.publisher_platform || [],
    startDate: formatDate(ad.start_date),
    endDate: ad.end_date ? formatDate(ad.end_date) : undefined,
    isActive: ad.is_active ?? true,
    isWinner: daysRunning >= 30,
    daysRunning,
    position: ad.position,
  };
}

const toolResultsDir = '/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results';
const files = readdirSync(toolResultsDir).filter(f => f.includes('get-actor-output') || f.includes('get-actor-run'));

console.log(`Found ${files.length} data files`);

let allAds = [];
for (const file of files) {
  try {
    const data = JSON.parse(readFileSync(`${toolResultsDir}/${file}`, 'utf8'));
    const items = data.items || data.dataset?.previewItems || [];
    console.log(`${file}: ${items.length} items`);
    
    for (const item of items) {
      const transformed = transformAd(item);
      if (transformed) allAds.push(transformed);
    }
  } catch (e) {
    console.error(`Error reading ${file}: ${e.message}`);
  }
}

console.log(`Total ads to insert: ${allAds.length}`);

// Output JSON for insertion
console.log(JSON.stringify({ ads: allAds }));
