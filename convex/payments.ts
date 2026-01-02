import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Create payment record
export const create = mutation({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if payment already exists for this order
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    
    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const paymentId = await ctx.db.insert("payments", {
      orderId: args.orderId,
      userId: args.userId,
      amount: args.amount,
      amountPaid: 0,
      status: "pending",
      paymentMethod: "UPI",
      paymentInitiatedAt: undefined, // Will be set when user clicks "Proceed to Payment"
      createdAt: now,
      updatedAt: now,
    });

    // Don't send Discord notification here - will be sent when payment is initiated

    return paymentId;
  },
});

// Get payment by order ID
export const getByOrderId = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

// Get payment by ID
export const getById = query({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update payment (admin only - marks amount paid)
export const updatePayment = mutation({
  args: {
    paymentId: v.id("payments"),
    amountPaid: v.number(),
    transactionId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment not found");

    const newAmountPaid = args.amountPaid;
    let newStatus: "pending" | "partial" | "paid" | "cancelled" = "pending";

    if (newAmountPaid >= payment.amount) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partial";
    }

    await ctx.db.patch(args.paymentId, {
      amountPaid: newAmountPaid,
      status: newStatus,
      transactionId: args.transactionId !== undefined ? args.transactionId : payment.transactionId,
      notes: args.notes !== undefined ? args.notes : payment.notes,
      updatedAt: Date.now(),
    });

    // Update order financial status
    const order = await ctx.db.get(payment.orderId);
    if (order) {
      await ctx.db.patch(payment.orderId, {
        financialStatus: newStatus === "paid" ? "paid" : "pending",
        updatedAt: Date.now(),
      });
    }

    // Send Discord notification
    try {
      const order = await ctx.db.get(payment.orderId);
      const user = await ctx.db.get(payment.userId);
      
      if (order && user) {
        const notificationType = newStatus === "paid" ? "completed" : newStatus === "partial" ? "partial" : "initiated";
        
        await ctx.scheduler.runAfter(0, internal.discordNotifications.sendPaymentNotification, {
          type: notificationType as "initiated" | "completed" | "partial",
          orderNumber: order.orderNumber,
          customerEmail: user.email,
          amount: payment.amount,
          amountPaid: newAmountPaid,
          paymentMethod: payment.paymentMethod,
          status: newStatus,
        });
      }
    } catch (error) {
      console.error("❌ Failed to send Discord notification:", error);
    }

    return { success: true, status: newStatus };
  },
});

// Initiate payment (when user clicks "Proceed to Payment")
export const initiatePayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment not found");
    
    if (payment.paymentInitiatedAt) {
      // Already initiated, return existing timestamp
      return payment.paymentInitiatedAt;
    }

    const now = Date.now();
    await ctx.db.patch(args.paymentId, {
      paymentInitiatedAt: now,
      updatedAt: now,
    });

    // Send Discord notification when payment is initiated
    try {
      const order = await ctx.db.get(payment.orderId);
      const user = await ctx.db.get(payment.userId);
      
      if (order && user) {
        await ctx.scheduler.runAfter(0, internal.discordNotifications.sendPaymentNotification, {
          type: "initiated",
          orderNumber: order.orderNumber,
          customerEmail: user.email,
          amount: payment.amount,
          amountPaid: payment.amountPaid,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
        });
      }
    } catch (error) {
      console.error("❌ Failed to send Discord notification:", error);
    }

    return now;
  },
});

// Get pending payments by user ID
export const getPendingByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return payments.filter((p) => p.status === "pending" || p.status === "partial");
  },
});

// Get all payments (admin)
export const getAll = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let payments = await ctx.db.query("payments").order("desc").collect();
    
    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    return payments.slice(0, args.limit || 100);
  },
});

