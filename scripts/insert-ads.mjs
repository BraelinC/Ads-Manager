// Fetch all dataset items and insert into Convex
const APIFY_TOKEN = process.env.APIFY_TOKEN;

const RUNS = [
  { name: "ReciMe", runId: "FXonCbs0ZMtylfwlE", competitorId: "j57fw9g67hx7bcw5dhttqb7sfs83b838" },
  { name: "Cal AI", runId: "p84jMAbNZLdJ6AwbN", competitorId: "j576w4b8wbrxpwd95veethb4j983ahff" },
  { name: "Gronda", runId: "6SSN0xXVpICOelISU", competitorId: "j571axfhf85yqb84hzfe2dae8x83a619" },
  { name: "Flashfood", runId: "DvqRhgXIGXc0mhc0v", competitorId: "j572d0z3fz3vf3qdkjqqe2pf0n83a211" },
  { name: "Misfits Market", runId: "cV8yIy13Cdae0q14h", competitorId: "j5772sh9fwq50dm5brgs2763tn83br55" },
  { name: "Imperfect Foods", runId: "6u9clymmwK7COeLeE", competitorId: "j57dkcdr6dpdvhntsb06zmp3cn83b58z" },
  { name: "Alex Hormozi", runId: "YdRzMxg9n6rtsHdnj", competitorId: "j575w04scfrr7d8c5npeagr1px83av0q" },
  { name: "DoorDash", runId: "NnpUdctsiBETR72Gi", competitorId: "j57dmnr3eh3f41css1b4k0jq2d83addc" },
];

function calculateDaysRunning(startTimestamp) {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(ad, competitorId) {
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

async function getDataset(runId) {
  const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
  const run = await runRes.json();
  if (run.data?.status !== "SUCCEEDED") return null;
  
  const dataRes = await fetch(`https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=100`);
  return dataRes.json();
}

async function main() {
  const allAds = [];
  
  for (const { name, runId, competitorId } of RUNS) {
    console.error(`Fetching ${name}...`);
    const ads = await getDataset(runId);
    if (ads?.length) {
      const transformed = ads.map(ad => transformAd(ad, competitorId));
      allAds.push(...transformed);
      console.error(`  Found ${ads.length} ads`);
    }
  }
  
  console.error(`Total: ${allAds.length} ads`);
  console.log(JSON.stringify(allAds));
}

main();
