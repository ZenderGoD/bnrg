import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Marquee } from '@/components/ui/marquee';
import { useState, useEffect } from 'react';
import { getAllProducts, ShopifyProduct } from '@/lib/shopify';

export function Hero() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await getAllProducts(20);
        setProducts(allProducts);
      } catch (error) {
        console.error('Failed to fetch products for hero marquee:', error);
      }
    };
    fetchProducts();
  }, []);

  // Get product images for marquee
  const productImages = products
    .map(product => product.images?.edges?.[0]?.node?.url)
    .filter(Boolean) as string[];

  // Split images into rows for 3D marquee (10 columns: 3 left + 4 center + 3 right)
  const totalColumns = 10;
  const rows = Array.from({ length: totalColumns }, (_, i) => {
    const start = Math.floor((productImages.length / totalColumns) * i);
    const end = Math.floor((productImages.length / totalColumns) * (i + 1));
    return productImages.slice(start, end);
  });

  const ProductImage = ({ imageUrl, index }: { imageUrl: string; index: number }) => (
    <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border border-border/50">
      <img
        src={imageUrl}
        alt="Product"
        className="w-full h-full object-cover"
      />
    </div>
  );

  return (
    <section className="relative min-h-screen overflow-x-clip overflow-y-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-[#F4F1EA] dark:bg-background" />

      {/* 3D Marquee */}
      <div className="absolute inset-0 flex items-center justify-center z-10 [perspective:300px]">
        <div
          className="flex flex-row items-center gap-8"
          style={{
            transform:
              "translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
          }}
        >
          {productImages.length > 0 ? (
            <>
              {/* Left 3 columns */}
              <Marquee reverse pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[0].map((imageUrl, i) => (
                  <ProductImage key={`left1-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[1].map((imageUrl, i) => (
                  <ProductImage key={`left2-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[2].map((imageUrl, i) => (
                  <ProductImage key={`left3-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              {/* Center 4 columns */}
              <Marquee pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[3].map((imageUrl, i) => (
                  <ProductImage key={`center1-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[4].map((imageUrl, i) => (
                  <ProductImage key={`center2-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[5].map((imageUrl, i) => (
                  <ProductImage key={`center3-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[6].map((imageUrl, i) => (
                  <ProductImage key={`center4-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              {/* Right 3 columns */}
              <Marquee reverse pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[7].map((imageUrl, i) => (
                  <ProductImage key={`right1-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[8].map((imageUrl, i) => (
                  <ProductImage key={`right2-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover vertical className="[--duration:20s] [--gap:3rem]" repeat={10}>
                {rows[9].map((imageUrl, i) => (
                  <ProductImage key={`right3-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
            </>
          ) : (
            <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg bg-muted/20 animate-pulse" />
          )}
        </div>

        {/* Gradient overlays */}
        <div className="from-[#F4F1EA] dark:from-background pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b"></div>
        <div className="from-[#F4F1EA] dark:from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t"></div>
        <div className="from-[#F4F1EA] dark:from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r"></div>
        <div className="from-[#F4F1EA] dark:from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l"></div>
      </div>

      {/* Hero Content - Centered */}
      <div className="flex-1 flex items-center justify-center z-10 px-4 sm:px-8">
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
            <span className="gradient-text">Step Into</span>
            <br />
            <span className="text-foreground">Excellence</span>
          </h1>
          
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover the world's most exclusive sneaker collection.
          </motion.p>

          <motion.div
            className="flex flex-col gap-4 sm:flex-row sm:gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/men">
                <Button className="btn-hero group w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4">
                  Shop Men's Collection
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/women">
                <Button className="btn-ghost-premium w-full sm:w-auto text-sm sm:text-base px-6 py-3 sm:py-4">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Women's Collection
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>


      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}