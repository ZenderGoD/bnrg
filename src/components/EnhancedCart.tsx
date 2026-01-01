import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowRight, CreditCard, User, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { useCart } from '@/contexts/CartContext';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Link } from 'react-router-dom';
import { getCurrentCustomer } from '@/lib/passwordlessAuth';
import { 
  getCustomerCredits, 
  CustomerCredits 
} from '@/lib/creditSystem';
import { 
  createEnhancedCheckout, 
  validateCheckout 
} from '@/lib/checkoutIntegration';
import { getCustomerToken } from '@/lib/shopify';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function EnhancedCart() {
  const { cart, isLoading, updateQuantity, removeItem } = useCart();
  const [customerCredits, setCustomerCredits] = useState<CustomerCredits>({ balance: 0, earned: 0, pendingCredits: 0 });
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscounts, setAppliedDiscounts] = useState<string[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  
  // Get customer info
  const customer = getCurrentCustomer();
  const isLoggedIn = !!customer;

  useEffect(() => {
    if (customer?.id) {
      loadCustomerCredits();
    }
  }, [customer]);

  const loadCustomerCredits = async () => {
    const token = getCustomerToken();
    if (!token?.accessToken) return;
    
    try {
      const credits = await getCustomerCredits(token.accessToken);
      setCustomerCredits(credits);
    } catch (error) {
      console.error('Error loading customer credits:', error);
    }
  };

  const handleApplyDiscount = () => {
    if (discountCode.trim() && !appliedDiscounts.includes(discountCode.trim())) {
      setAppliedDiscounts(prev => [...prev, discountCode.trim()]);
      setDiscountCode('');
      toast({
        title: "Discount Applied",
        description: `Discount code "${discountCode}" will be applied at checkout.`,
      });
    }
  };

  const handleRemoveDiscount = (code: string) => {
    setAppliedDiscounts(prev => prev.filter(c => c !== code));
  };

  const handleUseCreditsChange = (checked: boolean) => {
    setUseCredits(checked);
    if (checked && cart) {
      const total = cart.cost.totalAmount.amount;
      const maxCredits = Math.min(customerCredits.balance, parseFloat(total));
      setCreditsToApply(maxCredits);
    } else {
      setCreditsToApply(0);
    }
  };

  const handleCreditsAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const total = cart ? parseFloat(cart.cost.totalAmount.amount) : 0;
    const maxCredits = Math.min(customerCredits.balance, total);
    setCreditsToApply(Math.min(numAmount, maxCredits));
  };

  const handleCheckout = async () => {
    if (!cart) return;

    try {
      setIsCheckingOut(true);

      // Validate checkout
      const validation = await validateCheckout(
        cart.id,
        customer?.accessToken,
        useCredits ? creditsToApply : 0
      );

      if (!validation.valid) {
        toast({
          title: "Checkout Error",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Create enhanced checkout
      const checkoutUrl = await createEnhancedCheckout({
        cartId: cart.id,
        customerAccessToken: customer?.accessToken,
        creditsToApply: useCredits ? creditsToApply : 0,
        discountCodes: appliedDiscounts
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to create checkout');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Unable to proceed to checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonLoader variant="hero" className="mb-6 sm:mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonLoader variant="card" count={3} />
            </div>
            <div className="lg:col-span-1">
              <SkeletonLoader variant="card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.lines.edges.length) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Looks like you haven't added anything to your cart yet.
            </p>
                         <Link to="/catalog">
               <InteractiveHoverButton className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4">
                 Start Shopping
               </InteractiveHoverButton>
             </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
  const total = parseFloat(cart.cost.totalAmount.amount);
  const finalTotal = Math.max(0, total - (useCredits ? creditsToApply : 0));

  return (
    <div className="min-h-screen pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {cart.lines.edges.length} item{cart.lines.edges.length !== 1 ? 's' : ''} in your cart
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cart.lines.edges.map(({ node: item }, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {item.merchandise?.image?.url ? (
                        <img 
                          src={item.merchandise.image.url} 
                          alt={item.merchandise.image.altText || item.merchandise.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-xs sm:text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base truncate">
                        {item.merchandise?.product.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {item.merchandise?.title}
                      </p>
                      <p className="text-accent font-semibold text-sm sm:text-base">
                        {formatCurrency(item.cost.totalAmount.amount, item.cost.totalAmount.currencyCode || "INR")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3">
                      <div className="flex items-center space-x-2 bg-muted rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 p-0 touch-target"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0 touch-target"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary & Checkout */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-28"
            >
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Order Summary</h2>
              
              {/* Discount Code */}
              <div className="space-y-3 mb-4 sm:mb-6">
                <label className="text-sm font-medium text-foreground">Discount Code</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                    className="text-sm"
                  />
                  <Button 
                    onClick={handleApplyDiscount} 
                    variant="outline"
                    disabled={!discountCode.trim()}
                    className="text-sm"
                  >
                    Apply
                  </Button>
                </div>
                
                {/* Applied Discounts */}
                {appliedDiscounts.length > 0 && (
                  <div className="space-y-2">
                    {appliedDiscounts.map((code) => (
                      <div key={code} className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs sm:text-sm">
                        <span>{code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDiscount(code)}
                          className="h-5 w-5 p-0 text-green-600 hover:text-green-800 touch-target"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Credits Section */}
              {isLoggedIn && (
                <div className="space-y-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-accent/5 dark:from-amber-900/20 dark:to-accent/5 border border-amber-200/50 dark:border-amber-800/50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="use-credits" 
                      checked={useCredits}
                      onCheckedChange={handleUseCreditsChange}
                    />
                    <label htmlFor="use-credits" className="text-sm font-medium text-foreground flex items-center space-x-2">
                      <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                      <span>Use MONTEVELORIS Credits</span>
                    </label>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground">Available: {formatCurrency(customerCredits.balance, cart?.cost.totalAmount.currencyCode || "INR")}</div>

                  {useCredits && (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Amount to use"
                        value={creditsToApply}
                        onChange={(e) => handleCreditsAmountChange(e.target.value)}
                        max={Math.min(customerCredits.balance, total)}
                        min={0}
                        step={0.01}
                        className="text-sm"
                        disabled={customerCredits.balance <= 0}
                      />
                      <div className="text-xs text-muted-foreground">Max: {formatCurrency(Math.min(customerCredits.balance, total), cart?.cost.totalAmount.currencyCode || "INR")}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, cart.cost.subtotalAmount.currencyCode || "INR")}</span>
                </div>
                
                {useCredits && creditsToApply > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>MONTEVELORIS Credits Applied</span>
                    <span>-{formatCurrency(creditsToApply, cart.cost.subtotalAmount.currencyCode || "INR")}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                
                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-bold">Total</span>
                    <span className="text-lg sm:text-xl font-bold text-accent">{formatCurrency(finalTotal, cart.cost.totalAmount.currencyCode || "INR")}</span>
                  </div>
                </div>
              </div>

              {/* Redeem Gift Card */}
              <div className="space-y-3 mb-4 sm:mb-6">
                <label className="text-sm font-medium text-foreground">Redeem Gift Card</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input
                    placeholder="Enter gift card code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                    className="text-sm"
                  />
                  <Button 
                    onClick={handleApplyDiscount} 
                    variant="outline"
                    disabled={!discountCode.trim()}
                    className="text-sm"
                  >
                    Redeem
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Tip: Shareable credits are gift cards. Enter a code here to redeem.</p>
              </div>

                             <motion.div
                 className="mt-4 sm:mt-6"
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <ShimmerButton 
                   onClick={handleCheckout}
                   disabled={isCheckingOut}
                   className="w-full shadow-2xl"
                 >
                                       <div className="flex items-center justify-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                      {isCheckingOut ? (
                        'Processing...'
                      ) : (
                        <>
                          <span>Proceed to Checkout</span>
                          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </>
                      )}
                    </div>
                 </ShimmerButton>
               </motion.div>

              {!isLoggedIn && (
                <motion.div 
                  className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-accent/5 dark:from-amber-900/20 dark:to-accent/5 border border-amber-200/50 dark:border-amber-800/50 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    <p className="text-xs sm:text-sm font-medium text-accent">Unlock Premium Benefits</p>
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground leading-relaxed">
                    Sign in to earn <span className="font-medium text-accent">40% back in credits</span>, 
                    faster checkout, and exclusive rewards
                  </p>
                </motion.div>
              )}

              {/* Security Notice */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Secure checkout powered by Shopify</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}