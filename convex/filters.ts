import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all filters by type
export const getByType = query({
  args: {
    type: v.union(
      v.literal("brand"),
      v.literal("category"),
      v.literal("color"),
      v.literal("size"),
      v.literal("material"),
      v.literal("activity")
    ),
  },
  handler: async (ctx, args) => {
    const filters = await ctx.db
      .query("filterSettings")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
    
    return filters.sort((a, b) => a.order - b.order);
  },
});

// Get all active filters
export const getAllActive = query({
  args: {},
  handler: async (ctx) => {
    const filters = await ctx.db
      .query("filterSettings")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Group by type
    const grouped: Record<string, typeof filters> = {};
    filters.forEach((filter) => {
      if (!grouped[filter.type]) {
        grouped[filter.type] = [];
      }
      grouped[filter.type].push(filter);
    });
    
    // Sort each group by order
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => a.order - b.order);
    });
    
    return grouped;
  },
});

// Create filter
export const create = mutation({
  args: {
    type: v.union(
      v.literal("brand"),
      v.literal("category"),
      v.literal("color"),
      v.literal("size"),
      v.literal("material"),
      v.literal("activity")
    ),
    name: v.string(),
    displayName: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get max order for this type
    const existing = await ctx.db
      .query("filterSettings")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    
    const maxOrder = existing.length > 0
      ? Math.max(...existing.map((f) => f.order))
      : 0;
    
    const now = Date.now();
    return await ctx.db.insert("filterSettings", {
      type: args.type,
      name: args.name,
      displayName: args.displayName,
      isActive: true,
      order: args.order ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update filter
export const update = mutation({
  args: {
    id: v.id("filterSettings"),
    displayName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete filter
export const remove = mutation({
  args: { id: v.id("filterSettings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});



