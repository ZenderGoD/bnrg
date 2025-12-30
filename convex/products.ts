import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all products
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    collection: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    if (args.collection) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_collection", (q) => q.eq("collection", args.collection!))
        .take(limit);
      return products;
    } else if (args.category) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(limit);
      return products;
    } else {
      const products = await ctx.db
        .query("products")
        .take(limit);
      return products;
    }
  },
});

// Get product by handle
export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
    
    return product;
  },
});

// Get product by ID
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search products
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    const limit = args.limit || 20;
    
    const allProducts = await ctx.db.query("products").collect();
    
    const filtered = allProducts
      .filter((product) => {
        const titleMatch = product.title.toLowerCase().includes(searchTerm);
        const descMatch = product.description.toLowerCase().includes(searchTerm);
        const tagMatch = product.tags.some((tag) => 
          tag.toLowerCase().includes(searchTerm)
        );
        return titleMatch || descMatch || tagMatch;
      })
      .slice(0, limit);
    
    return filtered;
  },
});

// Create product (admin)
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    handle: v.string(),
    price: v.number(),
    currencyCode: v.string(),
    images: v.array(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    })),
    variants: v.array(v.object({
      id: v.string(),
      title: v.string(),
      price: v.number(),
      availableForSale: v.boolean(),
      selectedOptions: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
      }))),
      image: v.optional(v.object({
        url: v.string(),
        altText: v.optional(v.string()),
      })),
    })),
    tags: v.array(v.string()),
    collection: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update product (admin)
export const update = mutation({
  args: {
    id: v.id("products"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    images: v.optional(v.array(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    }))),
    variants: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      price: v.number(),
      availableForSale: v.boolean(),
      selectedOptions: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
      }))),
      image: v.optional(v.object({
        url: v.string(),
        altText: v.optional(v.string()),
      })),
    }))),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

