import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Marquee } from '@/components/ui/marquee';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function Hero() {
  const marqueeData = useQuery(api.homepage.getHeroMarquee);

  const topRowImages = marqueeData?.topRowImages || [];
  const bottomRowImages = marqueeData?.bottomRowImages || [];

  // Ensure both marquees have the same number of items for consistent speed
  const maxItems = Math.max(topRowImages.length, bottomRowImages.length);
  const normalizedTopImages = topRowImages.length > 0 
    ? Array.from({ length: Math.max(maxItems, 6) }, (_, i) => topRowImages[i % topRowImages.length])
    : [];
  const normalizedBottomImages = bottomRowImages.length > 0
    ? Array.from({ length: Math.max(maxItems, 6) }, (_, i) => bottomRowImages[i % bottomRowImages.length])
    : [];

  const MarqueeImage = ({ imageUrl, index }: { imageUrl: string; index: number }) => (
    <div className="flex-shrink-0 w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-lg overflow-hidden border border-border/30 bg-muted/10">
      <img
        src={imageUrl}
        alt={`Marquee ${index}`}
        className="w-full h-full object-cover"
      />
    </div>
  );

  return (
    <section className="relative min-h-screen overflow-x-clip overflow-y-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-[#022c22] dark:bg-black" />

      {/* Hero Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-4 sm:px-8">
        {/* Top Marquee Row */}
        {normalizedTopImages.length > 0 && (
          <div className="w-full mb-8">
            <Marquee pauseOnHover className="[--duration:40s] [--gap:2rem]" repeat={3}>
              {normalizedTopImages.map((imageUrl, i) => (
                <MarqueeImage key={`top-${i}`} imageUrl={imageUrl} index={i} />
              ))}
            </Marquee>
          </div>
        )}

        {/* Hero Text Content */}
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 text-[#F4F1EA] leading-tight">
            <span className="text-[#F4F1EA]">Elevated Comfort.</span>
            <br />
            <span className="text-[#F4F1EA]">Timeless Design.</span>
          </h1>
          
          <motion.div
            className="text-base sm:text-lg md:text-xl text-[#F4F1EA] mb-8 leading-relaxed space-y-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p>
              Luxury footwear crafted with precision, inspired by elegance, and designed for everyday comfort.
            </p>
            <p>
              At Monte Veloris, we believe true luxury is not just seen — it is felt with every step.
            </p>
          </motion.div>

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
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 text-[#052e16]" />
                </Button>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/women">
                <Button className="btn-ghost-premium w-full sm:w-auto text-sm sm:text-base px-6 py-3 sm:py-4">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#052e16]" />
                  Women's Collection
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom Marquee Row */}
        {normalizedBottomImages.length > 0 && (
          <div className="w-full mt-8">
            <Marquee reverse pauseOnHover className="[--duration:40s] [--gap:2rem]" repeat={3}>
              {normalizedBottomImages.map((imageUrl, i) => (
                <MarqueeImage key={`bottom-${i}`} imageUrl={imageUrl} index={i} />
              ))}
            </Marquee>
          </div>
        )}
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