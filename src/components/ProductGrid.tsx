import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './SkeletonLoader';
import { ShopifyProduct } from '@/lib/shopify';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';

interface ProductGridProps {
  products: ShopifyProduct[];
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  showLoadMore?: boolean;
}

export function ProductGrid({ products, isLoading, title, subtitle, onLoadMore, hasMore = true, isLoadingMore = false, showLoadMore = true }: ProductGridProps) {
  if (isLoading) {
    return (
      <section className="py-12">
        {title && (
          <div className="text-center mb-12">
            <div className="skeleton h-8 w-64 mx-auto mb-4 rounded" />
            <div className="skeleton h-4 w-96 mx-auto rounded" />
          </div>
        )}
        <ProductGridSkeleton count={8} />
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="py-12">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">No Products Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any products at the moment. Please check back later or explore other categories.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {title && (
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: "easeOut"
              }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <ProductCard
                product={product}
                index={index}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Load More Button */}
        {showLoadMore && onLoadMore && hasMore && products.length >= 8 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <InteractiveHoverButton
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 text-lg"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading...
                </span>
              ) : (
                'Load More Products'
              )}
            </InteractiveHoverButton>
          </motion.div>
        )}
      </div>
    </section>
  );
}