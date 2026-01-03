import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * WARNING: This will delete ALL data from ALL tables!
 * Use with extreme caution. This is a one-time cleanup script.
 */
export const clearAllTables = internalMutation({
  args: {
    confirm: v.string(), // Require confirmation string
  },
  handler: async (ctx, args) => {
    if (args.confirm !== "DELETE_ALL_DATA") {
      throw new Error("Confirmation required. Pass 'DELETE_ALL_DATA' as confirm parameter.");
    }

    const tables = [
      "users",
      "products",
      "carts",
      "orders",
      "creditTransactions",
      "giftCards",
      "adminGiftCards",
      "couponCodes",
      "filterSettings",
      "homepageContent",
      "chats",
      "payments",
      "messages",
      "threads",
      "contacts",
      "articles",
      "generations",
      "projects",
      "subscriptions",
      "subscriptionEvents",
      "creditEvents",
      "workflows",
    ];

    const results: Record<string, number> = {};

    for (const tableName of tables) {
      try {
        // Get all documents from the table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = await ctx.db.query(tableName as any).collect();
        
        // Delete each document
        let deleted = 0;
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          deleted++;
        }
        
        results[tableName] = deleted;
        console.log(`Deleted ${deleted} documents from ${tableName}`);
      } catch (error) {
        console.error(`Error clearing table ${tableName}:`, error);
        results[tableName] = -1; // -1 indicates error
      }
    }

    return {
      success: true,
      results,
      message: "All tables cleared successfully",
    };
  },
});

