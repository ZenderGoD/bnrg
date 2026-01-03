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
  _customerAccessToken?: string,
): Promise<CheckoutValidationResult> {
  // Cart system removed
  return { valid: true, errors: [] };
}

export async function createEnhancedCheckout(args: {
  customerAccessToken?: string;
  discountCodes?: string[];
}): Promise<string | null> {
  // Cart system removed
  return null;
}




