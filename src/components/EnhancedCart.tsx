import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { useCart } from '@/contexts/CartContext';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentCustomer } from '@/lib/passwordlessAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function EnhancedCart() {
  const { cart, isLoading, updateQuantity, removeItem } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Get customer info
  const customer = getCurrentCustomer();
  const isLoggedIn = !!customer;

  const handleCheckout = async () => {
    if (!cart) return;
    navigate('/checkout');
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
                        {item.merchandise?.product.title || "Product"}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {item.merchandise?.title || "Variant"}
                      </p>
                      <div className="space-y-1">
                        {(() => {
                          const pricePerItem = parseFloat(item.cost.totalAmount.amount) / item.quantity;
                          const totalMrp = item.mrp ? item.mrp * item.quantity : null;
                          const hasDiscount = item.mrp && item.mrp > pricePerItem;
                          
                          return (
                            <>
                              {hasDiscount && totalMrp ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-muted-foreground line-through">
                                    {formatCurrency(totalMrp, "INR")}
                                  </p>
                                  <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-semibold">
                                    {Math.round(((item.mrp! - pricePerItem) / item.mrp!) * 100)}% OFF
                                  </span>
                                </div>
                              ) : null}
                              <p className="text-accent font-semibold text-sm sm:text-base">
                                {formatCurrency(item.cost.totalAmount.amount, "INR")}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(pricePerItem, "INR")} per item
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
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
              


              <div className="space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, "INR")}</span>
                </div>
                
                
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
                    <span className="text-lg sm:text-xl font-bold text-accent">{formatCurrency(total, "INR")}</span>
                  </div>
                </div>
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


              {/* Security Notice */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Secure checkout</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}