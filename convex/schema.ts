import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Articles table
  products: defineTable({
    title: v.string(),
    description: v.string(),
    handle: v.string(),
    price: v.number(),
    mrp: v.optional(v.number()), // Maximum Retail Price for discount calculation
    currencyCode: v.string(),
    images: v.array(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
      locked: v.optional(v.boolean()), // If true, image is locked and requires approval to view
    })),
    variants: v.array(v.object({
      id: v.string(),
      title: v.string(),
      price: v.number(),
      availableForSale: v.boolean(),
      quantity: v.number(), // Inventory quantity
      selectedOptions: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
      }))),
      image: v.optional(v.object({
        url: v.string(),
        altText: v.optional(v.string()),
      })),
    })),
    tags: v.array(v.string()),
    collection: v.string(), // "mens-collection" or "womens-collection"
    category: v.optional(v.string()), // "premium-lifestyle", "athletic-performance", etc.
    archived: v.optional(v.boolean()), // If true, product is archived (hidden from public but kept in database)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_handle", ["handle"])
    .index("by_collection", ["collection"])
    .index("by_category", ["category"]),

  // Users/Customers table
  users: defineTable({
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    displayName: v.string(),
    phone: v.optional(v.string()),
    acceptsMarketing: v.boolean(),
    passwordHash: v.string(), // For authentication
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"), v.literal("manager"))), // User role (defaults to "customer")
    isApproved: v.optional(v.boolean()), // If true, user can view locked content
    authorizationRequestedAt: v.optional(v.number()), // Timestamp when user requested authorization
    // Address fields
    address: v.optional(v.string()),
    apartment: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    pinCode: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Cart table (one per user/session)
  carts: defineTable({
    userId: v.optional(v.id("users")), // Optional for guest carts
    sessionId: v.optional(v.string()), // For guest carts
    items: v.array(v.object({
      productId: v.id("products"),
      variantId: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  // Orders table
  orders: defineTable({
    userId: v.id("users"),
    orderNumber: v.number(),
    items: v.array(v.object({
      productId: v.id("products"),
      variantId: v.string(),
      title: v.string(),
      quantity: v.number(),
      price: v.number(),
      image: v.optional(v.string()),
    })),
    totalPrice: v.number(),
    currencyCode: v.string(),
    fulfillmentStatus: v.string(), // "unfulfilled", "fulfilled", "partial"
    financialStatus: v.string(), // "pending", "paid", "refunded"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_order_number", ["orderNumber"]),

  // Credit transactions table (deprecated - not used)
  creditTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("earned"),
      v.literal("spent"),
      v.literal("shared"),
      v.literal("received"),
      v.literal("refund")
    ),
    description: v.string(),
    orderId: v.optional(v.id("orders")),
    status: v.union(v.literal("pending"), v.literal("completed")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_order", ["orderId"]),

  // Gift cards / Shareable coupons
  giftCards: defineTable({
    code: v.string(),
    amount: v.number(),
    createdBy: v.id("users"),
    usedBy: v.optional(v.id("users")),
    isUsed: v.boolean(),
    expiresAt: v.number(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_creator", ["createdBy"]),

  // Admin-created gift cards (for checkout)
  adminGiftCards: defineTable({
    code: v.string(),
    amount: v.number(), // Fixed amount value
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()), // Optional expiration
    usageLimit: v.optional(v.number()), // Optional usage limit (how many times it can be used)
    usageCount: v.number(), // How many times it's been used
    minPurchaseAmount: v.optional(v.number()), // Optional minimum purchase amount
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Coupon codes (for checkout discounts)
  couponCodes: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")), // Percentage or fixed amount
    discountValue: v.number(), // Percentage (0-100) or fixed amount
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()), // Optional expiration
    usageLimit: v.optional(v.number()), // Optional usage limit
    usageCount: v.number(), // How many times it's been used
    minPurchaseAmount: v.optional(v.number()), // Optional minimum purchase amount
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Filter settings (brands, categories, etc.)
  filterSettings: defineTable({
    type: v.union(
      v.literal("brand"),
      v.literal("category"),
      v.literal("color"),
      v.literal("size"),
      v.literal("material"),
      v.literal("activity")
    ),
    name: v.string(),
    displayName: v.string(),
    isActive: v.boolean(),
    order: v.number(), // For sorting
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // Homepage content settings
  homepageContent: defineTable({
    type: v.union(
      v.literal("hero"),
      v.literal("categoryCard"),
      v.literal("featuredCollection"),
      v.literal("heroMarquee")
    ),
    // For hero: videos and images
    videos: v.optional(v.array(v.string())), // Video URLs
    heroImage: v.optional(v.string()), // Fallback hero image URL
    // For hero marquee: top and bottom row images
    topRowImages: v.optional(v.array(v.string())), // Image URLs for top marquee row
    bottomRowImages: v.optional(v.array(v.string())), // Image URLs for bottom marquee row
    // For category cards
    title: v.optional(v.string()),
    handle: v.optional(v.string()), // URL handle for navigation
    image: v.optional(v.string()), // Category card image URL
    description: v.optional(v.string()),
    // For featured collections
    collectionHandle: v.optional(v.string()), // Shopify collection handle
    productHandles: v.optional(v.array(v.string())), // Selected product handles to display
    collectionImage: v.optional(v.string()), // Image representing the collection
    subtitle: v.optional(v.string()), // Subtitle/description for the collection
    linkUrl: v.optional(v.string()), // Link URL (e.g., /men, /women, /catalog?collection=...)
    order: v.number(), // For sorting
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // Chat conversations table
  chats: defineTable({
    userId: v.id("users"),
    sessionId: v.string(), // Unique session ID
    title: v.optional(v.string()), // Auto-generated or user-defined title
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  // Payments table
  payments: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    amount: v.number(), // Total amount required
    amountPaid: v.number(), // Amount paid by user
    status: v.union(
      v.literal("pending"), // Payment pending
      v.literal("partial"), // Partial payment received
      v.literal("paid"), // Full payment received
      v.literal("cancelled") // Payment cancelled
    ),
    paymentMethod: v.string(), // "UPI", "Bank Transfer", etc.
    transactionId: v.optional(v.string()), // UPI transaction ID or reference
    notes: v.optional(v.string()), // Admin notes
    paymentInitiatedAt: v.optional(v.number()), // When payment QR was shown (for timer)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});


