// Simple credit system helpers backed by localStorage and Convex.
// The original implementation talked to Shopify metafields; this version is
// backend-agnostic and safe to use with Convex.

import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

export interface CustomerCredits {
  balance: number;
  earned: number;
  pendingCredits: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'shared' | 'received' | 'refund';
  description: string;
  orderId?: string;
  createdAt: string;
  status: 'pending' | 'completed';
}

export interface ShareableCoupon {
  id: string;
  code: string;
  amount: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
}

const BALANCE_KEY = "dev_credits_balance";
const EARNED_KEY = "dev_credits_earned";
const PENDING_KEY = "dev_credits_pending";
const TRANSACTIONS_KEY = "dev_credit_transactions";
const COUPONS_KEY = "dev_shared_coupons";

export async function getCustomerCredits(_accessToken?: string): Promise<CustomerCredits> {
  // Try to get from Convex first if we have a user ID
  const userId = localStorage.getItem("user_id");
  if (userId) {
    try {
      const credits = await convex.query(api.credits.getByUserId, { userId: userId as any });
      if (credits) {
        return credits;
      }
    } catch (error) {
      console.error('Error fetching credits from Convex:', error);
    }
  }
  
  // Fallback to localStorage
  const balance = parseFloat(localStorage.getItem(BALANCE_KEY) || "0");
  const earned = parseFloat(localStorage.getItem(EARNED_KEY) || "0");
  const pendingCredits = parseFloat(localStorage.getItem(PENDING_KEY) || "0");

  return { balance, earned, pendingCredits };
}

export function setDevCredits(credits: CustomerCredits) {
  localStorage.setItem(BALANCE_KEY, credits.balance.toString());
  localStorage.setItem(EARNED_KEY, credits.earned.toString());
  localStorage.setItem(PENDING_KEY, credits.pendingCredits.toString());
}

export async function getCreditTransactions(_accessToken?: string): Promise<CreditTransaction[]> {
  const userId = localStorage.getItem("user_id");
  if (userId) {
    try {
      const transactions = await convex.query(api.credits.getTransactions, { userId: userId as any });
      return (transactions || []).map((t: any) => ({
        id: t._id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        orderId: t.orderId,
        createdAt: new Date(t.createdAt).toISOString(),
        status: t.status,
      }));
    } catch (error) {
      console.error('Error fetching transactions from Convex:', error);
    }
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function createShareableCoupon(
  customerId: string,
  amount: number
): Promise<ShareableCoupon> {
  try {
    const code = await convex.mutation(api.credits.share, {
      userId: customerId as any,
      amount,
    });
    
    // Fetch the created gift card to return full details
    // For now, return a basic structure
    const coupon: ShareableCoupon = {
      id: `coupon-${Date.now()}`,
      code,
      amount,
      createdBy: customerId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      isUsed: false,
    };
    
    // Store in localStorage for dev
    try {
      const stored = localStorage.getItem(COUPONS_KEY);
      const coupons = stored ? JSON.parse(stored) : [];
      coupons.push(coupon);
      localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
    } catch {}
    
    return coupon;
  } catch (error: any) {
    console.error('Error creating shareable coupon:', error);
    throw new Error(error?.message || 'Failed to create shareable coupon');
  }
}


