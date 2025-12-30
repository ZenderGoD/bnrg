import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MobileCategoriesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGender?: 'men' | 'women' | null;
}

// Sneaker icon component
const SneakerIcon = ({ variant = 'default' }: { variant?: 'default' | 'high' | 'running' | 'slide' | 'boot' | 'heel' }) => {
  const iconPaths = {
    default: "M3 18h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V8H3v2z M2 20h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z",
    high: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    running: "M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-.8-4.3-2.1l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z",
    slide: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    boot: "M10 2v20H8V2h2zm4 0v20h-2V2h2zm4 4v16h-2V6h2z",
    heel: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"
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

const womensCategories = [
  { name: 'SUPER-STAR', icon: 'default', searchTerm: 'superstar women' },
  { name: 'BALL STAR', icon: 'high', searchTerm: 'basketball women' },
  { name: 'MARATHON', icon: 'running', searchTerm: 'marathon running women' },
  { name: 'TRUE-STAR', icon: 'high', searchTerm: 'premium luxury women', badge: 'NEW' },
  { name: 'STARDAN', icon: 'default', searchTerm: 'classic retro women' },
  { name: 'RUNNING SOLE', icon: 'running', searchTerm: 'running athletic women' },
  { name: 'PLATFORM', icon: 'heel', searchTerm: 'platform sneakers women' },
  { name: 'MID STAR', icon: 'high', searchTerm: 'mid-top women' },
  { name: 'V-STAR', icon: 'default', searchTerm: 'v-shape design women' },
  { name: 'PURESTAR', icon: 'default', searchTerm: 'pure white minimalist women' },
  { name: 'SKY-STAR', icon: 'high', searchTerm: 'high-top sky women' },
  { name: 'SLIDE', icon: 'slide', searchTerm: 'slide sandal women' },
  { name: 'FRANCY', icon: 'high', searchTerm: 'francy style women' },
  { name: 'GGDB CLASSICS', icon: 'default', searchTerm: 'golden goose classic women' },
  { name: 'SUPERSTAR', icon: 'default', searchTerm: 'superstar women' },
  { name: 'STARTER', icon: 'default', searchTerm: 'starter basic women' },
  { name: 'LIGHTSTAR', icon: 'running', searchTerm: 'lightweight women' },
  { name: 'SPACE-STAR', icon: 'high', searchTerm: 'space futuristic women' }
] as const;

export function MobileCategoriesSidebar({ isOpen, onClose, selectedGender }: MobileCategoriesSidebarProps) {
  const [currentView, setCurrentView] = useState<'main' | 'men' | 'women'>('main');
  const navigate = useNavigate();

  // Auto-navigate to selected gender when sidebar opens
  useEffect(() => {
    if (isOpen && selectedGender) {
      // Skip the main "Categories" view entirely - go straight to gender categories
      setCurrentView(selectedGender);
    } else if (isOpen && !selectedGender) {
      // Only show main view if no specific gender is selected
      setCurrentView('main');
    }
  }, [isOpen, selectedGender]);

  // If selectedGender is provided, we should never show the main view
  const shouldShowMainView = !selectedGender;

  const handleCategoryClick = (category: typeof mensCategories[0] | typeof womensCategories[0]) => {
    navigate(`/catalog?search=${encodeURIComponent(category.searchTerm)}`);
    onClose();
  };

  const handleGenderSelect = (gender: 'men' | 'women') => {
    setCurrentView(gender);
  };

  const goBack = () => {
    // If we're in a gender view, close the sidebar directly
    // No more "Categories" page - go straight to closing
    onClose();
  };

  const getCurrentCategories = () => {
    if (currentView === 'men') return mensCategories;
    if (currentView === 'women') return womensCategories;
    return [];
  };

  const getTitle = () => {
    switch (currentView) {
      case 'men': return "Men's Categories";
      case 'women': return "Women's Categories";
      default: return 'Categories';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Sidebar Content */}
          <motion.div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background/98 backdrop-blur-xl border-l-2 border-border/30 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-3">
                  {currentView !== 'main' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goBack}
                      className="p-2 h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <h2 className="text-lg font-semibold">{getTitle()}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {shouldShowMainView && currentView === 'main' ? (
                  /* Main gender selection */
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a category to explore our sneaker collections
                    </p>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGenderSelect('men')}
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/60 hover:bg-muted/80 border border-border/40 hover:border-primary/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
                          <SneakerIcon variant="default" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-foreground">Men's Collection</h3>
                          <p className="text-sm text-muted-foreground">18 categories</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGenderSelect('women')}
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/60 hover:bg-muted/80 border border-border/40 hover:border-primary/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
                          <SneakerIcon variant="heel" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-foreground">Women's Collection</h3>
                          <p className="text-sm text-muted-foreground">18 categories</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.button>

                    {/* Quick Links */}
                    <div className="pt-4 border-t border-border/30 mt-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Quick Links</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => { navigate('/catalog'); onClose(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">All Products</span>
                        </button>
                        <button
                          onClick={() => { navigate('/men'); onClose(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">Men's Page</span>
                        </button>
                        <button
                          onClick={() => { navigate('/women'); onClose(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">Women's Page</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Category listing */
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Browse {currentView === 'men' ? "men's" : "women's"} sneaker categories
                    </p>
                    
                    <div className="space-y-2">
                      {getCurrentCategories().map((category, index) => (
                        <motion.button
                          key={category.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCategoryClick(category)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-all duration-200 group border border-transparent hover:border-border/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                              <SneakerIcon variant={category.icon as any} />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors uppercase tracking-wide">
                                  {category.name}
                                </span>
                                {category.badge && (
                                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded uppercase">
                                    {category.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/30 bg-muted/10">
                <p className="text-xs text-muted-foreground text-center">
                  Premium sneakers for every style
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
