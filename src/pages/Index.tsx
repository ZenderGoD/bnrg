import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
// import { InteractiveComfortSection } from '@/components/InteractiveComfortSection';
import { getAllProducts, getProductsByCollection, ShopifyProduct } from '@/lib/shopify';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [menProducts, setMenProducts] = useState<ShopifyProduct[]>([]);
  const [womenProducts, setWomenProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 8;
  
  // Fetch category cards from Convex
  const categoryCards = useQuery(api.homepage.getCategoryCards);

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
      const newProducts = await getAllProducts(itemsPerPage, nextPage);
      setProducts(prev => [...prev, ...newProducts]);
      setCurrentPage(nextPage);
      setHasMore(newProducts.length >= itemsPerPage);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsCollectionsLoading(true);
        const [menData, womenData] = await Promise.all([
          getProductsByCollection('mens-collection', 4),
          getProductsByCollection('womens-collection', 4)
        ]);
        setMenProducts(menData);
        setWomenProducts(womenData);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setIsCollectionsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <Hero />

      {/* Category Cards Section */}
      <motion.section
        className="py-8 sm:py-12 bg-[#F4F1EA] dark:bg-black w-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Premium Sneaker Collections Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {(categoryCards || []).map((item, index) => (
              <motion.div
                key={item.title}
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(`/catalog?collection=${item.handle}`)}
              >
                <div className="relative overflow-hidden rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-500">
                  {/* Background Image */}
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    {/* Premium Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
                      <div className="transform transition-all duration-500 group-hover:translate-y-[-8px]">
                        <h3 className="text-white font-bold text-sm sm:text-base mb-1 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {item.description}
                        </p>
                      </div>
                      
                      {/* Explore Button */}
                      <div className="mt-2 sm:mt-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <div className="inline-flex items-center text-white text-xs sm:text-sm font-medium bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/30">
                          Explore Collection
                          <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Products */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        title="Featured Products"
        subtitle="Discover our latest collection of premium sneakers"
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
        {/* Animated Gradient Background - Amber and Black theme */}
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
            backgroundImage: 'linear-gradient(to top, #F4F1EA 0%, rgba(244, 241, 234, 0.95) 10%, rgba(244, 241, 234, 0.85) 20%, rgba(244, 241, 234, 0.7) 30%, rgba(244, 241, 234, 0.5) 45%, rgba(244, 241, 234, 0.3) 60%, rgba(244, 241, 234, 0.15) 75%, rgba(244, 241, 234, 0.05) 90%, transparent 100%)'
          }}
        />
        <div 
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: 'linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.95) 10%, rgba(0, 0, 0, 0.85) 20%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.5) 45%, rgba(0, 0, 0, 0.3) 60%, rgba(0, 0, 0, 0.15) 75%, rgba(0, 0, 0, 0.05) 90%, transparent 100%)'
          }}
        />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10 space-y-8">
          {/* Men's Collection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Men's Performance Image */}
            <motion.div
              className="relative h-[300px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(/athletic-performance.jpg)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
            </motion.div>

            {/* Men's Products Grid */}
            <motion.div
              className="lg:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                  Men's Collection
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
                  Unleash your potential with performance-driven designs
                </p>
                <Button asChild variant="default" className="group text-xs sm:text-sm px-3 sm:px-4 py-2">
                  <a href="/men">
                    Explore Men's
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {isCollectionsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted/20 rounded-lg animate-pulse" />
                  ))
                ) : (
                  menProducts.slice(0, 4).map((product, index) => (
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
                )}
              </div>
            </motion.div>
          </div>

          {/* Women's Collection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Women's Lifestyle Image */}
            <motion.div
              className="relative h-[300px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden lg:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(/premium-lifestyle.jpg)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </motion.div>

            {/* Women's Products Grid */}
            <motion.div
              className="lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                  Women's Collection
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
                  Elegance redefined with every step
                </p>
                <Button asChild variant="default" className="group text-xs sm:text-sm px-3 sm:px-4 py-2">
                  <a href="/women">
                    Explore Women's
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {isCollectionsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted/20 rounded-lg animate-pulse" />
                  ))
                ) : (
                  womenProducts.slice(0, 4).map((product, index) => (
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
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Index;
