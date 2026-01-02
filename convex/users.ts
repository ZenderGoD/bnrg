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
    
    // Don't return password hash, ensure role has default
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: userWithoutPassword.role || "customer",
    };
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
      role: "customer", // Default role
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
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"), v.literal("manager"))),
    address: v.optional(v.string()),
    apartment: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    pinCode: v.optional(v.string()),
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

// Get users by role
export const getByRole = query({
  args: { role: v.union(v.literal("customer"), v.literal("admin"), v.literal("manager")) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
    
    // Also include users without role if querying for "customer" (for backward compatibility)
    if (args.role === "customer") {
      const allUsers = await ctx.db.query("users").collect();
      const usersWithoutRole = allUsers.filter(u => !u.role || u.role === undefined);
      return [...users, ...usersWithoutRole];
    }
    
    return users;
  },
});

// Delete user (admin/cleanup)
export const deleteUser = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get all users (admin)
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"), v.literal("manager"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    let users = await ctx.db.query("users").collect();
    
    if (args.role) {
      users = users.filter((u) => (u.role || "customer") === args.role);
    }
    
    return users.slice(0, limit).map((user) => {
      // Don't return password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
});

// Create or get guest user (for guest checkout)
export const createOrGetGuestUser = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    apartment: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    pinCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      // Update address info if provided
      if (args.address || args.city || args.state || args.pinCode) {
        await ctx.db.patch(existing._id, {
          address: args.address || existing.address,
          apartment: args.apartment || existing.apartment,
          city: args.city || existing.city,
          state: args.state || existing.state,
          country: args.country || existing.country,
          pinCode: args.pinCode || existing.pinCode,
          phone: args.phone || existing.phone,
          updatedAt: Date.now(),
        });
      }
      return existing._id;
    }
    
    // Create new guest user (with placeholder password hash)
    const now = Date.now();
    const firstName = args.firstName || "Guest";
    const lastName = args.lastName || "User";
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash: "GUEST_USER_NO_PASSWORD", // Placeholder - user can set password later
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      phone: args.phone,
      acceptsMarketing: false,
      role: "customer",
      creditsBalance: 0,
      creditsEarned: 0,
      creditsPending: 0,
      address: args.address,
      apartment: args.apartment,
      city: args.city,
      state: args.state,
      country: args.country || "India",
      pinCode: args.pinCode,
      createdAt: now,
      updatedAt: now,
    });
    
    return userId;
  },
});

// Migration: Set default role for existing users without role
export const migrateUserRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    let updatedCount = 0;
    
    for (const user of allUsers) {
      // TypeScript might complain, but at runtime we need to check
      if (!("role" in user) || user.role === undefined) {
        await ctx.db.patch(user._id, {
          role: "customer" as const,
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }
    
    return { updatedCount, message: `Updated ${updatedCount} user(s) with default role` };
  },
});


