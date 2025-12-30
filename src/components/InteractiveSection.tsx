import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getAllProducts, ShopifyProduct } from '@/lib/shopify';

interface InteractiveSectionProps {
  title: string;
  subtitle: string;
  gradientClass?: string;
}

export function InteractiveSection({ title, subtitle, gradientClass = "bg-gradient-primary" }: InteractiveSectionProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await getAllProducts(9);
        setProducts(allProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, []);

  const productImages = products.slice(0, 9).map(product => 
    product.images?.[0]?.url || '/placeholder.svg'
  );

  return (
    <motion.section
      className={`relative py-24 ${gradientClass} overflow-hidden`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 p-8 h-full">
          {productImages.map((image, i) => (
            <motion.div
              key={i}
              className="aspect-square rounded-lg bg-cover bg-center border border-white/10"
              style={{ backgroundImage: `url(${image})` }}
              animate={{
                y: [0, -10, 0],
                rotateY: [0, 5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3 + (i * 0.2),
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
              whileHover={{
                scale: 1.1,
                rotateZ: 5,
                transition: { duration: 0.3 }
              }}
            />
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Interactive Elements */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          {[
            { icon: '🏃', title: 'Performance', desc: 'Built for athletes' },
            { icon: '✨', title: 'Style', desc: 'Fashion forward' },
            { icon: '🛡️', title: 'Quality', desc: 'Premium materials' },
            { icon: '🌟', title: 'Comfort', desc: 'All day wear' },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="text-center text-white"
              whileHover={{ y: -10, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm opacity-80">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.section>
  );
}