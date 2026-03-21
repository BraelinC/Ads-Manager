// Insert remaining competitor ads into Convex
import { readFileSync } from 'fs';

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";

const COMPETITORS = [
  { name: "Gronda", file: "/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-run-1774060678291.txt", competitorId: "j571axfhf85yqb84hzfe2dae8x83a619", isRunFile: true },
  { name: "Flashfood", file: "/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774060718603.txt", competitorId: "j572d0z3fz3vf3qdkjqqe2pf0n83a211" },
  { name: "Misfits Market", file: "/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774060718510.txt", competitorId: "j5772sh9fwq50dm5brgs2763tn83br55" },
  { name: "Alex Hormozi", file: "/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774060718536.txt", competitorId: "j575w04scfrr7d8c5npeagr1px83av0q" },
  { name: "DoorDash", file: "/home/braelin/.claude/projects/-home-braelin/23bfe3ff-bdd4-4d77-9b03-4f022f070d7c/tool-results/mcp-apify-get-actor-output-1774060718621.txt", competitorId: "j57dmnr3eh3f41css1b4k0jq2d83addc" },
];

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(item, competitorId) {
  const daysRunning = calculateDaysRunning(item.start_date || item["start_date"]);

  // Handle both nested and flat field structures
  const video = item.snapshot?.videos?.[0] || item["snapshot.videos"]?.[0];
  const image = item.snapshot?.images?.[0] || item["snapshot.images"]?.[0];
  const bodyText = item.snapshot?.body?.text || item["snapshot.body.text"] || "";
  const title = item.snapshot?.title || item["snapshot.title"];
  const ctaText = item.snapshot?.cta_text || item["snapshot.cta_text"];
  const displayFormat = item.snapshot?.display_format || item["snapshot.display_format"] || "UNKNOWN";
  const linkUrl = item.snapshot?.link_url || item["snapshot.link_url"];

  return {
    competitorId,
    adArchiveId: item.ad_archive_id,
    adLibraryUrl: item.ad_library_url || `https://www.facebook.com/ads/library/?id=${item.ad_archive_id}`,
    headline: title || undefined,
    bodyText,
    ctaText: ctaText || undefined,
    displayFormat,
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: image?.resized_image_url || image?.original_image_url || undefined,
    landingPageUrl: linkUrl || undefined,
    platforms: item.publisher_platform || [],
    startDate: formatDate(item.start_date || item["start_date"]),
    endDate: (item.end_date || item["end_date"]) ? formatDate(item.end_date || item["end_date"]) : undefined,
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
  let totalInserted = 0;

  for (const { name, file, competitorId, isRunFile } of COMPETITORS) {
    console.log(`\nProcessing ${name}...`);

    try {
      const rawData = JSON.parse(readFileSync(file, 'utf8'));

      // Handle different file structures
      let items;
      if (isRunFile) {
        // Run file has nested dataset.previewItems
        items = rawData.dataset?.previewItems || [];
        console.log(`  Warning: Using preview items only (${items.length}). Full data may need separate fetch.`);
      } else {
        items = rawData.items || [];
      }

      if (items.length === 0) {
        console.log(`  No items found, skipping.`);
        continue;
      }

      const ads = items.map(item => transformAd(item, competitorId));
      console.log(`  Found ${ads.length} ads to insert...`);

      for (let i = 0; i < ads.length; i += 5) {
        const batch = ads.slice(i, i + 5);
        const ok = await insertBatch(batch);
        if (ok) {
          console.log(`    Batch ${Math.floor(i/5) + 1}/${Math.ceil(ads.length/5)} done`);
        } else {
          console.error(`    Batch ${Math.floor(i/5) + 1} failed`);
        }
      }

      console.log(`  ✓ Inserted ${ads.length} ads for ${name}`);
      totalInserted += ads.length;
    } catch (err) {
      console.error(`  Error processing ${name}: ${err.message}`);
    }
  }

  console.log(`\n=== Total: ${totalInserted} ads inserted ===`);
}

main();
