import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ArrowLeft, Share, ZoomIn, ChevronLeft, ChevronRight, Star, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, Ruler, Plus, Minus } from 'lucide-react';
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
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSizes, setSelectedSizes] = useState<Array<{ index: number; variantId: string }>>([{ index: 0, variantId: '' }]);
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
    
    // Add each item to cart
    for (const sizeSelection of selectedSizes) {
      if (sizeSelection.variantId) {
        await addToCart(sizeSelection.variantId, 1);
      }
    }
    
    toast({
      title: "Added to cart",
      description: `${quantity} item(s) added to your cart.`,
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-semibold">₹{price.toFixed(2)}</p>
                      {mrp && mrp > price && (
                        <>
                          <p className="text-lg text-muted-foreground line-through">₹{mrp.toFixed(2)}</p>
                          <Badge className="bg-green-600 text-white">{discountPercentage}% OFF</Badge>
                        </>
                      )}
                    </div>
                    {mrp && mrp > price && (
                      <p className="text-sm text-muted-foreground">MRP: ₹{mrp.toFixed(2)}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
                  </div>
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

            {/* Quantity Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Quantity</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                <h3 className="font-medium">Shoe Sizes (UK)</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm p-0 h-auto hover:text-primary">
                      <Ruler className="h-4 w-4 mr-1" />
                      Size Guide
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Ruler className="h-5 w-5" />
                        Size Guide
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-3">Find your perfect fit with our size guide:</p>
                      </div>
                      
                      {/* Size Chart */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">UK Size</th>
                              <th className="text-left py-2 font-medium">EU Size</th>
                              <th className="text-left py-2 font-medium">CM</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            {[
                              { uk: '3', eu: '35.5', cm: '22' },
                              { uk: '3.5', eu: '36', cm: '22.5' },
                              { uk: '4', eu: '36.5', cm: '23' },
                              { uk: '4.5', eu: '37', cm: '23.5' },
                              { uk: '5', eu: '37.5', cm: '24' },
                              { uk: '5.5', eu: '38', cm: '24.5' },
                              { uk: '6', eu: '38.5', cm: '25' },
                              { uk: '6.5', eu: '39', cm: '25.5' },
                              { uk: '7', eu: '39.5', cm: '26' },
                              { uk: '7.5', eu: '40', cm: '26.5' },
                              { uk: '8', eu: '40.5', cm: '27' },
                              { uk: '8.5', eu: '41', cm: '27.5' },
                              { uk: '9', eu: '42', cm: '28' },
                              { uk: '9.5', eu: '42.5', cm: '28.5' },
                              { uk: '10', eu: '43', cm: '29' },
                              { uk: '10.5', eu: '43.5', cm: '29.5' },
                              { uk: '11', eu: '44', cm: '30' },
                              { uk: '11.5', eu: '44.5', cm: '30.5' },
                              { uk: '12', eu: '45', cm: '31' }
                            ].map((size) => (
                              <tr key={size.uk} className="border-b border-border/50">
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
              {quantity === 1 ? (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {sizeOptions.map((sizeOption) => (
                      <button
                        key={sizeOption.id}
                        type="button"
                        className={`px-4 py-2 rounded-md border-2 transition-all ${
                          !sizeOption.available 
                            ? 'opacity-50 cursor-not-allowed line-through border-border text-muted-foreground' 
                            : selectedSize === sizeOption.id 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-border hover:border-primary hover:text-primary'
                        }`}
                        onClick={() => {
                          if (sizeOption.available) {
                            setSelectedSize(sizeOption.id);
                            setSelectedVariant(sizeOption.id);
                            setSelectedSizes([{ index: 0, variantId: sizeOption.id }]);
                          }
                        }}
                        disabled={!sizeOption.available}
                      >
                        {sizeOption.size}
                      </button>
                    ))}
                  </div>
                  {selectedSize && (
                    <p className="text-sm text-muted-foreground">
                      <ShieldCheck className="inline h-4 w-4 mr-1" />
                      True to size. We recommend ordering your usual size.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: quantity }).map((_, idx) => {
                    const currentSelection = selectedSizes[idx] || { index: idx, variantId: '' };
                    return (
                      <div key={idx} className="space-y-2">
                        <label className="text-sm font-medium">
                          Item {idx + 1} - Select Size:
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {sizeOptions.map((sizeOption) => (
                            <button
                              key={sizeOption.id}
                              type="button"
                              className={`px-4 py-2 rounded-md border-2 transition-all text-sm ${
                                !sizeOption.available 
                                  ? 'opacity-50 cursor-not-allowed line-through border-border text-muted-foreground' 
                                  : currentSelection.variantId === sizeOption.id 
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'border-border hover:border-primary hover:text-primary'
                              }`}
                              onClick={() => {
                                if (sizeOption.available) {
                                  const newSelectedSizes = [...selectedSizes];
                                  newSelectedSizes[idx] = { index: idx, variantId: sizeOption.id };
                                  setSelectedSizes(newSelectedSizes);
                                  if (idx === 0) {
                                    setSelectedSize(sizeOption.id);
                                    setSelectedVariant(sizeOption.id);
                                  }
                                }
                              }}
                              disabled={!sizeOption.available}
                            >
                              {sizeOption.size}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {selectedSizes.every(s => s.variantId) && (
                    <p className="text-sm text-muted-foreground">
                      <ShieldCheck className="inline h-4 w-4 mr-1" />
                      True to size. We recommend ordering your usual size.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={cartLoading || (quantity === 1 ? !selectedSize : selectedSizes.some(s => !s.variantId))}
                className="w-full h-12"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {cartLoading ? 'Adding...' : `Add ${quantity} ${quantity === 1 ? 'Item' : 'Items'} to Bag`}
              </Button>
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