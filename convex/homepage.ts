import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get hero content
export const getHero = query({
  handler: async (ctx) => {
    try {
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
    } catch (error) {
      console.error("Error fetching hero content:", error);
      // Return default hero on error
      return {
        videos: [
          '/Intro.mp4',
          'https://cdn.shopify.com/s/files/1/0665/1651/7051/files/8518887-uhd_4096_1680_25fps.mp4',
          'https://cdn.shopify.com/s/files/1/0665/1651/7051/files/Halluo_Video_I_want_a_sho_c_3990065366058680375.mp4'
        ],
        heroImage: '/hero-video-bg.jpg',
      };
    }
  },
});

// Get category cards
export const getCategoryCards = query({
  handler: async (ctx) => {
    try {
      const cards = await ctx.db
        .query("homepageContent")
        .withIndex("by_type", (q) => q.eq("type", "categoryCard"))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      // Sort by order (handle undefined order values)
      cards.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
      
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
    } catch (error) {
      console.error("Error fetching category cards:", error);
      // Return default cards on error
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
    const hero = await ctx.db
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

// Get featured collections
export const getFeaturedCollections = query({
  handler: async (ctx) => {
    try {
      const collections = await ctx.db
        .query("homepageContent")
        .withIndex("by_type", (q) => q.eq("type", "featuredCollection"))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      // Sort by order (handle undefined order values)
      collections.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
      
      return collections.map(collection => ({
        id: collection._id,
        title: collection.title || '',
        subtitle: collection.subtitle || '',
        collectionHandle: collection.collectionHandle || '',
        productHandles: collection.productHandles || [],
        collectionImage: collection.collectionImage || '',
        linkUrl: collection.linkUrl || '',
        order: collection.order ?? 0,
        isActive: collection.isActive ?? true,
      }));
    } catch (error) {
      console.error("Error fetching featured collections:", error);
      // Return empty array on error to prevent app crash
      return [];
    }
  },
});

// Create/Update featured collection
export const upsertFeaturedCollection = mutation({
  args: {
    id: v.optional(v.id("homepageContent")),
    title: v.string(),
    subtitle: v.optional(v.string()),
    collectionHandle: v.string(), // Shopify collection handle
    productHandles: v.array(v.string()), // Selected product handles
    collectionImage: v.string(), // Image URL for the collection
    linkUrl: v.optional(v.string()), // Link URL
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
        .withIndex("by_type", (q) => q.eq("type", "featuredCollection"))
        .collect();
      
      const maxOrder = existing.length > 0
        ? Math.max(...existing.map(c => c.order))
        : -1;
      
      return await ctx.db.insert("homepageContent", {
        type: "featuredCollection",
        title: data.title,
        subtitle: data.subtitle,
        collectionHandle: data.collectionHandle,
        productHandles: data.productHandles,
        collectionImage: data.collectionImage,
        linkUrl: data.linkUrl,
        order: data.order ?? maxOrder + 1,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete featured collection
export const deleteFeaturedCollection = mutation({
  args: {
    id: v.id("homepageContent"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get hero marquee images
export const getHeroMarquee = query({
  handler: async (ctx) => {
    try {
      const marquee = await ctx.db
        .query("homepageContent")
        .withIndex("by_type", (q) => q.eq("type", "heroMarquee"))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      
      return marquee || {
        topRowImages: [],
        bottomRowImages: [],
      };
    } catch (error) {
      console.error("Error fetching hero marquee:", error);
      // Return default marquee on error
      return {
        topRowImages: [],
        bottomRowImages: [],
      };
    }
  },
});

// Update hero marquee images
export const updateHeroMarquee = mutation({
  args: {
    topRowImages: v.optional(v.array(v.string())),
    bottomRowImages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get existing marquee or create new
    const marquee = await ctx.db
      .query("homepageContent")
      .withIndex("by_type", (q) => q.eq("type", "heroMarquee"))
      .first();
    
    const now = Date.now();
    
    if (marquee) {
      await ctx.db.patch(marquee._id, {
        ...args,
        updatedAt: now,
      });
      return marquee._id;
    } else {
      return await ctx.db.insert("homepageContent", {
        type: "heroMarquee",
        topRowImages: args.topRowImages || [],
        bottomRowImages: args.bottomRowImages || [],
        order: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get all homepage content (admin)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("homepageContent").collect();
  },
});



