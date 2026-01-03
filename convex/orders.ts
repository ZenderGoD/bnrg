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

// Create order from cart items (handles product lookups)
export const createFromCart = mutation({
  args: {
    userId: v.id("users"),
    items: v.array(v.object({
      productHandle: v.string(), // Product handle instead of ID
      variantId: v.string(),
      title: v.string(),
      quantity: v.number(),
      price: v.number(),
      image: v.optional(v.string()),
    })),
    totalPrice: v.number(),
    currencyCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up product IDs from handles
    const orderItems = await Promise.all(
      args.items.map(async (item) => {
        const product = await ctx.db
          .query("products")
          .withIndex("by_handle", (q) => q.eq("handle", item.productHandle))
          .first();
        
        if (!product) {
          throw new Error(`Product not found: ${item.productHandle}`);
        }
        
        return {
          productId: product._id,
          variantId: item.variantId,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        };
      })
    );

    // Get the highest order number
    const allOrders = await ctx.db.query("orders").collect();
    const maxOrderNumber = allOrders.length > 0
      ? Math.max(...allOrders.map((o) => o.orderNumber))
      : 0;
    
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      orderNumber: maxOrderNumber + 1,
      items: orderItems,
      totalPrice: args.totalPrice,
      currencyCode: args.currencyCode,
      fulfillmentStatus: "unfulfilled",
      financialStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    
    return orderId;
  },
});

// Create order (legacy - kept for backward compatibility)
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
  },
  handler: async (ctx, args) => {
    // Get the highest order number
    const allOrders = await ctx.db.query("orders").collect();
    const maxOrderNumber = allOrders.length > 0
      ? Math.max(...allOrders.map((o) => o.orderNumber))
      : 0;
    
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      orderNumber: maxOrderNumber + 1,
      items: args.items,
      totalPrice: args.totalPrice,
      currencyCode: args.currencyCode,
      fulfillmentStatus: "unfulfilled",
      financialStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    
    return orderId;
  },
});

// Get all orders (admin)
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    let orders = await ctx.db.query("orders").order("desc").collect();
    
    if (args.status) {
      orders = orders.filter((o) => 
        o.fulfillmentStatus === args.status || o.financialStatus === args.status
      );
    }
    
    return orders.slice(0, limit);
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

