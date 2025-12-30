# 2XY Shopify Flow Setup Guide

## Overview
Shopify Flow doesn't use uploadable .flow files. Instead, you need to create workflows manually through the Shopify Flow interface. Here's how to set up the 2XY credit system workflows.

## Workflow 1: 40% Credit Earning (Order Created)

### Step 1: Create New Workflow
1. Go to **Shopify Admin → Apps → Flow**
2. Click **"Create workflow"**
3. Name: `2XY - 40% Credit Earning`

### Step 2: Set Trigger
1. Click **"Select a trigger"**
2. Choose **"Order created"** (or "Order paid" if available)

### Step 3: Add Condition
1. Click **"Add condition"**
2. Select **"Order → Financial status"**
3. Set to **"is equal to"** → **"paid"**

### Step 4: Add Action - Calculate Credits
1. Click **"Add action"**
2. Search for **"Set variable"** or **"Calculate"**
3. Variable name: `credits_earned`
4. Value: `{{ order.total_price | times: 0.40 | round: 2 }}`

### Step 5: Add Action - Update Customer Metafield
1. Click **"Add action"**
2. Search for **"Update customer metafield"**
3. Customer: `{{ order.customer }}`
4. Metafield namespace: `2xy`
5. Metafield key: `credits_balance`
6. Operation: **"Add to existing value"**
7. Value: `{{ credits_earned }}`

### Step 6: Add Action - Update Credits Earned Metafield
1. Click **"Add action"**
2. Search for **"Update customer metafield"**
3. Customer: `{{ order.customer }}`
4. Metafield namespace: `2xy`
5. Metafield key: `credits_earned`
6. Operation: **"Add to existing value"**
7. Value: `{{ credits_earned }}`

### Step 7: Add Action - Send Email Notification
1. Click **"Add action"**
2. Search for **"Send email"**
3. To: `{{ order.customer.email }}`
4. Subject: `🎉 You earned {{ credits_earned | money }} credits at 2XY!`
5. Body: 
```html
<h2>Congratulations! You earned credits!</h2>
<p>Thanks for your order {{ order.name }}!</p>
<p><strong>Credits earned: {{ credits_earned | money }}</strong></p>
<p>Your credits have been added to your 2XY account automatically.</p>
<p><a href="https://2xy.vercel.app">Shop More at 2XY</a></p>
```

### Step 8: Activate Workflow
1. Click **"Turn workflow on"**

---

## Workflow 2: Refund to Credits

### Step 1: Create New Workflow
1. Go to **Shopify Admin → Apps → Flow**
2. Click **"Create workflow"**
3. Name: `2XY - Refund to Credits`

### Step 2: Set Trigger
1. Click **"Select a trigger"**
2. Choose **"Refund created"**

### Step 3: Add Condition
1. Click **"Add condition"**
2. Select **"Refund → Status"**
3. Set to **"is equal to"** → **"success"**

### Step 4: Add Action - Update Credits Balance
1. Click **"Add action"**
2. Search for **"Update customer metafield"**
3. Customer: `{{ refund.order.customer }}`
4. Metafield namespace: `2xy`
5. Metafield key: `credits_balance`
6. Operation: **"Add to existing value"**
7. Value: `{{ refund.amount }}`

### Step 5: Add Action - Send Email Notification
1. Click **"Add action"**
2. Search for **"Send email"**
3. To: `{{ refund.order.customer.email }}`
4. Subject: `Your refund of {{ refund.amount | money }} has been added as 2XY credits`
5. Body:
```html
<h2>Refund Processed as Store Credits</h2>
<p>Hi {{ refund.order.customer.first_name }},</p>
<p>Your refund for order {{ refund.order.name }} has been processed.</p>
<p><strong>Amount: {{ refund.amount | money }}</strong></p>
<p>Instead of a cash refund, we've added this amount as credits to your 2XY account. You can use these credits for any future purchases!</p>
<p><a href="https://2xy.vercel.app/credits">View Your Credits</a></p>
```

### Step 6: Activate Workflow
1. Click **"Turn workflow on"**

---

## Quick Entry Cheatsheet

1) Order workflow (paid):
- Trigger: Order created → Condition Financial status = paid
- Action #1 Update customer metafield → Customer `{{ order.customer }}` → Namespace `2xy` → Key `credits_balance` → Add to existing value → Value `{{ order.total_price | times: 0.40 | round: 2 }}`
- Action #2 Update customer metafield → Customer `{{ order.customer }}` → Namespace `2xy` → Key `credits_earned` → Add to existing value → Value `{{ order.total_price | times: 0.40 | round: 2 }}`
- Turn workflow on

2) Refund workflow:
- Trigger: Refund created → Condition Status = success
- Action Update customer metafield → Customer `{{ refund.order.customer }}` → Namespace `2xy` → Key `credits_balance` → Add to existing value → Value `{{ refund.amount }}`

## Important Notes

1. **No File Upload**: Shopify Flow doesn't support uploading .flow files - all workflows must be created manually through the interface.

2. **Customer Metafields Required**: Before activating these workflows, make sure you've created the customer metafields:
   - `2xy.credits_balance`
   - `2xy.credits_earned`

3. **Testing**: Test workflows with small test orders before going live.

4. **Monitoring**: Check the Flow activity regularly to ensure workflows are running correctly.

## Alternative: Use Templates

Shopify Flow has pre-built templates you can customize:

1. In Flow app, click **"Browse templates"**
2. Search for **"customer metafield"** or **"loyalty"**
3. Customize the template for your credit system

## Troubleshooting

- If workflows don't trigger, check that all conditions are met
- Verify customer metafields exist and are accessible via Storefront API
- Test with small amounts first
- Check Flow activity logs for any errors