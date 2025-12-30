import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Sun, Moon, Search, User, ArrowUp, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { SearchInput } from '@/components/SearchInput';
import { MensCategoriesDropdown } from '@/components/MensCategoriesDropdown';
import { WomensCategoriesDropdown } from '@/components/WomensCategoriesDropdown';
import { MobileCategoriesSidebar } from '@/components/MobileCategoriesSidebar';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { isCustomerLoggedIn } from '@/lib/shopify';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<'men' | 'women' | null>(null);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [selectedGenderForMobile, setSelectedGenderForMobile] = useState<'men' | 'women' | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { getTotalItems } = useCart();
  const location = useLocation();
  const totalItems = getTotalItems();

  // Check login status directly (simpler approach)
  const isLoggedIn = isCustomerLoggedIn();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Men', href: '/men' },
    { name: 'Women', href: '/women' },
    { name: 'Catalog', href: '/catalog' },
    ...(isLoggedIn ? [{ name: 'Credits', href: '/credits' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  // Check if we're on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktopSize = window.innerWidth >= 768;

      setIsDesktop(isDesktopSize);
      
      // Always show header when switching to desktop
      if (isDesktopSize) {
        setIsHeaderVisible(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle scroll behavior for header visibility and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide header based on scroll direction (only on mobile)
      if (!isDesktop) {
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsHeaderVisible(false); // Hide header when scrolling down
        } else {
          setIsHeaderVisible(true); // Show header when scrolling up
        }
      } else {
        // Always show header on desktop
        setIsHeaderVisible(true);
      }
      
      // Show scroll-to-top button when near bottom
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercentage = (currentScrollY / (scrollHeight - clientHeight)) * 100;
      
      if (scrollPercentage > 20) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isDesktop]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold gradient-text">2XY</span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <motion.div
                  key={item.name}
                  className="relative"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => {
                    if (item.name === 'Men' || item.name === 'Women') {
                      setHoveredCategory(item.name.toLowerCase() as 'men' | 'women');
                    }
                  }}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    to={item.href}
                    className={`relative text-sm font-medium transition-colors hover:text-accent ${
                      isActive(item.href) 
                        ? 'text-accent' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                    {isActive(item.href) && (
                      <motion.div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full"
                        layoutId="activeIndicator"
                        initial={false}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                  
                  {/* Category Preview/Dropdown */}
                  {item.name === 'Men' && (
                    <MensCategoriesDropdown
                      isVisible={hoveredCategory === 'men'}
                    />
                  )}
                  {item.name === 'Women' && (
                    <WomensCategoriesDropdown
                      isVisible={hoveredCategory === 'women'}
                    />
                  )}
                </motion.div>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Search className="h-5 w-5" />
              </motion.button>

              {/* Theme Toggle */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatedThemeToggler className="p-2 rounded-lg hover:bg-muted/50 transition-colors" />
              </motion.div>

              {/* User Profile */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href = '/profile'}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <User className="h-5 w-5" />
              </motion.button>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href = '/cart'}
                className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {totalItems}
                  </motion.div>
                )}
              </motion.button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-0 m-0">
              
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Search className="h-5 w-5" />
              </motion.button>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href = '/cart'}
                className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {totalItems}
                  </motion.div>
                )}
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </motion.button>

            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Content */}
            <motion.div
              className="absolute right-0 top-0 h-full w-80 max-w-[80vw] bg-background/95 backdrop-blur-md border-l border-border shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="text-lg font-semibold">Menu</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {navigation.map((item) => {
                    // Handle Men and Women differently on mobile
                    if (item.name === 'Men' || item.name === 'Women') {
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            setIsMobileCategoriesOpen(true);
                            setIsMobileMenuOpen(false);
                            // Set the selected gender for the sidebar
                            setSelectedGenderForMobile(item.name.toLowerCase() as 'men' | 'women');
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left ${
                            isActive(item.href)
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <span>{item.name}</span>
                          <div className="text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      );
                    }
                    
                    // Regular navigation for other items
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* Actions */}
                <div className="p-4 border-t space-y-2">
                  <button
                    onClick={() => {
                      setIsSearchOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Search className="h-5 w-5 mr-3" />
                    Search
                  </button>
                  
                  <div className="flex items-center w-full rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
                    <AnimatedThemeToggler className="w-full flex items-center px-4 py-3 text-left">
                      <div className="mr-3">
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </div>
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </AnimatedThemeToggler>
                  </div>
                  
                  <button
                    onClick={() => {
                      window.location.href = '/profile';
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      window.location.href = '/cart';
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    Cart ({totalItems})
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchInput
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mobile Categories Sidebar */}
      <MobileCategoriesSidebar
        isOpen={isMobileCategoriesOpen}
        onClose={() => {
          setIsMobileCategoriesOpen(false);
          setSelectedGenderForMobile(null);
        }}
        selectedGender={selectedGenderForMobile}
      />

      {/* Scroll to Top Button - Positioned left of chatbot */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 right-24 z-50 p-3 bg-accent text-accent-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            initial={{ opacity: 0, scale: 0, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0, x: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}