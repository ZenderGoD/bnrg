import React, { createContext, useContext, useState, useCallback } from 'react';

interface Product {
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
}

interface AdminContextType {
  productFormData: Partial<Product>;
  updateProductFormData: (data: Partial<Product>) => void;
  openAddDialog: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ 
  children, 
  onUpdateProduct,
  onOpenDialog 
}: { 
  children: React.ReactNode; 
  onUpdateProduct?: (data: Partial<Product>) => void;
  onOpenDialog?: () => void;
}) {
  const [productFormData, setProductFormData] = useState<Partial<Product>>({});

  const updateProductFormData = useCallback((data: Partial<Product>) => {
    setProductFormData(prev => {
      const updated = {
        ...prev,
        ...data,
        // Merge arrays properly
        tags: data.tags !== undefined ? data.tags : prev.tags,
        images: data.images !== undefined ? data.images : prev.images,
        variants: data.variants !== undefined ? data.variants : prev.variants,
      };
      // Also call the callback to update parent state
      onUpdateProduct?.(updated);
      return updated;
    });
  }, [onUpdateProduct]);

  const openAddDialog = useCallback(() => {
    onOpenDialog?.();
  }, [onOpenDialog]);

  return (
    <AdminContext.Provider
      value={{
        productFormData,
        updateProductFormData,
        openAddDialog,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

