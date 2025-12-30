# 2XY Shopify Integration: Credits Backend Endpoints

This app includes serverless endpoints to securely perform Admin API operations for credits.

## Endpoints

- POST `/api/credits_share`
  - Body: `{ customerId: string, amount: number }`
  - Creates a Shopify Gift Card and deducts `amount` from the customer's `2xy.credits_balance`.
  - Appends a `shared` transaction to `2xy.credit_transactions`.

- POST `/api/credits_update`
  - Body: `{ customerId: string, delta: number, reason?: string }`
  - Applies a delta to `2xy.credits_balance`. Enforces non-negative balance.
  - Appends `received` (delta>0) or `spent` (delta<0) transaction.

- POST `/api/webhooks_shopify`
  - Set as webhook target if you prefer webhooks over Flow for awarding/deducting. HMAC verified via `SHOPIFY_WEBHOOK_SECRET`.

## Environment Variables (Server)

```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
SHOPIFY_WEBHOOK_SECRET=...
```

## Dev Testing Without Shopify Writes

In local dev, you can seed dev-only credits for testing the UI:

```js
localStorage.setItem('dev_credits_balance', '150');
localStorage.setItem('dev_credits_earned', '300');
localStorage.setItem('dev_credits_pending', '0');
localStorage.setItem('dev_credit_transactions', JSON.stringify([
  { id: 'txn_dev_seed', amount: 50, type: 'earned', description: 'Dev seed', createdAt: new Date().toISOString(), status: 'completed' },
]));
```

The share action will fallback to a local dev mock if the backend is not configured and you have enough dev credits.

# Shopify Integration Guide for 2XY

## 🛍️ **Complete Shopify Backend Integration**

This guide documents the complete integration of Shopify as the backend for the 2XY sneaker store, including authentication, payments, user accounts, and order management.

## 🎯 **What's Integrated**

### ✅ **Authentication & User Accounts**
- **Shopify Customer Authentication**: Full login/register system using Shopify's Customer API
- **Session Management**: Secure token-based authentication with automatic expiration
- **User Profiles**: Complete customer profile integration showing Shopify account data

### ✅ **Checkout & Payments**
- **Native Shopify Checkout**: Seamless redirect to Shopify's secure checkout
- **Stripe Integration**: Automatic Stripe payment processing through Shopify
- **Guest & Authenticated Checkout**: Support for both logged-in users and guests
- **Pre-filled Information**: Authenticated users get pre-filled checkout details

### ✅ **Order Management**
- **Order History**: Real-time sync with Shopify order data
- **Order Status Tracking**: Live fulfillment and payment status updates
- **Order Details**: Complete product information, quantities, and pricing

### ✅ **Credit System**
- **2XY Credits**: Store credits integrated with Shopify customer metafields
- **Credit Tracking**: Real-time credit balance and transaction history
- **Checkout Integration**: Credits can be applied during Shopify checkout

## 🔧 **Technical Implementation**

### **Enhanced Shopify API Functions** (`src/lib/shopify.ts`)

#### **Authentication Functions**
```typescript
// Customer login
customerLogin(email: string, password: string): Promise<CustomerAccessToken>

// Customer registration  
customerRegister(email, password, firstName, lastName, acceptsMarketing): Promise<CustomerAccessToken>

// Get customer data
getCustomer(accessToken: string): Promise<ShopifyCustomer>

// Session management
isCustomerLoggedIn(): boolean
getCustomerToken(): CustomerAccessToken | null
customerLogout(): void
```

#### **Order & Profile Functions**
```typescript
// Get customer orders
getCustomerOrders(accessToken: string, first?: number): Promise<ShopifyOrder[]>

// Credit system
getCustomerCredits(): number
updateCustomerCredits(customerId: string, credits: number): Promise<boolean>

// Enhanced checkout
getAuthenticatedCheckoutUrl(cart: Cart, customerToken?: string): string
```

### **Updated Components**

#### **AuthModal** (`src/components/AuthModal.tsx`)
- ✅ Real Shopify customer registration and login
- ✅ Error handling with user-friendly messages
- ✅ Loading states and form validation
- ✅ Marketing consent integration

#### **Cart** (`src/pages/Cart.tsx`)
- ✅ Enhanced checkout with customer authentication
- ✅ Credit balance display for logged-in users
- ✅ Guest checkout option with login prompts
- ✅ Automatic checkout URL enhancement

#### **Profile** (`src/pages/Profile.tsx`)
- ✅ Complete Shopify customer profile display
- ✅ Real-time order history with status tracking
- ✅ Credit balance and transaction history
- ✅ Member since date and account statistics

## 🚀 **User Experience Flow**

