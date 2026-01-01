import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useConvex } from 'convex/react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Shield, Lock, BarChart3, Users, ShoppingBag, Package, Filter, TrendingUp, DollarSign, PackageCheck, AlertTriangle, Info, Upload, Video, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { auth, users } from '@/lib/api';
import { AdminChatbot } from '@/components/AdminChatbot';
import { AdminProvider } from '@/contexts/AdminContext';
import { sanitizeConvexError } from '@/lib/errorHandler';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { ResizableAdminLayout } from '@/components/ResizableAdminLayout';
import { cn } from '@/lib/utils';

type Product = {
  _id?: string;
  title: string;
  description: string;
  handle: string;
  price: number;
  currencyCode: string;
  images: Array<{ url: string; altText?: string }>;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    availableForSale: boolean;
    quantity: number;
    selectedOptions?: Array<{ name: string; value: string }>;
    image?: { url: string; altText?: string };
  }>;
  tags: string[];
  collection: string;
  category?: string;
};

export default function Admin() {
  const navigate = useNavigate();
  const convex = useConvex();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: boolean;
    handle?: boolean;
    price?: boolean;
    variantErrors?: Record<number, { title?: boolean; price?: boolean; quantity?: boolean }>;
  }>({});
  const { toast } = useToast();

  // Check authorization
  useEffect(() => {
    let cancelled = false;
    
    const checkAuth = async () => {
      try {
        const loggedIn = auth.isLoggedIn();
        
        if (!loggedIn) {
          if (!cancelled) {
            setIsAuthorized(false);
            setIsLoadingAuth(false);
          }
          return;
        }

        const userId = auth.getUserId();
        
        if (!userId) {
          if (!cancelled) {
            setIsAuthorized(false);
            setIsLoadingAuth(false);
          }
          return;
        }

        try {
          // Use Convex query directly instead of API wrapper
          const userData = await convex.query(api.users.getById, { id: userId as Id<"users"> });
          
          if (cancelled) return;
          
          if (!userData) {
            console.error('Admin: No user data returned for userId:', userId);
            setIsAuthorized(false);
            setIsLoadingAuth(false);
            return;
          }
          
          const userRole = userData.role || "customer";
          console.log('Admin: User data:', { userId, role: userRole, email: userData.email });
          
          if (userRole === "admin" || userRole === "manager") {
            console.log('Admin: Authorization successful, role:', userRole);
            setIsAuthorized(true);
            setIsLoadingAuth(false);
          } else {
            console.warn('Admin: Access denied, user role is:', userRole, 'expected admin or manager');
            setIsAuthorized(false);
            setIsLoadingAuth(false);
            toast({
              title: "Access Denied",
              description: "You need admin or manager privileges to access this page.",
              variant: "destructive",
            });
            setTimeout(() => navigate("/"), 2000);
          }
        } catch (queryError) {
          console.error("Error fetching user data:", queryError);
          if (!cancelled) {
            setIsAuthorized(false);
            setIsLoadingAuth(false);
            toast({
              title: "Authorization Error",
              description: "Failed to verify your access. Please try refreshing the page.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        if (!cancelled) {
          setIsAuthorized(false);
          setIsLoadingAuth(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      cancelled = true;
    };
  }, [navigate, toast, convex]);

  // Fetch all products - always call hooks (React requirement)
  // For queries that need to be skipped, we'll handle null/undefined results in render
  const products = useQuery(
    api.products.getAll, 
    isAuthorized === true ? { limit: 100 } : { limit: 0 }
  );
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  
  // Analytics - pass empty object when not authorized (query will run but return empty/default)
  const analytics = useQuery(
    api.analytics.getDashboardStats,
    {}
  );
  
  // Users
  const allUsers = useQuery(
    api.users.getAll, 
    isAuthorized === true ? { limit: 100 } : { limit: 0 }
  );

  // Users with chat stats
  const usersWithStats = useQuery(
    api.chats.getAllUsersWithChatStats,
    isAuthorized === true ? {} : undefined
  );
  
  // Orders
  const allOrders = useQuery(
    api.orders.getAll, 
    isAuthorized === true ? { limit: 100 } : { limit: 0 }
  );
  const updateOrderStatus = useMutation(api.orders.updateStatus);
  
  // Payments
  const allPayments = useQuery(
    api.payments.getAll,
    isAuthorized === true ? { limit: 100 } : { limit: 0 }
  );
  const updatePaymentMutation = useMutation(api.payments.updatePayment);
  
  // Get payment for a specific order
  const getPaymentByOrderId = (orderId: Id<"orders">) => {
    return allPayments?.find(p => p.orderId === orderId);
  };
  
  // Filters
  const filterSettings = useQuery(
    api.filters.getAllActive,
    {}
  );
  const createFilter = useMutation(api.filters.create);
  const updateFilter = useMutation(api.filters.update);
  const deleteFilter = useMutation(api.filters.remove);
  
  // File upload
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>({});
  const [selectedPaymentOrderId, setSelectedPaymentOrderId] = useState<Id<"orders"> | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>("");

  const [newProduct, setNewProduct] = useState<Product>({
    title: '',
    description: '',
    handle: '',
    price: 0,
    currencyCode: 'INR',
    images: [],
    variants: [{
      id: `variant-${Date.now()}`,
      title: 'Default',
      price: 0,
      availableForSale: true,
      quantity: 0,
    }],
    tags: [],
    collection: 'mens-collection',
    category: '',
  });
  
  const [imageStorageIds, setImageStorageIds] = useState<Record<number, string>>({});
  
  // Handle file upload
  const handleFileUpload = async (file: File, index: number) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [index]: true }));
      
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      // Convex returns the storageId as text (sometimes as JSON string)
      const storageIdText = await result.text();
      
      if (!storageIdText) {
        throw new Error("Failed to get storage ID");
      }
      
      // Parse storageId - sometimes Convex returns JSON string instead of plain ID
      let storageId: string;
      try {
        const parsed = JSON.parse(storageIdText);
        storageId = parsed.storageId || storageIdText;
      } catch {
        // Not JSON, use as-is
        storageId = storageIdText;
      }
      
      // Get file URL using Convex client
      const fileUrl = await convex.query(api.files.getFileUrl, { storageId: storageId as Id<"_storage"> });
      
      // Update images array
      const newImages = [...newProduct.images];
      if (!newImages[index]) {
        newImages[index] = { url: '', altText: '' };
      }
      newImages[index].url = fileUrl || '';
      
      setNewProduct({ ...newProduct, images: newImages });
      setImageStorageIds(prev => ({ ...prev, [index]: storageId }));
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const message = sanitizeConvexError(error);
      toast({
        title: "Error",
        description: message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [index]: false }));
    }
  };
  
  // Handle bulk file upload
  const handleBulkUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const startIndex = newProduct.images.length;
    
    // Add placeholder entries
    const newImages = [...newProduct.images, ...fileArray.map(() => ({ url: '', altText: '' }))];
    setNewProduct({ ...newProduct, images: newImages });
    
    // Upload all files
    await Promise.all(
      fileArray.map((file, idx) => handleFileUpload(file, startIndex + idx))
    );
  };
  
  // Helper component for info icon
  const InfoIcon = ({ description }: { description: string }) => (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center"
          onClick={(e) => e.preventDefault()}
        >
          <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1 hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      const errors: Record<string, boolean> = {};
      
      if (!newProduct.title?.trim()) {
        errors.title = true;
      }
      if (!newProduct.handle?.trim()) {
        errors.handle = true;
      }
      if (!newProduct.price || newProduct.price <= 0) {
        errors.price = true;
      }
      
      // Validate variants
      const variantErrors: Record<number, Record<string, boolean>> = {};
      newProduct.variants.forEach((variant, idx) => {
        const variantError: Record<string, boolean> = {};
        if (!variant.title?.trim()) {
          variantError.title = true;
        }
        if (!variant.price || variant.price <= 0) {
          variantError.price = true;
        }
        if (variant.quantity === undefined || variant.quantity < 0) {
          variantError.quantity = true;
        }
        if (Object.keys(variantError).length > 0) {
          variantErrors[idx] = variantError;
        }
      });
      
      if (Object.keys(errors).length > 0 || Object.keys(variantErrors).length > 0) {
        setFieldErrors({ ...errors, variantErrors });
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (highlighted in red)",
          variant: "destructive",
        });
        return;
      }
      
      // Clear errors if validation passes
      setFieldErrors({});

      await createProduct({
        title: newProduct.title,
        description: newProduct.description,
        handle: newProduct.handle,
        price: newProduct.price,
        currencyCode: newProduct.currencyCode,
        images: newProduct.images.filter(img => img.url),
        variants: newProduct.variants,
        tags: newProduct.tags.filter(tag => tag.trim()),
        collection: newProduct.collection,
        category: newProduct.category || undefined,
      });

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      // Reset form
      setNewProduct({
        title: '',
        description: '',
        handle: '',
        price: 0,
        currencyCode: 'INR',
        images: [],
        variants: [{
          id: `variant-${Date.now()}`,
          title: 'Default',
          price: 0,
          availableForSale: true,
          quantity: 0,
        }],
        tags: [],
        collection: 'mens-collection',
        category: '',
      });
      setImageStorageIds({});
      setFieldErrors({});
      setShowAddDialog(false);
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      toast({
        title: "Error",
        description: message || "Failed to create product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct?._id) return;

    if (!editingProduct._id) return;

    try {
      await updateProduct({
        id: editingProduct._id as Id<"products">,
        title: editingProduct.title,
        description: editingProduct.description,
        price: editingProduct.price,
        images: editingProduct.images,
        variants: editingProduct.variants,
        tags: editingProduct.tags,
        category: editingProduct.category,
      });

      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      setIsEditing(false);
      setEditingProduct(null);
    } catch (error: unknown) {
      const message = sanitizeConvexError(error);
      toast({
        title: "Error",
        description: message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Show loading state
  if (isLoadingAuth || isAuthorized === null) {
    return (
      <AdminProvider>
        <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Checking authorization...</p>
          </div>
        </div>
      </AdminProvider>
    );
  }

  // Show unauthorized state
  if (isAuthorized === false) {
    return (
      <AdminProvider>
        <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-center">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                You need admin or manager privileges to access this page.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminProvider>
    );
  }

  // Render main admin panel
  return (
    <AdminProvider
      onUpdateProduct={(data) => {
        setNewProduct(prev => ({
          ...prev,
          ...data,
          tags: data.tags !== undefined ? data.tags : prev.tags,
          images: data.images !== undefined ? data.images : prev.images,
          variants: data.variants !== undefined ? data.variants : prev.variants,
        }));
      }}
      onOpenDialog={() => setShowAddDialog(true)}
    >
      <SidebarProvider>
        <ResizableAdminLayout sidebar={<AdminChatbot />}>
          <SidebarInset className="h-full overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto px-4 py-8 pt-20">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-muted-foreground mt-2">Manage products, orders, and users</p>
                </div>
              </div>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setFieldErrors({}); // Clear errors when dialog closes
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-accent to-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center">
                      Title *
                      <InfoIcon description="The product name that will be displayed to customers" />
                    </Label>
                    <Input
                      value={newProduct.title}
                      onChange={(e) => {
                        setNewProduct({
                          ...newProduct,
                          title: e.target.value,
                          handle: generateHandle(e.target.value),
                        });
                        // Clear error when user starts typing
                        if (fieldErrors.title) {
                          setFieldErrors(prev => ({ ...prev, title: false }));
                        }
                      }}
                      placeholder="Nike Air Max 90"
                      className={fieldErrors.title ? "border-destructive border-2" : ""}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center">
                      Handle *
                      <InfoIcon description="URL-friendly identifier (auto-generated from title, can be edited)" />
                    </Label>
                    <Input
                      value={newProduct.handle}
                      onChange={(e) => {
                        setNewProduct({ ...newProduct, handle: e.target.value });
                        // Clear error when user starts typing
                        if (fieldErrors.handle) {
                          setFieldErrors(prev => ({ ...prev, handle: false }));
                        }
                      }}
                      placeholder="nike-air-max-90"
                      className={fieldErrors.handle ? "border-destructive border-2" : ""}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center">
                    Description
                    <InfoIcon description="Detailed product description for customers" />
                  </Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Product description..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center">
                      Price *
                      <InfoIcon description="Product price in INR" />
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewProduct({ 
                          ...newProduct, 
                          price: value === '' ? 0 : parseFloat(value) || 0 
                        });
                        // Clear error when user starts typing
                        if (fieldErrors.price) {
                          setFieldErrors(prev => ({ ...prev, price: false }));
                        }
                      }}
                      placeholder="129.99"
                      className={fieldErrors.price ? "border-destructive border-2" : ""}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center">
                      Currency
                      <InfoIcon description="Currency code (INR only)" />
                    </Label>
                    <Select
                      value={newProduct.currencyCode}
                      onValueChange={(value) => setNewProduct({ ...newProduct, currencyCode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center">
                      Collection *
                      <InfoIcon description="Product collection category" />
                    </Label>
                    <Select
                      value={newProduct.collection}
                      onValueChange={(value) => setNewProduct({ ...newProduct, collection: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mens-collection">Men's Collection</SelectItem>
                        <SelectItem value="womens-collection">Women's Collection</SelectItem>
                        <SelectItem value="kids-collection">Kids' Collection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center">
                    Category (Optional)
                    <InfoIcon description="Product subcategory for better organization. Leave empty or enter your own category." />
                  </Label>
                  <Input
                    value={newProduct.category || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="e.g., Premium Lifestyle, Athletic Performance, or your own category"
                  />
                </div>

                <div>
                  <Label className="flex items-center mb-2">
                    Images & Videos
                    <InfoIcon description="Upload product images and videos. Supports bulk upload. Files are stored in Convex storage." />
                  </Label>
                  
                  {/* Bulk Upload */}
                  <div className="mb-4">
                    <input
                      type="file"
                      id="bulk-upload"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleBulkUpload(e.target.files);
                        }
                      }}
                    />
                    <label htmlFor="bulk-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Bulk Upload Images/Videos
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  {/* Uploaded Files */}
                  {newProduct.images.map((img, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      {img.url ? (
                        <>
                          {img.url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <Video className="h-10 w-10 text-muted-foreground" />
                          ) : (
                            <img src={img.url} alt={img.altText} className="h-10 w-10 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <Input
                              value={img.altText || ''}
                              onChange={(e) => {
                                const newImages = [...newProduct.images];
                                newImages[idx].altText = e.target.value;
                                setNewProduct({ ...newProduct, images: newImages });
                              }}
                              placeholder="Alt text / Description"
                              className="text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="file"
                            id={`file-upload-${idx}`}
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], idx);
                              }
                            }}
                          />
                          <label htmlFor={`file-upload-${idx}`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingFiles[idx]}
                              asChild
                            >
                              <span>
                                {uploadingFiles[idx] ? (
                                  <>Uploading...</>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                          <Input
                            value={img.altText || ''}
                            onChange={(e) => {
                              const newImages = [...newProduct.images];
                              newImages[idx].altText = e.target.value;
                              setNewProduct({ ...newProduct, images: newImages });
                            }}
                            placeholder="Alt text (optional)"
                            className="flex-1"
                          />
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newImages = newProduct.images.filter((_, i) => i !== idx);
                          const newStorageIds = { ...imageStorageIds };
                          delete newStorageIds[idx];
                          setNewProduct({ ...newProduct, images: newImages });
                          setImageStorageIds(newStorageIds);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewProduct({
                      ...newProduct,
                      images: [...newProduct.images, { url: '', altText: '' }],
                    })}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Add Another File
                  </Button>
                </div>

                <div>
                  <Label className="flex items-center mb-3">
                    Product Variants (Sizes, Colors, etc.)
                    <InfoIcon description="Variants are different versions of the same product. For example: Size 9 Black, Size 10 White, etc. Each variant has its own price, quantity in stock, and availability status." />
                  </Label>
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-dashed">
                    <p className="text-xs text-muted-foreground">
                      <strong>Example:</strong> If you're selling a sneaker, create variants like "Size 7 - Black", "Size 8 - Black", "Size 9 - White", etc. Each variant can have different pricing and stock levels.
                    </p>
                  </div>
                  {newProduct.variants.map((variant, idx) => (
                    <Card key={idx} className="mb-3 p-4 border-2">
                      <div className="mb-2">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Variant #{idx + 1}
                        </Label>
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">
                            Variant Name *
                            <InfoIcon description="e.g., 'Size 9 - Black' or 'Size 10 - White'. This identifies the specific variant." />
                          </Label>
                          <Input
                            value={variant.title}
                            onChange={(e) => {
                              const newVariants = [...newProduct.variants];
                              newVariants[idx].title = e.target.value;
                              setNewProduct({ ...newProduct, variants: newVariants });
                              // Clear error when user starts typing
                              if (fieldErrors.variantErrors?.[idx]?.title) {
                                setFieldErrors(prev => {
                                  const newErrors = { ...prev };
                                  if (newErrors.variantErrors?.[idx]) {
                                    newErrors.variantErrors = { ...newErrors.variantErrors };
                                    newErrors.variantErrors[idx] = { ...newErrors.variantErrors[idx], title: false };
                                  }
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="Size 9 - Black"
                            className={cn(
                              "text-sm",
                              fieldErrors.variantErrors?.[idx]?.title ? "border-destructive border-2" : ""
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Size (Optional)
                            <InfoIcon description="Size for this variant (e.g., '9', '10', 'M', 'L'). This helps customers filter by size." />
                          </Label>
                          <Input
                            value={variant.selectedOptions?.find(opt => opt.name === 'Size')?.value || ''}
                            onChange={(e) => {
                              const newVariants = [...newProduct.variants];
                              const existingOptions = newVariants[idx].selectedOptions || [];
                              const otherOptions = existingOptions.filter(opt => opt.name !== 'Size');
                              
                              if (e.target.value.trim()) {
                                newVariants[idx].selectedOptions = [
                                  ...otherOptions,
                                  { name: 'Size', value: e.target.value.trim() }
                                ];
                              } else {
                                newVariants[idx].selectedOptions = otherOptions;
                              }
                              
                              setNewProduct({ ...newProduct, variants: newVariants });
                            }}
                            placeholder="9, 10, M, L..."
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Price (INR) *
                            <InfoIcon description="Price for this specific variant. Can be different from the base product price." />
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.price || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newVariants = [...newProduct.variants];
                              newVariants[idx].price = value === '' ? 0 : parseFloat(value) || 0;
                              setNewProduct({ ...newProduct, variants: newVariants });
                              // Clear error when user starts typing
                              if (fieldErrors.variantErrors?.[idx]?.price) {
                                setFieldErrors(prev => {
                                  const newErrors = { ...prev };
                                  if (newErrors.variantErrors?.[idx]) {
                                    newErrors.variantErrors = { ...newErrors.variantErrors };
                                    newErrors.variantErrors[idx] = { ...newErrors.variantErrors[idx], price: false };
                                  }
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="1299.99"
                            className={cn(
                              "text-sm",
                              fieldErrors.variantErrors?.[idx]?.price ? "border-destructive border-2" : ""
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Stock Quantity *
                            <InfoIcon description="How many units of this variant are in stock. Set to 0 if out of stock." />
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.quantity || 0}
                            onChange={(e) => {
                              const newVariants = [...newProduct.variants];
                              newVariants[idx].quantity = parseInt(e.target.value) || 0;
                              setNewProduct({ ...newProduct, variants: newVariants });
                              // Clear error when user starts typing
                              if (fieldErrors.variantErrors?.[idx]?.quantity) {
                                setFieldErrors(prev => {
                                  const newErrors = { ...prev };
                                  if (newErrors.variantErrors?.[idx]) {
                                    newErrors.variantErrors = { ...newErrors.variantErrors };
                                    newErrors.variantErrors[idx] = { ...newErrors.variantErrors[idx], quantity: false };
                                  }
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="10"
                            className={cn(
                              "text-sm",
                              fieldErrors.variantErrors?.[idx]?.quantity ? "border-destructive border-2" : ""
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Availability *
                            <InfoIcon description="Whether this variant is available for purchase. Set to 'Unavailable' to hide it from customers." />
                          </Label>
                          <Select
                            value={variant.availableForSale ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const newVariants = [...newProduct.variants];
                              newVariants[idx].availableForSale = value === 'true';
                              setNewProduct({ ...newProduct, variants: newVariants });
                            }}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Available</SelectItem>
                              <SelectItem value="false">Unavailable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newVariants = newProduct.variants.filter((_, i) => i !== idx);
                              setNewProduct({ ...newProduct, variants: newVariants });
                            }}
                            className="h-10 w-10"
                            title="Remove this variant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewProduct({
                      ...newProduct,
                      variants: [...newProduct.variants, {
                        id: `variant-${Date.now()}`,
                        title: '',
                        price: newProduct.price,
                        availableForSale: true,
                        quantity: 0,
                      }],
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>

                <div>
                  <Label className="flex items-center">
                    Tags (comma-separated)
                    <InfoIcon description="Searchable tags for better product discoverability" />
                  </Label>
                  <Input
                    value={newProduct.tags.join(', ')}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t),
                    })}
                    placeholder="nike, running, athletic"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct} className="bg-gradient-to-r from-accent to-primary">
                    <Save className="mr-2 h-4 w-4" />
                    Create Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="user-management">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <PackageCheck className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="filters">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {products === undefined || products === null ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : (products || []).length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No products yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {(products || []).map((product) => (
                  <Card key={product._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="font-medium">${product.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">Handle: {product.handle}</span>
                          <span className="text-muted-foreground">Collection: {product.collection}</span>
                          {product.category && (
                            <span className="text-muted-foreground">Category: {product.category}</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">
                            {product.variants.length} variant(s) • {product.images.length} image(s)
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product as Product);
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            {analytics === undefined || analytics === null ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${(analytics?.revenue?.total || 0).toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">Pending: ${(analytics?.revenue?.pending || 0).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.orders?.total || 0}</div>
                      <p className="text-xs text-muted-foreground">{analytics?.orders?.fulfilled || 0} fulfilled</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.users?.total || 0}</div>
                      <p className="text-xs text-muted-foreground">{analytics?.users?.customers || 0} customers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Inventory</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.inventory?.total || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.inventory?.lowStock || 0} low stock
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {!analytics?.topProducts || analytics.topProducts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No sales yet</p>
                      ) : (
                        (analytics.topProducts || []).map((product, idx) => (
                          <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg w-8">{idx + 1}</span>
                              <div>
                                <p className="font-medium">{product.title}</p>
                                <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${product.revenue.toFixed(2)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            {allOrders === undefined || allOrders === null ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : (allOrders || []).length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No orders yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {(allOrders || []).map((order) => (
                  <Card key={order._id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{order.totalPrice.toFixed(2)}</p>
                        <div className="flex gap-2 mt-2">
                          <Select
                            value={order.fulfillmentStatus}
                            onValueChange={async (value) => {
                              try {
                                await updateOrderStatus({
                                  id: order._id,
                                  fulfillmentStatus: value,
                                });
                                toast({ title: "Status updated" });
                              } catch (error: unknown) {
                                const message = sanitizeConvexError(error);
                                toast({
                                  title: "Error",
                                  description: message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={order.financialStatus}
                            onValueChange={async (value) => {
                              try {
                                await updateOrderStatus({
                                  id: order._id,
                                  financialStatus: value,
                                });
                                toast({ title: "Status updated" });
                              } catch (error: unknown) {
                                const message = sanitizeConvexError(error);
                                toast({
                                  title: "Error",
                                  description: message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-muted rounded">
                          <span>{item.title} x{item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Payment Section */}
                    {(() => {
                      const payment = getPaymentByOrderId(order._id);
                      return (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Payment Status
                            </h4>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPaymentOrderId(order._id);
                                    setPaymentAmount(payment?.amountPaid.toString() || "0");
                                    setPaymentNotes(payment?.notes || "");
                                    setPaymentTransactionId(payment?.transactionId || "");
                                  }}
                                >
                                  Update Payment
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Payment - Order #{order.orderNumber}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <div>
                                    <Label>Total Amount</Label>
                                    <p className="text-lg font-bold">₹{order.totalPrice.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label>Amount Paid *</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={paymentAmount}
                                      onChange={(e) => setPaymentAmount(e.target.value)}
                                      placeholder="0.00"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Enter the amount that has been paid
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Transaction ID</Label>
                                    <Input
                                      value={paymentTransactionId}
                                      onChange={(e) => setPaymentTransactionId(e.target.value)}
                                      placeholder="UPI Transaction ID (optional)"
                                    />
                                  </div>
                                  <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                      value={paymentNotes}
                                      onChange={(e) => setPaymentNotes(e.target.value)}
                                      placeholder="Additional notes (optional)"
                                      rows={3}
                                    />
                                  </div>
                                  <Button
                                    onClick={async () => {
                                      if (!payment?._id) {
                                        toast({
                                          title: "Error",
                                          description: "Payment record not found. Payment should be created when order is created.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      try {
                                        await updatePaymentMutation({
                                          paymentId: payment._id,
                                          amountPaid: parseFloat(paymentAmount) || 0,
                                          transactionId: paymentTransactionId || undefined,
                                          notes: paymentNotes || undefined,
                                        });
                                        toast({ title: "Payment updated successfully" });
                                        setSelectedPaymentOrderId(null);
                                        setPaymentAmount("");
                                        setPaymentNotes("");
                                        setPaymentTransactionId("");
                                      } catch (error: unknown) {
                                        const message = sanitizeConvexError(error);
                                        toast({
                                          title: "Error",
                                          description: message,
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="w-full"
                                  >
                                    Update Payment
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {payment ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid:</span>
                                <span className="font-semibold">₹{payment.amountPaid.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Remaining:</span>
                                <span className="font-semibold">
                                  ₹{(payment.amount - payment.amountPaid).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={`font-semibold ${
                                  payment.status === "paid" ? "text-green-600" :
                                  payment.status === "partial" ? "text-orange-600" :
                                  "text-red-600"
                                }`}>
                                  {payment.status.toUpperCase()}
                                </span>
                              </div>
                              {payment.transactionId && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Transaction ID:</span>
                                  <span className="font-mono text-xs">{payment.transactionId}</span>
                                </div>
                              )}
                              {payment.notes && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <strong>Notes:</strong> {payment.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No payment record found. Payment will be created when customer proceeds to checkout.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="user-management" className="mt-6">
            {usersWithStats === undefined || usersWithStats === null ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading user data...</p>
              </div>
            ) : (usersWithStats || []).length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No users yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Email</th>
                            <th className="text-center p-3 font-medium">Purchases</th>
                            <th className="text-center p-3 font-medium">Total Chats</th>
                            <th className="text-center p-3 font-medium">Total Messages</th>
                            <th className="text-center p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(usersWithStats || []).map((user: any) => (
                            <tr key={user._id} className="border-b hover:bg-muted/50">
                              <td className="p-3">
                                <div>
                                  <div className="font-medium">{user.displayName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.role || 'customer'}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{user.email}</td>
                              <td className="p-3 text-center">
                                <span className="font-medium">{user.purchaseCount || 0}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-medium">{user.totalChats || 0}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-medium">{user.totalMessages || 0}</span>
                              </td>
                              <td className="p-3 text-center">
                                {(user.totalChats || 0) > 0 ? (
                                  <Link to={`/admin/users/${user._id}/chats`}>
                                    <Button size="sm" variant="outline">
                                      View Chats
                                    </Button>
                                  </Link>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No chats</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            {allUsers === undefined || allUsers === null ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (allUsers || []).length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No users yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {(allUsers || []).map((user) => (
                  <Card key={user._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{user.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Credits: ${user.creditsBalance.toFixed(2)} | 
                          Earned: ${user.creditsEarned.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={user.role || "customer"}
                          onValueChange={async (value) => {
                            try {
                              await users.update(user._id, {
                                role: value as "customer" | "admin" | "manager",
                              });
                              toast({ title: "Role updated" });
                            } catch (error: unknown) {
                              const message = sanitizeConvexError(error);
                              toast({
                                title: "Error",
                                description: message,
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-6">
            {products === undefined || products === null ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading inventory...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(products || []).map((product) => {
                  const totalQuantity = product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
                  const lowStock = product.variants.some((v) => (v.quantity || 0) < 10);
                  
                  return (
                    <Card key={product._id} className={`p-6 ${lowStock ? 'border-orange-500' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{product.title}</h3>
                            {lowStock && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">Total Stock: {totalQuantity}</p>
                          <div className="space-y-2">
                            {product.variants.map((variant, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                <span>{variant.title}</span>
                                <span className={variant.quantity < 10 ? 'text-orange-500 font-semibold' : ''}>
                                  Qty: {variant.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Filters Tab */}
          <TabsContent value="filters" className="mt-6">
            <div className="space-y-6">
              {filterSettings === undefined || filterSettings === null ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading filters...</p>
                </div>
              ) : (
                <>
                  {(['brand', 'category', 'color', 'size', 'material', 'activity'] as const).map((filterType) => (
                    <Card key={filterType}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="capitalize">{filterType}s</CardTitle>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add {filterType}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add {filterType}</DialogTitle>
                              </DialogHeader>
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  const name = formData.get('name') as string;
                                  const displayName = formData.get('displayName') as string;
                                  
                                  try {
                                    await createFilter({
                                      type: filterType,
                                      name: name.toLowerCase().replace(/\s+/g, '-'),
                                      displayName,
                                    });
                                    toast({ title: `${filterType} added` });
                                    e.currentTarget.reset();
                                  } catch (error: unknown) {
                                    const message = sanitizeConvexError(error);
                                    toast({
                                      title: "Error",
                                      description: message,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="space-y-4 mt-4"
                              >
                                <div>
                                  <Label>Name (internal)</Label>
                                  <Input name="name" required placeholder="nike" />
                                </div>
                                <div>
                                  <Label>Display Name</Label>
                                  <Input name="displayName" required placeholder="Nike" />
                                </div>
                                <Button type="submit">Add</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {filterSettings[filterType]?.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No {filterType}s yet</p>
                          ) : (
                            (filterSettings[filterType] || []).map((filter) => (
                              <div key={filter._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{filter.displayName}</p>
                                  <p className="text-xs text-muted-foreground">{filter.name}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await updateFilter({
                                          id: filter._id,
                                          isActive: !filter.isActive,
                                        });
                                        toast({ title: "Filter updated" });
                                      } catch (error: unknown) {
                                        const message = sanitizeConvexError(error);
                                        toast({
                                          title: "Error",
                                          description: message,
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    {filter.isActive ? 'Disable' : 'Enable'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await deleteFilter({ id: filter._id });
                                        toast({ title: "Filter deleted" });
                                      } catch (error: unknown) {
                                        const message = sanitizeConvexError(error);
                                        toast({
                                          title: "Error",
                                          description: message,
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        {isEditing && editingProduct && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingProduct({ 
                          ...editingProduct, 
                          price: value === '' ? 0 : parseFloat(value) || 0 
                        });
                      }}
                      placeholder="Enter price"
                    />
                  </div>
                  <div>
                    <Label>Category (Optional)</Label>
                    <Input
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      placeholder="e.g., Premium Lifestyle, Athletic Performance, or your own category"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProduct} className="bg-gradient-to-r from-accent to-primary">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
            </div>
            </div>
          </SidebarInset>
        </ResizableAdminLayout>
      </SidebarProvider>
    </AdminProvider>
  );
}




