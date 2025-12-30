import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get user credits
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    return {
      balance: user.creditsBalance,
      earned: user.creditsEarned,
      pending: user.creditsPending,
    };
  },
});

// Get credit transactions
export const getTransactions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return transactions;
  },
});

// Update credits (internal use)
export const update = mutation({
  args: {
    userId: v.id("users"),
    delta: v.number(),
    reason: v.string(),
    type: v.union(
      v.literal("earned"),
      v.literal("spent"),
      v.literal("shared"),
      v.literal("received"),
      v.literal("refund")
    ),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const newBalance = user.creditsBalance + args.delta;
    if (newBalance < 0) {
      throw new Error("Insufficient credits");
    }
    
    const now = Date.now();
    
    // Update user credits
    await ctx.db.patch(args.userId, {
      creditsBalance: newBalance,
      updatedAt: now,
    });
    
    // Create transaction record
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: args.delta,
      type: args.type,
      description: args.reason,
      orderId: args.orderId,
      status: "completed",
      createdAt: now,
    });
  },
});

// Share credits (create gift card)
export const share = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    if (user.creditsBalance < args.amount) {
      throw new Error("Insufficient credits");
    }
    
    // Generate unique gift card code
    const code = `2XY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const now = Date.now();
    const expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 1 year
    
    // Create gift card
    await ctx.db.insert("giftCards", {
      code,
      amount: args.amount,
      createdBy: args.userId,
      isUsed: false,
      expiresAt,
      createdAt: now,
    });
    
    // Deduct credits from user
    await ctx.db.patch(args.userId, {
      creditsBalance: user.creditsBalance - args.amount,
      updatedAt: now,
    });
    
    // Create transaction record
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "shared",
      description: `Shared via gift card ${code}`,
      status: "completed",
      createdAt: now,
    });
    
    return code;
  },
});

// Redeem gift card
export const redeemGiftCard = mutation({
  args: {
    userId: v.id("users"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const giftCard = await ctx.db
      .query("giftCards")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    
    if (!giftCard) {
      throw new Error("Invalid gift card code");
    }
    
    if (giftCard.isUsed) {
      throw new Error("Gift card has already been used");
    }
    
    if (Date.now() > giftCard.expiresAt) {
      throw new Error("Gift card has expired");
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const now = Date.now();
    
    // Mark gift card as used
    await ctx.db.patch(giftCard._id, {
      isUsed: true,
      usedBy: args.userId,
      usedAt: now,
    });
    
    // Add credits to user
    await ctx.db.patch(args.userId, {
      creditsBalance: user.creditsBalance + giftCard.amount,
      updatedAt: now,
    });
    
    // Create transaction record
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: giftCard.amount,
      type: "received",
      description: `Received from gift card ${args.code}`,
      status: "completed",
      createdAt: now,
    });
    
    return giftCard.amount;
  },
});


