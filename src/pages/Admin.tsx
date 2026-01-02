import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useConvex } from 'convex/react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Shield, Lock, BarChart3, Users, ShoppingBag, Package, Filter, TrendingUp, DollarSign, PackageCheck, AlertTriangle, Info, Upload, Video, CreditCard, Archive, ArchiveRestore, GripVertical, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { auth, users } from '@/lib/api';
import { AdminChatbot } from '@/components/AdminChatbot';
import { AdminProvider } from '@/contexts/AdminContext';
import { sanitizeConvexError } from '@/lib/errorHandler';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { ResizableAdminLayout } from '@/components/ResizableAdminLayout';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Product = {
  _id?: string;
  title: string;
  description: string;
  handle: string;
  price: number;
  mrp?: number;
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
  archived?: boolean;
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
    variants?: boolean;
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
    api.products.getAllIncludingArchived, 
    isAuthorized === true ? { limit: 100 } : { limit: 0 }
  );
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const archiveProduct = useMutation(api.products.archive);
  
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
  
  // Discounts - Coupon Codes
  const couponCodes = useQuery(
    api.discounts.getAllCoupons,
    isAuthorized === true ? undefined : undefined
  );
  const createCoupon = useMutation(api.discounts.createCoupon);
  const updateCoupon = useMutation(api.discounts.updateCoupon);
  const deleteCoupon = useMutation(api.discounts.deleteCoupon);
  
  // Discounts - Admin Gift Cards
  const adminGiftCards = useQuery(
    api.discounts.getAllAdminGiftCards,
    isAuthorized === true ? undefined : undefined
  );
  const createAdminGiftCard = useMutation(api.discounts.createAdminGiftCard);
  const updateAdminGiftCard = useMutation(api.discounts.updateAdminGiftCard);
  const deleteAdminGiftCard = useMutation(api.discounts.deleteAdminGiftCard);
  
  // State for coupon form
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  
  // Featured Collections
  const featuredCollections = useQuery(
    api.homepage.getFeaturedCollections,
    isAuthorized === true ? undefined : "skip"
  );
  const upsertFeaturedCollection = useMutation(api.homepage.upsertFeaturedCollection);
  const deleteFeaturedCollection = useMutation(api.homepage.deleteFeaturedCollection);
  
  // Hero Marquee
  const heroMarquee = useQuery(
    api.homepage.getHeroMarquee,
    isAuthorized === true ? undefined : "skip"
  );
  const updateHeroMarquee = useMutation(api.homepage.updateHeroMarquee);
  
  // State for featured collection form
  const [editingFeaturedCollection, setEditingFeaturedCollection] = useState<Id<"homepageContent"> | null>(null);
  const [featuredCollectionForm, setFeaturedCollectionForm] = useState({
    title: '',
    subtitle: '',
    collectionHandle: 'mens-collection',
    productIds: [] as string[],
    collectionImage: '',
    linkUrl: '',
    order: 0,
    isActive: true,
  });
  const [uploadingCollectionImage, setUploadingCollectionImage] = useState(false);
  
  // State for marquee images
  const [topRowImages, setTopRowImages] = useState<string[]>([]);
  const [bottomRowImages, setBottomRowImages] = useState<string[]>([]);
  const [uploadingMarqueeImages, setUploadingMarqueeImages] = useState<{ top: boolean; bottom: boolean }>({ top: false, bottom: false });
  const [isMarqueeOpen, setIsMarqueeOpen] = useState(false);
  
  // Load marquee images when data is available
  useEffect(() => {
    if (heroMarquee) {
      const hasTopImages = (heroMarquee.topRowImages || []).length > 0;
      const hasBottomImages = (heroMarquee.bottomRowImages || []).length > 0;
      setTopRowImages(heroMarquee.topRowImages || []);
      setBottomRowImages(heroMarquee.bottomRowImages || []);
      // Collapse by default if images are already saved (closed = false)
      setIsMarqueeOpen(!(hasTopImages || hasBottomImages));
    } else {
      // If no data yet, keep it open
      setIsMarqueeOpen(true);
    }
  }, [heroMarquee]);
  
  // File upload
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [draggedOverImageIndex, setDraggedOverImageIndex] = useState<number | null>(null);
  const [selectedPaymentOrderId, setSelectedPaymentOrderId] = useState<Id<"orders"> | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>("");

  const [newProduct, setNewProduct] = useState<Product>({
    title: '',
    description: '',
    handle: '',
    price: 0,
    mrp: 0,
    currencyCode: 'INR',
    images: [],
    variants: [],
    tags: [],
    collection: 'mens-collection',
    category: '',
  });

  // UK sizes available for selection
  const ukSizes = ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'];

  // Get selected sizes from variants
  const getSelectedSizes = () => {
    return newProduct.variants
      .map(v => v.selectedOptions?.find(opt => opt.name === 'Size')?.value)
      .filter(Boolean) as string[];
  };

  // Generate variants from selected UK sizes
  const updateVariantsFromSizes = (selectedSizes: string[]) => {
    const variants = selectedSizes.map(size => ({
      id: `variant-${Date.now()}-${size}`,
      title: `UK ${size}`,
      price: newProduct.price,
      availableForSale: true,
      quantity: 0,
      selectedOptions: [{ name: 'Size', value: size }],
    }));
    setNewProduct({ ...newProduct, variants });
  };

  // Update variant prices when base price changes
  useEffect(() => {
    if (newProduct.variants.length > 0 && newProduct.price > 0) {
      const needsUpdate = newProduct.variants.some(v => v.price !== newProduct.price);
      if (needsUpdate) {
        const updatedVariants = newProduct.variants.map(variant => ({
          ...variant,
          price: newProduct.price,
        }));
        setNewProduct(prev => ({ ...prev, variants: updatedVariants }));
      }
    }
  }, [newProduct.price]);
  
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
      
      // Update images array using functional update to avoid race conditions
      setNewProduct(prev => {
        const newImages = [...prev.images];
        if (!newImages[index]) {
          newImages[index] = { url: '', altText: '' };
        }
        newImages[index] = { ...newImages[index], url: fileUrl || '' };
        return { ...prev, images: newImages };
      });
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

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Filter to only image and video files
      const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      
      if (validFiles.length > 0) {
        // Create a FileList-like object
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        await handleBulkUpload(dataTransfer.files);
      } else {
        toast({
          title: "Invalid files",
          description: "Please drop only image or video files",
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle image reordering
  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedImageIndex !== null && draggedImageIndex !== index) {
      setDraggedOverImageIndex(index);
    }
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      setDraggedOverImageIndex(null);
      return;
    }

    const newImages = [...newProduct.images];
    const draggedImage = newImages[draggedImageIndex];
    
    // Remove dragged item
    newImages.splice(draggedImageIndex, 1);
    
    // Insert at new position (adjust if dropping after the original position)
    const insertIndex = draggedImageIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newImages.splice(insertIndex, 0, draggedImage);

    // Create array of storage IDs in same order as images before reordering
    const storageIdsArray: (string | undefined)[] = [];
    newProduct.images.forEach((_, idx) => {
      storageIdsArray.push(imageStorageIds[idx]);
    });

    // Reorder storage IDs array the same way
    const draggedStorageId = storageIdsArray[draggedImageIndex];
    storageIdsArray.splice(draggedImageIndex, 1);
    storageIdsArray.splice(insertIndex, 0, draggedStorageId);

    // Rebuild storageIds map
    const finalStorageIds: Record<number, string> = {};
    storageIdsArray.forEach((storageId, idx) => {
      if (storageId) {
        finalStorageIds[idx] = storageId;
      }
    });

    setNewProduct({ ...newProduct, images: newImages });
    setImageStorageIds(finalStorageIds);
    setDraggedImageIndex(null);
    setDraggedOverImageIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    setDraggedOverImageIndex(null);
  };

  // Helper function to get order label
  const getOrderLabel = (index: number) => {
    const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return labels[index] || `${index + 1}th`;
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
      
      // Validate that at least one size is selected
      if (newProduct.variants.length === 0) {
        errors.variants = true;
        setFieldErrors(errors);
        toast({
          title: "Validation Error",
          description: "Please select at least one UK size",
          variant: "destructive",
        });
        return;
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
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
        mrp: newProduct.mrp || undefined,
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
        mrp: 0,
        currencyCode: 'INR',
        images: [],
        variants: [],
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
        mrp: editingProduct.mrp || undefined,
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
      <SidebarProvider defaultOpen={false}>
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

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="flex items-center">
                      Price *
                      <InfoIcon description="Selling price in INR" />
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
                      MRP
                      <InfoIcon description="Maximum Retail Price (for discount calculation)" />
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.mrp || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewProduct({ 
                          ...newProduct, 
                          mrp: value === '' ? 0 : parseFloat(value) || 0 
                        });
                      }}
                      placeholder="199.99"
                    />
                    {newProduct.mrp && newProduct.mrp > newProduct.price && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                        {Math.round(((newProduct.mrp - newProduct.price) / newProduct.mrp) * 100)}% OFF
                      </p>
                    )}
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
                    <InfoIcon description="Upload product images and videos. Supports bulk upload and drag & drop. Files are stored in Convex storage." />
                  </Label>
                  
                  {/* Bulk Upload with Drag & Drop */}
                  <div
                    className={cn(
                      "mb-4 border-2 border-dashed rounded-lg p-6 transition-colors",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
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
                    <label htmlFor="bulk-upload" className="cursor-pointer">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium mb-1">
                          {isDragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Supports images and videos
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Browse Files
                          </span>
                        </Button>
                      </div>
                    </label>
                  </div>
                  
                  {/* Uploaded Files */}
                  {newProduct.images.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {newProduct.images.map((img, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleImageDragStart(idx)}
                          onDragOver={(e) => handleImageDragOver(e, idx)}
                          onDrop={(e) => handleImageDrop(e, idx)}
                          onDragEnd={handleImageDragEnd}
                          className={cn(
                            "flex gap-2 items-center p-2 rounded-lg border transition-colors",
                            draggedImageIndex === idx ? "opacity-50 border-primary" : "",
                            draggedOverImageIndex === idx ? "border-primary bg-primary/5" : "border-border"
                          )}
                        >
                          {/* Drag Handle */}
                          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                            <GripVertical className="h-5 w-5" />
                          </div>

                          {/* Order Indicator */}
                          <div className="flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded">
                            {getOrderLabel(idx)}
                          </div>

                          {img.url ? (
                            <>
                              {img.url.match(/\.(mp4|webm|ogg)$/i) ? (
                                <Video className="h-12 w-12 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <img src={img.url} alt={img.altText} className="h-12 w-12 object-cover rounded flex-shrink-0" />
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
                              <label htmlFor={`file-upload-${idx}`} className="flex-shrink-0">
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
                              const newStorageIds: Record<number, string> = {};
                              Object.keys(imageStorageIds).forEach((key) => {
                                const oldIdx = parseInt(key);
                                if (oldIdx < idx) {
                                  newStorageIds[oldIdx] = imageStorageIds[oldIdx];
                                } else if (oldIdx > idx) {
                                  newStorageIds[oldIdx - 1] = imageStorageIds[oldIdx];
                                }
                              });
                              setNewProduct({ ...newProduct, images: newImages });
                              setImageStorageIds(newStorageIds);
                            }}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
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
                    Select UK Sizes *
                    <InfoIcon description="Select the UK sizes available for this product. Each selected size will be available for purchase." />
                  </Label>
                  <div className={cn(
                    "p-4 border-2 rounded-lg",
                    fieldErrors.variants ? "border-destructive" : "border-border"
                  )}>
                    <div className="flex flex-wrap gap-3">
                      {ukSizes.map((size) => {
                        const isSelected = getSelectedSizes().includes(size);
                        return (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`size-${size}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentSizes = getSelectedSizes();
                                let newSizes: string[];
                                if (checked) {
                                  newSizes = [...currentSizes, size];
                                } else {
                                  newSizes = currentSizes.filter(s => s !== size);
                                }
                                updateVariantsFromSizes(newSizes);
                                if (fieldErrors.variants) {
                                  setFieldErrors(prev => ({ ...prev, variants: false }));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`size-${size}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {size}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    {getSelectedSizes().length > 0 && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Selected: {getSelectedSizes().join(', ')}
                      </p>
                    )}
                  </div>
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

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="discounts">
              <Ticket className="h-4 w-4 mr-2" />
              Discounts
            </TabsTrigger>
            <TabsTrigger value="homepage">
              <ImageIcon className="h-4 w-4 mr-2" />
              Homepage
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
                  <Card key={product._id} className={cn("p-6", product.archived && "opacity-60 border-dashed")}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{product.title}</h3>
                          {product.archived && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Archived</span>
                          )}
                        </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to ${product.archived ? 'unarchive' : 'archive'} "${product.title}"?`)) {
                              try {
                                await archiveProduct({
                                  id: product._id as Id<"products">,
                                  archived: !product.archived,
                                });
                                toast({
                                  title: "Success",
                                  description: `Product ${product.archived ? 'unarchived' : 'archived'} successfully`,
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: sanitizeConvexError(error),
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          {product.archived ? (
                            <>
                              <ArchiveRestore className="h-4 w-4 mr-2" />
                              Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to permanently delete "${product.title}"? This action cannot be undone.`)) {
                              try {
                                await deleteProduct({
                                  id: product._id as Id<"products">,
                                });
                                toast({
                                  title: "Success",
                                  description: "Product deleted successfully",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: sanitizeConvexError(error),
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

          <TabsContent value="discounts" className="mt-6">
            <div className="space-y-6">
              {/* Coupon Codes Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Coupon Codes</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Coupon Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create Coupon Code</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const code = formData.get('code') as string;
                            const discountValue = parseFloat(formData.get('discountValue') as string);
                            const isActive = formData.get('isActive') === 'on';
                            const expiresAtStr = formData.get('expiresAt') as string;
                            const usageLimitStr = formData.get('usageLimit') as string;
                            const minPurchaseStr = formData.get('minPurchase') as string;
                            const description = formData.get('description') as string;
                            
                            try {
                              await createCoupon({
                                code,
                                discountType: couponDiscountType,
                                discountValue,
                                isActive,
                                expiresAt: expiresAtStr ? new Date(expiresAtStr).getTime() : undefined,
                                usageLimit: usageLimitStr ? parseInt(usageLimitStr) : undefined,
                                minPurchaseAmount: minPurchaseStr ? parseFloat(minPurchaseStr) : undefined,
                                description: description || undefined,
                              });
                              toast({ title: "Coupon code created" });
                              e.currentTarget.reset();
                              setCouponDiscountType('percentage');
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
                            <Label>Code *</Label>
                            <Input name="code" required placeholder="SAVE20" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Discount Type *</Label>
                              <Select value={couponDiscountType} onValueChange={(value: 'percentage' | 'fixed') => setCouponDiscountType(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Discount Value *</Label>
                              <Input name="discountValue" type="number" step="0.01" required placeholder="20" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Expires At (Optional)</Label>
                              <Input name="expiresAt" type="datetime-local" />
                            </div>
                            <div>
                              <Label>Usage Limit (Optional)</Label>
                              <Input name="usageLimit" type="number" placeholder="100" />
                            </div>
                          </div>
                          <div>
                            <Label>Minimum Purchase Amount (Optional)</Label>
                            <Input name="minPurchase" type="number" step="0.01" placeholder="500" />
                          </div>
                          <div>
                            <Label>Description (Optional)</Label>
                            <Textarea name="description" placeholder="Enter description" rows={3} />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" name="isActive" defaultChecked className="rounded" />
                            <Label>Active</Label>
                          </div>
                          <Button type="submit">Create Coupon</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {couponCodes === undefined || couponCodes === null ? (
                    <p className="text-muted-foreground text-sm">Loading coupon codes...</p>
                  ) : couponCodes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No coupon codes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {couponCodes.map((coupon) => (
                        <div key={coupon._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-lg">{coupon.code}</p>
                              <Badge variant={coupon.isActive ? "default" : "secondary"}>
                                {coupon.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {coupon.discountType === "percentage" 
                                ? `${coupon.discountValue}% OFF` 
                                : `₹${coupon.discountValue} OFF`}
                            </p>
                            {coupon.description && (
                              <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              {coupon.expiresAt && (
                                <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                              )}
                              {coupon.usageLimit && (
                                <span>Usage: {coupon.usageCount} / {coupon.usageLimit}</span>
                              )}
                              {coupon.minPurchaseAmount && (
                                <span>Min: ₹{coupon.minPurchaseAmount}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateCoupon({
                                    id: coupon._id,
                                    isActive: !coupon.isActive,
                                  });
                                  toast({ title: "Coupon updated" });
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
                              {coupon.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this coupon code?")) {
                                  try {
                                    await deleteCoupon({ id: coupon._id });
                                    toast({ title: "Coupon deleted" });
                                  } catch (error: unknown) {
                                    const message = sanitizeConvexError(error);
                                    toast({
                                      title: "Error",
                                      description: message,
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gift Cards Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Gift Cards</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Gift Card
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create Gift Card</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const code = formData.get('code') as string;
                            const amount = parseFloat(formData.get('amount') as string);
                            const isActive = formData.get('isActive') === 'on';
                            const expiresAtStr = formData.get('expiresAt') as string;
                            const usageLimitStr = formData.get('usageLimit') as string;
                            const minPurchaseStr = formData.get('minPurchase') as string;
                            const description = formData.get('description') as string;
                            
                            try {
                              await createAdminGiftCard({
                                code,
                                amount,
                                isActive,
                                expiresAt: expiresAtStr ? new Date(expiresAtStr).getTime() : undefined,
                                usageLimit: usageLimitStr ? parseInt(usageLimitStr) : undefined,
                                minPurchaseAmount: minPurchaseStr ? parseFloat(minPurchaseStr) : undefined,
                                description: description || undefined,
                              });
                              toast({ title: "Gift card created" });
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
                            <Label>Code *</Label>
                            <Input name="code" required placeholder="GIFT100" />
                          </div>
                          <div>
                            <Label>Amount (₹) *</Label>
                            <Input name="amount" type="number" step="0.01" required placeholder="500" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Expires At (Optional)</Label>
                              <Input name="expiresAt" type="datetime-local" />
                            </div>
                            <div>
                              <Label>Usage Limit (Optional)</Label>
                              <Input name="usageLimit" type="number" placeholder="1" />
                            </div>
                          </div>
                          <div>
                            <Label>Minimum Purchase Amount (Optional)</Label>
                            <Input name="minPurchase" type="number" step="0.01" placeholder="1000" />
                          </div>
                          <div>
                            <Label>Description (Optional)</Label>
                            <Textarea name="description" placeholder="Enter description" rows={3} />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" name="isActive" defaultChecked className="rounded" />
                            <Label>Active</Label>
                          </div>
                          <Button type="submit">Create Gift Card</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {adminGiftCards === undefined || adminGiftCards === null ? (
                    <p className="text-muted-foreground text-sm">Loading gift cards...</p>
                  ) : adminGiftCards.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No gift cards yet</p>
                  ) : (
                    <div className="space-y-2">
                      {adminGiftCards.map((giftCard) => (
                        <div key={giftCard._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-lg">{giftCard.code}</p>
                              <Badge variant={giftCard.isActive ? "default" : "secondary"}>
                                {giftCard.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Value: ₹{giftCard.amount}
                            </p>
                            {giftCard.description && (
                              <p className="text-xs text-muted-foreground mt-1">{giftCard.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              {giftCard.expiresAt && (
                                <span>Expires: {new Date(giftCard.expiresAt).toLocaleDateString()}</span>
                              )}
                              {giftCard.usageLimit && (
                                <span>Usage: {giftCard.usageCount} / {giftCard.usageLimit}</span>
                              )}
                              {giftCard.minPurchaseAmount && (
                                <span>Min: ₹{giftCard.minPurchaseAmount}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateAdminGiftCard({
                                    id: giftCard._id,
                                    isActive: !giftCard.isActive,
                                  });
                                  toast({ title: "Gift card updated" });
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
                              {giftCard.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this gift card?")) {
                                  try {
                                    await deleteAdminGiftCard({ id: giftCard._id });
                                    toast({ title: "Gift card deleted" });
                                  } catch (error: unknown) {
                                    const message = sanitizeConvexError(error);
                                    toast({
                                      title: "Error",
                                      description: message,
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Homepage Tab - Featured Collections */}
          <TabsContent value="homepage" className="mt-6">
            <div className="space-y-6">
              {/* Hero Marquee Management */}
              <Card>
                <Collapsible open={isMarqueeOpen} onOpenChange={setIsMarqueeOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Hero Marquee Images</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            Upload images for the horizontal marquees above and below the hero text
                          </p>
                        </div>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          isMarqueeOpen && "transform rotate-180"
                        )} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                  {/* Top Row */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Top Row Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {topRowImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Top row ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = topRowImages.filter((_, i) => i !== index);
                              setTopRowImages(newImages);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            
                            setUploadingMarqueeImages(prev => ({ ...prev, top: true }));
                            try {
                              const newImageUrls: string[] = [];
                              
                              for (const file of files) {
                                const uploadUrl = await generateUploadUrl();
                                const result = await fetch(uploadUrl, {
                                  method: "POST",
                                  headers: { "Content-Type": file.type },
                                  body: file,
                                });
                                
                                const storageIdText = await result.text();
                                let storageId: string;
                                try {
                                  const parsed = JSON.parse(storageIdText);
                                  storageId = parsed.storageId || storageIdText;
                                } catch {
                                  storageId = storageIdText;
                                }
                                
                                const fileUrl = await convex.query(api.files.getFileUrl, { storageId: storageId as Id<"_storage"> });
                                newImageUrls.push(fileUrl);
                              }
                              
                              setTopRowImages(prev => [...prev, ...newImageUrls]);
                            } catch (error) {
                              toast({
                                title: "Upload Error",
                                description: sanitizeConvexError(error),
                                variant: "destructive",
                              });
                            } finally {
                              setUploadingMarqueeImages(prev => ({ ...prev, top: false }));
                            }
                          }}
                        />
                        {uploadingMarqueeImages.top ? (
                          <div className="text-sm text-muted-foreground">Uploading...</div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">Add Images</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  {/* Bottom Row */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Bottom Row Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {bottomRowImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Bottom row ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = bottomRowImages.filter((_, i) => i !== index);
                              setBottomRowImages(newImages);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            
                            setUploadingMarqueeImages(prev => ({ ...prev, bottom: true }));
                            try {
                              const newImageUrls: string[] = [];
                              
                              for (const file of files) {
                                const uploadUrl = await generateUploadUrl();
                                const result = await fetch(uploadUrl, {
                                  method: "POST",
                                  headers: { "Content-Type": file.type },
                                  body: file,
                                });
                                
                                const storageIdText = await result.text();
                                let storageId: string;
                                try {
                                  const parsed = JSON.parse(storageIdText);
                                  storageId = parsed.storageId || storageIdText;
                                } catch {
                                  storageId = storageIdText;
                                }
                                
                                const fileUrl = await convex.query(api.files.getFileUrl, { storageId: storageId as Id<"_storage"> });
                                newImageUrls.push(fileUrl);
                              }
                              
                              setBottomRowImages(prev => [...prev, ...newImageUrls]);
                            } catch (error) {
                              toast({
                                title: "Upload Error",
                                description: sanitizeConvexError(error),
                                variant: "destructive",
                              });
                            } finally {
                              setUploadingMarqueeImages(prev => ({ ...prev, bottom: false }));
                            }
                          }}
                        />
                        {uploadingMarqueeImages.bottom ? (
                          <div className="text-sm text-muted-foreground">Uploading...</div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">Add Images</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  <Button
                    onClick={async () => {
                      try {
                        await updateHeroMarquee({
                          topRowImages,
                          bottomRowImages,
                        });
                        toast({ title: "Marquee images saved successfully" });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: sanitizeConvexError(error),
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Marquee Images
                  </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Featured Collections</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          disabled={featuredCollections && featuredCollections.length >= 2}
                          onClick={() => {
                            setEditingFeaturedCollection(null);
                            setFeaturedCollectionForm({
                              title: '',
                              subtitle: '',
                              collectionHandle: 'mens-collection',
                              productIds: [],
                              collectionImage: '',
                              linkUrl: '',
                              order: featuredCollections?.length || 0,
                              isActive: true,
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Collection
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingFeaturedCollection ? 'Edit' : 'Add'} Featured Collection
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Title *</Label>
                            <Input
                              value={featuredCollectionForm.title}
                              onChange={(e) => setFeaturedCollectionForm({ ...featuredCollectionForm, title: e.target.value })}
                              placeholder="e.g., Men's Collection"
                            />
                          </div>
                          <div>
                            <Label>Subtitle</Label>
                            <Input
                              value={featuredCollectionForm.subtitle}
                              onChange={(e) => setFeaturedCollectionForm({ ...featuredCollectionForm, subtitle: e.target.value })}
                              placeholder="e.g., Unleash your potential with performance-driven designs"
                            />
                          </div>
                          <div>
                            <Label>Collection *</Label>
                            <Select
                              value={featuredCollectionForm.collectionHandle}
                              onValueChange={(value) => setFeaturedCollectionForm({ ...featuredCollectionForm, collectionHandle: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a collection" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mens-collection">Men's Collection</SelectItem>
                                <SelectItem value="womens-collection">Women's Collection</SelectItem>
                                <SelectItem value="kids-collection">Kids' Collection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Collection Image *</Label>
                            {featuredCollectionForm.collectionImage ? (
                              <div className="relative group mb-2">
                                <img
                                  src={featuredCollectionForm.collectionImage}
                                  alt="Collection"
                                  className="w-full h-48 object-cover rounded-lg border"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setFeaturedCollectionForm({ ...featuredCollectionForm, collectionImage: '' })}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    setUploadingCollectionImage(true);
                                    try {
                                      const uploadUrl = await generateUploadUrl();
                                      const result = await fetch(uploadUrl, {
                                        method: "POST",
                                        headers: { "Content-Type": file.type },
                                        body: file,
                                      });
                                      
                                      const storageIdText = await result.text();
                                      let storageId: string;
                                      try {
                                        const parsed = JSON.parse(storageIdText);
                                        storageId = parsed.storageId || storageIdText;
                                      } catch {
                                        storageId = storageIdText;
                                      }
                                      
                                      const fileUrl = await convex.query(api.files.getFileUrl, { storageId: storageId as Id<"_storage"> });
                                      setFeaturedCollectionForm({ ...featuredCollectionForm, collectionImage: fileUrl });
                                    } catch (error) {
                                      toast({
                                        title: "Upload Error",
                                        description: sanitizeConvexError(error),
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setUploadingCollectionImage(false);
                                    }
                                  }}
                                />
                                {uploadingCollectionImage ? (
                                  <div className="text-sm text-muted-foreground">Uploading...</div>
                                ) : (
                                  <div className="text-center">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <div className="text-sm text-muted-foreground">Upload Image</div>
                                  </div>
                                )}
                              </label>
                            )}
                          </div>
                          <div>
                            <Label>Select Products (Max 3) *</Label>
                            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                              {products && products.length > 0 ? (
                                <div className="space-y-2">
                                  {products
                                    .filter(p => p.collection === featuredCollectionForm.collectionHandle)
                                    .map((product) => {
                                      const isSelected = featuredCollectionForm.productIds.includes(product._id!);
                                      return (
                                        <div key={product._id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`product-${product._id}`}
                                            checked={isSelected}
                                            disabled={!isSelected && featuredCollectionForm.productIds.length >= 3}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                if (featuredCollectionForm.productIds.length < 3) {
                                                  setFeaturedCollectionForm({
                                                    ...featuredCollectionForm,
                                                    productIds: [...featuredCollectionForm.productIds, product._id!],
                                                  });
                                                }
                                              } else {
                                                setFeaturedCollectionForm({
                                                  ...featuredCollectionForm,
                                                  productIds: featuredCollectionForm.productIds.filter(id => id !== product._id),
                                                });
                                              }
                                            }}
                                          />
                                          <Label
                                            htmlFor={`product-${product._id}`}
                                            className="text-sm cursor-pointer flex-1"
                                          >
                                            {product.title}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  {products.filter(p => p.collection === featuredCollectionForm.collectionHandle).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No products in this collection yet</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Loading products...</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Selected: {featuredCollectionForm.productIds.length} / 3
                            </p>
                          </div>
                          <div>
                            <Label>Link URL</Label>
                            <Input
                              value={featuredCollectionForm.linkUrl}
                              onChange={(e) => setFeaturedCollectionForm({ ...featuredCollectionForm, linkUrl: e.target.value })}
                              placeholder="/men, /women, /kids"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Where the "Explore Collection" button should link to (optional)
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isActive"
                              checked={featuredCollectionForm.isActive}
                              onCheckedChange={(checked) => setFeaturedCollectionForm({ ...featuredCollectionForm, isActive: checked as boolean })}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Active (show on homepage)</Label>
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingFeaturedCollection(null);
                                setFeaturedCollectionForm({
                                  title: '',
                                  subtitle: '',
                                  collectionHandle: 'mens-collection',
                                  productIds: [],
                                  collectionImage: '',
                                  linkUrl: '',
                                  order: 0,
                                  isActive: true,
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={async () => {
                                if (!featuredCollectionForm.title || !featuredCollectionForm.collectionHandle || !featuredCollectionForm.collectionImage) {
                                  toast({
                                    title: "Validation Error",
                                    description: "Please fill in all required fields (Title, Collection, Image)",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                if (featuredCollectionForm.productIds.length === 0 || featuredCollectionForm.productIds.length > 3) {
                                  toast({
                                    title: "Validation Error",
                                    description: "Please select 1-3 products",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                try {
                                  // Convert productIds to productHandles for backend compatibility
                                  const selectedProducts = products?.filter(p => featuredCollectionForm.productIds.includes(p._id!)) || [];
                                  const productHandles = selectedProducts.map(p => p.handle);
                                  
                                  await upsertFeaturedCollection({
                                    id: editingFeaturedCollection || undefined,
                                    title: featuredCollectionForm.title,
                                    subtitle: featuredCollectionForm.subtitle,
                                    collectionHandle: featuredCollectionForm.collectionHandle,
                                    productHandles: productHandles,
                                    collectionImage: featuredCollectionForm.collectionImage,
                                    linkUrl: featuredCollectionForm.linkUrl,
                                    order: featuredCollectionForm.order,
                                    isActive: featuredCollectionForm.isActive,
                                  });
                                  toast({ title: "Featured collection saved successfully" });
                                  setEditingFeaturedCollection(null);
                                  setFeaturedCollectionForm({
                                    title: '',
                                    subtitle: '',
                                    collectionHandle: 'mens-collection',
                                    productIds: [],
                                    collectionImage: '',
                                    linkUrl: '',
                                    order: 0,
                                    isActive: true,
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: sanitizeConvexError(error),
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {featuredCollections === undefined || featuredCollections === null ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Loading featured collections...</p>
                    </div>
                  ) : featuredCollections.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No featured collections yet</p>
                      <p className="text-sm text-muted-foreground">
                        Add up to 2 collections to display on the homepage (max 3 products per collection)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {featuredCollections.map((collection) => (
                        <div key={collection.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{collection.title}</h3>
                                {!collection.isActive && (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                                <Badge variant="outline">Order: {collection.order}</Badge>
                              </div>
                              {collection.subtitle && (
                                <p className="text-sm text-muted-foreground mb-2">{collection.subtitle}</p>
                              )}
                              <div className="text-sm space-y-1">
                                <p><strong>Collection:</strong> {
                                  collection.collectionHandle === 'mens-collection' ? "Men's Collection" :
                                  collection.collectionHandle === 'womens-collection' ? "Women's Collection" :
                                  collection.collectionHandle === 'kids-collection' ? "Kids' Collection" :
                                  collection.collectionHandle
                                }</p>
                                <p><strong>Products:</strong> {
                                  collection.productHandles.length > 0 
                                    ? products
                                        ?.filter(p => collection.productHandles.includes(p.handle))
                                        .map(p => p.title)
                                        .join(', ') || collection.productHandles.join(', ')
                                    : 'No products selected'
                                }</p>
                                {collection.linkUrl && (
                                  <p><strong>Link:</strong> {collection.linkUrl}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const fullCollection = featuredCollections.find(c => c.id === collection.id);
                                  if (fullCollection) {
                                    // Convert productHandles to productIds
                                    const productIds = products
                                      ?.filter(p => fullCollection.productHandles.includes(p.handle))
                                      .map(p => p._id!)
                                      || [];
                                    
                                    setEditingFeaturedCollection(collection.id);
                                    setFeaturedCollectionForm({
                                      title: fullCollection.title,
                                      subtitle: fullCollection.subtitle || '',
                                      collectionHandle: fullCollection.collectionHandle,
                                      productIds: productIds,
                                      collectionImage: fullCollection.collectionImage,
                                      linkUrl: fullCollection.linkUrl || '',
                                      order: fullCollection.order,
                                      isActive: fullCollection.isActive ?? true,
                                    });
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this featured collection?')) {
                                    try {
                                      await deleteFeaturedCollection({ id: collection.id });
                                      toast({ title: "Featured collection deleted" });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: sanitizeConvexError(error),
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                <div className="grid grid-cols-3 gap-4">
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
                    <Label>MRP</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.mrp || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingProduct({ 
                          ...editingProduct, 
                          mrp: value === '' ? 0 : parseFloat(value) || 0 
                        });
                      }}
                      placeholder="Enter MRP"
                    />
                    {editingProduct.mrp && editingProduct.mrp > editingProduct.price && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                        {Math.round(((editingProduct.mrp - editingProduct.price) / editingProduct.mrp) * 100)}% OFF
                      </p>
                    )}
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




