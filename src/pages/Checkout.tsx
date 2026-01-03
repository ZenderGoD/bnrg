import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Copy, QrCode, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { getCurrentCustomer } from '@/lib/passwordlessAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { auth, users, type User as UserType } from '@/lib/api';
import { FullscreenImageViewer } from '@/components/FullscreenImageViewer';
const UPI_ID = "bishalbanerjee565@okicici";
const QR_CODE_IMAGE = "/WhatsApp Image 2026-01-01 at 03.42.11.jpeg";
const PAYMENT_TIMER_MINUTES = 5;

export default function Checkout() {
  const navigate = useNavigate();
  // Cart system removed - checkout page disabled
  const customer = getCurrentCustomer();
  const { toast } = useToast();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [savedUser, setSavedUser] = useState<UserType | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [orderId, setOrderId] = useState<Id<"orders"> | null>(null);
  const [paymentId, setPaymentId] = useState<Id<"payments"> | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(PAYMENT_TIMER_MINUTES * 60);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createOrder = useMutation(api.orders.createFromCart);
  const createPayment = useMutation(api.payments.create);
  const initiatePayment = useMutation(api.payments.initiatePayment);
  const createOrGetGuestUser = useMutation(api.users.createOrGetGuestUser);
  
  // Subscribe to payment status changes
  const payment = useQuery(
    api.payments.getByOrderId,
    orderId ? { orderId } : "skip"
  );

  const total = cart ? parseFloat(cart.cost.totalAmount.amount) : 0;
  const currency = "INR"; // Always use INR for display

  // Shipping address form state
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    phone: '',
    email: '',
  });

  // Billing address form state
  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    phone: '',
  });

  // Load saved user data if signed in
  useEffect(() => {
    const loadUserData = async () => {
      if (auth.isLoggedIn() && customer?.id) {
        try {
          const userData = await users.getById(customer.id);
          if (userData) {
            setSavedUser(userData);
            // Pre-fill shipping address from saved data
            setShippingAddress({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              address: userData.address || '',
              apartment: userData.apartment || '',
              city: userData.city || '',
              state: userData.state || '',
              country: userData.country || 'India',
              pinCode: userData.pinCode || '',
              phone: userData.phone || '',
              email: userData.email || '',
            });
            setUseSavedAddress(true);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [customer]);

  // Update billing address when sameAsShipping changes
  useEffect(() => {
    if (sameAsShipping) {
      setBillingAddress({
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        apartment: shippingAddress.apartment,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        pinCode: shippingAddress.pinCode,
        phone: shippingAddress.phone,
      });
    }
  }, [sameAsShipping, shippingAddress]);

  useEffect(() => {
    if (!cart || !cart.lines.edges.length) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Monitor payment status changes and show toast when confirmed
  useEffect(() => {
    if (payment && payment.status === 'paid' && showQRCode) {
      toast({
        title: "Payment Confirmed! ✅",
        description: "Your payment has been confirmed. We'll get back to you soon with your order details.",
        duration: 10000,
      });
      // Clear timer and hide QR code after a delay
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimeout(() => {
        setShowQRCode(false);
        navigate('/');
      }, 5000);
    }
  }, [payment?.status, showQRCode, toast, navigate]);

  // Timer countdown
  useEffect(() => {
    if (showQRCode && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setShowQRCode(false);
            toast({
              title: "Payment Time Expired",
              description: "The payment window has expired. Please proceed to payment again.",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [showQRCode, timeRemaining, toast]);

  const validateAddress = (addr: typeof shippingAddress, isShipping = true) => {
    const required = isShipping 
      ? ['firstName', 'lastName', 'address', 'city', 'state', 'pinCode', 'phone', 'email']
      : ['firstName', 'lastName', 'address', 'city', 'state', 'pinCode', 'phone'];
    
    for (const field of required) {
      if (!addr[field as keyof typeof addr]) {
        const fieldName = field === 'pinCode' ? 'PIN code' 
          : field === 'firstName' ? 'first name'
          : field === 'lastName' ? 'last name'
          : field;
        return `Please fill in ${fieldName}`;
      }
    }
    return null;
  };

  const handleProceedToPayment = async () => {
    // Validate shipping address
    const shippingError = validateAddress(shippingAddress, true);
    if (shippingError) {
      toast({
        title: "Validation Error",
        description: shippingError,
        variant: "destructive",
      });
      return;
    }

    // Validate billing address if different
    if (!sameAsShipping) {
      const billingError = validateAddress(billingAddress, false);
      if (billingError) {
        toast({
          title: "Validation Error",
          description: billingError,
          variant: "destructive",
        });
        return;
      }
    }

    if (!cart) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    setCreatingOrder(true);
    try {
      let userId: Id<"users">;

      // Create or get user (guest or signed in)
      if (customer?.id) {
        userId = customer.id as Id<"users">;
      } else {
        // Create guest user from shipping address
        userId = await createOrGetGuestUser({
          email: shippingAddress.email,
          firstName: shippingAddress.firstName || "Guest",
          lastName: shippingAddress.lastName || "User",
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pinCode: shippingAddress.pinCode,
        });
      }

      // Create order items from cart
      const orderItems = cart.lines.edges.map(({ node }) => ({
        productHandle: node.merchandise.product.handle,
        variantId: node.merchandise.id,
        title: node.merchandise.product.title,
        quantity: node.quantity,
        price: parseFloat(node.cost.totalAmount.amount) / node.quantity,
        image: node.merchandise.image?.url,
      }));

      // Create order
      const newOrderId = await createOrder({
        userId,
        items: orderItems,
        totalPrice: total,
        currencyCode: currency,
      });

      // Create payment record
      const newPaymentId = await createPayment({
        orderId: newOrderId,
        userId,
        amount: total,
      });

      // Initiate payment (this sends Discord notification and sets timer)
      await initiatePayment({
        paymentId: newPaymentId,
      });

      setOrderId(newOrderId);
      setPaymentId(newPaymentId);
      setShowQRCode(true);
      setTimeRemaining(PAYMENT_TIMER_MINUTES * 60);

      toast({
        title: "Payment Initiated",
        description: "Please complete the payment within 5 minutes using the QR code below.",
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
    <div className="min-h-screen pt-20 sm:pt-24 pb-20 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Checkout</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Complete your payment to confirm your order</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 overflow-hidden">
          {/* Shipping & Billing Addresses */}
          <div className="lg:col-span-2 space-y-8 sm:space-y-10 min-w-0">
            {/* Shipping Address */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 sm:space-y-6">
                {auth.isLoggedIn() && savedUser && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useSavedAddress"
                        checked={useSavedAddress}
                        onCheckedChange={(checked) => {
                          setUseSavedAddress(checked as boolean);
                          if (checked) {
                            setShippingAddress({
                              firstName: savedUser.firstName || '',
                              lastName: savedUser.lastName || '',
                              address: savedUser.address || '',
                              apartment: savedUser.apartment || '',
                              city: savedUser.city || '',
                              state: savedUser.state || '',
                              country: savedUser.country || 'India',
                              pinCode: savedUser.pinCode || '',
                              phone: savedUser.phone || '',
                              email: savedUser.email || '',
                            });
                          }
                        }}
                      />
                      <Label htmlFor="useSavedAddress" className="cursor-pointer">
                        Use the saved address
                      </Label>
                    </div>
                    {useSavedAddress && (
                      <div className="pl-6 text-sm text-muted-foreground">
                        <p>{savedUser.firstName} {savedUser.lastName}</p>
                        <p>{savedUser.address || ''}</p>
                        {savedUser.apartment && <p>{savedUser.apartment}</p>}
                        <p>{savedUser.city || ''}, {savedUser.state || ''} {savedUser.pinCode || ''}</p>
                        <p>{savedUser.phone || ''}</p>
                      </div>
                    )}
                  </div>
                )}

                {(!useSavedAddress || !auth.isLoggedIn()) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shipping-firstName">First name (optional)</Label>
                        <Input
                          id="shipping-firstName"
                          value={shippingAddress.firstName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-lastName">Last name</Label>
                        <Input
                          id="shipping-lastName"
                          value={shippingAddress.lastName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-semibold mb-3">Address</h3>
                      <Input
                        id="shipping-address"
                        placeholder="Enter your address"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shipping-city">City</Label>
                      <Input
                        id="shipping-city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shipping-state">State</Label>
                        <Select
                          value={shippingAddress.state}
                          onValueChange={(value) => setShippingAddress({ ...shippingAddress, state: value })}
                        >
                          <SelectTrigger id="shipping-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                            <SelectItem value="Karnataka">Karnataka</SelectItem>
                            <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                            <SelectItem value="Delhi">Delhi</SelectItem>
                            <SelectItem value="West Bengal">West Bengal</SelectItem>
                            <SelectItem value="Gujarat">Gujarat</SelectItem>
                            <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                            <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                            <SelectItem value="Punjab">Punjab</SelectItem>
                            <SelectItem value="Haryana">Haryana</SelectItem>
                            <SelectItem value="Kerala">Kerala</SelectItem>
                            <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                            <SelectItem value="Telangana">Telangana</SelectItem>
                            <SelectItem value="Bihar">Bihar</SelectItem>
                            <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                            <SelectItem value="Odisha">Odisha</SelectItem>
                            <SelectItem value="Assam">Assam</SelectItem>
                            <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                            <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                            <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                            <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                            <SelectItem value="Goa">Goa</SelectItem>
                            <SelectItem value="Tripura">Tripura</SelectItem>
                            <SelectItem value="Manipur">Manipur</SelectItem>
                            <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                            <SelectItem value="Mizoram">Mizoram</SelectItem>
                            <SelectItem value="Nagaland">Nagaland</SelectItem>
                            <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                            <SelectItem value="Sikkim">Sikkim</SelectItem>
                            <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                            <SelectItem value="Ladakh">Ladakh</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-pinCode">PIN code</Label>
                        <Input
                          id="shipping-pinCode"
                          value={shippingAddress.pinCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, pinCode: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shipping-phone">Phone</Label>
                        <Input
                          id="shipping-phone"
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipping-email">Email {!auth.isLoggedIn() && <span className="text-red-500">*</span>}</Label>
                        <Input
                          id="shipping-email"
                          type="email"
                          value={shippingAddress.email}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                          required={!auth.isLoggedIn()}
                          disabled={auth.isLoggedIn() && useSavedAddress}
                        />
                        {auth.isLoggedIn() && useSavedAddress && (
                          <p className="text-xs text-muted-foreground">Email from your account</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Billing Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 sm:space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
                  />
                  <Label htmlFor="sameAsShipping" className="cursor-pointer">
                    Same as shipping address
                  </Label>
                </div>

                {!sameAsShipping && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing-firstName">First name (optional)</Label>
                        <Input
                          id="billing-firstName"
                          value={billingAddress.firstName}
                          onChange={(e) => setBillingAddress({ ...billingAddress, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-lastName">Last name</Label>
                        <Input
                          id="billing-lastName"
                          value={billingAddress.lastName}
                          onChange={(e) => setBillingAddress({ ...billingAddress, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-semibold mb-3">Address</h3>
                      <Input
                        id="billing-address"
                        placeholder="Enter your address"
                        value={billingAddress.address}
                        onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-city">City</Label>
                      <Input
                        id="billing-city"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing-state">State</Label>
                        <Select
                          value={billingAddress.state}
                          onValueChange={(value) => setBillingAddress({ ...billingAddress, state: value })}
                        >
                          <SelectTrigger id="billing-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                            <SelectItem value="Karnataka">Karnataka</SelectItem>
                            <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                            <SelectItem value="Delhi">Delhi</SelectItem>
                            <SelectItem value="West Bengal">West Bengal</SelectItem>
                            <SelectItem value="Gujarat">Gujarat</SelectItem>
                            <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                            <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                            <SelectItem value="Punjab">Punjab</SelectItem>
                            <SelectItem value="Haryana">Haryana</SelectItem>
                            <SelectItem value="Kerala">Kerala</SelectItem>
                            <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                            <SelectItem value="Telangana">Telangana</SelectItem>
                            <SelectItem value="Bihar">Bihar</SelectItem>
                            <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                            <SelectItem value="Odisha">Odisha</SelectItem>
                            <SelectItem value="Assam">Assam</SelectItem>
                            <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                            <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                            <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                            <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                            <SelectItem value="Goa">Goa</SelectItem>
                            <SelectItem value="Tripura">Tripura</SelectItem>
                            <SelectItem value="Manipur">Manipur</SelectItem>
                            <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                            <SelectItem value="Mizoram">Mizoram</SelectItem>
                            <SelectItem value="Nagaland">Nagaland</SelectItem>
                            <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                            <SelectItem value="Sikkim">Sikkim</SelectItem>
                            <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                            <SelectItem value="Ladakh">Ladakh</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-pinCode">PIN code</Label>
                        <Input
                          id="billing-pinCode"
                          value={billingAddress.pinCode}
                          onChange={(e) => setBillingAddress({ ...billingAddress, pinCode: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-phone">Phone</Label>
                      <Input
                        id="billing-phone"
                        type="tel"
                        value={billingAddress.phone}
                        onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Payment */}
          <div className="space-y-8 sm:space-y-10 min-w-0">
            {/* Order Summary */}
            <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              {cart.lines.edges.map(({ node: item }) => (
                <div key={item.id} className="flex items-center space-x-4 sm:space-x-5 py-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
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
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium truncate">{item.merchandise.product.title}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold flex-shrink-0 ml-2">
                    {formatCurrency(item.cost.totalAmount.amount, currency)}
                  </p>
                </div>
              ))}
              
              <div className="border-t pt-5 sm:pt-6 space-y-3">
                <div className="flex justify-between text-lg sm:text-xl font-bold">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <QrCode className="h-5 w-5" />
                Pay via UPI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8">
              {!showQRCode ? (
                <div className="space-y-5 sm:space-y-6">
                  {!customer && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                        <strong>Guest Checkout Available:</strong> You can proceed as a guest or sign in to save your information and track orders.
                      </p>
                      <Button
                        onClick={() => navigate('/profile')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Sign In (Optional)
                      </Button>
                    </div>
                  )}

                  <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 p-5 sm:p-6 rounded-lg">
                    <p className="text-sm sm:text-base text-cyan-900 dark:text-cyan-100 font-semibold mb-3">
                      Payment Instructions:
                    </p>
                    <ol className="text-sm sm:text-base text-cyan-800 dark:text-cyan-200 space-y-2 sm:space-y-3 list-decimal list-inside">
                      <li>Fill in your shipping and billing details above</li>
                      <li>Review your order summary</li>
                      <li>Click "Proceed to Payment" to see the QR code</li>
                      <li>Scan the QR code with any UPI app or send money to the UPI ID</li>
                      <li>Enter the exact amount: <strong>{formatCurrency(total, currency)}</strong></li>
                      <li>You'll have 5 minutes to complete the payment</li>
                    </ol>
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    disabled={creatingOrder}
                    className="w-full"
                    size="lg"
                  >
                    {creatingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Timer */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4 w-full">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div 
                    className="bg-white p-5 sm:p-6 rounded-xl shadow-lg mb-6 sm:mb-8 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsImageViewerOpen(true)}
                  >
                    <img
                      src={QR_CODE_IMAGE}
                      alt="UPI QR Code"
                      className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
                    />
                  </div>
                  
                  <div className="w-full space-y-5 sm:space-y-6">
                    <div className="bg-muted/50 p-5 sm:p-6 rounded-lg">
                      <p className="text-sm sm:text-base text-muted-foreground mb-3 font-medium">UPI ID</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono font-medium text-sm sm:text-base break-all min-w-0 flex-1">{UPI_ID}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyUPIId}
                          className="ml-2 flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 p-5 sm:p-6 rounded-lg">
                      <p className="text-sm sm:text-base text-cyan-900 dark:text-cyan-100 font-semibold mb-3">
                        Instructions:
                      </p>
                      <ol className="text-sm sm:text-base text-cyan-800 dark:text-cyan-200 space-y-2 sm:space-y-3 list-decimal list-inside">
                        <li>Scan the QR code with any UPI app</li>
                        <li>Or send money to the UPI ID shown above</li>
                        <li>Enter the exact amount: <strong>{formatCurrency(total, currency)}</strong></li>
                        <li>Complete payment within the time limit</li>
                        <li>You'll receive a confirmation once we verify your payment</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        isOpen={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
        src={QR_CODE_IMAGE}
        alt="UPI QR Code"
        title="UPI Payment QR Code"
      />
    </div>
  );
}

