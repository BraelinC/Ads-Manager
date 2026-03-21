import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all ads, optionally filtered by competitor
export const list = query({
  args: {
    competitorId: v.optional(v.id("competitors")),
    winnersOnly: v.optional(v.boolean()),
    format: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.competitorId) {
      const ads = await ctx.db
        .query("ads")
        .withIndex("by_competitor", (q) => q.eq("competitorId", args.competitorId!))
        .collect();

      if (args.winnersOnly) {
        return ads.filter(ad => ad.isWinner);
      }
      return ads;
    }

    if (args.winnersOnly) {
      return await ctx.db
        .query("ads")
        .withIndex("by_winner", (q) => q.eq("isWinner", true))
        .collect();
    }

    if (args.format) {
      return await ctx.db
        .query("ads")
        .withIndex("by_format", (q) => q.eq("displayFormat", args.format!))
        .collect();
    }

    return await ctx.db.query("ads").collect();
  },
});

// Get a single ad by ID
export const get = query({
  args: { id: v.id("ads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get ad by archive ID
export const getByArchiveId = query({
  args: { adArchiveId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_ad_id", (q) => q.eq("adArchiveId", args.adArchiveId))
      .first();
  },
});

// Create a new ad
export const create = mutation({
  args: {
    competitorId: v.id("competitors"),
    adArchiveId: v.string(),
    adLibraryUrl: v.string(),
    headline: v.optional(v.string()),
    bodyText: v.string(),
    ctaText: v.optional(v.string()),
    ctaType: v.optional(v.string()),
    displayFormat: v.string(),
    videoHdUrl: v.optional(v.string()),
    videoSdUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    landingPageUrl: v.optional(v.string()),
    platforms: v.array(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    isActive: v.boolean(),
    isWinner: v.boolean(),
    daysRunning: v.number(),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if ad already exists
    const existing = await ctx.db
      .query("ads")
      .withIndex("by_ad_id", (q) => q.eq("adArchiveId", args.adArchiveId))
      .first();

    if (existing) {
      // Update existing ad
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("ads", args);
  },
});

// Create multiple ads at once
export const createMany = mutation({
  args: {
    ads: v.array(v.object({
      competitorId: v.id("competitors"),
      adArchiveId: v.string(),
      adLibraryUrl: v.string(),
      headline: v.optional(v.string()),
      bodyText: v.string(),
      ctaText: v.optional(v.string()),
      ctaType: v.optional(v.string()),
      displayFormat: v.string(),
      videoHdUrl: v.optional(v.string()),
      videoSdUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      landingPageUrl: v.optional(v.string()),
      platforms: v.array(v.string()),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      isActive: v.boolean(),
      isWinner: v.boolean(),
      daysRunning: v.number(),
      position: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const ad of args.ads) {
      // Check if ad already exists
      const existing = await ctx.db
        .query("ads")
        .withIndex("by_ad_id", (q) => q.eq("adArchiveId", ad.adArchiveId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, ad);
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("ads", ad);
        ids.push(id);
      }
    }
    return ids;
  },
});

// Delete all ads for a competitor
export const deleteByCompetitor = mutation({
  args: { competitorId: v.id("competitors") },
  handler: async (ctx, args) => {
    const ads = await ctx.db
      .query("ads")
      .withIndex("by_competitor", (q) => q.eq("competitorId", args.competitorId))
      .collect();

    for (const ad of ads) {
      await ctx.db.delete(ad._id);
    }

    return ads.length;
  },
});

// Delete all ads
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const ads = await ctx.db.query("ads").collect();
    for (const ad of ads) {
      await ctx.db.delete(ad._id);
    }
    return ads.length;
  },
});

// Get ad stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const ads = await ctx.db.query("ads").collect();

    const totalAds = ads.length;
    const winnerAds = ads.filter(a => a.isWinner).length;
    const videoAds = ads.filter(a => a.displayFormat === "VIDEO").length;
    const imageAds = ads.filter(a => a.displayFormat === "IMAGE").length;
    const activeAds = ads.filter(a => a.isActive).length;

    return {
      totalAds,
      winnerAds,
      videoAds,
      imageAds,
      activeAds,
    };
  },
});
