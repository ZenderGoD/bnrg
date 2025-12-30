import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchProducts, ShopifyProduct, isCustomerLoggedIn, getCustomerToken } from '@/lib/shopify';
import { useNavigate } from 'react-router-dom';

interface SearchInputProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchInput({ isOpen, onClose }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        try {
          const searchResults = await searchProducts(query, 6);
          setResults(searchResults);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const saveSearchHistory = (searchQuery: string) => {
    if (searchQuery.trim().length > 0) {
      const customerId = isCustomerLoggedIn() ? getCustomerToken()?.accessToken : null;
      const historyKey = customerId ? `2xy-search-history-${customerId}` : '2xy-search-history';
      const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Add to beginning of history, remove duplicates, limit to 10 items
      const newHistory = [searchQuery, ...currentHistory.filter((h: string) => h !== searchQuery)].slice(0, 10);
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
    }
  };

  const handleProductClick = (productHandle: string) => {
    saveSearchHistory(query);
    navigate(`/product/${productHandle}`);
    onClose();
    setQuery('');
    setResults([]);
  };

  const handleSearch = () => {
    if (query.trim().length > 0) {
      saveSearchHistory(query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      onClose();
      setQuery('');
      setResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Search Container */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 sm:top-20 left-0 right-0 mx-auto w-full max-w-sm sm:max-w-2xl px-4 z-50"
          >
            <div className="bg-background/90 backdrop-blur-md border rounded-lg shadow-xl w-full">
              {/* Search Input */}
              <div className="flex items-center p-3 sm:p-4 border-b w-full">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for sneakers..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base min-w-0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 ml-2 h-8 w-8 sm:h-auto sm:w-auto flex-shrink-0 touch-target"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {(isLoading || results.length > 0 || (query.length > 2 && results.length === 0)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-h-80 sm:max-h-96 overflow-y-auto w-full"
                  >
                    {isLoading && (
                      <div className="p-4 text-center text-muted-foreground">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                        <span className="ml-2 text-sm sm:text-base">Searching...</span>
                      </div>
                    )}

                    {!isLoading && results.length === 0 && query.length > 2 && (
                      <div className="p-4 text-center text-muted-foreground text-sm sm:text-base">
                        No products found for "{query}"
                      </div>
                    )}

                    {!isLoading && results.length > 0 && (
                      <div className="p-2 w-full">
                        {results.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors w-full"
                            onClick={() => handleProductClick(product.handle)}
                          >
                            <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-cover bg-center mr-3 border flex-shrink-0"
                              style={{
                                backgroundImage: `url(${product.images?.edges?.[0]?.node?.url || '/placeholder.svg'})`
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm truncate">{product.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                ${product.priceRange.minVariantPrice.amount}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        
                        {results.length === 6 && (
                          <div className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigate(`/catalog?q=${encodeURIComponent(query)}`);
                                onClose();
                              }}
                              className="text-accent hover:text-accent text-sm"
                            >
                              View all results for "{query}"
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}