# Payment System Documentation

## Overview
The BNRG payment system handles UPI payments through QR code scanning, with manual payment verification by admin and Discord notifications.

## Architecture

### Components

1. **Checkout Page** (`/src/pages/Checkout.tsx`)
   - Displays order summary
   - Shows UPI QR code for payment
   - Creates order and payment records when user confirms

2. **Payment Schema** (`/convex/schema.ts`)
   - `payments` table stores payment records
   - Tracks: amount, amountPaid, status, transactionId, notes

3. **Payment Functions** (`/convex/payments.ts`)
   - `create`: Creates payment record when order is created
   - `updatePayment`: Admin updates payment amount
   - `getByOrderId`: Get payment for an order
   - `getAll`: Get all payments (admin)

4. **Admin Payment Management** (`/src/pages/Admin.tsx`)
   - View payment status for each order
   - Update amount paid
   - Add transaction ID and notes
   - Automatic Discord notifications

## Payment Flow

### Customer Flow
1. Customer adds items to cart
2. Clicks "Proceed to Checkout" from cart page
3. Redirected to `/checkout` page
4. Sees order summary and QR code
5. Clicks "Create Order & Confirm Payment"
6. Order and payment record created (status: pending)
7. Customer scans QR code or uses UPI ID: `bishalbanerjee565@okicici`
8. Customer makes payment via UPI
9. Admin receives Discord notification

### Admin Flow
1. Admin receives Discord notification about new payment
2. Admin goes to Admin Panel > Orders tab
3. Finds the order and clicks "Update Payment"
4. Enters amount paid, transaction ID (optional), notes (optional)
5. System calculates status:
   - `paid`: amountPaid >= amount
   - `partial`: amountPaid > 0 but < amount
   - `pending`: amountPaid = 0
6. Order financial status updated automatically
7. Discord notification sent for payment update

## Configuration

### Environment Variables

**Required:**
- `DISCORD_WEBHOOK_SYSTEM`: Discord webhook URL for payment notifications
  - Set in both `.env` (local) and Convex dashboard (production)
  - Get from Discord: Server Settings > Integrations > Webhooks > New Webhook

### Payment Details

- **UPI ID**: `bishalbanerjee565@okicici`
- **QR Code Image**: `/WhatsApp Image 2026-01-01 at 03.42.11.jpeg`
- **Currency**: INR (₹)
- **Payment Method**: UPI

## Database Schema

### Payments Table
```typescript
{
  orderId: Id<"orders">,
  userId: Id<"users">,
  amount: number,           // Total amount required
  amountPaid: number,       // Amount paid by customer
  status: "pending" | "partial" | "paid" | "cancelled",
  paymentMethod: string,    // "UPI"
  transactionId?: string,   // UPI transaction ID
  notes?: string,           // Admin notes
  createdAt: number,
  updatedAt: number,
}
```

## Discord Notifications

### New Payment Notification
Sent when a payment record is created:
- **Title**: 💰 New Payment Pending
- **Fields**: Order Number, Customer Email, Amount
- **Color**: Orange

### Payment Update Notification
Sent when admin updates payment:
- **Title**: ✅ Payment Completed (if paid) or ⚠️ Partial Payment
- **Fields**: Order Number, Customer, Total Amount, Amount Paid, Status
- **Color**: Green (paid) or Orange (partial)

## API Functions

### Convex Mutations

#### `payments.create`
Creates a payment record for an order.
```typescript
await createPayment({
  orderId: Id<"orders">,
  userId: Id<"users">,
  amount: number,
});
```

#### `payments.updatePayment`
Updates payment amount (admin only).
```typescript
await updatePayment({
  paymentId: Id<"payments">,
  amountPaid: number,
  transactionId?: string,
  notes?: string,
});
```

### Convex Queries

#### `payments.getByOrderId`
Gets payment record for an order.
```typescript
const payment = await getPaymentByOrderId({ orderId: Id<"orders"> });
```

#### `payments.getAll`
Gets all payments (admin).
```typescript
const payments = await getAllPayments({ 
  status?: string,
  limit?: number 
});
```

## Currency Formatting

All prices are displayed in INR (₹) format using the `formatCurrency` utility:
```typescript
import { formatCurrency } from '@/lib/utils';
formatCurrency(amount, "INR"); // Returns: "₹100.00"
```

## Order Creation

Orders are created using `orders.createFromCart` which:
1. Takes cart items with product handles
2. Looks up product IDs from handles
3. Creates order record
4. Updates user credits (40% cashback)
5. Creates credit transactions

## Troubleshooting

### Payment Notifications Not Working
1. Check `DISCORD_WEBHOOK_SYSTEM` is set in Convex dashboard
2. Verify webhook URL is valid
3. Check Convex logs for errors

### Payment Status Not Updating
1. Ensure payment record exists for the order
2. Check order financial status updates after payment update
3. Verify amountPaid is being saved correctly

### QR Code Not Displaying
1. Verify image exists at `/WhatsApp Image 2026-01-01 at 03.42.11.jpeg`
2. Check image is in `public/` folder
3. Verify image file name matches exactly (case-sensitive)

## Future Enhancements

- [ ] Automatic payment verification via payment gateway API
- [ ] Payment receipts/invoices generation
- [ ] Payment history in user profile
- [ ] Partial payment tracking and reminders
- [ ] Multiple payment methods support


