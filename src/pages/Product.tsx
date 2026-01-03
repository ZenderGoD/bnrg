import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Share, Star, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, Ruler, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getProduct, ShopifyProduct, getAllProducts, isCustomerLoggedIn, getCustomerToken, canViewLockedContent } from '@/lib/shopify';
import { users, auth } from '@/lib/api';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ProductGrid } from '@/components/ProductGrid';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import Masonry from '@/components/ui/masonry';
import { FullscreenImageViewer } from '@/components/FullscreenImageViewer';

export default function Product() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedColorVariant, setSelectedColorVariant] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSizes, setSelectedSizes] = useState<Array<{ index: number; variantId: string }>>([{ index: 0, variantId: '' }]);
  const [isLiked, setIsLiked] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [canViewLocked, setCanViewLocked] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  // Cart system removed
  const { toast } = useToast();

  const handleBackNavigation = () => {
    const savedScrollPosition = sessionStorage.getItem('homeScrollPosition');
    navigate('/');
    
    // Restore scroll position after navigation
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
      }, 100);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize liked state and check approval
  useEffect(() => {
    setIsLoggedIn(isCustomerLoggedIn());
    canViewLockedContent().then(setCanViewLocked);
    
    // Check rate limit
    const checkRateLimit = () => {
      const lastRequestTime = localStorage.getItem('authorization_request_timestamp');
      if (lastRequestTime) {
        const lastRequest = parseInt(lastRequestTime, 10);
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const timeSinceLastRequest = now - lastRequest;
        
        if (timeSinceLastRequest < oneDayInMs) {
          setIsRateLimited(true);
          return;
        }
      }
      setIsRateLimited(false);
    };
    
    checkRateLimit();
    
    if (!product || !isCustomerLoggedIn()) return;
    
    const customerId = getCustomerToken()?.accessToken;
    const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
    const likedProducts = JSON.parse(localStorage.getItem(likedKey) || '[]');
    setIsLiked(likedProducts.includes(product.id));
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) return;
      
      try {
        const [productData, allProducts] = await Promise.all([
          getProduct(handle),
          getAllProducts(20)
        ]);
        
        setProduct(productData);
        
        // Set related products (exclude current product)
        const related = allProducts.filter(p => p.id !== productData?.id).slice(0, 8);
        setRelatedProducts(related);
        
        if (productData?.variants.edges.length > 0) {
          const firstVariant = productData.variants.edges[0].node;
          setSelectedVariant(firstVariant.id);
          setSelectedColorVariant(firstVariant.id);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [handle]);

  // Helper functions
  const getCurrentVariant = () => {
    return product?.variants.edges.find(edge => edge.node.id === selectedVariant)?.node;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getVariantsByColor = () => {
    if (!product) return [];
    
    const colorGroups: { [key: string]: Array<{
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }> } = {};
    product.variants.edges.forEach(edge => {
      const variant = edge.node;
      const color = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'color')?.value || 'Default';
      
      if (!colorGroups[color]) {
        colorGroups[color] = [];
      }
      colorGroups[color].push(variant);
    });
    
    return Object.entries(colorGroups).map(([color, variants]) => ({
      color,
      variants,
      image: variants[0].image?.url || product.images.edges[0]?.node.url
    }));
  };

  const getSizeOptions = () => {
    if (!product) return [];
    
    const colorVariants = getVariantsByColor();
    const selectedColorGroup = colorVariants.find(group => 
      group.variants.some(v => v.id === selectedColorVariant)
    );
    
    if (!selectedColorGroup) return [];
    
    return selectedColorGroup.variants.map(variant => ({
      id: variant.id,
      size: variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size')?.value || variant.title,
      available: variant.availableForSale && (variant.quantityAvailable ? variant.quantityAvailable > 0 : true),
      price: variant.price.amount
    }));
  };


  const toggleLike = () => {
    if (!isCustomerLoggedIn()) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save products to your favorites.",
      });
      return;
    }
    
    if (!product) return;
    
    const customerId = getCustomerToken()?.accessToken;
    const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
    const currentLiked = JSON.parse(localStorage.getItem(likedKey) || '[]');
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    if (newLikedState) {
      currentLiked.push(product.id);
      toast({
        title: "Added to favorites",
        description: `${product.title} has been added to your favorites.`,
      });
    } else {
      const index = currentLiked.indexOf(product.id);
      if (index > -1) currentLiked.splice(index, 1);
      toast({
        title: "Removed from favorites",
        description: `${product.title} has been removed from your favorites.`,
      });
    }
    
    localStorage.setItem(likedKey, JSON.stringify(currentLiked));
  };

  const handleRequestAuthorization = async () => {
    // Check if rate limited
    const lastRequestTime = localStorage.getItem('authorization_request_timestamp');
    if (lastRequestTime) {
      const lastRequest = parseInt(lastRequestTime, 10);
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceLastRequest = now - lastRequest;
      
      if (timeSinceLastRequest < oneDayInMs) {
        const hoursRemaining = Math.ceil((oneDayInMs - timeSinceLastRequest) / (60 * 60 * 1000));
        toast({
          title: "Request Already Sent",
          description: `You can only request authorization once per day. Please try again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}.`,
          variant: "default",
        });
        return;
      }
    }
    
    // Get user ID
    const userId = auth.getUserId();
    if (!userId) {
      toast({
        title: "Error",
        description: "Please sign in to request authorization.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Call the mutation to update user and send Discord notification
      await users.requestAuthorization(userId);
      
      // Set rate limit timestamp
      localStorage.setItem('authorization_request_timestamp', Date.now().toString());
      setIsRateLimited(true);
      
      toast({
        title: "Authorization Request",
        description: "Your request has been noted. An admin will review and approve your access soon.",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to request authorization:', error);
      toast({
        title: "Error",
        description: "Failed to send authorization request. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async () => {
    // Check if user is logged in
    if (!isCustomerLoggedIn()) {
      toast({
        title: "Please log in",
        description: "You need to log in to add items to your cart.",
        action: <Button variant="outline" onClick={() => navigate('/profile')}>Login</Button>
      });
      return;
    }

    if (!product) return;
    
    // Validate all selected sizes
    const invalidSizes = selectedSizes.filter(s => !s.variantId || s.variantId === '');
    if (invalidSizes.length > 0) {
      toast({
        title: "Size required",
        description: "Please select sizes for all items before adding to cart.",
      });
      return;
    }
    
    // Cart system removed
    toast({
      title: "Cart system removed",
      description: `Cart functionality has been removed from this project.`,
    });
  };

  // Update selected sizes when quantity changes
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      toast({
        title: "Maximum quantity",
        description: "You can add up to 10 items at a time.",
      });
      return;
    }
    
    setQuantity(newQuantity);
    const newSelectedSizes = Array.from({ length: newQuantity }, (_, i) => 
      selectedSizes[i] || { index: i, variantId: i === 0 ? selectedSize : '' }
    );
    setSelectedSizes(newSelectedSizes);
    
    // Update first selection if it exists
    if (newSelectedSizes[0] && selectedSize) {
      newSelectedSizes[0].variantId = selectedSize;
      setSelectedSizes(newSelectedSizes);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <SkeletonLoader variant="hero" />
            <SkeletonLoader variant="hero" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images.edges;
  const variants = product.variants.edges;
  const currentVariant = getCurrentVariant();
  const price = currentVariant ? parseFloat(currentVariant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount);
  const mrp = product.mrp;
  const discountPercentage = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const colorVariants = getVariantsByColor();
  const sizeOptions = getSizeOptions();

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button variant="ghost" className="group" onClick={handleBackNavigation}>
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Products
            </Button>
        </motion.div>

        {/* Masonry Layout with Title/Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Masonry
            items={[
              // Title and Description Card (first item)
              {
                id: 'product-info',
                type: 'text' as const,
                title: product.title,
                description: product.description,
                tags: product.tags,
                height: Math.max(
                  400, 
                  200 + (product.description?.length || 0) / 10 + (product.tags?.length || 0) * 30 + 
                  (isLoggedIn && !canViewLocked ? 80 : 0) // Extra height for button if shown
                ), // Dynamic height based on content
                onLikeClick: toggleLike,
                isLiked: isLiked,
              },
              // Image items
              ...images.map((image, index) => {
                // Create varied heights for masonry effect (300-600px range)
                const heightVariations = [400, 500, 350, 600, 450, 550, 380, 520];
                const height = heightVariations[index % heightVariations.length];
                
                return {
                  id: image.node.id || `image-${index}`,
                  type: 'image' as const,
                  img: image.node.url,
                  altText: image.node.altText || `${product.title} view ${index + 1}`,
                  height: height,
                  locked: image.node.locked || false,
                };
              })
            ]}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            blurToFocus={true}
            colorShiftOnHover={false}
            canViewLocked={canViewLocked}
            isLoggedIn={isLoggedIn}
            isRateLimited={isRateLimited}
            onRequestAuthorization={handleRequestAuthorization}
            onItemClick={(item) => {
              // Only open viewer for image items, not text cards
              if (item.type === 'image' && item.img) {
                const imageIndex = images.findIndex(img => 
                  img.node.id === item.id || img.node.url === item.img
                );
                if (imageIndex >= 0) {
                  setSelectedImageIndex(imageIndex);
                  setIsViewerOpen(true);
                }
              }
            }}
          />
        </motion.div>

        {/* Fullscreen Image Viewer */}
        {product && images.length > 0 && (
          <FullscreenImageViewer
            isOpen={isViewerOpen}
            onOpenChange={setIsViewerOpen}
            src={images[selectedImageIndex]?.node.url || ''}
            alt={images[selectedImageIndex]?.node.altText || product.title}
            title={product.title}
            assets={images.map((img, idx) => ({
              src: img.node.url,
              alt: img.node.altText || `${product.title} view ${idx + 1}`,
              title: product.title,
              locked: img.node.locked || false,
            }))}
            initialIndex={selectedImageIndex}
            canViewLocked={canViewLocked}
          />
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16"
          >
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">You might also like</h2>
              <ProductGrid
                products={relatedProducts}
                isLoading={false}
                title=""
                subtitle=""
                showLoadMore={false}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}