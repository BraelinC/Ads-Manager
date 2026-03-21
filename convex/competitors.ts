import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all competitors
export const list = query({
  args: {
    category: v.optional(v.union(v.literal("Micro-Niche"), v.literal("Macro-Niche"), v.literal("Ad Leader"))),
    status: v.optional(v.union(v.literal("Active"), v.literal("Inactive"))),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("competitors")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    if (args.status) {
      return await ctx.db
        .query("competitors")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("competitors").collect();
  },
});

// Get a single competitor by ID
export const get = query({
  args: { id: v.id("competitors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get competitor by name
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("competitors")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Create a new competitor
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("competitors", args);
  },
});

// Create multiple competitors at once
export const createMany = mutation({
  args: {
    competitors: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const competitor of args.competitors) {
      const id = await ctx.db.insert("competitors", competitor);
      ids.push(id);
    }
    return ids;
  },
});

// Update a competitor
export const update = mutation({
  args: {
    id: v.id("competitors"),
    name: v.optional(v.string()),
    category: v.optional(v.union(v.literal("Micro-Niche"), v.literal("Macro-Niche"), v.literal("Ad Leader"))),
    nicheIndustry: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("Active"), v.literal("Inactive"))),
    facebookPageUrl: v.optional(v.string()),
    facebookPageId: v.optional(v.string()),
    adLibraryUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    tiktokUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    adResearch: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    winnerAds: v.optional(v.string()),
    swipeInsights: v.optional(v.string()),
    adNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
    return await ctx.db.get(id);
  },
});

// Update adResearch field (for lesson 3.2 - scrape-ads)
export const updateAdResearch = mutation({
  args: {
    id: v.id("competitors"),
    adResearch: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { adResearch: args.adResearch });
    return await ctx.db.get(args.id);
  },
});

// Delete a competitor
export const remove = mutation({
  args: { id: v.id("competitors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete all competitors (for resetting)
export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("competitors").collect();
    for (const competitor of all) {
      await ctx.db.delete(competitor._id);
    }
    return all.length;
  },
});
