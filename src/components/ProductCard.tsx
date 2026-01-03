import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopifyProduct, isCustomerLoggedIn, getCustomerToken } from '@/lib/shopify';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: ShopifyProduct;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(() => {
    // Only show liked products if user is logged in
    if (!isCustomerLoggedIn()) return false;
    
    const customerId = getCustomerToken()?.accessToken;
    const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
    const likedProducts = JSON.parse(localStorage.getItem(likedKey) || '[]');
    return likedProducts.includes(product.id);
  });
  const { addToCart, isLoading } = useCart();
  const { toast } = useToast();

  const images = product.images.edges;
  const firstVariant = product.variants.edges[0]?.node;
  
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currency = product.priceRange.minVariantPrice.currencyCode;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (firstVariant) {
      await addToCart(firstVariant.id);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is logged in
    if (!isCustomerLoggedIn()) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save products to your favorites.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Navigate to profile page which will show auth modal
              window.location.href = '/profile';
            }}
          >
            Sign In
          </Button>
        ),
      });
      return;
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Save to customer-specific localStorage
    const customer = getCustomerToken();
    const customerId = customer?.accessToken;
    const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
    const currentLiked = JSON.parse(localStorage.getItem(likedKey) || '[]');
    
    if (newLikedState) {
      if (!currentLiked.includes(product.id)) {
        currentLiked.push(product.id);
        toast({
          title: "Added to favorites",
          description: `${product.title} has been added to your favorites.`,
        });
      }
    } else {
      const index = currentLiked.indexOf(product.id);
      if (index > -1) {
        currentLiked.splice(index, 1);
        toast({
          title: "Removed from favorites",
          description: `${product.title} has been removed from your favorites.`,
        });
      }
    }
    localStorage.setItem(likedKey, JSON.stringify(currentLiked));
  };

  const handleProductClick = () => {
    // Save current scroll position before navigating
    sessionStorage.setItem('homeScrollPosition', window.scrollY.toString());
    // Scroll to top when navigating to product
    window.scrollTo(0, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/product/${product.handle}`} onClick={handleProductClick}>
        <div
          className="relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-accent/50 transition-all duration-300 product-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setCurrentImageIndex(0);
          }}
        >
          {/* Product Image */}
          <div className="aspect-square overflow-hidden bg-muted/20">
            <motion.img
              src={images[currentImageIndex]?.node.url || '/placeholder.svg'}
              alt={images[currentImageIndex]?.node.altText || product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              whileHover={{ scale: 1.05 }}
            />
            
            {/* Image Indicator Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors ${
                      i === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Wishlist Button - Show on hover */}
            <motion.button
              className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleLike}
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: isHovered ? 1 : (isLiked ? 0.8 : 0), 
                y: isHovered ? 0 : -10 
              }}
              transition={{ duration: 0.3 }}
            >
              <Heart 
                className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </motion.button>


            {/* Sale Badge */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
              <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded-full">
                New
              </span>
            </div>

            {/* Quick Add Button - Show on hover at bottom of image area */}
            <motion.div 
              className="absolute bottom-2 left-2 right-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                y: isHovered ? 0 : 20 
              }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleAddToCart}
                disabled={isLoading || !firstVariant?.availableForSale}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg text-sm flex items-center justify-center"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {isLoading ? 'Adding...' : 'Quick Add'}
              </Button>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="p-3 sm:p-4 space-y-2">
            <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors text-sm sm:text-base">
              {product.title}
            </h3>
            
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {product.description.substring(0, 100)}...
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {formatCurrency(price, "INR")}
                </p>
              </div>

              {/* Stock Status - Moved to right side */}
              {firstVariant && (
                <p className={`text-xs ${
                  firstVariant.availableForSale 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {firstVariant.availableForSale ? 'In Stock' : 'Out of Stock'}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}