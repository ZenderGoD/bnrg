import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
      createdAt: now,
      updatedAt: now,
    });

    // Send Discord notification
    const webhookUrl = process.env.DISCORD_WEBHOOK_SYSTEM || "";
    if (webhookUrl) {
      try {
        const order = await ctx.db.get(args.orderId);
        const user = await ctx.db.get(args.userId);
        
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: "💰 New Payment Pending",
              description: `A new payment has been initiated`,
              fields: [
                { name: "Order Number", value: `#${order?.orderNumber || "N/A"}`, inline: true },
                { name: "Customer", value: user?.email || "Unknown", inline: true },
                { name: "Amount", value: `₹${args.amount.toFixed(2)}`, inline: true },
              ],
              color: 0xffa500, // Orange
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (error) {
        console.error("Failed to send Discord notification:", error);
      }
    }

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
      transactionId: args.transactionId || payment.transactionId,
      notes: args.notes || payment.notes,
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
    const webhookUrl = process.env.DISCORD_WEBHOOK_SYSTEM || "";
    if (webhookUrl) {
      try {
        const updatedPayment = await ctx.db.get(args.paymentId);
        const order = await ctx.db.get(payment.orderId);
        const user = await ctx.db.get(payment.userId);
        
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: newStatus === "paid" ? "✅ Payment Completed" : "⚠️ Partial Payment",
              description: newStatus === "paid" 
                ? `Full payment received for order #${order?.orderNumber || "N/A"}`
                : `Partial payment of ₹${newAmountPaid.toFixed(2)} received. Remaining: ₹${(payment.amount - newAmountPaid).toFixed(2)}`,
              fields: [
                { name: "Order Number", value: `#${order?.orderNumber || "N/A"}`, inline: true },
                { name: "Customer", value: user?.email || "Unknown", inline: true },
                { name: "Total Amount", value: `₹${payment.amount.toFixed(2)}`, inline: true },
                { name: "Amount Paid", value: `₹${newAmountPaid.toFixed(2)}`, inline: true },
                { name: "Status", value: newStatus, inline: true },
              ],
              color: newStatus === "paid" ? 0x00ff00 : 0xffa500,
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (error) {
        console.error("Failed to send Discord notification:", error);
      }
    }

    return { success: true, status: newStatus };
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

