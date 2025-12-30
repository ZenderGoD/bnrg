import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get orders by user ID
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return orders;
  },
});

// Get order by ID
export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get order by order number
export const getByOrderNumber = query({
  args: { orderNumber: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
      .first();
  },
});

// Create order
export const create = mutation({
  args: {
    userId: v.id("users"),
    items: v.array(v.object({
      productId: v.id("products"),
      variantId: v.string(),
      title: v.string(),
      quantity: v.number(),
      price: v.number(),
      image: v.optional(v.string()),
    })),
    totalPrice: v.number(),
    currencyCode: v.string(),
    creditsApplied: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the highest order number
    const allOrders = await ctx.db.query("orders").collect();
    const maxOrderNumber = allOrders.length > 0
      ? Math.max(...allOrders.map((o) => o.orderNumber))
      : 0;
    
    // Calculate credits earned (40% cashback)
    const creditsEarned = Math.round((args.totalPrice - args.creditsApplied) * 0.4 * 100) / 100;
    
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      orderNumber: maxOrderNumber + 1,
      items: args.items,
      totalPrice: args.totalPrice,
      currencyCode: args.currencyCode,
      fulfillmentStatus: "unfulfilled",
      financialStatus: "pending",
      creditsEarned,
      creditsApplied: args.creditsApplied,
      createdAt: now,
      updatedAt: now,
    });
    
    // Update user credits
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        creditsBalance: user.creditsBalance - args.creditsApplied + creditsEarned,
        creditsEarned: user.creditsEarned + creditsEarned,
        updatedAt: now,
      });
      
      // Create credit transaction for earned credits
      if (creditsEarned > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: args.userId,
          amount: creditsEarned,
          type: "earned",
          description: `Earned from order #${maxOrderNumber + 1}`,
          orderId,
          status: "completed",
          createdAt: now,
        });
      }
      
      // Create credit transaction for spent credits
      if (args.creditsApplied > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: args.userId,
          amount: -args.creditsApplied,
          type: "spent",
          description: `Applied to order #${maxOrderNumber + 1}`,
          orderId,
          status: "completed",
          createdAt: now,
        });
      }
    }
    
    return orderId;
  },
});

// Update order status
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    fulfillmentStatus: v.optional(v.string()),
    financialStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});


