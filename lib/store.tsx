"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { seedState } from "@/lib/mock-data";
import {
  AppState,
  CartItem,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ThemeMode,
} from "@/lib/types";
import { makeOrderNumber, slugify } from "@/lib/utils";

const SESSION_KEYS = {
  theme: "golden-store-theme-v1",
  cart: "golden-store-cart-v1",
  adminSession: "golden-store-admin-v1",
};
const ADMIN_EMAIL = "admin@goldenstore.id";
const ADMIN_PASSWORD = "Golden123!";

export interface ProductDraft {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  tags: string[];
  rating: number;
  reviewsCount: number;
}

export interface CategoryDraft {
  name: string;
  description: string;
  isActive: boolean;
}

export interface PaymentMethodDraft {
  type: "COD" | "DANA" | "BANK";
  label: string;
  details: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  mapsLink: string;
  notes: string;
  paymentMethodId: string;
  paymentProofUrl?: string;
}

interface StoreContextValue extends AppState {
  hydrated: boolean;
  toggleTheme: () => void;
  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (payload: CheckoutPayload) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  createProduct: (draft: ProductDraft) => void;
  updateProduct: (productId: string, draft: ProductDraft) => void;
  deleteProduct: (productId: string) => void;
  createCategory: (draft: CategoryDraft) => void;
  updateCategory: (categoryId: string, draft: CategoryDraft) => void;
  deleteCategory: (categoryId: string) => void;
  createPaymentMethod: (draft: PaymentMethodDraft) => void;
  updatePaymentMethod: (paymentMethodId: string, draft: PaymentMethodDraft) => void;
  deletePaymentMethod: (paymentMethodId: string) => void;
  setTheme: (theme: ThemeMode) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

type SessionStorageState = Pick<AppState, "theme" | "cart" | "adminSession">;

async function fetchBootstrapState() {
  const response = await fetch("/api/bootstrap", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load bootstrap state");
  }

  return (await response.json()) as Pick<AppState, "categories" | "paymentMethods" | "products" | "orders">;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bootstrapState, storedTheme, storedCart, storedAdmin] = await Promise.all([
          fetchBootstrapState(),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.theme)),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.cart)),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.adminSession)),
        ]);

        const sessionState: SessionStorageState = {
          theme: (storedTheme as ThemeMode | null) ?? seedState.theme,
          cart: storedCart ? (JSON.parse(storedCart) as CartItem[]) : seedState.cart,
          adminSession: storedAdmin ? (JSON.parse(storedAdmin) as AppState["adminSession"]) : seedState.adminSession,
        };

        setState({
          ...seedState,
          ...bootstrapState,
          ...sessionState,
        });
      } catch {
        setState(seedState);
      } finally {
        setHydrated(true);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(SESSION_KEYS.theme, state.theme);
    window.localStorage.setItem(SESSION_KEYS.cart, JSON.stringify(state.cart));
    if (state.adminSession) {
      window.localStorage.setItem(SESSION_KEYS.adminSession, JSON.stringify(state.adminSession));
    } else {
      window.localStorage.removeItem(SESSION_KEYS.adminSession);
    }
    document.documentElement.dataset.theme = state.theme;
  }, [hydrated, state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const toggleTheme = () => {
    setState((current) => ({
      ...current,
      theme: current.theme === "dark" ? "light" : "dark",
    }));
  };

  const setTheme = (theme: ThemeMode) => {
    setState((current) => ({
      ...current,
      theme,
    }));
  };

  const refreshCollections = async () => {
    try {
      const bootstrapState = await fetchBootstrapState();
      setState((current) => ({
        ...current,
        ...bootstrapState,
      }));
    } catch {
      // Keep optimistic state if refresh fails.
    }
  };

  const loginAdmin = (email: string, password: string) => {
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return false;
    }

    setState((current) => ({
      ...current,
      adminSession: {
        email: ADMIN_EMAIL,
        name: "Admin Golden Store",
      },
    }));

    return true;
  };

  const logoutAdmin = () => {
    setState((current) => ({
      ...current,
      adminSession: null,
    }));
  };

  const addToCart = (productId: string, quantity = 1) => {
    setState((current) => {
      const product = current.products.find((item) => item.id === productId);
      if (!product || !product.isActive || product.stock <= 0) {
        return current;
      }

      const existing = current.cart.find((item) => item.productId === productId);
      const nextCart = existing
        ? current.cart.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + quantity, product.stock),
                }
              : item,
          )
        : [
            {
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              quantity: Math.min(quantity, product.stock),
              image: product.images[0] ?? "",
              stock: product.stock,
            },
            ...current.cart,
          ];

      return {
        ...current,
        cart: nextCart,
      };
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setState((current) => {
      const product = current.products.find((item) => item.id === productId);
      if (!product) {
        return current;
      }

      if (quantity <= 0) {
        return {
          ...current,
          cart: current.cart.filter((item) => item.productId !== productId),
        };
      }

      return {
        ...current,
        cart: current.cart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.min(quantity, product.stock),
              }
            : item,
        ),
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setState((current) => ({
      ...current,
      cart: current.cart.filter((item) => item.productId !== productId),
    }));
  };

  const clearCart = () => {
    setState((current) => ({
      ...current,
      cart: [],
    }));
  };

  const createOrder = (payload: CheckoutPayload) => {
    const paymentMethod = state.paymentMethods.find((method) => method.id === payload.paymentMethodId);
    if (!paymentMethod) {
      return null;
    }

    if (state.cart.length === 0) {
      return null;
    }

    const items: OrderItem[] = state.cart.map((item) => ({
      productId: item.productId,
      productName: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      image: item.image,
    }));

    const shippingFee = 25000;
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalAmount = subtotal + shippingFee;
    const nextOrderNumber = makeOrderNumber(state.orders.length + 1);
    const createdAt = new Date().toISOString();
    const order: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerAddress: payload.customerAddress,
      mapsLink: payload.mapsLink,
      notes: payload.notes,
      status: "PENDING",
      paymentStatus: paymentMethod.type === "COD" ? "UNPAID" : "PAID",
      paymentMethodId: paymentMethod.id,
      paymentProofUrl: payload.paymentProofUrl,
      totalAmount,
      shippingFee,
      adminNote: "",
      items,
      createdAt,
    };

    setState((current) => ({
      ...current,
      orders: [order, ...current.orders],
      cart: [],
      products: current.products.map((product) => {
        const match = current.cart.find((item) => item.productId === product.id);
        if (!match) {
          return product;
        }
        return {
          ...product,
          stock: Math.max(0, product.stock - match.quantity),
          isActive: Math.max(0, product.stock - match.quantity) > 0 ? product.isActive : false,
        };
      }),
    }));

    void (async () => {
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            items,
          }),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();

    return order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setState((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              paymentStatus:
                status === "COMPLETED"
                  ? "VERIFIED"
                  : order.paymentStatus,
            }
          : order,
      ),
    }));

    void (async () => {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const createProduct = (draft: ProductDraft) => {
    setState((current) => {
      const id = `prd-${Date.now()}`;
      const slug = slugify(draft.name);
      const nextProduct: Product = {
        id,
        name: draft.name,
        slug,
        description: draft.description,
        categoryId: draft.categoryId,
        price: draft.price,
        compareAtPrice: draft.compareAtPrice,
        stock: draft.stock,
        sku: draft.sku,
        isFeatured: draft.isFeatured,
        isActive: draft.isActive,
        images: draft.images,
        tags: draft.tags,
        rating: draft.rating,
        reviewsCount: draft.reviewsCount,
      };

      return {
        ...current,
        products: [nextProduct, ...current.products],
      };
    });

    void (async () => {
      try {
        await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const updateProduct = (productId: string, draft: ProductDraft) => {
    setState((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId
          ? {
              ...product,
              name: draft.name,
              slug: slugify(draft.name),
              description: draft.description,
              categoryId: draft.categoryId,
              price: draft.price,
              compareAtPrice: draft.compareAtPrice,
              stock: draft.stock,
              sku: draft.sku,
              isFeatured: draft.isFeatured,
              isActive: draft.isActive,
              images: draft.images,
              tags: draft.tags,
              rating: draft.rating,
              reviewsCount: draft.reviewsCount,
            }
          : product,
      ),
    }));

    void (async () => {
      try {
        await fetch(`/api/products/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const deleteProduct = (productId: string) => {
    setState((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== productId),
      cart: current.cart.filter((item) => item.productId !== productId),
    }));

    void (async () => {
      try {
        await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const createCategory = (draft: CategoryDraft) => {
    setState((current) => ({
      ...current,
      categories: [
        {
          id: `cat-${Date.now()}`,
          name: draft.name,
          slug: slugify(draft.name),
          description: draft.description,
          isActive: draft.isActive,
        },
        ...current.categories,
      ],
    }));

    void (async () => {
      try {
        await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const updateCategory = (categoryId: string, draft: CategoryDraft) => {
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: draft.name,
              slug: slugify(draft.name),
              description: draft.description,
              isActive: draft.isActive,
            }
          : category,
      ),
    }));

    void (async () => {
      try {
        await fetch(`/api/categories/${categoryId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const deleteCategory = (categoryId: string) => {
    setState((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
      products: current.products.map((product) =>
        product.categoryId === categoryId
          ? {
              ...product,
              isActive: false,
            }
          : product,
      ),
    }));

    void (async () => {
      try {
        await fetch(`/api/categories/${categoryId}`, {
          method: "DELETE",
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const createPaymentMethod = (draft: PaymentMethodDraft) => {
    setState((current) => ({
      ...current,
      paymentMethods: [
        {
          id: `pay-${Date.now()}`,
          type: draft.type,
          label: draft.label,
          details: draft.details,
          accountName: draft.accountName,
          accountNumber: draft.accountNumber,
          isActive: draft.isActive,
        },
        ...current.paymentMethods,
      ],
    }));

    void (async () => {
      try {
        await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const updatePaymentMethod = (paymentMethodId: string, draft: PaymentMethodDraft) => {
    setState((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) =>
        method.id === paymentMethodId
          ? {
              ...method,
              type: draft.type,
              label: draft.label,
              details: draft.details,
              accountName: draft.accountName,
              accountNumber: draft.accountNumber,
              isActive: draft.isActive,
            }
          : method,
      ),
    }));

    void (async () => {
      try {
        await fetch(`/api/payments/${paymentMethodId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const deletePaymentMethod = (paymentMethodId: string) => {
    setState((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.filter((method) => method.id !== paymentMethodId),
    }));

    void (async () => {
      try {
        await fetch(`/api/payments/${paymentMethodId}`, {
          method: "DELETE",
        });
        await refreshCollections();
      } catch {
        // Keep optimistic state.
      }
    })();
  };

  const value: StoreContextValue = {
    ...state,
    hydrated,
    toggleTheme,
    loginAdmin,
    logoutAdmin,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    updateOrderStatus,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setTheme,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useGoldenStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useGoldenStore must be used inside StoreProvider");
  }
  return context;
}
