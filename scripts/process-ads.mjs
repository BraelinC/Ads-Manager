// Process Apify results and insert into Convex
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Dataset IDs from completed Apify scrapes
const DATASETS = [
  { name: "ReciMe", datasetId: "9tCunTHXqAvMZR482", competitorId: "j57fw9g67hx7bcw5dhttqb7sfs83b838" },
  { name: "Cal AI", datasetId: "0fyCMPCZYGDLnfazs", competitorId: "j576w4b8wbrxpwd95veethb4j983ahff" },
  { name: "Gronda", runId: "6SSN0xXVpICOelISU", competitorId: "j571axfhf85yqb84hzfe2dae8x83a619" },
  { name: "Flashfood", runId: "DvqRhgXIGXc0mhc0v", competitorId: "j572d0z3fz3vf3qdkjqqe2pf0n83a211" },
  { name: "Misfits Market", runId: "cV8yIy13Cdae0q14h", competitorId: "j5772sh9fwq50dm5brgs2763tn83br55" },
  { name: "Imperfect Foods", runId: "6u9clymmwK7COeLeE", competitorId: "j57dkcdr6dpdvhntsb06zmp3cn83b58z" },
  { name: "Alex Hormozi", runId: "YdRzMxg9n6rtsHdnj", competitorId: "j575w04scfrr7d8c5npeagr1px83av0q" },
  { name: "DoorDash", runId: "NnpUdctsiBETR72Gi", competitorId: "j57dmnr3eh3f41css1b4k0jq2d83addc" },
];

const APIFY_TOKEN = process.env.APIFY_TOKEN;

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(ad, competitorId) {
  const daysRunning = calculateDaysRunning(ad.start_date);
  const isWinner = daysRunning >= 30;

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
    isWinner,
    daysRunning,
    position: ad.position,
  };
}

async function getRunDataset(runId) {
  // First get the run to find datasetId
  const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
  const run = await runRes.json();

  if (run.data.status !== "SUCCEEDED") {
    console.log(`  Run ${runId} status: ${run.data.status}`);
    return null;
  }

  const datasetId = run.data.defaultDatasetId;

  // Get dataset items
  const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
  return dataRes.json();
}

async function main() {
  console.log("Processing Apify results and inserting into Convex...\n");

  let totalInserted = 0;

  for (const { name, runId, competitorId } of RUNS) {
    console.log(`Processing ${name}...`);

    try {
      const ads = await getRunDataset(runId);

      if (!ads || ads.length === 0) {
        console.log(`  No ads found or run not complete`);
        continue;
      }

      console.log(`  Found ${ads.length} ads`);

      // Transform ads
      const transformed = ads.map((ad) => transformAd(ad, competitorId));

      // Insert in batches of 10
      for (let i = 0; i < transformed.length; i += 10) {
        const batch = transformed.slice(i, i + 10);
        await client.mutation("ads:createMany", { ads: batch });
      }

      console.log(`  ✓ Inserted ${transformed.length} ads`);
      totalInserted += transformed.length;
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }

  console.log(`\n=== Total: ${totalInserted} ads inserted ===`);

  // Get stats
  const stats = await client.query("ads:getStats", {});
  console.log("\nDatabase stats:");
  console.log(`  Total ads: ${stats.totalAds}`);
  console.log(`  Winner ads (30+ days): ${stats.winnerAds}`);
  console.log(`  Video ads: ${stats.videoAds}`);
  console.log(`  Image ads: ${stats.imageAds}`);
  console.log(`  Active ads: ${stats.activeAds}`);
}

main().catch(console.error);
