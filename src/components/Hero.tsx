import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import heroVideoImage from '@/assets/hero-video-bg.jpg';

export function Hero() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Video URLs - Update these with your actual Shopify file URLs
  const videoUrls = [
    '/Intro.mp4',
    'https://cdn.shopify.com/s/files/1/0665/1651/7051/files/8518887-uhd_4096_1680_25fps.mp4',
    'https://cdn.shopify.com/s/files/1/0665/1651/7051/files/Halluo_Video_I_want_a_sho_c_3990065366058680375.mp4'
  ];

  useEffect(() => {
    // Only cycle through videos if there are multiple videos
    if (videoUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
      }, 8000); // Change video every 8 seconds

      return () => clearInterval(interval);
    }
  }, [videoUrls.length]);
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background with gradient transition to video */}
      <div className="absolute inset-0">
        {/* Gradient Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-hero"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        
        {/* Video Background */}
        {videoUrls.map((videoUrl, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: currentVideoIndex === index ? 0.8 : 0 
            }}
            transition={{ duration: 1 }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              style={{ opacity: 0.6 }}
            >
              <source src={videoUrl} type="video/mp4" />
              {/* Fallback to hero image if video fails */}
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${heroVideoImage})` }}
              />
            </video>
            <div className="absolute inset-0 bg-black/30"></div>
          </motion.div>
        ))}
        
        {/* Animated background shapes */}
        <motion.div
          className="absolute top-20 left-10 w-16 h-16 sm:w-32 sm:h-32 bg-accent/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-24 h-24 sm:w-48 sm:h-48 bg-primary/10 rounded-full blur-xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        
        {/* Floating elements */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-accent/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(i) * 20}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Hero Content - Responsive positioning */}
      <div className="absolute bottom-8 sm:bottom-16 md:bottom-20 left-4 sm:left-8 md:left-8 z-10 max-w-xs sm:max-w-md md:max-w-xl px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 text-white leading-tight">
            <span className="gradient-text">Step Into</span>
            <br />
            <span className="text-white">Excellence</span>
          </h1>
          
          <motion.p
            className="text-sm sm:text-base md:text-lg text-white/80 mb-6 leading-relaxed max-w-sm sm:max-w-md"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover the world's most exclusive sneaker collection.
          </motion.p>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:gap-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
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
        className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2"
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