import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
// import { InteractiveComfortSection } from '@/components/InteractiveComfortSection';
import { getAllProducts, getProductsByCollection, ShopifyProduct } from '@/lib/shopify';
import { ArrowRight, Mail, FileText, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 8;
  
  // Fetch featured collections from Convex
  const featuredCollections = useQuery(api.homepage.getFeaturedCollections);
  
  // Store products for each featured collection
  const [collectionProducts, setCollectionProducts] = useState<Record<string, ShopifyProduct[]>>({});

  // Handle Shopify login redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('shopify_login') === 'success') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Show success message or update auth state
      console.log('Successfully logged in with Shopify!');
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await getAllProducts(itemsPerPage);
        setProducts(allProducts);
        // If we get less than itemsPerPage, there are no more items
        setHasMore(allProducts.length >= itemsPerPage);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const totalToFetch = itemsPerPage * (nextPage + 1);
      const allProducts = await getAllProducts(totalToFetch);
      const newProducts = allProducts.slice(products.length);
      setProducts(allProducts);
      setCurrentPage(nextPage);
      setHasMore(newProducts.length >= itemsPerPage && allProducts.length >= totalToFetch);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Fetch products for featured collections
  useEffect(() => {
    const fetchCollectionProducts = async () => {
      if (!featuredCollections || featuredCollections.length === 0) {
        setIsCollectionsLoading(false);
        return;
      }

      try {
        setIsCollectionsLoading(true);
        const productsMap: Record<string, ShopifyProduct[]> = {};
        
        // Fetch products for each featured collection
        await Promise.all(
          featuredCollections.map(async (collection) => {
            try {
              if (collection.productHandles.length > 0) {
                // Fetch specific products by handles
                const allProducts = await getAllProducts(100);
                const selectedProducts = allProducts.filter(p => 
                  collection.productHandles.includes(p.handle)
                );
                productsMap[collection.id] = selectedProducts.slice(0, 4);
              } else if (collection.collectionHandle) {
                // Fetch products from collection
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
        setIsCollectionsLoading(false);
      }
    };

    fetchCollectionProducts();
  }, [featuredCollections]);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <Hero />

      {/* Brand Information Section */}
      <motion.section
        className="py-8 sm:py-12 bg-[#F4F1EA] dark:bg-black w-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              About TOESPRING
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto">
            At Toespring, we design and document the foundation of footwear <br />
            from schematics to production-ready systems.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Link
                to="/contact"
                className="relative overflow-hidden rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-500 block"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('/athletic-performance.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <Mail className="h-8 w-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-bold text-base mb-1">Contact Us</h3>
                    <p className="text-white/80 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Get in touch with our team
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Link
                to="/terms"
                className="relative overflow-hidden rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-500 block"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('/premium-lifestyle.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <FileText className="h-8 w-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-bold text-base mb-1">Terms of Service</h3>
                    <p className="text-white/80 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Read our terms and conditions
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Link
                to="/privacy"
                className="relative overflow-hidden rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-500 block"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('/limited-editions.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <Shield className="h-8 w-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-bold text-base mb-1">Privacy Policy</h3>
                    <p className="text-white/80 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Learn how we protect your data
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Link
                to="/about"
                className="relative overflow-hidden rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-500 block"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('/street-fashion.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <Info className="h-8 w-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-bold text-base mb-1">About Us</h3>
                    <p className="text-white/80 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Discover our story and mission
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Featured Articles */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        title="Featured Articles"
        subtitle="Discover our latest collection of premium footwear"
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        showLoadMore={true}
      />

      {/* Interactive Comfort Section - Full Width */}
      {/* <InteractiveComfortSection /> */}

      {/* Combined Collections Showcase */}
      <motion.section
        className="py-12 sm:py-16 relative overflow-hidden bg-[#F4F1EA] dark:bg-black"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Animated Gradient Background - Cyan and Black theme */}
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(45deg, rgb(217, 119, 6, 0.2), rgb(0, 0, 0, 0.3), rgb(217, 119, 6, 0.2))",
              "linear-gradient(135deg, rgb(0, 0, 0, 0.3), rgb(217, 119, 6, 0.2), rgb(0, 0, 0, 0.3))",
              "linear-gradient(225deg, rgb(217, 119, 6, 0.2), rgb(0, 0, 0, 0.3), rgb(217, 119, 6, 0.2))",
              "linear-gradient(315deg, rgb(0, 0, 0, 0.3), rgb(217, 119, 6, 0.2), rgb(0, 0, 0, 0.3))",
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Enhanced Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/15 to-primary/10" />
        <div 
          className="absolute inset-0 block dark:hidden"
          style={{
            backgroundImage: `linear-gradient(
            to top, 
            #F4F1EA 0%, 
            rgba(244, 241, 234, 0.95) 10%, 
            rgba(244, 241, 234, 0.85) 20%, 
            rgba(244, 241, 234, 0.7) 30%, 
            rgba(244, 241, 234, 0.5) 45%, 
            rgba(244, 241, 234, 0.3) 60%, 
            rgba(244, 241, 234, 0.15) 75%, 
            rgba(244, 241, 234, 0.05) 90%, 
            transparent 100%)`
          }}
        />
        <div 
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: `linear-gradient(
            to top, 
            #06b6d4 0%, 
            rgba(6, 182, 212, 0.95) 
            10%, rgba(6, 182, 212, 0.85) 20%, 
            rgba(6, 182, 212, 0.7) 30%, 
            rgba(6, 182, 212, 0.5) 45%, 
            rgba(6, 182, 212, 0.3) 60%, 
            rgba(6, 182, 212, 0.15) 75%, 
            rgba(6, 182, 212, 0.05) 90%, 
            transparent 100%)`
          }}
        />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10 space-y-8">
          {featuredCollections && featuredCollections.length > 0 ? (
            featuredCollections.map((collection, collectionIndex) => {
              const products = collectionProducts[collection.id] || [];
              const isEven = collectionIndex % 2 === 0;
              
              return (
                <div key={collection.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                  {/* Collection Image */}
                  <motion.div
                    className={`relative h-[300px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                    initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${collection.collectionImage || '/placeholder.svg'})` }}
                    />
                    <div className={`absolute inset-0 ${isEven ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/40 to-transparent`} />
                  </motion.div>

                  {/* Products Grid */}
                  <motion.div
                    className={isEven ? 'lg:order-1' : 'lg:order-2'}
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                        {collection.title}
                      </h2>
                      {collection.subtitle && (
                        <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
                          {collection.subtitle}
                        </p>
                      )}
                      {collection.linkUrl && (
                        <Button asChild variant="default" className="group text-xs sm:text-sm px-3 sm:px-4 py-2 bg-[#052e16] hover:bg-[#052e16]/90 text-white">
                          <a href={collection.linkUrl}>
                            Explore Collection
                            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                      {isCollectionsLoading ? (
                        [...Array(4)].map((_, i) => (
                          <div key={i} className="aspect-square bg-muted/20 rounded-lg animate-pulse" />
                        ))
                      ) : products.length > 0 ? (
                        products.slice(0, 4).map((product, index) => (
                          <motion.div
                            key={product.id}
                            className="group cursor-pointer"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5 }}
                            onClick={() => window.location.href = `/product/${product.handle}`}
                          >
                            <div className="aspect-square bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300">
                              <img
                                src={product.images?.edges?.[0]?.node?.url || '/placeholder.svg'}
                                alt={product.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </div>
                            <div className="mt-1 sm:mt-2">
                              <h3 className="text-foreground font-medium text-xs sm:text-sm truncate">{product.title}</h3>
                              <p className="text-muted-foreground text-xs sm:text-sm">₹{parseFloat(product.priceRange.minVariantPrice.amount).toFixed(0)}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-4 text-center text-muted-foreground py-8">
                          No articles found for this collection
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No featured collections configured. Add collections from the admin panel.
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Index;
