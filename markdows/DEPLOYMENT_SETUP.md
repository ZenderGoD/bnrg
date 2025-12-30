# 🚀 2XY Deployment & Authentication Setup Guide

## **🔧 Issues Fixed**

### ✅ **1. Customer Account API Integration**
- Replaced legacy Storefront API authentication with proper **Customer Account API**
- Implemented **OAuth 2.0 authorization code flow with PKCE**
- Added secure token management with refresh tokens
- Created proper authentication callback handling

### ✅ **2. Vercel Deployment Issues**
- Fixed **image loading** issues in production
- Resolved **404 routing errors** for client-side routing
- Optimized build configuration for better performance
- Added proper asset handling and caching

### ✅ **3. Environment Variables**
- Added support for Customer Account API client ID
- Created proper environment variable structure
- Enhanced configuration for production deployment

---

## **📋 Setup Instructions**

### **Step 1: Shopify Admin Configuration**

#### **1.1. Enable Customer Accounts**
1. Go to **Settings** → **Customer accounts**
2. Under **"Accounts in online store and checkout"**, select **"Customer accounts"**
3. Click **Save**

#### **1.2. Install Headless Sales Channel**
1. Go to **Apps** → **App Store**
2. Search for and install **"Headless"** sales channel
3. Or visit: https://apps.shopify.com/headless

#### **1.3. Configure Customer Account API**
1. In Shopify admin, go to **Sales channels** → **Headless**
2. Click on your storefront
3. Navigate to **Customer Account API settings**
4. Set **Client type** to **"Public"** → **"Web clients"**
5. Your **Client ID**: `a55b25c1-6ad9-4240-bc4f-b6dc886d7794`
6. **🚨 CRITICAL:** Under **Application setup**, you MUST add your website domains:
   
   **Callback URL(s)** (Add these exact URLs):
   - Development: `https://localhost:5173/auth/callback`
   - Vercel: `https://your-vercel-app.vercel.app/auth/callback`
   - Custom domain: `https://your-domain.com/auth/callback`
   
   **JavaScript origins** (Add these domains):
   - Development: `https://localhost:5173`
   - Vercel: `https://your-vercel-app.vercel.app`
   - Custom domain: `https://your-domain.com`
   
   **Logout URL** (same as JavaScript origins)
   
   **⚠️ Note:** You CANNOT use `localhost` or `http://` URLs due to security requirements. Use `https://` only.

### **Step 2: Environment Variables**

Create a `.env.local` file in your project root:

```env
# Shopify Configuration
VITE_SHOPIFY_STORE_DOMAIN=2uazn0-mu.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=9d40123490d877e07d3eb203edff259f

# Customer Account API (Required for authentication)
VITE_CUSTOMER_ACCOUNT_API_CLIENT_ID=your-client-id-from-shopify-admin

# Production URL (for production builds)
VITE_APP_URL=https://your-domain.com
```

### **Step 3: Vercel Deployment**

#### **3.1. Environment Variables in Vercel**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the variables from your `.env.local` file
4. Make sure to set them for **Production**, **Preview**, and **Development**

#### **3.2. Deploy Configuration**
The project includes:
- ✅ `vercel.json` - Handles routing and asset optimization
- ✅ `public/_redirects` - Ensures client-side routing works
- ✅ Updated `vite.config.ts` - Optimized build settings

#### **3.3. Deploy**
```bash
# Option 1: Via Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: Via GitHub integration
# Just push to your main branch (if connected to Vercel)
```

### **Step 4: Testing Authentication**

#### **4.1. Create Test Customer**
1. In Shopify admin → **Customers** → **Add customer**
2. Fill in details and **send account invite**
3. Check the email for activation link

#### **4.2. Test Login Flow**
1. Click **Sign In** on your site
2. Should redirect to Shopify Customer Account login
3. After login, should redirect back to your site
4. Check browser localStorage for authentication tokens

---

## **🔍 Troubleshooting**

### **Authentication Issues**

#### **"Client ID not found" Error**
- Check that `VITE_CUSTOMER_ACCOUNT_API_CLIENT_ID` is set correctly
- Verify the Client ID in Shopify admin matches exactly

#### **"Redirect URI mismatch" Error**
- Ensure callback URLs in Shopify admin match your deployed domain
- Check that you've added both local and production URLs

#### **Email Verification Not Working**
1. Check **Settings** → **Notifications** in Shopify admin
2. Find **"Customer account invite"** email template
3. Ensure it's enabled and configured properly
4. Test with a real email address (not test domains)

### **Vercel Deployment Issues**

#### **Images Not Loading**
- Check that images are in the `public` folder or `src/assets`
- Verify image paths don't start with `/src/` in production
- Images should be referenced as `/image.jpg` or imported as modules

#### **404 Errors on Refresh**
- Ensure `vercel.json` is configured correctly
- Check that `public/_redirects` file exists
- Verify client-side routing is working

#### **Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build
npm run preview
```

---

## **🔐 Security Notes**

1. **Never commit sensitive environment variables**
2. **Client ID is safe to expose** (it's meant to be public)
3. **Tokens are stored securely** in localStorage with expiration
4. **PKCE flow protects** against authorization code interception
5. **Refresh tokens** handle automatic token renewal

---

## **📝 What's Changed**

### **New Files Added:**
- `src/lib/customerAccountApi.ts` - Customer Account API implementation
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `vercel.json` - Vercel deployment configuration
- `public/_redirects` - Client-side routing support

### **Updated Files:**
- `src/App.tsx` - Added auth callback route
- `src/components/AuthModal.tsx` - Integrated Customer Account API
- `vite.config.ts` - Optimized build configuration

### **Environment Variables:**
- Added `VITE_CUSTOMER_ACCOUNT_API_CLIENT_ID`
- Updated authentication flow to use OAuth 2.0

---

## **🎉 Next Steps**

1. **Deploy to Vercel** with the new configuration
2. **Configure Shopify admin** Customer Account API settings
3. **Test the authentication flow** end-to-end
4. **Monitor** for any remaining email delivery issues

The authentication now uses Shopify's **recommended Customer Account API** which is more secure, handles 6-digit codes automatically, and provides a better user experience! 🚀