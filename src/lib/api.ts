// Convex API integration for 2XY sneaker store
import { ConvexReactClient } from "convex/react";
// Import Convex generated API
import { api } from "../../convex/_generated/api";

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

// Type definitions
export interface Product {
  _id: string;
  title: string;
  description: string;
  handle: string;
  price: number;
  currencyCode: string;
  images: Array<{
    url: string;
    altText?: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    availableForSale: boolean;
    selectedOptions?: Array<{
      name: string;
      value: string;
    }>;
    image?: {
      url: string;
      altText?: string;
    };
  }>;
  tags: string[];
  collection: string;
  category?: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  acceptsMarketing: boolean;
  creditsBalance: number;
  creditsEarned: number;
  creditsPending: number;
}

export interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
  }>;
}

export interface Order {
  _id: string;
  userId: string;
  orderNumber: number;
  items: Array<{
    productId: string;
    variantId: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalPrice: number;
  currencyCode: string;
  fulfillmentStatus: string;
  financialStatus: string;
  creditsEarned: number;
  creditsApplied: number;
}

export interface CreditTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: "earned" | "spent" | "shared" | "received" | "refund";
  description: string;
  orderId?: string;
  status: "pending" | "completed";
  createdAt: number;
}

// Helper to hash password (client-side, in production use proper hashing)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Products API
export const products = {
  getAll: (options?: { limit?: number; collection?: string; category?: string }) => {
    return convex.query(api.products.getAll, options || {});
  },
  
  getByHandle: (handle: string) => {
    return convex.query(api.products.getByHandle, { handle });
  },
  
  getById: (id: string) => {
    return convex.query(api.products.getById, { id: id as any });
  },
  
  search: (query: string, limit?: number) => {
    return convex.query(api.products.search, { query, limit });
  },
};

// Users API
export const users = {
  getByEmail: (email: string) => {
    return convex.query(api.users.getByEmail, { email });
  },
  
  getById: (id: string) => {
    return convex.query(api.users.getById, { id: id as any });
  },
  
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    acceptsMarketing: boolean;
  }) => {
    const passwordHash = await hashPassword(data.password);
    return convex.mutation(api.auth.register, {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      acceptsMarketing: data.acceptsMarketing,
    });
  },
  
  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
  }) => {
    return convex.mutation(api.users.update, {
      id: id as any,
      ...data,
    });
  },
};

// Auth API
export const auth = {
  login: async (email: string, password: string) => {
    const passwordHash = await hashPassword(password);
    return convex.mutation(api.auth.login, { email, passwordHash });
  },
  
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    acceptsMarketing: boolean;
  }) => {
    const passwordHash = await hashPassword(data.password);
    return convex.mutation(api.auth.register, {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      acceptsMarketing: data.acceptsMarketing,
    });
  },
  
  logout: () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_token");
  },
  
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem("user_id");
  },
  
  getUserId: (): string | null => {
    return localStorage.getItem("user_id");
  },
  
  setUserId: (userId: string) => {
    localStorage.setItem("user_id", userId);
  },
};

// Cart API
export const cart = {
  getByUserId: (userId: string) => {
    return convex.query(api.cart.getByUserId, { userId: userId as any });
  },
  
  getBySessionId: (sessionId: string) => {
    return convex.query(api.cart.getBySessionId, { sessionId });
  },
  
  getOrCreate: (userId?: string, sessionId?: string) => {
    return convex.mutation(api.cart.getOrCreate, {
      userId: userId ? (userId as any) : undefined,
      sessionId,
    });
  },
  
  addItem: (cartId: string, productId: string, variantId: string, quantity: number) => {
    return convex.mutation(api.cart.addItem, {
      cartId: cartId as any,
      productId: productId as any,
      variantId,
      quantity,
    });
  },
  
  updateItemQuantity: (cartId: string, productId: string, variantId: string, quantity: number) => {
    return convex.mutation(api.cart.updateItemQuantity, {
      cartId: cartId as any,
      productId: productId as any,
      variantId,
      quantity,
    });
  },
  
  removeItem: (cartId: string, productId: string, variantId: string) => {
    return convex.mutation(api.cart.removeItem, {
      cartId: cartId as any,
      productId: productId as any,
      variantId,
    });
  },
  
  clear: (cartId: string) => {
    return convex.mutation(api.cart.clear, { cartId: cartId as any });
  },
};

// Orders API
export const orders = {
  getByUserId: (userId: string) => {
    return convex.query(api.orders.getByUserId, { userId: userId as any });
  },
  
  getById: (id: string) => {
    return convex.query(api.orders.getById, { id: id as any });
  },
  
  create: (data: {
    userId: string;
    items: Array<{
      productId: string;
      variantId: string;
      title: string;
      quantity: number;
      price: number;
      image?: string;
    }>;
    totalPrice: number;
    currencyCode: string;
    creditsApplied: number;
  }) => {
    return convex.mutation(api.orders.create, {
      userId: data.userId as any,
      items: data.items.map(item => ({
        ...item,
        productId: item.productId as any,
      })),
      totalPrice: data.totalPrice,
      currencyCode: data.currencyCode,
      creditsApplied: data.creditsApplied,
    });
  },
};

// Credits API
export const credits = {
  getByUserId: (userId: string) => {
    return convex.query(api.credits.getByUserId, { userId: userId as any });
  },
  
  getTransactions: (userId: string) => {
    return convex.query(api.credits.getTransactions, { userId: userId as any });
  },
  
  share: (userId: string, amount: number) => {
    return convex.mutation(api.credits.share, {
      userId: userId as any,
      amount,
    });
  },
  
  redeemGiftCard: (userId: string, code: string) => {
    return convex.mutation(api.credits.redeemGiftCard, {
      userId: userId as any,
      code,
    });
  },
};

export default convex;

