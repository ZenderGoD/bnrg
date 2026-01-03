import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Login mutation
export const login = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(), // Client should hash password before sending
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) {
      throw new Error("Invalid email or password");
    }
    
    if (user.passwordHash !== args.passwordHash) {
      throw new Error("Invalid email or password");
    }
    
    // Return user ID (in production, you'd generate a JWT token)
    return user._id;
  },
});

// Register mutation
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

