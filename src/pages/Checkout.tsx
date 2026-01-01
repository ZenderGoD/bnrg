import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';
import { getCurrentCustomer } from '@/lib/passwordlessAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
const UPI_ID = "bishalbanerjee565@okicici";
const QR_CODE_IMAGE = "/WhatsApp Image 2026-01-01 at 03.42.11.jpeg";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, isLoading: cartLoading } = useCart();
  const customer = getCurrentCustomer();
  const { toast } = useToast();
  const [creatingOrder, setCreatingOrder] = useState(false);

  const createOrder = useMutation(api.orders.createFromCart);
  const createPayment = useMutation(api.payments.create);

  const total = cart ? parseFloat(cart.cost.totalAmount.amount) : 0;
  const currency = cart?.cost.totalAmount.currencyCode || "INR";

  useEffect(() => {
    if (!cart || !cart.lines.edges.length) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleCreateOrder = async () => {
    if (!cart || !customer?.id) {
      toast({
        title: "Error",
        description: "Please sign in to continue with checkout.",
        variant: "destructive",
      });
      navigate('/profile');
      return;
    }

    setCreatingOrder(true);
    try {
      // Create order items from cart
      const orderItems = cart.lines.edges.map(({ node }) => ({
        productHandle: node.merchandise.product.handle,
        variantId: node.merchandise.id,
        title: node.merchandise.product.title,
        quantity: node.quantity,
        price: parseFloat(node.cost.totalAmount.amount) / node.quantity,
        image: node.merchandise.image?.url,
      }));

      // Create order (this will look up product IDs from handles)
      const orderId = await createOrder({
        userId: customer.id as Id<"users">,
        items: orderItems,
        totalPrice: total,
        currencyCode: currency,
        creditsApplied: 0,
      });

      // Create payment record
      await createPayment({
        orderId,
        userId: customer.id as Id<"users">,
        amount: total,
      });

      toast({
        title: "Order Created",
        description: "Your order has been created. Please complete the payment.",
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  if (cartLoading || !cart || !cart.lines.edges.length) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>

          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your payment to confirm your order</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.lines.edges.map(({ node: item }) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.merchandise.image?.url ? (
                      <img
                        src={item.merchandise.image.url}
                        alt={item.merchandise.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.merchandise.product.title}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.cost.totalAmount.amount, item.cost.totalAmount.currencyCode || currency)}
                  </p>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Pay via UPI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                  <img
                    src={QR_CODE_IMAGE}
                    alt="UPI QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                
                <div className="w-full space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">UPI ID</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-medium">{UPI_ID}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyUPIId}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>Instructions:</strong>
                    </p>
                    <ol className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 list-decimal list-inside">
                      <li>Scan the QR code with any UPI app</li>
                      <li>Or send money to the UPI ID shown above</li>
                      <li>Enter the exact amount: <strong>{formatCurrency(total, currency)}</strong></li>
                      <li>After payment, notify us through your order confirmation</li>
                    </ol>
                  </div>

                  {!customer && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        Please sign in to create an order and receive payment confirmation.
                      </p>
                      <Button
                        onClick={() => navigate('/profile')}
                        className="mt-2 w-full"
                        variant="outline"
                      >
                        Sign In
                      </Button>
                    </div>
                  )}

                  {customer && (
                    <Button
                      onClick={handleCreateOrder}
                      disabled={creatingOrder}
                      className="w-full"
                      size="lg"
                    >
                      {creatingOrder ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Create Order & Confirm Payment
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

