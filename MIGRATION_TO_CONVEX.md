# Migration from Shopify to Convex

This document outlines the changes made to migrate the 2XY project from Shopify to Convex as the backend.

## ✅ Completed Changes

### 1. Backend Setup
- ✅ Installed Convex SDK
- ✅ Created Convex schema (`convex/schema.ts`) with tables for:
  - Products
  - Users
  - Carts
  - Orders
  - Credit Transactions
  - Gift Cards
- ✅ Created Convex queries and mutations:
  - `convex/products.ts` - Product operations
  - `convex/users.ts` - User management
  - `convex/auth.ts` - Authentication
  - `convex/cart.ts` - Shopping cart operations
  - `convex/orders.ts` - Order management
  - `convex/credits.ts` - Credit system

### 2. Frontend Changes
- ✅ Created new API layer (`src/lib/api.ts`) to replace Shopify integration
- ✅ Updated `src/main.tsx` to include ConvexProvider
- ✅ Removed all Shopify-related files:
  - `src/lib/shopify.ts`
  - `src/lib/customerAccountApi.ts`
  - `src/lib/passwordlessAuth.ts`
  - `src/lib/checkoutIntegration.ts`
  - `src/lib/creditSystem.ts`
  - `api/` directory (all serverless functions)

### 3. Dependencies
- ✅ Removed `@shopify/storefront-kit-react` from package.json
- ✅ Added Convex scripts to package.json

## 🔧 Next Steps Required

### 1. Initialize Convex Project
```bash
cd 2XY
npx convex dev
```
This will:
- Create a Convex project (if not already created)
- Generate the `_generated` API files
- Set up the deployment URL

### 2. Environment Variables
Create a `.env.local` file:
```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

The Convex URL will be provided when you run `npx convex dev`.

### 3. Update Components
All components that import from `shopify.ts` need to be updated to use the new `api.ts`:

**Files that need updating:**
- `src/components/AuthModal.tsx`
- `src/components/CreditSystem.tsx`
- `src/pages/Index.tsx`
- `src/pages/Men.tsx`
- `src/pages/Women.tsx`
- `src/pages/Catalog.tsx`
- `src/pages/Product.tsx`
- `src/pages/Cart.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Credits.tsx`
- `src/pages/Search.tsx`
- `src/contexts/CartContext.tsx`
- `src/lib/chatbotService.ts`

### 4. Migration Pattern

**Old (Shopify):**
```typescript
import { getAllProducts, customerLogin } from "@/lib/shopify";

const products = await getAllProducts();
const token = await customerLogin(email, password);
```

**New (Convex):**
```typescript
import { products, auth } from "@/lib/api";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// For queries
const productsList = useQuery(api.products.getAll, { limit: 20 });

// For mutations
const loginMutation = useMutation(api.auth.login);
await loginMutation({ email, passwordHash: await hashPassword(password) });
```

### 5. Authentication Changes

**Old:**
- Used Shopify Customer Access Tokens
- Stored in localStorage as `shopify_customer_token`

**New:**
- Uses Convex user IDs
- Store user ID in localStorage as `user_id`
- Password hashing is done client-side (SHA-256) before sending to server

### 6. Cart Changes

**Old:**
- Shopify cart with checkout URL
- Cart ID stored in localStorage

**New:**
- Convex cart stored in database
- Can be associated with user ID or session ID (for guests)
- No automatic checkout URL - you'll need to implement your own checkout flow

### 7. Product Data Migration

You'll need to migrate your product data from Shopify to Convex. You can:

1. **Manual migration**: Use the Convex dashboard to add products
2. **Script migration**: Create a script to fetch from Shopify and insert into Convex
3. **Admin interface**: Build an admin interface using Convex mutations

### 8. Payment Processing

**Important:** Convex doesn't handle payments directly. You'll need to:

1. Integrate a payment provider (Stripe, PayPal, etc.)
2. Create a Convex action to process payments
3. Update the checkout flow to use your payment provider

### 9. Credit System

The credit system is now fully integrated with Convex:
- Credits stored in user record
- Transactions tracked in `creditTransactions` table
- Gift cards stored in `giftCards` table

### 10. Testing

After migration:
1. Test user registration and login
2. Test product browsing and search
3. Test cart operations
4. Test order creation
5. Test credit system
6. Test gift card redemption

## 📝 Notes

- The Convex schema uses `_id` for document IDs (Convex convention)
- All timestamps are stored as numbers (milliseconds since epoch)
- Password hashing is done client-side - consider moving to server-side for production
- The credit system maintains the same 40% cashback logic
- Order numbers are auto-incremented

## 🚨 Breaking Changes

1. **No automatic checkout**: You need to implement your own checkout flow
2. **No Shopify payment processing**: Integrate your own payment provider
3. **Product structure changed**: Products now use Convex schema format
4. **Authentication tokens**: Now using user IDs instead of access tokens
5. **Cart structure**: Cart items structure has changed

## 🔄 Rollback

If you need to rollback:
1. Restore files from git history
2. Reinstall `@shopify/storefront-kit-react`
3. Restore Shopify environment variables
4. Revert component changes

## 📚 Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
- [Convex Schema Guide](https://docs.convex.dev/database/schemas)


