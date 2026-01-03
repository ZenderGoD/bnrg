import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
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
    <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border border-border/30 bg-muted/10 mb-4">
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

      {/* Hero Content - With Vertical Marquees */}
      <div className="flex-1 flex flex-row items-center justify-center z-10 px-4 sm:px-8 relative">
        {/* Left Vertical Marquee */}
        {normalizedTopImages.length > 0 && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-48 overflow-hidden">
            <div className="h-full flex items-center">
              <Marquee pauseOnHover vertical className="[--duration:40s] [--gap:1rem]" repeat={3}>
                {normalizedTopImages.map((imageUrl, i) => (
                  <MarqueeImage key={`left-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
            </div>
            {/* Gradient fade at top and bottom */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#022c22] dark:from-black pointer-events-none z-10"></div>
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#022c22] dark:from-black pointer-events-none z-10"></div>
          </div>
        )}

        {/* Hero Text Content - Centered */}
        <motion.div
          className="text-center max-w-4xl z-10 flex-shrink-0"
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
              Precision sole engineering for contemporary footwear.
            </p>
            <p>
              Developed through discipline, material science, and decades of manufacturing experience.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col gap-4 sm:flex-row sm:gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/catalog">
                <Button className="btn-ghost-premium w-full sm:w-auto text-sm sm:text-base px-6 py-3 sm:py-4">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#3c6a42]" />
                  View Collections
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Vertical Marquee */}
        {normalizedBottomImages.length > 0 && (
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-48 overflow-hidden">
            <div className="h-full flex items-center">
              <Marquee reverse pauseOnHover vertical className="[--duration:40s] [--gap:1rem]" repeat={3}>
                {normalizedBottomImages.map((imageUrl, i) => (
                  <MarqueeImage key={`right-${i}`} imageUrl={imageUrl} index={i} />
                ))}
              </Marquee>
            </div>
            {/* Gradient fade at top and bottom */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#022c22] dark:from-black pointer-events-none z-10"></div>
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#022c22] dark:from-black pointer-events-none z-10"></div>
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