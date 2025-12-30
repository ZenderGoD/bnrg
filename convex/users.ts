import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    
    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Register new user
export const register = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    acceptsMarketing: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("User with this email already exists");
    }
    
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash: args.passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      displayName: `${args.firstName} ${args.lastName}`,
      acceptsMarketing: args.acceptsMarketing,
      creditsBalance: 0,
      creditsEarned: 0,
      creditsPending: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    return userId;
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    acceptsMarketing: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    
    const updateData: any = {
      ...updates,
      updatedAt: Date.now(),
    };
    
    if (updates.firstName || updates.lastName) {
      updateData.displayName = `${updates.firstName || user.firstName} ${updates.lastName || user.lastName}`;
    }
    
    await ctx.db.patch(id, updateData);
  },
});

// Update password
export const updatePassword = mutation({
  args: {
    id: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
    });
  },
});


