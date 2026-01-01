import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllProducts, ShopifyProduct } from '@/lib/shopify';
import { useNavigate } from 'react-router-dom';

interface MensCategoriesDropdownProps {
  isVisible: boolean;
}

// Sneaker icon component for consistent minimal icons
const SneakerIcon = ({ variant = 'default' }: { variant?: 'default' | 'high' | 'running' | 'slide' }) => {
  const iconPaths = {
    default: "M3 18h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V8H3v2z M2 20h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z",
    high: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    running: "M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-.8-4.3-2.1l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z",
    slide: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
  };
  
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d={iconPaths[variant]} />
    </svg>
  );
};

const mensCategories = [
  { name: 'SUPER-STAR', icon: 'default', searchTerm: 'superstar' },
  { name: 'BALL STAR', icon: 'high', searchTerm: 'basketball' },
  { name: 'MARATHON', icon: 'running', searchTerm: 'marathon running' },
  { name: 'TRUE-STAR', icon: 'high', searchTerm: 'premium luxury', badge: 'NEW' },
  { name: 'STARDAN', icon: 'default', searchTerm: 'classic retro' },
  { name: 'RUNNING SOLE', icon: 'running', searchTerm: 'running athletic' },
  { name: 'DAD-STAR', icon: 'default', searchTerm: 'dad sneaker chunky' },
  { name: 'MID STAR', icon: 'high', searchTerm: 'mid-top' },
  { name: 'V-STAR', icon: 'default', searchTerm: 'v-shape design' },
  { name: 'PURESTAR', icon: 'default', searchTerm: 'pure white minimalist' },
  { name: 'SKY-STAR', icon: 'high', searchTerm: 'high-top sky' },
  { name: 'SLIDE', icon: 'slide', searchTerm: 'slide sandal' },
  { name: 'FORTY2', icon: 'default', searchTerm: 'forty2 special' },
  { name: 'GGDB CLASSICS', icon: 'default', searchTerm: 'golden goose classic' },
  { name: 'FRANCY', icon: 'high', searchTerm: 'francy style' },
  { name: 'STARTER', icon: 'default', searchTerm: 'starter basic' },
  { name: 'LIGHTSTAR', icon: 'running', searchTerm: 'lightweight' },
  { name: 'SPACE-STAR', icon: 'high', searchTerm: 'space futuristic' }
] as const;

export function MensCategoriesDropdown({ isVisible }: MensCategoriesDropdownProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isVisible && products.length === 0) {
      const fetchProducts = async () => {
        setIsLoading(true);
        try {
          // Get a variety of products to showcase
          const fetchedProducts = await getAllProducts(12);
          setProducts(fetchedProducts);
        } catch (error) {
          console.error('Failed to fetch products for men\'s categories:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isVisible, products.length]);

  const handleCategoryClick = (category: typeof mensCategories[0]) => {
    // Navigate to catalog with search term
    navigate(`/catalog?search=${encodeURIComponent(category.searchTerm)}`);
  };

  const getFeaturedProduct = (index: number) => {
    return products[index % products.length];
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-full right-0 mt-2 w-[90vw] max-w-[800px] sm:w-[600px] md:w-[800px] bg-background/95 backdrop-blur-xl border-2 border-border/30 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <motion.h3
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Coming Soon
              </motion.h3>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
