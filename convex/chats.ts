import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all chats for a user
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return chats.map(chat => ({
      ...chat,
      messageCount: chat.messages.length,
    }));
  },
});

// Get a single chat by session ID
export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Get chat by ID
export const getById = query({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Save or update a chat conversation
export const saveChat = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    messages: v.array(v.object({
      id: v.string(),
      type: v.union(v.literal("user"), v.literal("bot")),
      content: v.string(),
      timestamp: v.number(),
      metadata: v.optional(v.object({
        products: v.optional(v.array(v.object({
          id: v.string(),
          title: v.string(),
          handle: v.string(),
        }))),
        intent: v.optional(v.string()),
      })),
    })),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if chat exists
    const existing = await ctx.db
      .query("chats")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    const now = Date.now();

    // Auto-generate title from first user message if not provided
    let title = args.title;
    if (!title && args.messages.length > 0) {
      const firstUserMessage = args.messages.find(m => m.type === "user");
      if (firstUserMessage) {
        title = firstUserMessage.content.slice(0, 50);
        if (firstUserMessage.content.length > 50) {
          title += "...";
        }
      } else {
        title = "New Chat";
      }
    }

    if (existing) {
      // Update existing chat
      await ctx.db.patch(existing._id, {
        messages: args.messages,
        title: title || existing.title,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new chat
      const chatId = await ctx.db.insert("chats", {
        userId: args.userId,
        sessionId: args.sessionId,
        messages: args.messages,
        title: title || "New Chat",
        createdAt: now,
        updatedAt: now,
      });
      return chatId;
    }
  },
});

// Delete a chat
export const deleteChat = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get chat statistics for a user
export const getStatsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalChats = chats.length;
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
    
    return {
      totalChats,
      totalMessages,
    };
  },
});

// Get all users with their chat stats
export const getAllUsersWithChatStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const orders = await ctx.db.query("orders").collect();
    
    // Calculate purchase count per user
    const purchaseCounts: Record<string, number> = {};
    orders.forEach(order => {
      const userId = order.userId;
      purchaseCounts[userId] = (purchaseCounts[userId] || 0) + 1;
    });
    
    // Get chat stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const chats = await ctx.db
          .query("chats")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        
        const totalChats = chats.length;
        const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
        
        return {
          ...user,
          purchaseCount: purchaseCounts[user._id] || 0,
          totalChats,
          totalMessages,
        };
      })
    );
    
    return usersWithStats;
  },
});


