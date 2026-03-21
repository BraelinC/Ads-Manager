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
    // Ad analysis fields
    winnerAds: v.optional(v.string()),        // Ad IDs running 30+ days (proven winners)
    swipeInsights: v.optional(v.string()),    // What works: hooks, angles, formats
    adNotes: v.optional(v.string()),          // General notes, what to test
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_name", ["name"]),
});
