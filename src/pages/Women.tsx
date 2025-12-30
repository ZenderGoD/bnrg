import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductGrid } from '@/components/ProductGrid';
import { getProductsByCollection, ShopifyProduct } from '@/lib/shopify';
import { Activity, Sparkles, Shield, Heart } from 'lucide-react';

export default function Women() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products from "womens-collection"
        const womenProducts = await getProductsByCollection('womens-collection', 20);
        setProducts(womenProducts);
      } catch (error) {
        console.error('Failed to fetch women products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen pt-16">
      {/* Combined Hero & Interactive Section */}
      <motion.section
        className="relative h-[50vh] bg-gradient-accent overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Optimized Horizontal Scrolling Rows - 3 rows only */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full flex flex-col justify-between py-8">
            {[0, 1, 2].map((rowIndex) => (
              <div key={rowIndex} className="flex gap-8 relative overflow-hidden">
                <motion.div
                  className="flex gap-8 flex-nowrap will-change-transform"
                  animate={{
                    x: rowIndex % 2 === 0 ? [0, -400] : [0, 400],
                  }}
                  transition={{
                    duration: 20 + rowIndex * 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: rowIndex * 1,
                  }}
                >
                  {/* Bigger product items for better visibility */}
                  {Array.from({ length: 8 }).map((_, itemIndex) => {
                    const productIndex = (rowIndex * 2 + itemIndex) % Math.max(products.length, 1);
                    const product = products[productIndex];
                    const image = product?.images?.edges?.[0]?.node?.url || '/placeholder.svg';
                    
                    return (
                      <div
                        key={`${rowIndex}-${itemIndex}`}
                        className="w-32 h-32 flex-shrink-0 rounded-xl bg-cover bg-center border border-white/20 shadow-lg transform-gpu"
                        style={{ backgroundImage: `url(${image})` }}
                      />
                    );
                  })}
                  {/* Single duplicate set for seamless loop */}
                  {Array.from({ length: 8 }).map((_, itemIndex) => {
                    const productIndex = (rowIndex * 2 + itemIndex) % Math.max(products.length, 1);
                    const product = products[productIndex];
                    const image = product?.images?.edges?.[0]?.node?.url || '/placeholder.svg';
                    
                    return (
                      <div
                        key={`${rowIndex}-${itemIndex}-dup`}
                        className="w-32 h-32 flex-shrink-0 rounded-xl bg-cover bg-center border border-white/20 shadow-lg transform-gpu"
                        style={{ backgroundImage: `url(${image})` }}
                      />
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        {/* Combined Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center h-full py-12">
          {/* Hero Content */}
          <div className="text-center text-white mb-8">
            <motion.h1
              className="text-3xl md:text-5xl font-bold mb-4"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Women's Collection
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-2"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Elegance Redefined
            </motion.p>
            <motion.p
              className="text-sm md:text-base text-white/70 max-w-xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Step into a world where sophistication meets unparalleled comfort
            </motion.p>
          </div>

          {/* Premium Interactive Elements */}
          <motion.div
            className="grid grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { 
                icon: Activity, 
                title: 'Performance', 
                desc: 'Built for athletes'
              },
              { 
                icon: Sparkles, 
                title: 'Style', 
                desc: 'Fashion forward'
              },
              { 
                icon: Shield, 
                title: 'Quality', 
                desc: 'Premium materials'
              },
              { 
                icon: Heart, 
                title: 'Comfort', 
                desc: 'All day wear'
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center text-white"
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-white/15 transition-all duration-300">
                  <item.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="text-sm md:text-base font-semibold mb-1">{item.title}</h3>
                <p className="text-xs md:text-sm opacity-80">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Simplified Floating Particles - fewer for better performance */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </motion.section>

      {/* Products Grid */}
      <motion.div
        className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <ProductGrid
          products={products}
          isLoading={isLoading}
          title="Women's Sneakers"
          subtitle="Experience elegance and comfort with every stride"
        />
      </motion.div>
    </div>
  );
}