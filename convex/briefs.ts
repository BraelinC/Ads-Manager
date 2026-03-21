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

function hasTemplateTokens(text?: string) {
  return !!text && /\{\{[^}]+\}\}/.test(text);
}

function isInsightReadyAd(ad: {
  displayFormat: string;
  bodyText: string;
}) {
  return ad.displayFormat !== "DCO" && !hasTemplateTokens(ad.bodyText);
}

function countBy<T>(items: T[], getKey: (item: T) => string | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));
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
    const normalAds = allAds.filter((ad) => ad.displayFormat !== "DCO");
    const dcoAds = allAds.filter((ad) => ad.displayFormat === "DCO");
    const normalWinnerPool = allAds.filter(
      (ad) => ad.isWinner && isInsightReadyAd(ad)
    );
    const dcoWinnerPool = dcoAds.filter((ad) => ad.isWinner);

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
      .filter(([format]) => format !== "DCO")
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

      const normalAdsForComp = ads.filter((a) => isInsightReadyAd(a));
      const videos = normalAdsForComp.filter((a) => a.displayFormat === "VIDEO");
      const images = normalAdsForComp.filter((a) => a.displayFormat === "IMAGE");
      const winners = ads.filter((a) => a.isWinner);
      const normalWinners = normalAdsForComp.filter((a) => a.isWinner);
      const dcoForComp = ads.filter((a) => a.displayFormat === "DCO");

      // Find longest running ad
      const sortedByDays = [...normalAdsForComp].sort((a, b) => b.daysRunning - a.daysRunning);
      const longest = sortedByDays[0];

      // Extract top hooks from winners
      const topHooks = normalWinners
        .sort((a, b) => b.daysRunning - a.daysRunning)
        .slice(0, 3)
        .map((a) => extractHook(a.bodyText))
        .filter((h) => h.length > 0);

      competitorBreakdowns.push({
        competitorId: compId,
        name: comp.name,
        category: NICHE_TIER_MAP[comp.category] || comp.category,
        totalAds: normalAdsForComp.length,
        videoAds: videos.length,
        imageAds: images.length,
        winnerAds: normalWinners.length,
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
    const accountPlaybooks = competitorBreakdowns
      .map((comp) => {
        const originalComp = competitors.find((c) => c.name === comp.name);
        if (!originalComp) return null;
        const ads = allAds.filter((ad) => ad.competitorId === originalComp._id);
        const normalWinners = ads.filter((ad) => ad.isWinner && isInsightReadyAd(ad));
        const totalWinners = ads.filter((ad) => ad.isWinner).length;
        const topFormats = countBy(normalWinners, (ad) => ad.displayFormat)
          .slice(0, 2)
          .map(({ key, count }) => `${key} (${count})`);
        const notes = [
          `${normalWinners.length} insight-ready winners out of ${totalWinners} total winners`,
          comp.longestRunningAd
            ? `Longest winner is ${comp.longestRunningAd.daysRunning} days`
            : "No normal winner assets captured yet",
        ];

        return {
          competitorId: originalComp._id,
          name: comp.name,
          category: comp.category,
          normalWinnerAds: normalWinners.length,
          totalWinnerAds: totalWinners,
          topFormats,
          topHooks: comp.topHooks,
          notes,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.normalWinnerAds - a.normalWinnerAds)
      .slice(0, 6);

    const topWinningAds = normalWinnerPool
      .sort((a, b) => b.daysRunning - a.daysRunning || (a.position || 999) - (b.position || 999))
      .slice(0, 12)
      .map((ad) => {
        const competitor = competitorMap.get(ad.competitorId);
        return {
          competitorId: ad.competitorId,
          competitorName: competitor?.name || "Unknown",
          adArchiveId: ad.adArchiveId,
          adLibraryUrl: ad.adLibraryUrl,
          format: ad.displayFormat,
          daysRunning: ad.daysRunning,
          hook: extractHook(ad.bodyText),
          headline: ad.headline,
          ctaText: ad.ctaText,
          landingPageUrl: ad.landingPageUrl,
        };
      });

    const dcoTopAds = dcoWinnerPool
      .sort((a, b) => b.daysRunning - a.daysRunning || (a.position || 999) - (b.position || 999))
      .slice(0, 12)
      .map((ad) => {
        const competitor = competitorMap.get(ad.competitorId);
        return {
          competitorId: ad.competitorId,
          competitorName: competitor?.name || "Unknown",
          adArchiveId: ad.adArchiveId,
          adLibraryUrl: ad.adLibraryUrl,
          daysRunning: ad.daysRunning,
          bodyText: ad.bodyText,
          ctaText: ad.ctaText,
          landingPageUrl: ad.landingPageUrl,
        };
      });

    const combinedTopAds = [
      ...topWinningAds.map((ad) => ({
        competitorId: ad.competitorId,
        competitorName: ad.competitorName,
        adArchiveId: ad.adArchiveId,
        adLibraryUrl: ad.adLibraryUrl,
        sourceType: "Regular Winner",
        format: ad.format,
        daysRunning: ad.daysRunning,
        summary: ad.hook,
        ctaText: ad.ctaText,
        landingPageUrl: ad.landingPageUrl,
      })),
      ...dcoTopAds.map((ad) => ({
        competitorId: ad.competitorId,
        competitorName: ad.competitorName,
        adArchiveId: ad.adArchiveId,
        adLibraryUrl: ad.adLibraryUrl,
        sourceType: "DCO Winner",
        format: "DCO",
        daysRunning: ad.daysRunning,
        summary: extractHook(ad.bodyText),
        ctaText: ad.ctaText,
        landingPageUrl: ad.landingPageUrl,
      })),
    ]
      .sort((a, b) => b.daysRunning - a.daysRunning)
      .slice(0, 12);

    const accountComparisons = competitors
      .map((comp) => {
        const ads = allAds.filter((ad) => ad.competitorId === comp._id);
        const normalWinners = ads.filter((ad) => ad.isWinner && isInsightReadyAd(ad));
        const dcoWinners = ads.filter((ad) => ad.isWinner && ad.displayFormat === "DCO");
        if (normalWinners.length === 0 && dcoWinners.length === 0) return null;
        return {
          competitorId: comp._id,
          name: comp.name,
          category: NICHE_TIER_MAP[comp.category] || comp.category,
          normalWinnerAds: normalWinners.length,
          dcoWinnerAds: dcoWinners.length,
          totalWinnerAds: normalWinners.length + dcoWinners.length,
          bestNormalDays: Math.max(0, ...normalWinners.map((ad) => ad.daysRunning)),
          bestDcoDays: Math.max(0, ...dcoWinners.map((ad) => ad.daysRunning)),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.totalWinnerAds - a.totalWinnerAds)
      .slice(0, 8);

    const dcoSummary = {
      totalAds: dcoAds.length,
      winnerAds: dcoAds.filter((ad) => ad.isWinner).length,
      topCompetitors: countBy(dcoAds, (ad) => competitorMap.get(ad.competitorId)?.name)
        .slice(0, 4)
        .map(({ key, count }) => ({
          name: key,
          count,
          winners: dcoAds.filter((ad) => competitorMap.get(ad.competitorId)?.name === key && ad.isWinner).length,
        })),
      commonCtas: countBy(dcoAds, (ad) => ad.ctaText)
        .slice(0, 4)
        .map(({ key, count }) => ({ cta: key, count })),
    };

    // Executive Summary (6 key findings)
    const winningFormat = formatBreakdown[0];
    const longRunners = normalWinnerPool.filter((a) => a.daysRunning >= 90);
    const performers = normalWinnerPool.filter((a) => a.daysRunning >= 30 && a.daysRunning < 90);
    const tests = normalAds.filter((a) => a.daysRunning < 30);

    const shortCopy = normalAds.filter((a) => a.bodyText.length < 100 && !hasTemplateTokens(a.bodyText));
    const longCopy = normalAds.filter((a) => a.bodyText.length >= 100 && !hasTemplateTokens(a.bodyText));

    const executiveSummary = [
      {
        title: "Winning Format",
        finding: `${winningFormat?.format || "VIDEO"} leads the non-DCO winner pool with ${winningFormat?.winners || 0} winners`,
        dataPoint: `${winningFormat?.count || 0} normal ads tracked, ${Math.round((winningFormat?.winners || 0) / (winningFormat?.count || 1) * 100)}% hit 30+ days`,
      },
      {
        title: "Longevity Distribution",
        finding: `${longRunners.length} Long-Runners and ${performers.length} Performers in normal creative`,
        dataPoint: `${normalWinnerPool.length} non-DCO winner ads are safe to mine for hooks and creative patterns`,
      },
      {
        title: "Copy Length Analysis",
        finding: shortCopy.length > longCopy.length ? "Short copy dominates in insight-ready ads" : "Long copy dominates in insight-ready ads",
        dataPoint: `Short (<100 chars): ${shortCopy.length}, Long (100+ chars): ${longCopy.length}, DCO excluded`,
      },
      {
        title: "Top Competitor",
        finding: `${competitorBreakdowns[0]?.name || "N/A"} leads with ${competitorBreakdowns[0]?.winnerAds || 0} winner ads`,
        dataPoint: `${competitorBreakdowns[0]?.totalAds || 0} non-DCO ads, ${competitorBreakdowns[0]?.videoAds || 0} video / ${competitorBreakdowns[0]?.imageAds || 0} image`,
      },
      {
        title: "DCO Separation",
        finding: `${dcoAds.length} DCO ads are tracked separately from creative insight work`,
        dataPoint: `${dcoSummary.winnerAds} DCO winners kept out of hook analysis to avoid template noise`,
      },
      {
        title: "Top Ad Pool",
        finding: `${topWinningAds[0]?.competitorName || "N/A"} owns the longest-running normal winner in the report`,
        dataPoint: topWinningAds[0]
          ? `${topWinningAds[0].daysRunning} days live, ${topWinningAds[0].format} format, hook: "${topWinningAds[0].hook}"`
          : "No normal winner ads available",
      },
    ];

    const winnerInsights = [
      {
        title: "Cross-Competitor Winners",
        finding: `${accountPlaybooks.length} ad accounts have normal winners worth studying now`,
        dataPoint: `${normalWinnerPool.length} total non-DCO winners with usable copy and creative fields`,
      },
      {
        title: "Top Account Pattern",
        finding: `${accountPlaybooks[0]?.name || "N/A"} has the strongest winner bank`,
        dataPoint: accountPlaybooks[0]
          ? `${accountPlaybooks[0].normalWinnerAds} insight-ready winners, top formats: ${accountPlaybooks[0].topFormats.join(", ") || "n/a"}`
          : "No account data available",
      },
      {
        title: "Best Ad Examples",
        finding: `${topWinningAds.length} top ads are ranked across all accounts by longevity`,
        dataPoint: topWinningAds[0]
          ? `Lead ad: ${topWinningAds[0].competitorName} - ${topWinningAds[0].daysRunning}d`
          : "No top ads available",
      },
    ];

    const winnerComparisons = [
      {
        title: "Winner Pool",
        regularFinding: `${normalWinnerPool.length} regular winners with usable creative insight`,
        dcoFinding: `${dcoWinnerPool.length} DCO winners tracked as template-and-asset systems`,
        takeaway: normalWinnerPool.length >= dcoWinnerPool.length
          ? "Regular winners still drive the clearest message and hook learning."
          : "DCO is a major scaling channel and needs equal operational attention.",
      },
      {
        title: "Best Longevity",
        regularFinding: `${topWinningAds[0]?.daysRunning || 0}d top regular winner from ${topWinningAds[0]?.competitorName || "N/A"}`,
        dcoFinding: `${dcoTopAds[0]?.daysRunning || 0}d top DCO winner from ${dcoTopAds[0]?.competitorName || "N/A"}`,
        takeaway: "Compare both pools by days running, but judge them differently: copy for regular ads, system patterns for DCO.",
      },
      {
        title: "Account Mix",
        regularFinding: `${accountComparisons.filter((item) => item.normalWinnerAds > 0).length} accounts have regular winners`,
        dcoFinding: `${accountComparisons.filter((item) => item.dcoWinnerAds > 0).length} accounts have DCO winners`,
        takeaway: "The strongest accounts usually show both: clear regular creatives plus a DCO scaling layer.",
      },
    ];

    // Strategic Playbook
    const playbook = {
      createFirst: [
        {
          priority: 1,
          recommendation: `Model ${winningFormat?.format || "VIDEO"} winner patterns from non-DCO ads first`,
          dataSupport: `${winningFormat?.winners || 0} winners out of ${winningFormat?.count || 0} total (${Math.round((winningFormat?.winners || 0) / (winningFormat?.count || 1) * 100)}%)`,
        },
        {
          priority: 2,
          recommendation: `Study ${accountPlaybooks[0]?.name || "top competitor"}'s winner hooks by account`,
          dataSupport: `Their top hook: "${competitorBreakdowns[0]?.topHooks[0] || "N/A"}"`,
        },
        {
          priority: 3,
          recommendation: "Use the top ads table to review concrete winners across all accounts",
          dataSupport: `${topWinningAds.length} ranked normal winner ads with live library links`,
        },
      ],
      avoid: [
        "Do not use DCO template text as hook insight",
        formatBreakdown.length > 1 && formatBreakdown[formatBreakdown.length - 1].winners === 0
          ? `${formatBreakdown[formatBreakdown.length - 1].format} format has zero non-DCO winners`
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
      normalWinnerAds: normalWinnerPool.length,
      dcoAds: dcoAds.length,
      totalCompetitors: competitors.filter((c) => c.status === "Active").length,
      executiveSummary,
      winnerInsights,
      winnerComparisons,
      formatBreakdown,
      competitorBreakdowns,
      accountPlaybooks,
      topWinningAds,
      dcoTopAds,
      combinedTopAds,
      accountComparisons,
      dcoSummary,
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
      normalWinnerAds: normalWinnerPool.length,
      dcoAds: dcoAds.length,
      executiveSummary,
      winnerInsights,
      winnerComparisons,
      formatBreakdown,
      competitorBreakdowns,
      accountPlaybooks,
      topWinningAds,
      dcoTopAds,
      combinedTopAds,
      accountComparisons,
      dcoSummary,
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
  winnerInsights: Array<{ title: string; finding: string; dataPoint: string }>;
  winnerComparisons: Array<{ title: string; regularFinding: string; dcoFinding: string; takeaway: string }>;
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
  accountPlaybooks: Array<{
    name: string;
    category: string;
    normalWinnerAds: number;
    totalWinnerAds: number;
    topFormats: string[];
    topHooks: string[];
    notes: string[];
  }>;
  topWinningAds: Array<{
    competitorName: string;
    adArchiveId: string;
    adLibraryUrl: string;
    format: string;
    daysRunning: number;
    hook: string;
    headline?: string;
    ctaText?: string;
    landingPageUrl?: string;
  }>;
  dcoTopAds: Array<{
    competitorName: string;
    adArchiveId: string;
    adLibraryUrl: string;
    daysRunning: number;
    bodyText: string;
    ctaText?: string;
    landingPageUrl?: string;
  }>;
  combinedTopAds: Array<{
    competitorName: string;
    adArchiveId: string;
    adLibraryUrl: string;
    sourceType: string;
    format: string;
    daysRunning: number;
    summary: string;
    ctaText?: string;
    landingPageUrl?: string;
  }>;
  accountComparisons: Array<{
    name: string;
    category: string;
    normalWinnerAds: number;
    dcoWinnerAds: number;
    totalWinnerAds: number;
    bestNormalDays: number;
    bestDcoDays: number;
  }>;
  dcoAds: number;
  normalWinnerAds: number;
  dcoSummary: {
    totalAds: number;
    winnerAds: number;
    topCompetitors: Array<{ name: string; count: number; winners: number }>;
    commonCtas: Array<{ cta: string; count: number }>;
  };
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
  lines.push(`- **Normal Winner Ads:** ${data.normalWinnerAds} | **DCO Ads:** ${data.dcoAds}`);
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

  lines.push("---");
  lines.push("");
  lines.push("## 2. Winner-Focused Insights");
  lines.push("");
  data.winnerInsights.forEach((item, i) => {
    lines.push(`### ${i + 1}. ${item.title}`);
    lines.push(`**${item.finding}**`);
    lines.push(`> ${item.dataPoint}`);
    lines.push("");
  });

  // Section 2: Format Analysis
  lines.push("---");
  lines.push("");
  lines.push("## 3. Format Analysis");
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
    lines.push(`## ${4 + idx}. ${tier} Competitors`);
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
  lines.push("## 7. Competitor Micro-Briefs");
  lines.push("");
  lines.push("| Competitor | Category | Ads | Winners | V/I | Longest (days) |");
  lines.push("|------------|----------|-----|---------|-----|----------------|");
  data.competitorBreakdowns.forEach((c) => {
    lines.push(`| ${c.name} | ${c.category} | ${c.totalAds} | ${c.winnerAds} | ${c.videoAds}/${c.imageAds} | ${c.longestRunningAd?.daysRunning || 0} |`);
  });
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push("## 8. Top Ad Accounts");
  lines.push("");
  data.accountPlaybooks.forEach((account) => {
    lines.push(`### ${account.name} (${account.category})`);
    lines.push(`- **Normal Winners:** ${account.normalWinnerAds} of ${account.totalWinnerAds} total winners`);
    lines.push(`- **Top Formats:** ${account.topFormats.join(", ") || "N/A"}`);
    if (account.topHooks.length > 0) {
      lines.push(`- **Top Hooks:** ${account.topHooks.map((hook) => `"${hook}"`).join(" | ")}`);
    }
    account.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push("## 9. Top Winning Ads Across Accounts");
  lines.push("");
  data.topWinningAds.forEach((ad, index) => {
    lines.push(`### ${index + 1}. ${ad.competitorName} - ${ad.daysRunning}d [${ad.format}]`);
    lines.push(`- **Hook:** "${ad.hook}"`);
    if (ad.headline) lines.push(`- **Headline:** ${ad.headline}`);
    if (ad.ctaText) lines.push(`- **CTA:** ${ad.ctaText}`);
    lines.push(`- **Library:** ${ad.adLibraryUrl}`);
    if (ad.landingPageUrl) lines.push(`- **Landing Page:** ${ad.landingPageUrl}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push("## 10. DCO Watchlist");
  lines.push("");
  lines.push(`- **Tracked DCO Ads:** ${data.dcoSummary.totalAds}`);
  lines.push(`- **DCO Winners:** ${data.dcoSummary.winnerAds}`);
  if (data.dcoSummary.topCompetitors.length > 0) {
    lines.push(`- **Top DCO Accounts:** ${data.dcoSummary.topCompetitors.map((item) => `${item.name} (${item.count}, ${item.winners} winners)`).join(" | ")}`);
  }
  if (data.dcoSummary.commonCtas.length > 0) {
    lines.push(`- **Common DCO CTAs:** ${data.dcoSummary.commonCtas.map((item) => `${item.cta} (${item.count})`).join(" | ")}`);
  }
  lines.push("");

  // Section 7: Strategic Playbook
  lines.push("---");
  lines.push("");
  lines.push("## 11. Strategic Playbook");
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
  lines.push("## 12. Methodology");
  lines.push("");
  lines.push("**Longevity Tiers:**");
  lines.push("- **Long-Runner:** 90+ days active (proven scalers)");
  lines.push("- **Performer:** 30-90 days active (validated winners)");
  lines.push("- **Test:** <30 days active (still proving)");
  lines.push("");
  lines.push("**Core Thesis:** Longevity = Profitability. Ads running 30+ days are validated winners because advertisers keep spending on what converts.");
  lines.push("");
  lines.push("**Filtering Rule:** DCO ads are tracked separately and excluded from hook/copy insights because template fields distort creative analysis.");
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