### **For New Customers**
1. **Browse Products** → Normal product browsing experience
2. **Add to Cart** → Products added to Shopify cart
3. **Checkout** → Option to create Shopify account or checkout as guest
4. **Account Creation** → Seamless Shopify customer account setup
5. **Payment** → Secure Stripe payment through Shopify
6. **Order Tracking** → Automatic order sync to profile

### **For Existing Customers**
1. **Sign In** → Login with Shopify credentials
2. **Browse & Shop** → Enhanced experience with saved preferences
3. **Enhanced Checkout** → Pre-filled information, credit application
4. **Order History** → View all past orders and status
5. **Credit Management** → Track and use 2XY credits

## 💳 **Payment Processing**

### **Shopify + Stripe Integration**
- **Automatic Setup**: Payments processed through Shopify's Stripe integration
- **Secure Checkout**: PCI-compliant payment processing
- **Multiple Payment Methods**: Credit cards, digital wallets, etc.
- **International Support**: Multi-currency and global payment support

### **Credit System Integration**
- **Credit Earning**: Automatic credit allocation post-purchase
- **Credit Usage**: Apply credits during Shopify checkout
- **Credit Tracking**: Full transaction history and balance management

## 🛡️ **Security Features**

### **Authentication Security**
- **Token-based Authentication**: Secure customer access tokens
- **Automatic Expiration**: Tokens expire automatically for security
- **Secure Storage**: Local storage with expiration validation
- **Session Management**: Automatic logout on token expiration

### **Data Protection**
- **Shopify Security**: All customer data protected by Shopify's infrastructure
- **HTTPS Encryption**: All API calls encrypted in transit
- **PCI Compliance**: Payment data handled by PCI-compliant Shopify
- **Privacy Controls**: Customer marketing preferences respected

## 📊 **Shopify Configuration Required**

### **Storefront API Setup**
```javascript
// Already configured in src/lib/shopify.ts
const STOREFRONT_ACCESS_TOKEN = "9d40123490d877e07d3eb203edff259f";
const STORE_DOMAIN = "2uazn0-mu.myshopify.com";
```

### **Required Shopify Settings**
1. **Storefront API**: Enable customer account operations
2. **Customer Accounts**: Enable customer registration and login
3. **Stripe Integration**: Configure Stripe as payment provider
4. **Metafields**: Set up custom metafields for credit system
   - Namespace: `2xy`
   - Key: `credits`
   - Type: `number_integer`

### **Collections Setup**
Make sure these collections exist in Shopify:
- `mens-collection` - For men's products
- `womens-collection` - For women's products  
- `performance-sports` - Performance & Sports category
- `lifestyle-casual` - Lifestyle & Casual category
- `limited-edition-hype` - Limited Edition & Hype category
- `retro-classics` - Retro & Classics category

## 🔍 **Testing the Integration**

### **Authentication Testing**
1. **Registration**: Create new account through the app
2. **Login**: Login with Shopify credentials
3. **Session**: Verify session persistence across page reloads
4. **Logout**: Test logout and session cleanup

### **Checkout Testing**
1. **Guest Checkout**: Complete purchase without account
2. **Authenticated Checkout**: Complete purchase when logged in
3. **Credit Application**: Test credit usage during checkout
4. **Order Sync**: Verify orders appear in profile after purchase

### **Profile Testing**
1. **Order History**: Verify real-time order sync
2. **Order Status**: Check fulfillment and payment status updates
3. **Credit Balance**: Verify credit tracking and updates
4. **Account Details**: Confirm customer information display

## 🎉 **Benefits of This Integration**

### **For Customers**
- **Seamless Experience**: Single account for shopping and management
- **Secure Payments**: Industry-standard security and compliance
- **Order Tracking**: Real-time order status and history
- **Credit Rewards**: Earn and use credits for purchases
- **Fast Checkout**: Pre-filled information for returning customers

### **For Business**
- **Unified Backend**: Single source of truth for all customer data
- **Automated Processing**: Orders, payments, and fulfillment automated
- **Customer Insights**: Rich analytics through Shopify dashboard
- **Scalability**: Built on Shopify's robust infrastructure
- **Compliance**: Automatic PCI and privacy compliance

## 🚨 **Important Notes**

### **Environment Variables**
Make sure to secure your Shopify credentials:
- Move `STOREFRONT_ACCESS_TOKEN` to environment variables
- Use different tokens for development/production
- Regularly rotate access tokens

### **Error Handling**
The integration includes comprehensive error handling:
- Network errors with retry logic
- Authentication failures with clear messages
- API rate limiting with graceful degradation
- Fallback states for offline scenarios

### **Performance Optimization**
- Customer data cached locally for faster access
- Orders loaded on-demand to reduce initial load time
- Optimistic UI updates for better user experience
- Background sync for seamless data updates

This integration provides a complete, production-ready e-commerce solution powered by Shopify's robust infrastructure while maintaining the custom user experience of the 2XY brand.