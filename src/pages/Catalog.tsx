import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductGrid } from '@/components/ProductGrid';
import { getAllProducts, ShopifyProduct } from '@/lib/shopify';

const Catalog = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch all products with very high limit to get everything
        const allProducts = await getAllProducts(100000);
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }
    
    const filtered = [...products];

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => 
          parseFloat(a.priceRange.minVariantPrice.amount) - 
          parseFloat(b.priceRange.minVariantPrice.amount)
        );
        break;
      case 'price-high':
        filtered.sort((a, b) => 
          parseFloat(b.priceRange.minVariantPrice.amount) - 
          parseFloat(a.priceRange.minVariantPrice.amount)
        );
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Keep original order for 'featured'
        break;
    }

    setFilteredProducts(filtered);
  }, [products, sortBy]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Complete Catalog</h1>
              <p className="text-muted-foreground">Discover all our premium sneakers</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            title=""
            subtitle={`${filteredProducts.length} products found`}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Catalog;
