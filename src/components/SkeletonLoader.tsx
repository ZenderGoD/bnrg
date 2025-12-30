import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'product' | 'hero' | 'text' | 'card';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'card', count = 1, className = '' }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'product':
        return (
          <motion.div
            className={`space-y-4 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="aspect-square skeleton rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-6 w-1/3 rounded" />
            </div>
          </motion.div>
        );

      case 'hero':
        return (
          <motion.div
            className={`space-y-6 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="skeleton h-12 w-3/4 rounded-lg" />
            <div className="skeleton h-6 w-full rounded" />
            <div className="skeleton h-6 w-2/3 rounded" />
            <div className="skeleton h-12 w-1/3 rounded-xl" />
          </motion.div>
        );

      case 'text':
        return (
          <motion.div
            className={`space-y-2 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/6 rounded" />
          </motion.div>
        );

      case 'card':
      default:
        return (
          <motion.div
            className={`p-4 border rounded-xl space-y-4 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="skeleton h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SkeletonLoader variant="product" count={count} />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <SkeletonLoader variant="hero" className="max-w-2xl mx-auto text-center" />
    </div>
  );
}