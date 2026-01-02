import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ========== COUPON CODES ==========

// Get all coupon codes
export const getAllCoupons = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("couponCodes")
      .order("desc")
      .collect();
  },
});

// Get active coupon codes
export const getActiveCoupons = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("couponCodes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get coupon by code
export const getCouponByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("couponCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

// Create coupon code
export const createCoupon = mutation({
  args: {
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existing = await ctx.db
      .query("couponCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    
    if (existing) {
      throw new Error("Coupon code already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("couponCodes", {
      code: args.code.toUpperCase(),
      discountType: args.discountType,
      discountValue: args.discountValue,
      isActive: args.isActive ?? true,
      expiresAt: args.expiresAt,
      usageLimit: args.usageLimit,
      usageCount: 0,
      minPurchaseAmount: args.minPurchaseAmount,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update coupon code
export const updateCoupon = mutation({
  args: {
    id: v.id("couponCodes"),
    code: v.optional(v.string()),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
    discountValue: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if code already exists (if code is being updated)
    if (updates.code) {
      const existing = await ctx.db
        .query("couponCodes")
        .withIndex("by_code", (q) => q.eq("code", updates.code!.toUpperCase()))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error("Coupon code already exists");
      }
    }

    const now = Date.now();
    const updateData: {
      updatedAt: number;
      code?: string;
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      isActive?: boolean;
      expiresAt?: number;
      usageLimit?: number;
      minPurchaseAmount?: number;
      description?: string;
    } = {
      updatedAt: now,
    };

    if (updates.code !== undefined) updateData.code = updates.code.toUpperCase();
    if (updates.discountType !== undefined) updateData.discountType = updates.discountType;
    if (updates.discountValue !== undefined) updateData.discountValue = updates.discountValue;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;
    if (updates.usageLimit !== undefined) updateData.usageLimit = updates.usageLimit;
    if (updates.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = updates.minPurchaseAmount;
    if (updates.description !== undefined) updateData.description = updates.description;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete coupon code
export const deleteCoupon = mutation({
  args: { id: v.id("couponCodes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ========== ADMIN GIFT CARDS ==========

// Get all admin gift cards
export const getAllAdminGiftCards = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("adminGiftCards")
      .order("desc")
      .collect();
  },
});

// Get active admin gift cards
export const getActiveAdminGiftCards = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("adminGiftCards")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get admin gift card by code
export const getAdminGiftCardByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adminGiftCards")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

// Create admin gift card
export const createAdminGiftCard = mutation({
  args: {
    code: v.string(),
    amount: v.number(),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existing = await ctx.db
      .query("adminGiftCards")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    
    if (existing) {
      throw new Error("Gift card code already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("adminGiftCards", {
      code: args.code.toUpperCase(),
      amount: args.amount,
      isActive: args.isActive ?? true,
      expiresAt: args.expiresAt,
      usageLimit: args.usageLimit,
      usageCount: 0,
      minPurchaseAmount: args.minPurchaseAmount,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update admin gift card
export const updateAdminGiftCard = mutation({
  args: {
    id: v.id("adminGiftCards"),
    code: v.optional(v.string()),
    amount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if code already exists (if code is being updated)
    if (updates.code) {
      const existing = await ctx.db
        .query("adminGiftCards")
        .withIndex("by_code", (q) => q.eq("code", updates.code!.toUpperCase()))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error("Gift card code already exists");
      }
    }

    const now = Date.now();
    const updateData: {
      updatedAt: number;
      code?: string;
      amount?: number;
      isActive?: boolean;
      expiresAt?: number;
      usageLimit?: number;
      minPurchaseAmount?: number;
      description?: string;
    } = {
      updatedAt: now,
    };

    if (updates.code !== undefined) updateData.code = updates.code.toUpperCase();
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;
    if (updates.usageLimit !== undefined) updateData.usageLimit = updates.usageLimit;
    if (updates.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = updates.minPurchaseAmount;
    if (updates.description !== undefined) updateData.description = updates.description;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete admin gift card
export const deleteAdminGiftCard = mutation({
  args: { id: v.id("adminGiftCards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

