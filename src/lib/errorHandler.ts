// Utility to sanitize Convex errors and extract user-friendly messages

type ErrorLike = {
  message?: string;
  toString?: () => string;
} | string | Error | null | undefined;

export function sanitizeConvexError(error: ErrorLike): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  let errorMessage: string;
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    errorMessage = error.message;
  } else if (typeof error === 'object' && 'toString' in error && typeof error.toString === 'function') {
    errorMessage = error.toString();
  } else {
    errorMessage = String(error);
  }

  // Common Convex error patterns to clean up
  const patterns = [
    /^CONVEX\s+[^(]+\([^)]+\)\]\s*/, // Remove "CONVEX M(auth:login)]" prefix
    /\[Request ID: [^\]]+\]\s*/, // Remove Request ID
    /Server Error\s*/, // Remove "Server Error" text
    /Uncaught Error:\s*/, // Remove "Uncaught Error:" prefix
    /\s+at handler\s+\([^)]+\)/, // Remove stack trace "at handler (../convex/auth.ts:19:13)"
    /\s+at\s+.*$/, // Remove any remaining stack traces
  ];

  let cleanedMessage = errorMessage;
  for (const pattern of patterns) {
    cleanedMessage = cleanedMessage.replace(pattern, '');
  }

  cleanedMessage = cleanedMessage.trim();

  // Map common error messages to user-friendly ones
  const errorMap: Record<string, string> = {
    'Invalid email or password': 'Incorrect email or password',
    'User with this email already exists': 'An account with this email already exists',
    'User not found': 'User not found',
    'Cart not found': 'Cart not found',
    'Product not found': 'Product not found',
    'Variant not found': 'Product variant not found',
    'Insufficient credits': 'You do not have enough credits',
    'Invalid gift card code': 'Invalid gift card code',
    'Gift card has already been used': 'This gift card has already been used',
    'Gift card has expired': 'This gift card has expired',
  };

  // Check if we have a mapped version
  if (errorMap[cleanedMessage]) {
    return errorMap[cleanedMessage];
  }

  // If we still have a reasonable message, return it
  if (cleanedMessage.length > 0 && cleanedMessage.length < 200) {
    return cleanedMessage;
  }

  // Fallback to generic message
  return 'An error occurred. Please try again.';
}

// Helper to wrap Convex mutation/query calls with error handling
export async function safeConvexCall<T>(
  fn: () => Promise<T>,
  defaultError?: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: unknown) {
    const message = sanitizeConvexError(error);
    return { success: false, error: message || defaultError || 'An error occurred' };
  }
}

