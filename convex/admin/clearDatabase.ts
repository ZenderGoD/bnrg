import { mutation } from "../_generated/server";

/**
 * Clears all data from all tables
 * Run with: npx convex run admin/clearDatabase:clearAll
 */
export const clearAll = mutation({
  handler: async (ctx) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = await ctx.db.query(tableName as any).collect();
        let deleted = 0;
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          deleted++;
        }
        results[tableName] = deleted;
      } catch (error) {
        console.error(`Error clearing ${tableName}:`, error);
        results[tableName] = 0;
      }
    }

    return results;
  },
});

