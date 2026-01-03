// Convex API integration for TOESPRING footwear store
import { ConvexReactClient } from "convex/react";
// Import Convex generated API
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { sanitizeConvexError } from "./errorHandler";

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

// Type definitions
export interface Product {
  _id: string;
  title: string;
  description: string;
  handle: string;
  price: number;
  mrp?: number;
  currencyCode: string;
  images: Array<{
    url: string;
    altText?: string;
    locked?: boolean;
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
  role?: "customer" | "admin" | "manager";
  isApproved?: boolean; // If true, user can view locked content
  authorizationRequestedAt?: number; // Timestamp when user requested authorization
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  createdAt?: number;
  updatedAt?: number;
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
  createdAt: number;
  updatedAt?: number;
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
    return convex.query(api.products.getById, { id: id as Id<"products"> });
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
    return convex.query(api.users.getById, { id: id as Id<"users"> });
  },
  
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    acceptsMarketing: boolean;
  }) => {
    try {
      const passwordHash = await hashPassword(data.password);
      return await convex.mutation(api.auth.register, {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        acceptsMarketing: data.acceptsMarketing,
      });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
  
  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
    role?: "customer" | "admin" | "manager";
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
  }) => {
    try {
      return convex.mutation(api.users.update, {
        id: id as Id<"users">,
        ...data,
      });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
  
  requestAuthorization: async (id: string) => {
    try {
      return await convex.mutation(api.users.requestAuthorization, {
        id: id as Id<"users">,
      });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
};

// Auth API
export const auth = {
  login: async (email: string, password: string) => {
    try {
      const passwordHash = await hashPassword(password);
      return await convex.mutation(api.auth.login, { email, passwordHash });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
  
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    acceptsMarketing: boolean;
  }) => {
    try {
      const passwordHash = await hashPassword(data.password);
      return await convex.mutation(api.auth.register, {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        acceptsMarketing: data.acceptsMarketing,
      });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
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


// Orders API
export const orders = {
  getByUserId: (userId: string) => {
    return convex.query(api.orders.getByUserId, { userId: userId as Id<"users"> });
  },
  
  getById: (id: string) => {
    return convex.query(api.orders.getById, { id: id as Id<"orders"> });
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
  }) => {
    return convex.mutation(api.orders.create, {
      userId: data.userId as Id<"users">,
      items: data.items.map(item => ({
        ...item,
        productId: item.productId as Id<"products">,
      })),
      totalPrice: data.totalPrice,
      currencyCode: data.currencyCode,
    });
  },
};


// Payments API
export const payments = {
  getPendingByUserId: (userId: string) => {
    return convex.query(api.payments.getPendingByUserId, { userId: userId as Id<"users"> });
  },
  
  getByOrderId: (orderId: string) => {
    return convex.query(api.payments.getByOrderId, { orderId: orderId as Id<"orders"> });
  },
};

// Homepage API
export const homepage = {
  getHero: () => {
    return convex.query(api.homepage.getHero);
  },
  
  getCategoryCards: () => {
    return convex.query(api.homepage.getCategoryCards);
  },
  
  updateHero: async (data: {
    videos?: string[];
    heroImage?: string;
  }) => {
    try {
      return await convex.mutation(api.homepage.updateHero, data);
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
  
  upsertCategoryCard: async (data: {
    id?: string;
    title: string;
    handle: string;
    image: string;
    description?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    try {
      return await convex.mutation(api.homepage.upsertCategoryCard, {
        ...data,
        id: data.id ? (data.id as Id<"homepageContent">) : undefined,
      });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
  
  deleteCategoryCard: async (id: string) => {
    try {
      return await convex.mutation(api.homepage.deleteCategoryCard, {
        id: id as Id<"homepageContent">,
      });
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      throw new Error(message);
    }
  },
};

export default convex;

