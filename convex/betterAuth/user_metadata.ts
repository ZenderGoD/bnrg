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
    // Note: This is accessing a table outside the schema, so we use type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ctx.db as unknown as { patch: (table: string, id: string, data: { userId: string }) => Promise<void> }).patch("user", args.authId, {
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
    // Note: This is accessing a table outside the schema, so we use type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ctx.db as unknown as { patch: (table: string, id: string, data: { role: string }) => Promise<void> }).patch("user", args.authId, {
      role: args.role,
    });
    return null;
  },
});

