import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get hero content
export const getHero = query({
  handler: async (ctx) => {
    const hero = await ctx.db
      .query("homepageContent")
      .withIndex("by_type", (q) => q.eq("type", "hero"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    return hero || {
      videos: [
        '/Intro.mp4',
        'https://cdn.shopify.com/s/files/1/0665/1651/7051/files/8518887-uhd_4096_1680_25fps.mp4',
        'https://cdn.shopify.com/s/files/1/0665/1651/7051/files/Halluo_Video_I_want_a_sho_c_3990065366058680375.mp4'
      ],
      heroImage: '/hero-video-bg.jpg',
    };
  },
});

// Get category cards
export const getCategoryCards = query({
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("homepageContent")
      .withIndex("by_type", (q) => q.eq("type", "categoryCard"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Sort by order
    cards.sort((a, b) => a.order - b.order);
    
    // Return default if empty
    if (cards.length === 0) {
      return [
        { 
          title: 'Performance & Sports', 
          handle: 'performance-sports', 
          image: '/athletic-performance.jpg',
          description: 'Athletic excellence redefined'
        },
        { 
          title: 'Lifestyle & Casual', 
          handle: 'lifestyle-casual', 
          image: '/premium-lifestyle.jpg',
          description: 'Everyday sophistication'
        },
        { 
          title: 'Limited Edition & Hype', 
          handle: 'limited-edition-hype', 
          image: '/limited-editions.jpg',
          description: 'Exclusive drops & collaborations'
        },
        { 
          title: 'Retro & Classics', 
          handle: 'retro-classics', 
          image: '/street-fashion.jpg',
          description: 'Timeless heritage designs'
        },
      ];
    }
    
    return cards.map(card => ({
      title: card.title || '',
      handle: card.handle || '',
      image: card.image || '',
      description: card.description || '',
    }));
  },
});

// Update hero content
export const updateHero = mutation({
  args: {
    videos: v.optional(v.array(v.string())),
    heroImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing hero or create new
    let hero = await ctx.db
      .query("homepageContent")
      .withIndex("by_type", (q) => q.eq("type", "hero"))
      .first();
    
    const now = Date.now();
    
    if (hero) {
      await ctx.db.patch(hero._id, {
        ...args,
        updatedAt: now,
      });
      return hero._id;
    } else {
      return await ctx.db.insert("homepageContent", {
        type: "hero",
        videos: args.videos,
        heroImage: args.heroImage,
        order: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Create/Update category card
export const upsertCategoryCard = mutation({
  args: {
    id: v.optional(v.id("homepageContent")),
    title: v.string(),
    handle: v.string(),
    image: v.string(),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const now = Date.now();
    
    if (id) {
      // Update existing
      await ctx.db.patch(id, {
        ...data,
        updatedAt: now,
      });
      return id;
    } else {
      // Create new - get max order
      const existing = await ctx.db
        .query("homepageContent")
        .withIndex("by_type", (q) => q.eq("type", "categoryCard"))
        .collect();
      
      const maxOrder = existing.length > 0
        ? Math.max(...existing.map(c => c.order))
        : -1;
      
      return await ctx.db.insert("homepageContent", {
        type: "categoryCard",
        title: data.title,
        handle: data.handle,
        image: data.image,
        description: data.description,
        order: data.order ?? maxOrder + 1,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete category card
export const deleteCategoryCard = mutation({
  args: {
    id: v.id("homepageContent"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get all homepage content (admin)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("homepageContent").collect();
  },
});



