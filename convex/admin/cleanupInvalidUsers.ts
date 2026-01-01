import { mutation } from "../_generated/server";

// Cleanup mutation to delete invalid user documents
// This should be run once to clean up old schema documents
export const cleanupInvalidUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    let deletedCount = 0;
    const deletedIds: string[] = [];
    
    for (const user of allUsers) {
      // Check if document has required fields (and doesn't have old 'name' field)
      const hasRequiredFields = 
        user.firstName !== undefined &&
        user.lastName !== undefined &&
        user.displayName !== undefined &&
        user.passwordHash !== undefined &&
        user.acceptsMarketing !== undefined &&
        user.creditsBalance !== undefined &&
        user.creditsEarned !== undefined &&
        user.creditsPending !== undefined &&
        user.createdAt !== undefined &&
        user.updatedAt !== undefined;
      
      // Also check if it has the old 'name' field (which indicates old schema)
      const hasOldSchema = (user as any).name !== undefined;
      
      if (!hasRequiredFields || hasOldSchema) {
        // Delete invalid documents (old schema)
        await ctx.db.delete(user._id);
        deletedCount++;
        deletedIds.push(user._id);
        console.log(`Deleted invalid user: ${user._id} (email: ${(user as any).email || 'unknown'})`);
      }
    }
    
    return { 
      deletedCount, 
      deletedIds,
      message: `Cleaned up ${deletedCount} invalid user(s)` 
    };
  },
});

