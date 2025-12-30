import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductGrid } from '@/components/ProductGrid';
import { getAllProducts, ShopifyProduct } from '@/lib/shopify';

const Catalog = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Get collection from URL params and auto-apply filter
  const urlParams = new URLSearchParams(window.location.search);
  const collection = urlParams.get('collection');
  const first = 50;
  
  // Auto-apply collection filter on page load
  useEffect(() => {
    if (collection) {
      const collectionMap: { [key: string]: string } = {
        'performance-sports': 'Performance & Sports',
        'lifestyle-casual': 'Lifestyle & Casual',
        'limited-edition-hype': 'Limited Edition & Hype',
        'retro-classics': 'Retro & Classics'
      };
      
      const categoryName = collectionMap[collection];
      if (categoryName && !selectedCategories.includes(categoryName)) {
        setSelectedCategories([categoryName]);
      }
    }
  }, [collection]);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('featured');

  const categories = ['Performance & Sports', 'Lifestyle & Casual', 'Limited Edition & Hype', 'Retro & Classics'];
  const priceRanges = ['₹0 - ₹50', '₹50 - ₹100', '₹100 - ₹200', '₹200 - ₹500', '₹500+'];
  const sizes = ['6', '7', '8', '9', '10', '11', '12', '13'];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Grey', 'Brown', 'Pink'];
  const materials = ['Leather', 'Canvas', 'Mesh', 'Synthetic', 'Suede'];
  const activities = ['Running', 'Walking', 'Training', 'Casual', 'Sports'];
  const brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'AIRN', 'Bisuth', 'My Store'];

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let products;
        
        // For now, just fetch all products since collection API isn't implemented
        products = await getAllProducts(first);
        
        setProducts(products);
        setFilteredProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [collection, first]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Filter by categories (collections)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        // This is basic filtering by title - in a real app, you'd use product tags or collections
        return selectedCategories.some(category => {
          const categoryKeywords = {
            'Performance & Sports': ['athletic', 'sport', 'running', 'performance'],
            'Lifestyle & Casual': ['lifestyle', 'casual', 'everyday'],
            'Limited Edition & Hype': ['limited', 'edition', 'hype', 'exclusive'],
            'Retro & Classics': ['retro', 'classic', 'vintage']
          };
          
          const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];
          return keywords.some(keyword => 
            product.title.toLowerCase().includes(keyword.toLowerCase()) ||
            product.description.toLowerCase().includes(keyword.toLowerCase())
          );
        });
      });
    }

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product =>
        selectedBrands.some(brand =>
          product.title.toLowerCase().includes(brand.toLowerCase())
        )
      );
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter(product =>
        selectedColors.some(color =>
          product.title.toLowerCase().includes(color.toLowerCase()) ||
          product.description.toLowerCase().includes(color.toLowerCase())
        )
      );
    }

    // Filter by materials
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(product =>
        selectedMaterials.some(material =>
          product.title.toLowerCase().includes(material.toLowerCase()) ||
          product.description.toLowerCase().includes(material.toLowerCase())
        )
      );
    }

    // Filter by activities
    if (selectedActivities.length > 0) {
      filtered = filtered.filter(product =>
        selectedActivities.some(activity =>
          product.title.toLowerCase().includes(activity.toLowerCase()) ||
          product.description.toLowerCase().includes(activity.toLowerCase())
        )
      );
    }

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
  }, [products, priceRange, selectedCategories, selectedBrands, selectedSizes, selectedColors, selectedMaterials, selectedActivities, sortBy]);

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand]);
    } else {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    }
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    if (checked) {
      setSelectedSizes([...selectedSizes, size]);
    } else {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };

  const handleColorChange = (color: string, checked: boolean) => {
    if (checked) {
      setSelectedColors([...selectedColors, color]);
    } else {
      setSelectedColors(selectedColors.filter(c => c !== color));
    }
  };

  const handleMaterialChange = (material: string, checked: boolean) => {
    if (checked) {
      setSelectedMaterials([...selectedMaterials, material]);
    } else {
      setSelectedMaterials(selectedMaterials.filter(m => m !== material));
    }
  };

  const handleActivityChange = (activity: string, checked: boolean) => {
    if (checked) {
      setSelectedActivities([...selectedActivities, activity]);
    } else {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    }
  };

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedActivities([]);
    setSortBy('featured');
  };

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
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <motion.div
              className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center">
                      <SlidersHorizontal className="h-5 w-5 mr-2" />
                      Filters
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">
                      Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Brands */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">Brands</Label>
                    <div className="space-y-2">
                      {brands.map(brand => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={brand}
                            checked={selectedBrands.includes(brand)}
                            onCheckedChange={(checked) => 
                              handleBrandChange(brand, checked as boolean)
                            }
                          />
                          <Label htmlFor={brand} className="text-sm">
                            {brand}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">Collections</Label>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category, checked as boolean)
                            }
                          />
                          <Label htmlFor={category} className="text-sm">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">Colors</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map(color => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={color}
                            checked={selectedColors.includes(color)}
                            onCheckedChange={(checked) => 
                              handleColorChange(color, checked as boolean)
                            }
                          />
                          <Label htmlFor={color} className="text-xs">
                            {color}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">Materials</Label>
                    <div className="space-y-2">
                      {materials.map(material => (
                        <div key={material} className="flex items-center space-x-2">
                          <Checkbox
                            id={material}
                            checked={selectedMaterials.includes(material)}
                            onCheckedChange={(checked) => 
                              handleMaterialChange(material, checked as boolean)
                            }
                          />
                          <Label htmlFor={material} className="text-sm">
                            {material}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">Activities</Label>
                    <div className="space-y-2">
                      {activities.map(activity => (
                        <div key={activity} className="flex items-center space-x-2">
                          <Checkbox
                            id={activity}
                            checked={selectedActivities.includes(activity)}
                            onCheckedChange={(checked) => 
                              handleActivityChange(activity, checked as boolean)
                            }
                          />
                          <Label htmlFor={activity} className="text-sm">
                            {activity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Shoe Sizes (US)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {sizes.map(size => (
                        <div key={size} className="flex items-center space-x-1">
                          <Checkbox
                            id={size}
                            checked={selectedSizes.includes(size)}
                            onCheckedChange={(checked) => 
                              handleSizeChange(size, checked as boolean)
                            }
                          />
                          <Label htmlFor={size} className="text-xs">
                            {size}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <ProductGrid
                products={filteredProducts}
                isLoading={isLoading}
                title=""
                subtitle={`${filteredProducts.length} products found`}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Catalog;
