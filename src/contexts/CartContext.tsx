import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Cart, createCart, getCart, addToCart as shopifyAddToCart, updateCartLine, removeFromCart } from '@/lib/shopify';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, []);

  const initializeCart = async () => {
    try {
      const cartId = localStorage.getItem('2xy-cart-id');
      
      if (cartId) {
        // Try to get existing cart
        try {
          const existingCart = await getCart(cartId);
          setCart(existingCart);
          return existingCart;
        } catch (error) {
          // Cart doesn't exist, create new one
          localStorage.removeItem('2xy-cart-id');
        }
      }
      
      // Create new cart
      const newCart = await createCart();
      localStorage.setItem('2xy-cart-id', newCart.id);
      setCart(newCart);
      return newCart;
    } catch (error) {
      console.error('Failed to initialize cart:', error);
      toast({
        title: "Cart Error",
        description: "Failed to initialize cart. Please refresh the page.",
        variant: "destructive",
      });
      return null;
    }
  };

  const addToCart = async (variantId: string, quantity = 1) => {
    let currentCart = cart;
    if (!currentCart) {
      currentCart = await initializeCart();
      if (!currentCart) {
        console.error('Failed to initialize cart');
        toast({
          title: "Error",
          description: "Failed to initialize cart. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const updatedCart = await shopifyAddToCart(currentCart.id, variantId, quantity);
      setCart(updatedCart);
      
      toast({
        title: "Added to cart!",
        description: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart.`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const updatedCart = await updateCartLine(cart.id, lineId, quantity);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (lineId: string) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const updatedCart = await removeFromCart(cart.id, lineId);
      setCart(updatedCart);
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalItems = () => {
    if (!cart) return 0;
    return cart.lines.edges.reduce((total, edge) => total + edge.node.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      getTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}