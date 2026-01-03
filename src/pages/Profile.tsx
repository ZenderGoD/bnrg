import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Heart, ShoppingBag, Clock, LogOut, Settings, CreditCard, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SimpleLoginModal } from '@/components/SimpleLoginModal';
import { auth, users, orders, products, payments, type User as UserType, type Order, type Product } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [likedProductsDetails, setLikedProductsDetails] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingPayments, setHasPendingPayments] = useState(false);
  const { toast } = useToast();
  
  // Personal information form state
  const [formData, setFormData] = useState({
    email: '',
    acceptsMarketing: false,
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [user]);

  const loadUserData = async () => {
    console.log('🔄 Profile: Starting loadUserData');
    setIsLoading(true);
    try {
      const loggedIn = auth.isLoggedIn();
      console.log('🔍 Profile: User logged in status:', loggedIn);
      
      if (loggedIn) {
        const userId = auth.getUserId();
        console.log('🎫 Profile: Got userId:', userId ? 'User ID exists' : 'No user ID');
        
        if (userId) {
          console.log('👤 Profile: Loading user details...');
          // Load user details
          const userData = await users.getById(userId);
          console.log('👤 Profile: User data received:', userData ? 'Success' : 'Failed');
          
          if (userData) {
            setUser(userData);
            console.log('✅ Profile: User state set:', userData.email);
            
            // Populate form data
            setFormData({
              email: userData.email || '',
              acceptsMarketing: userData.acceptsMarketing || false,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              address: userData.address || '',
              apartment: userData.apartment || '',
              city: userData.city || '',
              state: userData.state || '',
              country: userData.country || 'India',
              pinCode: userData.pinCode || '',
              phone: userData.phone || '',
            });
            
            // Load user orders
            console.log('📦 Profile: Loading orders...');
            const userOrdersData = await orders.getByUserId(userId);
            console.log('📦 Profile: Orders loaded:', userOrdersData.length);
            setUserOrders(userOrdersData);
            
            
            // Check for pending payments
            console.log('💳 Profile: Checking pending payments...');
            try {
              const pendingPayments = await payments.getPendingByUserId(userId);
              console.log('💳 Profile: Pending payments:', pendingPayments.length);
              setHasPendingPayments(pendingPayments.length > 0);
            } catch (paymentError) {
              console.error('❌ Profile: Error loading pending payments:', paymentError);
              setHasPendingPayments(false);
            }
          } else {
            console.warn('⚠️ Profile: No user data returned');
          }
        } else {
          console.warn('⚠️ Profile: No user ID available');
        }
      } else {
        console.log('🚫 Profile: User not logged in');
      }
    } catch (error) {
      console.error('❌ Profile: Error loading user data:', error);
    } finally {
      console.log('✅ Profile: Finished loading, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const loadLocalData = async () => {
    // Get user-specific storage keys
    const userId = user?._id;
    const likedKey = userId ? `2xy-liked-products-${userId}` : '2xy-liked-products';
    const historyKey = userId ? `2xy-search-history-${userId}` : '2xy-search-history';
    
    // Load liked articles and search history from localStorage
    const liked = localStorage.getItem(likedKey);
    const history = localStorage.getItem(historyKey);
    
    if (liked) {
      const likedIds = JSON.parse(liked);
      setLikedProducts(likedIds);
      
      // Load actual product details
      try {
        const allProducts = await products.getAll();
        const productDetails = likedIds
          .map((productId: string) => allProducts.find(p => p._id === productId))
          .filter((p): p is Product => p !== undefined);
        setLikedProductsDetails(productDetails);
      } catch (error) {
        console.error('Error loading liked articles details:', error);
      }
    }
    
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const handleLogin = (userData: UserType) => {
    setUser(userData);
    loadUserData(); // Reload data after login
  };

  const handleLogout = () => {
    // Clear user-specific data
    setUser(null);
    setUserOrders([]);
    setLikedProducts([]);
    setLikedProductsDetails([]);
    setSearchHistory([]);
    
    // Perform logout
    auth.logout();
  };

  const clearSearchHistory = () => {
    const userId = user?._id;
    const historyKey = userId ? `2xy-search-history-${userId}` : '2xy-search-history';
    localStorage.removeItem(historyKey);
    setSearchHistory([]);
  };

  const clearLikedProducts = () => {
    const userId = user?._id;
    const likedKey = userId ? `2xy-liked-products-${userId}` : '2xy-liked-products';
    localStorage.removeItem(likedKey);
    setLikedProducts([]);
    setLikedProductsDetails([]);
  };

  const handleSavePersonalInfo = async () => {
    if (!user?._id) return;
    
    setIsSaving(true);
    try {
      await users.update(user._id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        acceptsMarketing: formData.acceptsMarketing,
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pinCode: formData.pinCode,
      });
      
      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
      
      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  console.log('🎯 Profile: Render check - isLoading:', isLoading, 'user:', user ? 'exists' : 'null', 'loggedIn:', auth.isLoggedIn());

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



  if (!auth.isLoggedIn()) {
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
              Welcome to TOESPRING
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Sign in to your account to view your profile and track orders
            </p>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg"
              >
                <User className="w-5 h-5 mr-2 text-white" />
                <span className="text-white">Sign In</span>
              </Button>
            </motion.div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Secure authentication
            </p>
          </motion.div>
        </div>
        <SimpleLoginModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin} 
        />
      </>
    );
  }

  // Show loading if logged in but user data not loaded
  if (auth.isLoggedIn() && !user && isLoading) {
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

  // If logged in but no user data and not loading, show error
  if (auth.isLoggedIn() && !user && !isLoading) {
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

  console.log('✅ Profile: Rendering main profile content for user:', user?.email);
  
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
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.displayName || 'Welcome'}
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground mb-4 text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {user?.email || 'No email available'}
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
                <span className="font-medium">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently joined'}</span>
              </div>
            </motion.div>
            
            {/* Enhanced Quick Stats */}
            <motion.div 
              className="grid grid-cols-2 gap-6 mb-8 max-w-md mx-auto"
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
                  {userOrders.length}
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
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div 
              className="flex gap-4 justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-accent/30 hover:bg-accent/5 hover:border-accent/50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
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
            <TabsList className="grid w-full grid-cols-4 h-14 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 border border-accent/10 rounded-xl p-1">
              <TabsTrigger 
                value="orders" 
                className={`h-full rounded-lg text-[#1f2937] dark:text-[#06b6d4] data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative ${
                  hasPendingPayments ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                }`}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Orders
                {hasPendingPayments && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="liked" 
                className="h-full rounded-lg text-[#1f2937] dark:text-[#06b6d4] data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <Heart className="h-4 w-4 mr-2" />
                Liked Articles
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="h-full rounded-lg text-[#1f2937] dark:text-[#06b6d4] data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                Search History
              </TabsTrigger>
              <TabsTrigger 
                value="personal" 
                className="h-full rounded-lg text-[#1f2937] dark:text-[#06b6d4] data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <User className="h-4 w-4 mr-2" />
                Personal Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="liked" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Liked Articles</CardTitle>
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
                          key={product._id}
                          className="group relative border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                          whileHover={{ y: -4 }}
                        >
                          <Link to={`/product/${product.handle}`} className="block">
                            <div className="aspect-square overflow-hidden bg-muted/20">
                              <img
                                src={product.images?.[0]?.url || '/placeholder.svg'}
                                alt={product.images?.[0]?.altText || product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                                {product.title}
                              </h3>
                              <p className="text-lg font-bold text-accent mt-2">
                                ${product.price.toFixed(2)} {product.currencyCode}
                              </p>
                            </div>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
                            onClick={() => {
                              const userId = user?._id;
                              const likedKey = userId ? `2xy-liked-products-${userId}` : '2xy-liked-products';
                              const currentLiked = JSON.parse(localStorage.getItem(likedKey) || '[]');
                              const newLiked = currentLiked.filter((id: string) => id !== product._id);
                              localStorage.setItem(likedKey, JSON.stringify(newLiked));
                              setLikedProducts(newLiked);
                              setLikedProductsDetails(prev => prev.filter(p => p._id !== product._id));
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
                      <p className="text-lg font-medium mb-2">No liked articles yet</p>
                      <p className="text-sm">Heart articles to save them here</p>
                      <p className="text-xs mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/5 to-primary/5 rounded-full border border-accent/10">
                        💡 Tip: Click the heart icon on any article to add it to your favorites
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

            <TabsContent value="personal" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acceptsMarketing"
                        checked={formData.acceptsMarketing}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, acceptsMarketing: checked as boolean })
                        }
                      />
                      <Label htmlFor="acceptsMarketing" className="cursor-pointer">
                        Email me with news and offers
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger id="country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name (optional)</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                      <Input
                        id="apartment"
                        value={formData.apartment}
                        onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                          <SelectItem value="West Bengal">West Bengal</SelectItem>
                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                          <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                          <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="Haryana">Haryana</SelectItem>
                          <SelectItem value="Kerala">Kerala</SelectItem>
                          <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                          <SelectItem value="Telangana">Telangana</SelectItem>
                          <SelectItem value="Bihar">Bihar</SelectItem>
                          <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                          <SelectItem value="Odisha">Odisha</SelectItem>
                          <SelectItem value="Assam">Assam</SelectItem>
                          <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                          <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                          <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                          <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                          <SelectItem value="Goa">Goa</SelectItem>
                          <SelectItem value="Tripura">Tripura</SelectItem>
                          <SelectItem value="Manipur">Manipur</SelectItem>
                          <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                          <SelectItem value="Mizoram">Mizoram</SelectItem>
                          <SelectItem value="Nagaland">Nagaland</SelectItem>
                          <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                          <SelectItem value="Sikkim">Sikkim</SelectItem>
                          <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                          <SelectItem value="Ladakh">Ladakh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pinCode">PIN code</Label>
                      <Input
                        id="pinCode"
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSavePersonalInfo}
                      disabled={isSaving}
                      className="min-w-[120px]"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {userOrders.length > 0 ? (
                    <div className="space-y-4">
                      {userOrders.map((order) => (
                        <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-accent">
                                ${order.totalPrice.toFixed(2)} {order.currencyCode}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.fulfillmentStatus === 'fulfilled' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.fulfillmentStatus === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.fulfillmentStatus}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.financialStatus === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.financialStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order.financialStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3 p-2 bg-muted/50 rounded">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.title}</p>
                                  <p className="text-xs">Qty: {item.quantity}</p>
                                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
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
                      <p className="text-muted-foreground mb-4">Your order history will appear here</p>
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/5 to-primary/5 rounded-full border border-accent/10">
                        <span className="text-sm text-accent font-medium">
                          ✨ Start shopping to see your orders here
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