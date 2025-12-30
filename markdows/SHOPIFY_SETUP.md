# 🛍️ Shopify Credit System & Payment Gateway Setup Guide

This guide explains how to set up the complete credit system and payment gateway integration with Shopify for your 2XY store.

## 📋 Overview

The implemented system provides:
- **40% Cashback**: Customers earn 40% back in credits on every purchase
- **Credit Sharing**: Create gift cards to share credits with friends
- **Store Credit at Checkout**: Use credits as payment method
- **Refund to Credits**: Convert refunds to store credits instead of money
- **Secure Payment Processing**: Full Shopify Payments integration

## 🏪 Shopify Admin Setup

### 1. Enable Store Credit System

1. Go to **Settings** → **Payments**
2. In the **Store credit** section, toggle **ON** "Let customers use store credit"
3. Configure store credit settings:
   - Allow customers to use store credit at checkout
   - Set minimum and maximum amounts if needed

### 2. Create Customer Metafield Definitions

Go to **Settings** → **Custom data** → **Customers** and create these metafields:

#### Credits Balance
- **Namespace**: `2xy`
- **Key**: `credits_balance`
- **Type**: Number (decimal)
- **Description**: Customer's available credit balance
- **Storefront API access**: Read access

#### Credits Earned
- **Namespace**: `2xy`
- **Key**: `credits_earned`
- **Type**: Number (decimal)  
- **Description**: Total credits earned by customer
- **Storefront API access**: Read access

#### Credits Pending
- **Namespace**: `2xy`
- **Key**: `credits_pending`
- **Type**: Number (decimal)
- **Description**: Credits pending from recent purchases
- **Storefront API access**: Read access

#### Credit Transactions
- **Namespace**: `2xy`
- **Key**: `credit_transactions`
- **Type**: JSON
- **Description**: Transaction history for credits
- **Storefront API access**: Read access

### 3. Configure Gift Cards for Credit Sharing

1. Go to **Products** → **Gift cards**
2. Enable gift cards in your store
3. Configure gift card settings:
   - Allow customers to purchase gift cards
   - Set expiration policies (we recommend 1 year)
   - Configure email templates for gift card delivery

### 4. Set Up Shopify Flow (Automation)

Install **Shopify Flow** app and create these workflows:

#### Workflow 1: Award Credits After Purchase
```
Trigger: Order paid
Condition: Order financial status = paid
Action: Update customer metafield (credits_balance) 
Formula: current_balance + (order_total * 0.40)
```

#### Workflow 2: Convert Refunds to Credits
```
Trigger: Refund created
Condition: Refund status = success
Action: Update customer metafield (credits_balance)
Formula: current_balance + refund_amount
```

### 5. Configure Shopify Payments

1. Go to **Settings** → **Payments**
2. Set up **Shopify Payments** as your payment provider
3. Enable additional payment methods as needed:
   - Credit/Debit cards
   - Shop Pay
   - PayPal
   - Apple Pay / Google Pay

### 6. Update Email Templates

Go to **Settings** → **Notifications** and customize these templates:

#### Order Confirmation Email
Add this liquid code to show credits earned:
```liquid
{% assign credits_earned = order.total_price | times: 0.40 %}
<p>🎉 You've earned ${{ credits_earned | money_without_currency }} in 2XY Credits!</p>
```

#### Gift Card Email Template
Customize the gift card email to match 2XY branding and mention it's for sharing credits.

### 7. Serverless Environment Variables

Configure these on your hosting platform (e.g., Vercel) for the backend endpoints under `/api/*`:

```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
SHOPIFY_WEBHOOK_SECRET=...
```

## 🔧 Technical Implementation

### Required API Permissions

Update your Shopify custom app with these scopes:

**Storefront API:**
- `unauthenticated_read_product_listings`
- `unauthenticated_read_checkouts`
- `unauthenticated_write_checkouts`
- `unauthenticated_read_customers`
- `unauthenticated_write_customers`

**Admin API:**
- `read_customers`
- `write_customers`
- `read_orders`
- `write_orders`
- `read_products`
- `read_gift_cards`
- `write_gift_cards`

### Environment Variables

Add these to your `.env.local`:

```bash
# Shopify Configuration
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token
VITE_SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token

# Credit System Configuration  
VITE_CREDIT_PERCENTAGE=0.40
VITE_CREDIT_NAMESPACE=2xy
```

## 🔄 How the Credit System Works

### 1. Customer Makes Purchase
1. Customer completes checkout through Shopify
2. Payment is processed via Shopify Payments
3. Order webhook triggers credit calculation
4. 40% of purchase amount is added to customer's credit balance
5. Customer receives confirmation email with credits earned

### 2. Customer Uses Credits
1. Customer adds items to cart
2. At checkout, they can choose to apply store credits
3. Credits are deducted from order total
4. Remaining amount is charged to payment method
5. Credit balance is updated in customer metafields

### 3. Customer Shares Credits
1. Customer creates shareable coupon in credit system
2. System creates Shopify gift card with specified amount
3. Credits are deducted from customer's balance
4. Gift card code is generated for sharing
5. Recipients can use gift card code at checkout

### 4. Refund Process
1. Merchant processes refund through Shopify admin
2. Instead of money refund, credits are added to customer balance
3. Customer is notified of credit refund
4. Credits can be used on future purchases

## 🧪 Testing the System

### Test Credit Earning
1. Create a test order with a customer account
2. Mark order as paid in Shopify admin
3. Check customer metafields for updated credit balance
4. Verify credits display correctly in the app

### Test Credit Usage
1. Add products to cart while logged in
2. Go to checkout and verify credit options appear
3. Apply credits and complete purchase
4. Confirm credit balance is reduced correctly

### Test Credit Sharing
1. Go to Credits page in the app
2. Create a shareable coupon with some credit amount
3. Verify gift card is created in Shopify admin
4. Test using the gift card code at checkout

## 🚨 Important Notes

### Security Considerations
- Customer metafields should be read-only via Storefront API
- All credit updates should happen server-side via webhooks
- Validate credit amounts before applying at checkout
- Implement rate limiting for credit operations

### Performance Optimization
- Cache customer credit data where possible
- Batch metafield updates when processing multiple transactions
- Use Shopify's bulk operations for large data updates
- Monitor API rate limits and implement retry logic

### Monitoring & Analytics
- Track credit earning and spending patterns
- Monitor gift card usage and sharing rates
- Set up alerts for unusual credit activity
- Analyze impact on customer retention and AOV

## 📞 Support & Troubleshooting

### Common Issues

**Credits not appearing after purchase:**
- Check Shopify Flow automation is active
- Verify order status is "paid"
- Confirm metafield definitions are correct

**Checkout not applying credits:**
- Ensure customer is logged in
- Verify credit balance is sufficient
- Check Storefront API permissions

**Gift cards not working:**
- Confirm gift card functionality is enabled
- Check gift card hasn't expired
- Verify gift card code format

### Getting Help
- Shopify Partner Support for API issues
- Shopify Flow documentation for automation
- Community forums for implementation questions

---

## 🎯 Next Steps

1. **Set up the Shopify backend** following the steps above
2. **Test the implementation** with small transactions
3. **Configure email templates** to match your brand
4. **Set up monitoring** for credit transactions
5. **Train your team** on the new credit system
6. **Launch** and promote the credit program to customers

This comprehensive credit system will significantly enhance customer retention and increase repeat purchases by providing immediate value back to customers while encouraging them to share your brand with friends! 🚀