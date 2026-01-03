import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductsByCollection, ShopifyProduct } from '@/lib/shopify';
import { formatCurrency } from '@/lib/utils';

interface CategoryPreviewProps {
  category: 'men' | 'women';
  isVisible: boolean;
}

export function CategoryPreview({ category, isVisible }: CategoryPreviewProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && products.length === 0) {
      const fetchProducts = async () => {
        setIsLoading(true);
        try {
          const collectionHandle = category === 'men' ? 'mens-collection' : 'womens-collection';
          const fetchedProducts = await getProductsByCollection(collectionHandle, 4);
          setProducts(fetchedProducts);
        } catch (error) {
          console.error(`Failed to fetch ${category} products:`, error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isVisible, category, products.length]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 mt-2 w-80 bg-background/95 backdrop-blur-md border rounded-lg shadow-xl z-50 p-4"
        >
          <h3 className="font-semibold text-foreground mb-3 capitalize">
            {category}'s Top Picks
          </h3>
          
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => window.location.href = `/product/${product.handle}`}
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${product.images?.edges?.[0]?.node?.url || '/placeholder.svg'})`
                      }}
                    />
                  </div>
                  <h4 className="text-xs font-medium text-foreground truncate">
                    {product.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(parseFloat(product.priceRange.minVariantPrice.amount), "INR")}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
          
          {!isLoading && products.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p className="text-sm">No products found</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}