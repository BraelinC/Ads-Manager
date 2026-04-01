import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  competitors: defineTable({
    name: v.string(),
    category: v.union(v.literal("Micro-Niche"), v.literal("Macro-Niche"), v.literal("Ad Leader")),
    nicheIndustry: v.string(),
    description: v.string(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    facebookPageUrl: v.optional(v.string()),
    facebookPageId: v.optional(v.string()),
    adLibraryUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    tiktokUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    dateAdded: v.string(),
    adResearch: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    winnerAds: v.optional(v.string()),
    swipeInsights: v.optional(v.string()),
    adNotes: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  // Individual ads with full creative data
  ads: defineTable({
    competitorId: v.id("competitors"),
    adArchiveId: v.string(),           // Facebook ad ID
    adLibraryUrl: v.string(),          // Direct link to ad

    // Creative content
    headline: v.optional(v.string()),   // Ad title/headline
    bodyText: v.string(),               // Full ad copy
    ctaText: v.optional(v.string()),    // CTA button text
    ctaType: v.optional(v.string()),    // CTA type
    displayFormat: v.string(),          // VIDEO, IMAGE, CAROUSEL, etc.

    // Media
    videoHdUrl: v.optional(v.string()), // HD video URL
    videoSdUrl: v.optional(v.string()), // SD video URL
    thumbnailUrl: v.optional(v.string()), // Video thumbnail
    imageUrl: v.optional(v.string()),   // Image URL (for image ads)

    // Metadata
    landingPageUrl: v.optional(v.string()),
    platforms: v.array(v.string()),     // FACEBOOK, INSTAGRAM, MESSENGER
    startDate: v.string(),              // When ad started
    endDate: v.optional(v.string()),    // When ad ends (if set)
    isActive: v.boolean(),

    // Analysis
    isWinner: v.boolean(),              // Running 30+ days
    daysRunning: v.number(),            // How many days active
    position: v.optional(v.number()),   // Position in impressions ranking
  })
    .index("by_competitor", ["competitorId"])
    .index("by_format", ["displayFormat"])
    .index("by_winner", ["isWinner"])
    .index("by_ad_id", ["adArchiveId"]),

  dcoVersions: defineTable({
    adId: v.id("ads"),
    adArchiveId: v.string(),
    competitorId: v.id("competitors"),
    versionIndex: v.number(),
    versionLabel: v.string(),
    bodyText: v.string(),
    ctaText: v.optional(v.string()),
    headline: v.optional(v.string()),
    caption: v.optional(v.string()),
    landingPageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    posterUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    creativeFingerprint: v.optional(v.string()),
    extractedAt: v.string(),
    source: v.string(),
  })
    .index("by_ad", ["adId"])
    .index("by_archive_id", ["adArchiveId"]),

  // Clips from screen recorder / imports
  clips: defineTable({
    title: v.string(),
    url: v.string(),                          // R2 public URL
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),         // seconds
    fileSize: v.optional(v.number()),         // bytes
    source: v.union(v.literal("recorded"), v.literal("uploaded"), v.literal("edited")),
    tags: v.optional(v.array(v.string())),
    createdAt: v.string(),
  })
    .index("by_date", ["createdAt"])
    .index("by_source", ["source"]),

  // Ad Intelligence Briefs
  briefs: defineTable({
    title: v.string(),
    generatedAt: v.string(),

    // Summary stats
    totalAds: v.number(),
    totalCompetitors: v.number(),
    winnerAds: v.number(),
    videoAds: v.number(),
    imageAds: v.number(),

    // Executive Summary (6 findings)
    executiveSummary: v.array(v.object({
      title: v.string(),
      finding: v.string(),
      dataPoint: v.string(),
    })),

    // Format analysis
    formatBreakdown: v.array(v.object({
      format: v.string(),
      count: v.number(),
      winners: v.number(),
      medianDays: v.number(),
    })),

    // Per-competitor breakdown
    competitorBreakdowns: v.array(v.object({
      competitorId: v.id("competitors"),
      name: v.string(),
      category: v.string(),
      totalAds: v.number(),
      videoAds: v.number(),
      imageAds: v.number(),
      winnerAds: v.number(),
      longestRunningAd: v.optional(v.object({
        adArchiveId: v.string(),
        daysRunning: v.number(),
        bodyText: v.string(),
        format: v.string(),
      })),
      topHooks: v.array(v.string()),
    })),

    // Strategic playbook
    playbook: v.object({
      createFirst: v.array(v.object({
        priority: v.number(),
        recommendation: v.string(),
        dataSupport: v.string(),
      })),
      avoid: v.array(v.string()),
    }),

    // Full markdown content
    fullMarkdown: v.string(),

    // Winner-focused insight blocks
    normalWinnerAds: v.optional(v.number()),
    dcoAds: v.optional(v.number()),
    winnerInsights: v.optional(v.array(v.object({
      title: v.string(),
      finding: v.string(),
      dataPoint: v.string(),
    }))),
    accountPlaybooks: v.optional(v.array(v.object({
      competitorId: v.id("competitors"),
      name: v.string(),
      category: v.string(),
      normalWinnerAds: v.number(),
      totalWinnerAds: v.number(),
      topFormats: v.array(v.string()),
      topHooks: v.array(v.string()),
      notes: v.array(v.string()),
    }))),
    topWinningAds: v.optional(v.array(v.object({
      competitorId: v.id("competitors"),
      competitorName: v.string(),
      adArchiveId: v.string(),
      adLibraryUrl: v.string(),
      format: v.string(),
      daysRunning: v.number(),
      hook: v.string(),
      headline: v.optional(v.string()),
      ctaText: v.optional(v.string()),
      landingPageUrl: v.optional(v.string()),
    }))),
    dcoTopAds: v.optional(v.array(v.object({
      competitorId: v.id("competitors"),
      competitorName: v.string(),
      adArchiveId: v.string(),
      adLibraryUrl: v.string(),
      daysRunning: v.number(),
      bodyText: v.string(),
      ctaText: v.optional(v.string()),
      landingPageUrl: v.optional(v.string()),
    }))),
    combinedTopAds: v.optional(v.array(v.object({
      competitorId: v.id("competitors"),
      competitorName: v.string(),
      adArchiveId: v.string(),
      adLibraryUrl: v.string(),
      sourceType: v.string(),
      format: v.string(),
      daysRunning: v.number(),
      summary: v.string(),
      ctaText: v.optional(v.string()),
      landingPageUrl: v.optional(v.string()),
    }))),
    accountComparisons: v.optional(v.array(v.object({
      competitorId: v.id("competitors"),
      name: v.string(),
      category: v.string(),
      normalWinnerAds: v.number(),
      dcoWinnerAds: v.number(),
      totalWinnerAds: v.number(),
      bestNormalDays: v.number(),
      bestDcoDays: v.number(),
    }))),
    winnerComparisons: v.optional(v.array(v.object({
      title: v.string(),
      regularFinding: v.string(),
      dcoFinding: v.string(),
      takeaway: v.string(),
    }))),
    dcoSummary: v.optional(v.object({
      totalAds: v.number(),
      winnerAds: v.number(),
      topCompetitors: v.array(v.object({
        name: v.string(),
        count: v.number(),
        winners: v.number(),
      })),
      commonCtas: v.array(v.object({
        cta: v.string(),
        count: v.number(),
      })),
    })),
  })
    .index("by_date", ["generatedAt"]),
});
