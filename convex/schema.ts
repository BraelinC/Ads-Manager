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
});
