import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Heart, ShoppingBag, Clock, LogOut, Settings, CreditCard, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StorefrontAuthModal } from '@/components/StorefrontAuthModal';
import { 
  getCustomerToken, 
  getCustomer, 
  getCustomerOrders, 
  customerLogout, 
  isCustomerLoggedIn,
  getProductById,
  ShopifyCustomer,
  ShopifyOrder,
  ShopifyProduct
} from '@/lib/shopify';
import { getCustomerCredits } from '@/lib/creditSystem';

const Profile = () => {
  const [customer, setCustomer] = useState<ShopifyCustomer | null>(null);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [likedProductsDetails, setLikedProductsDetails] = useState<ShopifyProduct[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerCredits, setCustomerCredits] = useState(0);

  useEffect(() => {
    loadCustomerData();
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [customer]);

  const loadCustomerData = async () => {
    console.log('🔄 Profile: Starting loadCustomerData');
    setIsLoading(true);
    try {
      const loggedIn = isCustomerLoggedIn();
      console.log('🔍 Profile: User logged in status:', loggedIn);
      
      if (loggedIn) {
        const token = getCustomerToken();
        console.log('🎫 Profile: Got token:', token ? 'Token exists' : 'No token');
        
        if (token) {
          console.log('👤 Profile: Loading customer details...');
          // Load customer details
          const customerData = await getCustomer(token.accessToken);
          console.log('👤 Profile: Customer data received:', customerData ? 'Success' : 'Failed');
          
          if (customerData) {
            setCustomer(customerData);
            console.log('✅ Profile: Customer state set:', customerData.email);
            
            // Load customer orders
            console.log('📦 Profile: Loading orders...');
            const customerOrders = await getCustomerOrders(token.accessToken);
            console.log('📦 Profile: Orders loaded:', customerOrders.length);
            setOrders(customerOrders);
          } else {
            console.warn('⚠️ Profile: No customer data returned');
          }
          
          // Load customer credits
          if (token?.accessToken) {
            console.log('💳 Profile: Loading credits...');
            try {
              const creditData = await getCustomerCredits(token.accessToken);
              console.log('💳 Profile: Credits loaded:', creditData.balance);
              setCustomerCredits(creditData.balance);
            } catch (creditError) {
              console.error('❌ Profile: Error loading credits:', creditError);
              setCustomerCredits(0);
            }
          }
        } else {
          console.warn('⚠️ Profile: No token available');
        }
      } else {
        console.log('🚫 Profile: User not logged in');
      }
    } catch (error) {
      console.error('❌ Profile: Error loading customer data:', error);
    } finally {
      console.log('✅ Profile: Finished loading, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const loadLocalData = async () => {
    // Get customer-specific storage keys
    const customerId = customer?.id;
    const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
    const historyKey = customerId ? `2xy-search-history-${customerId}` : '2xy-search-history';
    
    // Load liked products and search history from localStorage
    const liked = localStorage.getItem(likedKey);
    const history = localStorage.getItem(historyKey);
    
    if (liked) {
      const likedIds = JSON.parse(liked);
      setLikedProducts(likedIds);
      
      // Load actual product details
      try {
        const productDetails = await Promise.all(
          likedIds.map(async (productId: string) => {
            try {
              return await getProductById(productId);
            } catch (error) {
              console.error(`Failed to load product ${productId}:`, error);
              return null;
            }
          })
        );
        setLikedProductsDetails(productDetails.filter(p => p !== null) as ShopifyProduct[]);
      } catch (error) {
        console.error('Error loading liked products details:', error);
      }
    }
    
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const handleLogin = (customerData: ShopifyCustomer) => {
    setCustomer(customerData);
    loadCustomerData(); // Reload data after login
  };

  const handleLogout = () => {
    // Clear user-specific data
    setCustomer(null);
    setOrders([]);
    setCustomerCredits(0);
    setLikedProducts([]);
    setLikedProductsDetails([]);
    setSearchHistory([]);
    
    // Perform logout
    customerLogout();
  };

  const clearSearchHistory = () => {
    const customerId = customer?.id;
    const historyKey = customerId ? `2xy-search-history-${customerId}` : '2xy-search-history';
    localStorage.removeItem(historyKey);
    setSearchHistory([]);
  };

  const clearLikedProducts = () => {
    const customerId = customer?.id;
    const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
    localStorage.removeItem(likedKey);
    setLikedProducts([]);
    setLikedProductsDetails([]);
  };

  console.log('🎯 Profile: Render check - isLoading:', isLoading, 'customer:', customer ? 'exists' : 'null', 'loggedIn:', isCustomerLoggedIn());

  if (isLoading) {
    console.log('⏳ Profile: Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }



  if (!isCustomerLoggedIn()) {
    console.log('🚫 Profile: User not logged in, showing auth screen');
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-accent via-primary to-accent rounded-full flex items-center justify-center shadow-xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <User className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              Welcome to 2XY
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Sign in to your <span className="font-medium text-accent">Shopify account</span> to view your profile, track orders, and start earning exclusive 2XY credits
            </p>
            
            {/* Benefits preview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/10">
                <ShoppingBag className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-xs font-medium text-center">Order Tracking</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/10">
                <CreditCard className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-xs font-medium text-center">Earn Credits</p>
              </div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg"
              >
                <User className="w-5 h-5 mr-2 text-white" />
                <span className="text-white">Sign In with Shopify</span>
              </Button>
            </motion.div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Secure authentication powered by Shopify
            </p>
          </motion.div>
        </div>
                <StorefrontAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin} 
        />
      </>
    );
  }

  // Show loading if logged in but customer data not loaded
  if (isCustomerLoggedIn() && !customer && isLoading) {
    console.log('⏳ Profile: Logged in but loading customer data');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  // If logged in but no customer data and not loading, show error
  if (isCustomerLoggedIn() && !customer && !isLoading) {
    console.log('❌ Profile: Logged in but no customer data, showing refresh button');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-muted-foreground mb-4">Unable to load profile data</p>
          <Button onClick={() => {
            console.log('🔄 Profile: Refresh button clicked');
            window.location.reload();
          }}>Refresh</Button>
        </motion.div>
      </div>
    );
  }

  console.log('✅ Profile: Rendering main profile content for user:', customer?.email);
  
  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Enhanced Profile Header */}
          <div className="text-center mb-12">
            <motion.div 
              className="w-32 h-32 bg-gradient-to-br from-accent via-primary to-accent rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-accent/20 border-4 border-white/10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <User className="w-16 h-16 text-white" />
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : customer?.displayName || 'Welcome'}
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground mb-4 text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {customer?.email || 'No email available'}
            </motion.p>
            
            {/* Membership Info */}
            <motion.div 
              className="flex items-center justify-center gap-6 mb-8 text-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full border border-accent/20">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="font-medium">Member since {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Recently joined'}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full border border-accent/20">
                <CreditCard className="w-4 h-4 text-accent" />
                <span className="font-medium">{customerCredits} Credits Available</span>
              </div>
            </motion.div>
            
            {/* Enhanced Quick Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-6 mb-8 max-w-lg mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.div 
                className="p-4 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/5 rounded-xl border border-accent/20 shadow-sm"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
                  {orders.length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Orders</div>
              </motion.div>
              <motion.div 
                className="p-4 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/5 rounded-xl border border-accent/20 shadow-sm"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
                  {likedProducts.length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Liked</div>
              </motion.div>
              <motion.div 
                className="p-4 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/5 rounded-xl border border-accent/20 shadow-sm"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
                  {customerCredits}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Credits</div>
              </motion.div>
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div 
              className="flex gap-4 justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-accent/30 hover:bg-accent/5 hover:border-accent/50"
                >
                  <Settings className="w-4 h-4" />
                  Shopify Account
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 border border-accent/10 rounded-xl p-1">
              <TabsTrigger 
                value="orders" 
                className="h-full rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="liked" 
                className="h-full rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <Heart className="h-4 w-4 mr-2" />
                Liked Products
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="h-full rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                Search History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="liked" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Liked Products</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearLikedProducts}
                    disabled={likedProducts.length === 0}
                  >
                    Clear All
                  </Button>
                </CardHeader>
                <CardContent>
                  {likedProductsDetails.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {likedProductsDetails.map((product) => (
                        <motion.div
                          key={product.id}
                          className="group relative border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                          whileHover={{ y: -4 }}
                        >
                          <Link to={`/product/${product.handle}`} className="block">
                            <div className="aspect-square overflow-hidden bg-muted/20">
                              <img
                                src={product.images?.edges?.[0]?.node?.url || '/placeholder.svg'}
                                alt={product.images?.edges?.[0]?.node?.altText || product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                                {product.title}
                              </h3>
                              <p className="text-lg font-bold text-accent mt-2">
                                ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                              </p>
                            </div>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
                            onClick={() => {
                              const customerId = customer?.id;
                              const likedKey = customerId ? `2xy-liked-products-${customerId}` : '2xy-liked-products';
                              const currentLiked = JSON.parse(localStorage.getItem(likedKey) || '[]');
                              const newLiked = currentLiked.filter((id: string) => id !== product.id);
                              localStorage.setItem(likedKey, JSON.stringify(newLiked));
                              setLikedProducts(newLiked);
                              setLikedProductsDetails(prev => prev.filter(p => p.id !== product.id));
                            }}
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <motion.div
                        className="w-20 h-20 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Heart className="h-10 w-10 opacity-50" />
                      </motion.div>
                      <p className="text-lg font-medium mb-2">No liked products yet</p>
                      <p className="text-sm">Heart products to save them here</p>
                      <p className="text-xs mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/5 to-primary/5 rounded-full border border-accent/10">
                        💡 Tip: Click the heart icon on any product to add it to your favorites
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Search History</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSearchHistory}
                    disabled={searchHistory.length === 0}
                  >
                    Clear All
                  </Button>
                </CardHeader>
                <CardContent>
                  {searchHistory.length > 0 ? (
                    <div className="space-y-2">
                      {searchHistory.map((query, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">{query}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No search history yet</p>
                      <p className="text-sm">Your searches will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.processedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-accent">
                                ${parseFloat(order.totalPrice.amount).toFixed(2)} {order.totalPrice.currencyCode}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.fulfillmentStatus === 'FULFILLED' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.fulfillmentStatus === 'PARTIAL'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.fulfillmentStatus}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.financialStatus === 'PAID' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.financialStatus === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order.financialStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.lineItems.edges.map((lineItem, index) => (
                              <div key={index} className="flex items-center space-x-3 p-2 bg-muted/50 rounded">
                                {lineItem.node.variant.image && (
                                  <img
                                    src={lineItem.node.variant.image.url}
                                    alt={lineItem.node.variant.image.altText || lineItem.node.title}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{lineItem.node.title}</p>
                                  <p className="text-xs text-muted-foreground">{lineItem.node.variant.title}</p>
                                  <p className="text-xs">Qty: {lineItem.node.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="w-20 h-20 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ShoppingBag className="h-10 w-10 text-accent" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">Your Shopify order history will appear here</p>
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/5 to-primary/5 rounded-full border border-accent/10">
                        <span className="text-sm text-accent font-medium">
                          ✨ Orders automatically sync from your Shopify account
                        </span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;