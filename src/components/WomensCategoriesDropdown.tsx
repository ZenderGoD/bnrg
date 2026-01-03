import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllProducts, getProductsByCollection, ShopifyProduct } from '@/lib/shopify';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface WomensCategoriesDropdownProps {
  isVisible: boolean;
}

// Footwear icon component for consistent minimal icons
const FootwearIcon = ({ variant = 'default' }: { variant?: 'default' | 'high' | 'running' | 'slide' | 'boot' | 'heel' }) => {
  const iconPaths = {
    default: "M3 18h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V8H3v2z M2 20h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z",
    high: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    running: "M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-.8-4.3-2.1l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z",
    slide: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    boot: "M10 2v20H8V2h2zm4 0v20h-2V2h2zm4 4v16h-2V6h2z",
    heel: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"
  };
  
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d={iconPaths[variant]} />
    </svg>
  );
};

export function WomensCategoriesDropdown({ isVisible }: WomensCategoriesDropdownProps) {
  const [collectionProducts, setCollectionProducts] = useState<Record<string, ShopifyProduct[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch featured collections from Convex
  const featuredCollections = useQuery(api.homepage.getFeaturedCollections);

  useEffect(() => {
    const fetchCollectionProducts = async () => {
      if (!featuredCollections || featuredCollections.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const productsMap: Record<string, ShopifyProduct[]> = {};
        
        await Promise.all(
          featuredCollections.map(async (collection) => {
            try {
              if (collection.productHandles.length > 0) {
                const allProducts = await getAllProducts(100);
                const selectedProducts = allProducts.filter(p => 
                  collection.productHandles.includes(p.handle)
                );
                productsMap[collection.id] = selectedProducts.slice(0, 4);
              } else if (collection.collectionHandle) {
                const collectionProducts = await getProductsByCollection(
                  collection.collectionHandle,
                  4
                );
                productsMap[collection.id] = collectionProducts;
              }
            } catch (error) {
              console.error(`Failed to fetch products for collection ${collection.id}:`, error);
              productsMap[collection.id] = [];
            }
          })
        );
        
        setCollectionProducts(productsMap);
      } catch (error) {
        console.error('Failed to fetch collection products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isVisible && featuredCollections) {
      fetchCollectionProducts();
    }
  }, [isVisible, featuredCollections]);

  const handleCategoryClick = (collection: typeof featuredCollections[0]) => {
    if (collection.linkUrl) {
      if (collection.linkUrl.startsWith('http')) {
        window.location.href = collection.linkUrl;
      } else {
        navigate(collection.linkUrl);
      }
    } else if (collection.collectionHandle) {
      navigate(`/catalog?collection=${collection.collectionHandle}`);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-full left-0 mt-2 w-[90vw] max-w-[800px] sm:w-[600px] md:w-[800px] bg-background/95 backdrop-blur-xl border-2 border-border/30 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Women's Categories</h3>
                <p className="text-sm text-muted-foreground mt-1">Discover our complete collection</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/women')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                See All
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Categories Grid */}
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Categories</h4>
                {featuredCollections && featuredCollections.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1">
                    {featuredCollections.map((collection, index) => (
                      <motion.button
                        key={collection.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategoryClick(collection)}
                        onMouseEnter={() => setHoveredCategory(collection.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 group ${
                          hoveredCategory === collection.id
                            ? 'bg-primary/15 border-primary/30 shadow-sm'
                            : 'hover:bg-muted/80 border-transparent'
                        } border`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                            <FootwearIcon variant="default" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium uppercase tracking-wide transition-colors ${
                                hoveredCategory === collection.id ? 'text-primary' : 'text-foreground'
                              }`}>
                                {collection.title}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          initial={false}
                          animate={{ rotate: hoveredCategory === collection.id ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-muted-foreground group-hover:text-primary"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">No categories available</p>
                  </div>
                )}
              </div>

              {/* Featured Articles */}
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Featured</h4>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : featuredCollections && featuredCollections.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {featuredCollections.slice(0, 1).flatMap((collection) => {
                      const products = collectionProducts[collection.id] || [];
                      return products.slice(0, 4).map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="group cursor-pointer bg-muted/60 rounded-lg overflow-hidden border border-border/40 hover:border-primary/30 transition-all duration-200"
                          onClick={() => navigate(`/product/${product.handle}`)}
                        >
                          <div className="aspect-square relative overflow-hidden">
                            <div
                              className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                              style={{
                                backgroundImage: `url(${product.images?.edges?.[0]?.node?.url || '/placeholder.svg'})`
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            
                            {/* Category Badge */}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-background/95 backdrop-blur-md rounded-md border border-border/30">
                              <span className="text-[10px] font-medium text-foreground uppercase tracking-wide">
                                {collection.title}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-3">
                            <h5 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {product.title}
                            </h5>
                            <p className="text-sm text-muted-foreground font-medium mt-1">
                              ₹{parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                            </p>
                          </div>
                        </motion.div>
                      ));
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">No articles available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 -mx-6 px-6 py-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Discover premium footwear designed for women
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/catalog')}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    View All Articles →
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
