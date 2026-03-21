// Read JSON from the saved tool output and insert into Convex
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const COMPETITOR_ID = "j57fw9g67hx7bcw5dhttqb7sfs83b838"; // ReciMe

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

const file = '/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774059233339.txt';
const data = JSON.parse(readFileSync(file, 'utf8'));

const ads = data.items.map(item => {
  const daysRunning = calculateDaysRunning(item.start_date);
  const video = item["snapshot.videos"]?.[0];

  return {
    competitorId: COMPETITOR_ID,
    adArchiveId: item.ad_archive_id,
    adLibraryUrl: item.ad_library_url,
    headline: item["snapshot.title"] || undefined,
    bodyText: item["snapshot.body.text"] || "",
    ctaText: item["snapshot.cta_text"] || undefined,
    ctaType: item["snapshot.cta_type"] || undefined,
    displayFormat: item["snapshot.display_format"] || "VIDEO",
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: item["snapshot.images"]?.[0]?.resized_image_url || undefined,
    landingPageUrl: item["snapshot.link_url"] || undefined,
    platforms: item.publisher_platform || [],
    startDate: formatDate(item.start_date),
    endDate: item.end_date ? formatDate(item.end_date) : undefined,
    isActive: item.is_active ?? true,
    isWinner: daysRunning >= 30,
    daysRunning,
    position: item.position,
  };
});

console.log(`Processing ${ads.length} ads for ReciMe`);

// Insert in batches via Convex CLI
for (let i = 0; i < ads.length; i += 5) {
  const batch = ads.slice(i, i + 5);
  const jsonArg = JSON.stringify({ ads: batch });

  try {
    execSync(`CONVEX_DEPLOYMENT=prod:formal-weasel-180 npx convex run ads:createMany '${jsonArg.replace(/'/g, "'\\''")}'`, {
      cwd: '/home/braelin/competitor-dashboard',
      stdio: 'inherit'
    });
    console.log(`Inserted batch ${Math.floor(i/5) + 1}`);
  } catch (e) {
    console.error(`Error inserting batch: ${e.message}`);
  }
}

console.log('Done!');
