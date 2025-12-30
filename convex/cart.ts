import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get cart by user ID
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("carts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get cart by session ID (guest cart)
export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Create or get cart
export const getOrCreate = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let cart;
    
    if (args.userId) {
      cart = await ctx.db
        .query("carts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
    } else if (args.sessionId) {
      cart = await ctx.db
        .query("carts")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .first();
    }
    
    if (!cart) {
      const now = Date.now();
      const cartId = await ctx.db.insert("carts", {
        userId: args.userId,
        sessionId: args.sessionId,
        items: [],
        createdAt: now,
        updatedAt: now,
      });
      return await ctx.db.get(cartId);
    }
    
    return cart;
  },
});

// Add item to cart
export const addItem = mutation({
  args: {
    cartId: v.id("carts"),
    productId: v.id("products"),
    variantId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId);
    if (!cart) throw new Error("Cart not found");
    
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    
    const variant = product.variants.find((v) => v.id === args.variantId);
    if (!variant) throw new Error("Variant not found");
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === args.productId && item.variantId === args.variantId
    );
    
    let newItems;
    if (existingItemIndex >= 0) {
      // Update quantity
      newItems = [...cart.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + args.quantity,
      };
    } else {
      // Add new item
      newItems = [
        ...cart.items,
        {
          productId: args.productId,
          variantId: args.variantId,
          quantity: args.quantity,
          price: variant.price,
        },
      ];
    }
    
    await ctx.db.patch(args.cartId, {
      items: newItems,
      updatedAt: Date.now(),
    });
  },
});

// Update item quantity
export const updateItemQuantity = mutation({
  args: {
    cartId: v.id("carts"),
    productId: v.id("products"),
    variantId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId);
    if (!cart) throw new Error("Cart not found");
    
    if (args.quantity <= 0) {
      // Remove item
      const newItems = cart.items.filter(
        (item) => !(item.productId === args.productId && item.variantId === args.variantId)
      );
      await ctx.db.patch(args.cartId, {
        items: newItems,
        updatedAt: Date.now(),
      });
    } else {
      // Update quantity
      const newItems = cart.items.map((item) =>
        item.productId === args.productId && item.variantId === args.variantId
          ? { ...item, quantity: args.quantity }
          : item
      );
      await ctx.db.patch(args.cartId, {
        items: newItems,
        updatedAt: Date.now(),
      });
    }
  },
});

// Remove item from cart
export const removeItem = mutation({
  args: {
    cartId: v.id("carts"),
    productId: v.id("products"),
    variantId: v.string(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId);
    if (!cart) throw new Error("Cart not found");
    
    const newItems = cart.items.filter(
      (item) => !(item.productId === args.productId && item.variantId === args.variantId)
    );
    
    await ctx.db.patch(args.cartId, {
      items: newItems,
      updatedAt: Date.now(),
    });
  },
});

// Clear cart
export const clear = mutation({
  args: { cartId: v.id("carts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cartId, {
      items: [],
      updatedAt: Date.now(),
    });
  },
});


