import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const CONVEX_URL = "https://formal-weasel-180.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

interface ApifyAd {
  ad_archive_id: string;
  ad_library_url: string;
  snapshot: {
    body?: { text: string };
    title?: string;
    cta_text?: string;
    cta_type?: string;
    display_format: string;
    videos?: Array<{
      video_hd_url?: string;
      video_sd_url?: string;
      video_preview_image_url?: string;
    }>;
    images?: Array<{ original_image_url?: string; resized_image_url?: string }>;
    link_url?: string;
  };
  publisher_platform: string[];
  start_date: number; // Unix timestamp
  end_date?: number;
  is_active: boolean;
  position?: number;
}

function calculateDaysRunning(startTimestamp: number): number {
  const startDate = new Date(startTimestamp * 1000);
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function transformAd(ad: ApifyAd, competitorId: Id<"competitors">) {
  const daysRunning = calculateDaysRunning(ad.start_date);
  const isWinner = daysRunning >= 30;

  const video = ad.snapshot.videos?.[0];
  const image = ad.snapshot.images?.[0];

  return {
    competitorId,
    adArchiveId: ad.ad_archive_id,
    adLibraryUrl: ad.ad_library_url,
    headline: ad.snapshot.title || undefined,
    bodyText: ad.snapshot.body?.text || "",
    ctaText: ad.snapshot.cta_text || undefined,
    ctaType: ad.snapshot.cta_type || undefined,
    displayFormat: ad.snapshot.display_format,
    videoHdUrl: video?.video_hd_url || undefined,
    videoSdUrl: video?.video_sd_url || undefined,
    thumbnailUrl: video?.video_preview_image_url || undefined,
    imageUrl: image?.resized_image_url || image?.original_image_url || undefined,
    landingPageUrl: ad.snapshot.link_url || undefined,
    platforms: ad.publisher_platform || [],
    startDate: formatDate(ad.start_date),
    endDate: ad.end_date ? formatDate(ad.end_date) : undefined,
    isActive: ad.is_active,
    isWinner,
    daysRunning,
    position: ad.position,
  };
}

async function scrapeCompetitor(pageId: string, limit = 50): Promise<ApifyAd[]> {
  console.log(`Scraping page ${pageId}...`);

  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=${pageId}`;

  const response = await fetch("https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync-get-dataset-items?token=" + APIFY_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls: [{ url }],
      scrapeAdDetails: true,
      limitPerSource: limit,
      "scrapePageAds.sortBy": "impressions_desc",
      "scrapePageAds.activeStatus": "active",
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  // Get all competitors
  const competitors = await client.query(api.competitors.list, {});
  console.log(`Found ${competitors.length} competitors`);

  for (const competitor of competitors) {
    if (!competitor.facebookPageId) {
      console.log(`Skipping ${competitor.name} - no Facebook Page ID`);
      continue;
    }

    console.log(`\nProcessing ${competitor.name}...`);

    try {
      const ads = await scrapeCompetitor(competitor.facebookPageId, 30);
      console.log(`Found ${ads.length} ads for ${competitor.name}`);

      if (ads.length === 0) continue;

      // Transform and batch insert
      const transformedAds = ads.map(ad => transformAd(ad, competitor._id));

      // Insert in batches of 10
      for (let i = 0; i < transformedAds.length; i += 10) {
        const batch = transformedAds.slice(i, i + 10);
        await client.mutation(api.ads.createMany, { ads: batch });
        console.log(`Inserted batch ${Math.floor(i/10) + 1}/${Math.ceil(transformedAds.length/10)}`);
      }

      console.log(`✓ Inserted ${transformedAds.length} ads for ${competitor.name}`);
    } catch (error) {
      console.error(`Error processing ${competitor.name}:`, error);
    }
  }

  // Print stats
  const stats = await client.query(api.ads.getStats, {});
  console.log("\n=== Final Stats ===");
  console.log(`Total ads: ${stats.totalAds}`);
  console.log(`Winner ads (30+ days): ${stats.winnerAds}`);
  console.log(`Video ads: ${stats.videoAds}`);
  console.log(`Image ads: ${stats.imageAds}`);
  console.log(`Active ads: ${stats.activeAds}`);
}

main().catch(console.error);
