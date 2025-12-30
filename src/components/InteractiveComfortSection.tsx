import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getAllProducts, ShopifyProduct } from '@/lib/shopify';

export function InteractiveComfortSection() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const allProducts = await getAllProducts(50); // Fetch 50 products
        setProducts(allProducts);
      } catch (error) {
        console.error('Failed to fetch products for comfort section:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Create infinite scrolling product images
  const productImages = products.map(product => 
    product.images?.edges?.[0]?.node?.url || '/placeholder.svg'
  );

  // Create truly infinite loop with massive duplication to avoid gaps
  const infiniteImages = productImages.length > 0 
    ? [...Array(20)].flatMap(() => productImages)
    : Array(200).fill('/placeholder.svg');

    return (
    <motion.section
      className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-br from-primary/30 via-accent/40 to-purple-accent/30 mb-16 rounded-2xl mx-4 sm:mx-8 lg:mx-16"
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
    >
      {/* Infinite Scrolling Columns Grid */}
      <div className="absolute inset-0 flex gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-3 sm:gap-4 md:gap-6 relative">
            {/* Infinite scrolling effect */}
            <motion.div
              className="flex flex-col gap-3 sm:gap-4 md:gap-6"
              animate={{
                y: columnIndex % 2 === 0 ? [0, -800] : [0, 800],
              }}
              transition={{
                duration: 15 + columnIndex * 2,
                repeat: Infinity,
                ease: "linear",
                delay: columnIndex * 0.3,
              }}
            >
              {/* First set of images */}
              {infiniteImages.slice(columnIndex * 8, (columnIndex + 1) * 8).map((image, itemIndex) => (
                <motion.div
                  key={`${columnIndex}-${itemIndex}`}
                  className="aspect-square bg-white/15 rounded-md sm:rounded-lg bg-cover bg-center backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundImage: `url(${image})`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: (columnIndex * 8 + itemIndex) * 0.05,
                  }}
                  whileHover={{
                    scale: 1.08,
                    opacity: 1,
                    transition: { duration: 0.3 }
                  }}
                />
              ))}
              {/* Duplicate set for seamless loop */}
              {infiniteImages.slice(columnIndex * 8, (columnIndex + 1) * 8).map((image, itemIndex) => (
                <motion.div
                  key={`${columnIndex}-${itemIndex}-dup`}
                  className="aspect-square bg-white/15 rounded-md sm:rounded-lg bg-cover bg-center backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundImage: `url(${image})`,
                  }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  whileHover={{
                    scale: 1.08,
                    opacity: 1,
                    transition: { duration: 0.3 }
                  }}
                />
              ))}
              {/* Third set for seamless loop */}
              {infiniteImages.slice(columnIndex * 8, (columnIndex + 1) * 8).map((image, itemIndex) => (
                <motion.div
                  key={`${columnIndex}-${itemIndex}-dup2`}
                  className="aspect-square bg-white/15 rounded-md sm:rounded-lg bg-cover bg-center backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundImage: `url(${image})`,
                  }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  whileHover={{
                    scale: 1.08,
                    opacity: 1,
                    transition: { duration: 0.3 }
                  }}
                />
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white z-10 px-4">
          <motion.h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            style={{
              textShadow: '3px 3px 30px rgba(0,0,0,0.7)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Where Style Meets
          </motion.h2>
          <motion.p
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-wide"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            style={{
              textShadow: '2px 2px 20px rgba(0,0,0,0.7)',
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Exceptional Comfort
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
}