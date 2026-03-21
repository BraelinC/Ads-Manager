// Insert ads into Convex using HTTP API
import { readFileSync } from 'fs';

const CONVEX_URL = "https://formal-weasel-180.convex.cloud";
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
    bodyText: item["snapshot.body.text"] || "",
    displayFormat: item["snapshot.display_format"] || "VIDEO",
    videoHdUrl: video?.video_hd_url,
    videoSdUrl: video?.video_sd_url,
    thumbnailUrl: video?.video_preview_image_url,
    platforms: item.publisher_platform || [],
    startDate: formatDate(item.start_date),
    isActive: item.is_active ?? true,
    isWinner: daysRunning >= 30,
    daysRunning,
    position: item.position,
  };
});

console.log(`Inserting ${ads.length} ads...`);

// Use Convex HTTP API
async function insertAds() {
  for (let i = 0; i < ads.length; i += 5) {
    const batch = ads.slice(i, i + 5);

    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: "ads:createMany",
        args: { ads: batch },
        format: "json"
      })
    });

    if (response.ok) {
      console.log(`Batch ${Math.floor(i/5) + 1}/${Math.ceil(ads.length/5)} inserted`);
    } else {
      console.error(`Error: ${await response.text()}`);
    }
  }
}

insertAds().then(() => console.log('Done!'));
