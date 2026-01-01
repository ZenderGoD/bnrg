import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const setUserId = mutation({
  args: {
    authId: v.string(), // Better Auth user ID as string
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Better Auth user table is in the component, access via component context
    await (ctx.db as any).patch("user", args.authId as any, {
      userId: args.userId,
    });
    return null;
  },
});

export const setUserRole = mutation({
  args: {
    authId: v.string(), // Better Auth user ID as string
    role: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Better Auth user table is in the component, access via component context
    await (ctx.db as any).patch("user", args.authId as any, {
      role: args.role,
    });
    return null;
  },
});

