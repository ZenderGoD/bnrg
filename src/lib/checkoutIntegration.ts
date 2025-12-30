// Stubbed checkout helpers for the Convex-based backend.
// The original implementation wrapped Shopify's checkout. Here we just provide
// minimal behavior so the UI can function without errors.

export type PaymentResult = {
  success: boolean;
  message?: string;
  redirectUrl?: string;
};

export type CheckoutValidationResult = {
  valid: boolean;
  errors: string[];
};

export async function validateCheckout(
  _cartId: string,
  _customerAccessToken?: string,
  _creditsToApply?: number,
): Promise<CheckoutValidationResult> {
  // In a real implementation you would call Convex to verify the cart,
  // inventory, credits, etc. For now always return valid.
  return { valid: true, errors: [] };
}

export async function createEnhancedCheckout(args: {
  cartId: string;
  customerAccessToken?: string;
  creditsToApply?: number;
  discountCodes?: string[];
}): Promise<string | null> {
  console.warn("createEnhancedCheckout is a stub in Convex mode. Args:", args);
  // For now just send the user to the credits page so the flow continues.
  return "/credits";
}


