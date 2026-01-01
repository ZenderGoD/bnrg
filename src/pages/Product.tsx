import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ArrowLeft, Share, ZoomIn, ChevronLeft, ChevronRight, Star, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getProduct, ShopifyProduct, getAllProducts, isCustomerLoggedIn, getCustomerToken } from '@/lib/shopify';
import { useCart } from '@/contexts/CartContext';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ProductGrid } from '@/components/ProductGrid';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Product() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColorVariant, setSelectedColorVariant] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const { addToCart, isLoading: cartLoading } = useCart();
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

  // Initialize liked state
  useEffect(() => {
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

  const handleImageHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
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

    if (!selectedVariant || !product) return;
    
    if (!selectedSize) {
      toast({
        title: "Size required",
        description: "Please select a size before adding to cart.",
      });
      return;
    }
    
    await addToCart(selectedVariant, quantity);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left - Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Main Image with Enhanced Zoom */}
            <div className="relative group">
              <div 
                className="aspect-square overflow-hidden bg-muted cursor-zoom-in relative"
                onMouseEnter={() => setIsZoomMode(true)}
                onMouseLeave={() => setIsZoomMode(false)}
                onMouseMove={handleImageHover}
              >
                <img
                  src={images[selectedImage]?.node.url || '/placeholder.svg'}
                  alt={images[selectedImage]?.node.altText || product.title}
                  className={`h-full w-full object-cover transition-all duration-300 ${
                    isZoomMode ? 'scale-150' : 'group-hover:scale-110'
                  }`}
                  style={{
                    transformOrigin: isZoomMode ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                
                {/* Zoom Indicator */}
                {isZoomMode && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute w-32 h-32 border-2 border-white/50 bg-black/20 rounded-full"
                      style={{
                        left: `${zoomPosition.x}%`,
                        top: `${zoomPosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  </div>
                )}
                
                {/* Zoom Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                  onClick={() => setIsZoomMode(!isZoomMode)}
                >
                  <ZoomIn className="h-4 w-4 text-foreground" />
                </Button>
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 w-20 h-20 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image.node.url}
                      alt={`${product.title} view ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Image Navigation Arrows */}
            {images.length > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedImage + 1} / {images.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>

          {/* Right - Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">New</Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">No reviews yet</span>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold">{product.title}</h1>
                  <p className="text-2xl font-semibold">₹{price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">MRP in Indian currency per pair</p>
                  <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLike}
                  className={isLiked ? 'text-red-500' : 'text-muted-foreground'}
                >
                  <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <div className="text-muted-foreground leading-relaxed">
                  {/* Mobile: Show truncated text with read more */}
                  <div className="block md:hidden">
                    <p>
                      {isDescriptionExpanded 
                        ? product.description 
                        : truncateText(product.description, 150)
                      }
                    </p>
                    {product.description.length > 150 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary font-medium mt-2"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      >
                        {isDescriptionExpanded ? (
                          <span className="flex items-center gap-1">
                            Read less <ChevronUp className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            Read more <ChevronDown className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Desktop: Show full text */}
                  <div className="hidden md:block">
                    <p>{product.description}</p>
                  </div>
                </div>
                
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {product.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Color Selection */}
            {colorVariants.length > 1 && (
              <div className="space-y-4">
                <h3 className="font-medium">Colors</h3>
                <div className="flex gap-3">
                  {colorVariants.map((colorGroup, index) => (
                    <motion.div
                      key={colorGroup.color}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        colorGroup.variants.some(v => v.id === selectedColorVariant)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                      onClick={() => {
                        const firstVariant = colorGroup.variants[0];
                        setSelectedColorVariant(firstVariant.id);
                        setSelectedVariant(firstVariant.id);
                        setSelectedSize(firstVariant.id);
                      }}
                    >
                      <div className="w-16 h-16">
                        <img
                          src={colorGroup.image}
                          alt={`${product.title} in ${colorGroup.color}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                        {colorGroup.color}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Shoe Sizes (US)</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm p-0 h-auto hover:text-primary">
                      <Ruler className="h-4 w-4 mr-1" />
                      Size Guide
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Ruler className="h-5 w-5" />
                        Size Guide
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-3">Find your perfect fit with our size guide:</p>
                      </div>
                      
                      {/* Size Chart */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">US Size</th>
                              <th className="text-left py-2 font-medium">UK Size</th>
                              <th className="text-left py-2 font-medium">EU Size</th>
                              <th className="text-left py-2 font-medium">CM</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            {[
                              { us: '6', uk: '5.5', eu: '39', cm: '24.5' },
                              { us: '6.5', uk: '6', eu: '39.5', cm: '25' },
                              { us: '7', uk: '6.5', eu: '40', cm: '25.5' },
                              { us: '7.5', uk: '7', eu: '40.5', cm: '26' },
                              { us: '8', uk: '7.5', eu: '41', cm: '26.5' },
                              { us: '8.5', uk: '8', eu: '42', cm: '27' },
                              { us: '9', uk: '8.5', eu: '42.5', cm: '27.5' },
                              { us: '9.5', uk: '9', eu: '43', cm: '28' },
                              { us: '10', uk: '9.5', eu: '44', cm: '28.5' },
                              { us: '10.5', uk: '10', eu: '44.5', cm: '29' },
                              { us: '11', uk: '10.5', eu: '45', cm: '29.5' },
                              { us: '11.5', uk: '11', eu: '45.5', cm: '30' },
                              { us: '12', uk: '11.5', eu: '46', cm: '30.5' }
                            ].map((size) => (
                              <tr key={size.us} className="border-b border-border/50">
                                <td className="py-2">{size.us}</td>
                                <td className="py-2">{size.uk}</td>
                                <td className="py-2">{size.eu}</td>
                                <td className="py-2">{size.cm}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Measurement Instructions */}
                      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <h4 className="font-medium text-sm">How to measure:</h4>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>Place your foot on a piece of paper</li>
                          <li>Mark the longest point of your foot</li>
                          <li>Measure the distance from heel to toe</li>
                          <li>Use the CM measurement to find your size</li>
                        </ol>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Still unsure? We recommend ordering your usual size.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {sizeOptions.map((sizeOption) => (
                  <Button
                    key={sizeOption.id}
                    variant={selectedSize === sizeOption.id ? "default" : "outline"}
                    className={`h-12 ${
                      !sizeOption.available 
                        ? 'opacity-50 cursor-not-allowed line-through' 
                        : selectedSize === sizeOption.id 
                          ? 'bg-primary text-primary-foreground' 
                          : ''
                    }`}
                    onClick={() => {
                      if (sizeOption.available) {
                        setSelectedSize(sizeOption.id);
                        setSelectedVariant(sizeOption.id);
                      }
                    }}
                    disabled={!sizeOption.available}
                  >
                    {sizeOption.size}
                  </Button>
                ))}
              </div>
              {selectedSize && (
                <p className="text-sm text-muted-foreground">
                  <ShieldCheck className="inline h-4 w-4 mr-1" />
                  True to size. We recommend ordering your usual size.
                </p>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={cartLoading || !selectedSize}
                  className="flex-1 h-12"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {cartLoading ? 'Adding...' : 'Add to Bag'}
                </Button>
              </div>
            </div>

            {/* Product Features */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Free shipping on orders over ₹2,999</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Free returns within 30 days</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">2-year warranty included</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

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