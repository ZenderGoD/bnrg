// Compatibility layer that mimics the old `shopify.ts` API but is implemented
// on top of Convex and simple local state. No real Shopify calls are made.

import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Product, User } from "./api";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

// ---- Types ----

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  mrp?: number;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        id: string;
        url: string;
        altText: string | null;
        locked?: boolean;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        image?: {
          url: string;
          altText?: string;
        };
      };
    }>;
  };
  tags: string[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
    };
    image?: {
      url: string;
      altText?: string;
    };
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  mrp?: number; // Maximum Retail Price for discount display
}

export interface Cart {
  id: string;
  lines: {
    edges: Array<{
      node: CartLine;
    }>;
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  checkoutUrl?: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ShopifyOrder {
  id: string;
  orderNumber: number;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  processedAt: string;
  fulfillmentStatus: string;
  financialStatus: string;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          id: string;
          title: string;
          image?: {
            url: string;
            altText?: string;
          };
        };
      };
    }>;
  };
}

// ---- In-memory cart helpers (no real backend yet) ----

const CART_STORAGE_KEY = "2xy_local_cart";

function loadCart(cartId?: string): Cart | null {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cart;
    if (cartId && parsed.id !== cartId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCart(cart: Cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function recalcCart(cart: Cart): Cart {
  if (cart.lines.edges.length === 0) {
    cart.cost.subtotalAmount.amount = "0.00";
    cart.cost.totalAmount.amount = "0.00";
    cart.cost.subtotalAmount.currencyCode = "INR";
    cart.cost.totalAmount.currencyCode = "INR";
    return cart;
  }

  // Always use INR for currency
  const subtotal = cart.lines.edges.reduce((sum, edge) => {
    const line = edge.node;
    const lineTotal = parseFloat(line.cost.totalAmount.amount);
    return sum + lineTotal;
  }, 0);

  cart.cost.subtotalAmount.amount = subtotal.toFixed(2);
  cart.cost.subtotalAmount.currencyCode = "INR";
  cart.cost.totalAmount.amount = subtotal.toFixed(2);
  cart.cost.totalAmount.currencyCode = "INR";
  return cart;
}

export async function createCart(): Promise<Cart> {
  const existing = loadCart();
  if (existing) return existing;

  const cart: Cart = {
    id: `local-cart-${Date.now()}`,
    lines: { edges: [] },
    cost: {
      totalAmount: { amount: "0.00", currencyCode: "INR" },
      subtotalAmount: { amount: "0.00", currencyCode: "INR" },
    },
    checkoutUrl: "/checkout",
  };
  saveCart(cart);
  return cart;
}

export async function getCart(cartId: string): Promise<Cart> {
  const cart = loadCart(cartId);
  if (!cart) {
    return createCart();
  }
  return cart;
}

// Helper to find product by variantId
async function findProductByVariantId(variantId: string): Promise<{ product: ShopifyProduct; variant: ShopifyProduct['variants']['edges'][number]['node'] } | null> {
  try {
    // Get all articles and find the one containing this variant
    const products = await getAllProducts(100);
    for (const product of products) {
      const variant = product.variants.edges.find(edge => edge.node.id === variantId);
      if (variant) {
        return { product, variant: variant.node };
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding product by variantId:', error);
    return null;
  }
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  const cart = (await getCart(cartId)) as Cart;
  
  // Find product and variant data
  const productData = await findProductByVariantId(variantId);
  if (!productData) {
    throw new Error(`Product not found for variant ${variantId}`);
  }
  
  const { product, variant } = productData;
  const price = parseFloat(variant.price.amount);
  const currencyCode = "INR"; // Always use INR
  const productImage = product.images.edges[0]?.node;
  const variantImage = variant.image;
  const mrp = product.mrp; // Get MRP from product

  const existingEdge = cart.lines.edges.find(
    (edge) => edge.node.merchandise.id === variantId,
  );

  if (existingEdge) {
    existingEdge.node.quantity += quantity;
    existingEdge.node.cost.totalAmount.amount = (
      existingEdge.node.quantity * price
    ).toFixed(2);
    existingEdge.node.cost.totalAmount.currencyCode = "INR";
    // Update MRP if available
    if (mrp !== undefined) {
      existingEdge.node.mrp = mrp;
    }
  } else {
    const line: CartLine = {
      id: `line-${Date.now()}`,
      quantity,
      merchandise: {
        id: variantId,
        title: variant.title,
        product: {
          title: product.title,
          handle: product.handle,
        },
        image: variantImage ? {
          url: variantImage.url,
          altText: variantImage.altText || product.title,
        } : productImage ? {
          url: productImage.url,
          altText: productImage.altText || product.title,
        } : undefined,
      },
      cost: {
        totalAmount: {
          amount: (quantity * price).toFixed(2),
          currencyCode: "INR",
        },
      },
      mrp: mrp, // Include MRP in cart line
    };
    cart.lines.edges.push({ node: line });
  }

  const updated = recalcCart(cart);
  saveCart(updated);
  return updated;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart> {
  const cart = (await getCart(cartId)) as Cart;

  const edge = cart.lines.edges.find((e) => e.node.id === lineId);
  if (!edge) return cart;

  if (quantity <= 0) {
    cart.lines.edges = cart.lines.edges.filter((e) => e.node.id !== lineId);
  } else {
    // Get price per item from existing cost
    const pricePerItem = parseFloat(edge.node.cost.totalAmount.amount) / edge.node.quantity;
    edge.node.quantity = quantity;
    edge.node.cost.totalAmount.amount = (quantity * pricePerItem).toFixed(2);
  }

  const updated = recalcCart(cart);
  saveCart(updated);
  return updated;
}

export async function removeFromCart(cartId: string, lineId: string): Promise<Cart> {
  const cart = (await getCart(cartId)) as Cart;
  cart.lines.edges = cart.lines.edges.filter((e) => e.node.id !== lineId);
  const updated = recalcCart(cart);
  saveCart(updated);
  return updated;
}

// ---- Product helpers backed by Convex ----

function mapConvexProduct(p: Product): ShopifyProduct {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    handle: p.handle,
    mrp: p.mrp, // Add MRP if available
    priceRange: {
      minVariantPrice: {
        amount: p.price.toFixed(2),
        currencyCode: p.currencyCode || "INR",
      },
    },
    images: {
      edges: (p.images || []).map((img, idx) => ({
        node: {
          id: `${p._id}-img-${idx}`,
          url: img.url,
          altText: img.altText ?? null,
          locked: img.locked || false,
        },
      })),
    },
    variants: {
      edges: (p.variants || []).map((v) => ({
        node: {
          id: v.id,
          title: v.title,
          price: {
            amount: v.price.toFixed(2),
            currencyCode: p.currencyCode || "INR",
          },
          availableForSale: v.availableForSale,
          image: v.image,
        },
      })),
    },
    tags: p.tags || [],
  };
}

export async function getAllProducts(first = 20): Promise<ShopifyProduct[]> {
  try {
    const list = await convex.query(api.products.getAll, { limit: first });
    return (list || []).map(mapConvexProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductsByCollection(
  handle: string,
  first = 20,
): Promise<ShopifyProduct[]> {
  try {
    const list = await convex.query(api.products.getAll, { limit: first, collection: handle });
    return (list || []).map(mapConvexProduct);
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return [];
  }
}

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  try {
    const p = await convex.query(api.products.getByHandle, { handle });
    return p ? mapConvexProduct(p) : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProductById(id: string): Promise<ShopifyProduct | null> {
  try {
    const p = await convex.query(api.products.getById, { id: id as Id<"products"> });
    return p ? mapConvexProduct(p) : null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

export async function searchProducts(
  searchTerm: string,
  first = 20,
): Promise<ShopifyProduct[]> {
  try {
    const list = await convex.query(api.products.search, { query: searchTerm, limit: first });
    return (list || []).map(mapConvexProduct);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// ---- Customer helpers backed by Convex ----

export function isCustomerLoggedIn(): boolean {
  return !!localStorage.getItem("user_id");
}

export function customerLogout(): void {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_token");
  localStorage.removeItem("customer_data");
}

export function getCustomerToken(): { accessToken: string } | null {
  const userId = localStorage.getItem("user_id");
  if (!userId) return null;
  return { accessToken: userId };
}

export async function getCustomer(accessToken: string): Promise<ShopifyCustomer | null> {
  try {
    const user = await convex.query(api.users.getById, { id: accessToken as Id<"users"> });
    if (!user) return null;

    return {
      id: accessToken,
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      displayName: user.displayName ?? "",
      phone: user.phone,
      acceptsMarketing: !!user.acceptsMarketing,
      createdAt: new Date(user.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(user.updatedAt || Date.now()).toISOString(),
      tags: [],
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

// Check if current user can view locked content
export async function canViewLockedContent(): Promise<boolean> {
  if (!isCustomerLoggedIn()) return false;
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;
    const user = await convex.query(api.users.getById, { id: userId as Id<"users"> });
    return user?.isApproved === true;
  } catch (error) {
    console.error('Error checking approval status:', error);
    return false;
  }
}

export async function getCustomerOrders(
  accessToken: string,
  first = 10,
): Promise<ShopifyOrder[]> {
  try {
    const list = await convex.query(api.orders.getByUserId, { userId: accessToken as Id<"users"> }) as ConvexOrder[] | null | undefined;

    return (list || []).slice(0, first).map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      totalPrice: {
        amount: o.totalPrice.toFixed(2),
        currencyCode: o.currencyCode || "INR",
      },
      processedAt: new Date(o.createdAt || Date.now()).toISOString(),
      fulfillmentStatus: o.fulfillmentStatus || "unfulfilled",
      financialStatus: o.financialStatus || "pending",
      lineItems: {
        edges: (o.items || []).map((item) => ({
          node: {
            title: item.title,
            quantity: item.quantity,
            variant: {
              id: item.variantId,
              title: item.title,
              image: item.image
                ? {
                    url: item.image,
                    altText: item.title,
                  }
                : undefined,
            },
          },
        })),
      },
    }));
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
}


