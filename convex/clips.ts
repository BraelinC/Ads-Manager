import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    source: v.optional(v.union(v.literal("recorded"), v.literal("uploaded"), v.literal("edited"))),
  },
  handler: async (ctx, args) => {
    if (args.source) {
      return await ctx.db
        .query("clips")
        .withIndex("by_source", (q) => q.eq("source", args.source!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("clips").withIndex("by_date").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("clips") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    source: v.union(v.literal("recorded"), v.literal("uploaded"), v.literal("edited")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clips", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clips"),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("clips") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
