// Passwordless-style auth helpers reimplemented on top of the Convex backend.
// These keep the existing UI working but no longer talk to Shopify.

import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { hashPassword, type User } from "./api";
import { sanitizeConvexError } from "./errorHandler";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

type Customer = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type AuthResult = {
  success: boolean;
  customer?: Customer;
  message?: string;
};

type SimpleResult = {
  success: boolean;
  message?: string;
};

const CUSTOMER_STORAGE_KEY = "customer_data";

export function getCurrentCustomer(): Customer | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Customer;
  } catch {
    return null;
  }
}

export async function customerLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const passwordHash = await hashPassword(password);
    const userId = await convex.mutation(api.auth.login, { email, passwordHash });
    if (!userId) {
      return { success: false, message: "Incorrect email or password" };
    }

    localStorage.setItem("user_id", userId);
    const user = await convex.query(api.users.getById, { id: userId as Id<"users"> });

    if (!user) {
      return { success: false, message: "Failed to load user data" };
    }

    const customer: Customer = {
      id: userId,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));

    return { success: true, customer };
  } catch (error: unknown) {
    console.error("customerLogin error:", error);
    const message = sanitizeConvexError(error);
    return { success: false, message };
  }
}

export async function customerRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<SimpleResult> {
  try {
    const passwordHash = await hashPassword(password);
    await convex.mutation(api.auth.register, {
      email,
      passwordHash,
      firstName,
      lastName,
      acceptsMarketing: true,
    });

    return {
      success: true,
      message: "Account created successfully. You can now sign in with your email and password.",
    };
  } catch (error: unknown) {
    console.error("customerRegister error:", error);
    const message = sanitizeConvexError(error);
    return { success: false, message };
  }
}

export async function customerRecover(email: string): Promise<SimpleResult> {
  // In a real implementation you'd trigger an email via Convex + your email provider.
  console.warn("customerRecover is a stub in Convex mode. Email provided:", email);
  return {
    success: true,
    message: "If this were production, a password reset email would be sent.",
  };
}

export async function resetPasswordWithUrl(
  _resetUrl: string | null,
  _newPassword: string,
): Promise<{ success: boolean; customer?: { email: string }; message?: string }> {
  // The old implementation relied on Shopify's password reset URLs.
  // With Convex, password reset should be implemented as a separate flow.
  // For now we simply return a stub response so the UI can proceed.
  const current = getCurrentCustomer();
  const email = current?.email || "dev@example.com";

  console.warn("resetPasswordWithUrl is a stub in Convex mode. Update your password reset flow.");

  return {
    success: true,
    customer: { email },
    message: "Password reset flow is not fully implemented yet.",
  };
}


