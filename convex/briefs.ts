import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Category mapping for niche tiers
const NICHE_TIER_MAP: Record<string, string> = {
  "Micro-Niche": "Direct",
  "Macro-Niche": "Adjacent",
  "Ad Leader": "Aspirational",
};

// Helper: Calculate median
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Helper: Extract hook from body text (first sentence or line)
function extractHook(text: string): string {
  if (!text) return "";
  const firstLine = text.split(/[.\n]/)[0]?.trim() || "";
  return firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;
}

// List all briefs
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_date")
      .order("desc")
      .collect();
  },
});

// Get single brief
export const get = query({
  args: { id: v.id("briefs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get latest brief
export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_date")
      .order("desc")
      .first();
  },
});

// Generate a new brief from current ad data
export const generate = mutation({
  args: {
    brandName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const brandName = args.brandName || "Your Brand";
    const today = new Date().toISOString().split("T")[0];

    // Fetch all competitors
    const competitors = await ctx.db.query("competitors").collect();
    const competitorMap = new Map(
      competitors.map((c) => [c._id, c])
    );

    // Fetch all ads
    const allAds = await ctx.db.query("ads").collect();

    // Basic stats
    const totalAds = allAds.length;
    const winnerAds = allAds.filter((a) => a.isWinner).length;
    const videoAds = allAds.filter((a) => a.displayFormat === "VIDEO").length;
    const imageAds = allAds.filter((a) => a.displayFormat === "IMAGE").length;

    // Group ads by competitor
    const adsByCompetitor = new Map<Id<"competitors">, typeof allAds>();
    for (const ad of allAds) {
      const existing = adsByCompetitor.get(ad.competitorId) || [];
      existing.push(ad);
      adsByCompetitor.set(ad.competitorId, existing);
    }

    // Format breakdown
    const formatGroups = new Map<string, typeof allAds>();
    for (const ad of allAds) {
      const format = ad.displayFormat || "UNKNOWN";
      const existing = formatGroups.get(format) || [];
      existing.push(ad);
      formatGroups.set(format, existing);
    }

    const formatBreakdown = Array.from(formatGroups.entries())
      .map(([format, ads]) => ({
        format,
        count: ads.length,
        winners: ads.filter((a) => a.isWinner).length,
        medianDays: median(ads.map((a) => a.daysRunning)),
      }))
      .sort((a, b) => b.winners - a.winners);

    // Per-competitor breakdown
    const competitorBreakdowns = [];
    for (const [compId, ads] of adsByCompetitor) {
      const comp = competitorMap.get(compId);
      if (!comp) continue;

      const videos = ads.filter((a) => a.displayFormat === "VIDEO");
      const images = ads.filter((a) => a.displayFormat === "IMAGE");
      const winners = ads.filter((a) => a.isWinner);

      // Find longest running ad
      const sortedByDays = [...ads].sort((a, b) => b.daysRunning - a.daysRunning);
      const longest = sortedByDays[0];

      // Extract top hooks from winners
      const topHooks = winners
        .sort((a, b) => b.daysRunning - a.daysRunning)
        .slice(0, 3)
        .map((a) => extractHook(a.bodyText))
        .filter((h) => h.length > 0);

      competitorBreakdowns.push({
        competitorId: compId,
        name: comp.name,
        category: NICHE_TIER_MAP[comp.category] || comp.category,
        totalAds: ads.length,
        videoAds: videos.length,
        imageAds: images.length,
        winnerAds: winners.length,
        longestRunningAd: longest
          ? {
              adArchiveId: longest.adArchiveId,
              daysRunning: longest.daysRunning,
              bodyText: longest.bodyText.slice(0, 200),
              format: longest.displayFormat,
            }
          : undefined,
        topHooks,
      });
    }

    // Sort by winner ads
    competitorBreakdowns.sort((a, b) => b.winnerAds - a.winnerAds);

    // Executive Summary (6 key findings)
    const winningFormat = formatBreakdown[0];
    const longRunners = allAds.filter((a) => a.daysRunning >= 90);
    const performers = allAds.filter((a) => a.daysRunning >= 30 && a.daysRunning < 90);
    const tests = allAds.filter((a) => a.daysRunning < 30);

    const shortCopy = allAds.filter((a) => a.bodyText.length < 100);
    const longCopy = allAds.filter((a) => a.bodyText.length >= 100);

    const executiveSummary = [
      {
        title: "Winning Format",
        finding: `${winningFormat?.format || "VIDEO"} dominates with ${winningFormat?.winners || 0} winner ads`,
        dataPoint: `${winningFormat?.count || 0} total ads, ${Math.round((winningFormat?.winners || 0) / (winningFormat?.count || 1) * 100)}% hit 30+ days`,
      },
      {
        title: "Longevity Distribution",
        finding: `${longRunners.length} Long-Runners (90d+), ${performers.length} Performers (30-90d), ${tests.length} Tests (<30d)`,
        dataPoint: `${Math.round(winnerAds / totalAds * 100)}% of all ads are validated winners`,
      },
      {
        title: "Copy Length Analysis",
        finding: shortCopy.length > longCopy.length ? "Short copy dominates" : "Long copy dominates",
        dataPoint: `Short (<100 chars): ${shortCopy.length} ads, Long (100+ chars): ${longCopy.length} ads`,
      },
      {
        title: "Top Competitor",
        finding: `${competitorBreakdowns[0]?.name || "N/A"} leads with ${competitorBreakdowns[0]?.winnerAds || 0} winner ads`,
        dataPoint: `${competitorBreakdowns[0]?.totalAds || 0} total ads, ${competitorBreakdowns[0]?.videoAds || 0} video / ${competitorBreakdowns[0]?.imageAds || 0} image`,
      },
      {
        title: "Video vs Image",
        finding: videoAds > imageAds ? "Video-first market" : "Image-first market",
        dataPoint: `Video: ${videoAds} ads (${Math.round(videoAds / totalAds * 100)}%), Image: ${imageAds} ads (${Math.round(imageAds / totalAds * 100)}%)`,
      },
      {
        title: "Platform Focus",
        finding: "Multi-platform distribution standard",
        dataPoint: `${allAds.filter((a) => a.platforms.includes("FACEBOOK")).length} on Facebook, ${allAds.filter((a) => a.platforms.includes("INSTAGRAM")).length} on Instagram`,
      },
    ];

    // Strategic Playbook
    const playbook = {
      createFirst: [
        {
          priority: 1,
          recommendation: `Create ${winningFormat?.format || "VIDEO"} ads - highest winner rate`,
          dataSupport: `${winningFormat?.winners || 0} winners out of ${winningFormat?.count || 0} total (${Math.round((winningFormat?.winners || 0) / (winningFormat?.count || 1) * 100)}%)`,
        },
        {
          priority: 2,
          recommendation: `Study ${competitorBreakdowns[0]?.name || "top competitor"}'s hooks`,
          dataSupport: `Their top hook: "${competitorBreakdowns[0]?.topHooks[0] || "N/A"}"`,
        },
        {
          priority: 3,
          recommendation: longCopy.length > shortCopy.length ? "Test long-form copy" : "Test short punchy copy",
          dataSupport: `${Math.max(longCopy.length, shortCopy.length)} ads use this style`,
        },
      ],
      avoid: [
        formatBreakdown.length > 1 && formatBreakdown[formatBreakdown.length - 1].winners === 0
          ? `${formatBreakdown[formatBreakdown.length - 1].format} format - zero winners`
          : "Untested formats without competitor validation",
      ],
    };

    // Generate full markdown
    const markdown = generateMarkdown({
      brandName,
      today,
      totalAds,
      winnerAds,
      videoAds,
      imageAds,
      totalCompetitors: competitors.filter((c) => c.status === "Active").length,
      executiveSummary,
      formatBreakdown,
      competitorBreakdowns,
      playbook,
      longRunners: longRunners.length,
      performers: performers.length,
      tests: tests.length,
    });

    // Save brief
    const briefId = await ctx.db.insert("briefs", {
      title: `Ad Intelligence Brief - ${today}`,
      generatedAt: today,
      totalAds,
      totalCompetitors: competitors.filter((c) => c.status === "Active").length,
      winnerAds,
      videoAds,
      imageAds,
      executiveSummary,
      formatBreakdown,
      competitorBreakdowns,
      playbook,
      fullMarkdown: markdown,
    });

    return briefId;
  },
});

// Helper: Generate full markdown report
function generateMarkdown(data: {
  brandName: string;
  today: string;
  totalAds: number;
  winnerAds: number;
  videoAds: number;
  imageAds: number;
  totalCompetitors: number;
  executiveSummary: Array<{ title: string; finding: string; dataPoint: string }>;
  formatBreakdown: Array<{ format: string; count: number; winners: number; medianDays: number }>;
  competitorBreakdowns: Array<{
    name: string;
    category: string;
    totalAds: number;
    videoAds: number;
    imageAds: number;
    winnerAds: number;
    longestRunningAd?: { adArchiveId: string; daysRunning: number; bodyText: string; format: string };
    topHooks: string[];
  }>;
  playbook: {
    createFirst: Array<{ priority: number; recommendation: string; dataSupport: string }>;
    avoid: string[];
  };
  longRunners: number;
  performers: number;
  tests: number;
}): string {
  const lines: string[] = [];

  lines.push(`# Ad Intelligence Brief for ${data.brandName}`);
  lines.push(`**Generated:** ${data.today}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Data Summary
  lines.push("## Data Summary");
  lines.push("");
  lines.push(`- **Total Ads Analyzed:** ${data.totalAds}`);
  lines.push(`- **Active Competitors:** ${data.totalCompetitors}`);
  lines.push(`- **Winner Ads (30+ days):** ${data.winnerAds} (${Math.round(data.winnerAds / data.totalAds * 100)}%)`);
  lines.push(`- **Video Ads:** ${data.videoAds} | **Image Ads:** ${data.imageAds}`);
  lines.push(`- **Long-Runners (90d+):** ${data.longRunners} | **Performers (30-90d):** ${data.performers} | **Tests (<30d):** ${data.tests}`);
  lines.push("");

  // Section 1: Executive Summary
  lines.push("---");
  lines.push("");
  lines.push("## 1. Executive Summary");
  lines.push("");
  data.executiveSummary.forEach((item, i) => {
    lines.push(`### ${i + 1}. ${item.title}`);
    lines.push(`**${item.finding}**`);
    lines.push(`> ${item.dataPoint}`);
    lines.push("");
  });

  // Section 2: Format Analysis
  lines.push("---");
  lines.push("");
  lines.push("## 2. Format Analysis");
  lines.push("");
  lines.push("| Format | Total Ads | Winners | Win Rate | Median Days |");
  lines.push("|--------|-----------|---------|----------|-------------|");
  data.formatBreakdown.forEach((f) => {
    const winRate = f.count > 0 ? Math.round((f.winners / f.count) * 100) : 0;
    lines.push(`| ${f.format} | ${f.count} | ${f.winners} | ${winRate}% | ${Math.round(f.medianDays)} |`);
  });
  lines.push("");

  // Section 3-5: Niche Tier Breakdowns
  const tiers = ["Direct", "Adjacent", "Aspirational"];
  tiers.forEach((tier, idx) => {
    const tierComps = data.competitorBreakdowns.filter((c) => c.category === tier);
    if (tierComps.length === 0) return;

    lines.push("---");
    lines.push("");
    lines.push(`## ${3 + idx}. ${tier} Competitors`);
    lines.push("");
    lines.push(`**${tierComps.length} competitors** | **${tierComps.reduce((a, c) => a + c.totalAds, 0)} total ads** | **${tierComps.reduce((a, c) => a + c.winnerAds, 0)} winners**`);
    lines.push("");

    tierComps.forEach((comp) => {
      lines.push(`### ${comp.name}`);
      lines.push(`- **Total:** ${comp.totalAds} ads (${comp.videoAds}V / ${comp.imageAds}I)`);
      lines.push(`- **Winners:** ${comp.winnerAds}`);
      if (comp.longestRunningAd) {
        lines.push(`- **Longest Running:** ${comp.longestRunningAd.daysRunning} days [${comp.longestRunningAd.format}]`);
        lines.push(`  > "${comp.longestRunningAd.bodyText}..."`);
      }
      if (comp.topHooks.length > 0) {
        lines.push(`- **Top Hooks:**`);
        comp.topHooks.forEach((hook) => {
          lines.push(`  - "${hook}"`);
        });
      }
      lines.push("");
    });
  });

  // Section 6: Micro Briefs
  lines.push("---");
  lines.push("");
  lines.push("## 6. Competitor Micro-Briefs");
  lines.push("");
  lines.push("| Competitor | Category | Ads | Winners | V/I | Longest (days) |");
  lines.push("|------------|----------|-----|---------|-----|----------------|");
  data.competitorBreakdowns.forEach((c) => {
    lines.push(`| ${c.name} | ${c.category} | ${c.totalAds} | ${c.winnerAds} | ${c.videoAds}/${c.imageAds} | ${c.longestRunningAd?.daysRunning || 0} |`);
  });
  lines.push("");

  // Section 7: Strategic Playbook
  lines.push("---");
  lines.push("");
  lines.push("## 7. Strategic Playbook");
  lines.push("");
  lines.push("### What to Create First");
  lines.push("");
  data.playbook.createFirst.forEach((item) => {
    lines.push(`**${item.priority}. ${item.recommendation}**`);
    lines.push(`> ${item.dataSupport}`);
    lines.push("");
  });

  lines.push("### What to Avoid");
  lines.push("");
  data.playbook.avoid.forEach((item) => {
    lines.push(`- ${item}`);
  });
  lines.push("");

  // Section 8: Methodology
  lines.push("---");
  lines.push("");
  lines.push("## 8. Methodology");
  lines.push("");
  lines.push("**Longevity Tiers:**");
  lines.push("- **Long-Runner:** 90+ days active (proven scalers)");
  lines.push("- **Performer:** 30-90 days active (validated winners)");
  lines.push("- **Test:** <30 days active (still proving)");
  lines.push("");
  lines.push("**Core Thesis:** Longevity = Profitability. Ads running 30+ days are validated winners because advertisers keep spending on what converts.");
  lines.push("");
  lines.push("**Data Source:** Meta Ad Library via Apify, stored in Convex.");
  lines.push("");

  return lines.join("\n");
}

// Delete a brief
export const remove = mutation({
  args: { id: v.id("briefs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
