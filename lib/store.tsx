"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { seedState } from "@/lib/mock-data";
import {
  AppState,
  Banner,
  CartItem,
  Category,
  CustomerAddress,
  CustomerSession,
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
  customer: "golden-store-customer-v1",
  addresses: "golden-store-addresses-v1",
  orders: "golden-store-customer-orders-v1",
  banners: "golden-store-banners-v1",
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

export interface BannerDraft {
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
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
  customerId?: string;
  shippingFee: number;
  paymentDueAt?: string;
}

interface StoreContextValue extends AppState {
  hydrated: boolean;
  customerSession: CustomerSession | null;
  customerAddresses: CustomerAddress[];
  cartNotice: string | null;
  toggleTheme: () => void;
  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  dismissCartNotice: () => void;
  registerCustomer: (data: Omit<CustomerSession, "id"> & { password: string }) => Promise<{ ok: boolean; message?: string }>;
  loginCustomer: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logoutCustomer: () => void;
  saveCustomerAddress: (address: Omit<CustomerAddress, "id">) => void;
  deleteCustomerAddress: (addressId: string) => void;
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
  createBanner: (draft: BannerDraft) => void;
  updateBanner: (bannerId: string, draft: BannerDraft) => void;
  deleteBanner: (bannerId: string) => void;
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
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bootstrapState, storedTheme, storedCart, storedAdmin, storedCustomer, storedAddresses, storedOrders, storedBanners] = await Promise.all([
          fetchBootstrapState(),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.theme)),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.cart)),
          Promise.resolve(null),
          fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.ok ? response.json() : { customer: null }),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.addresses)),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.orders)),
          Promise.resolve(window.localStorage.getItem(SESSION_KEYS.banners)),
        ]);

        const sessionState: SessionStorageState = {
          theme: (storedTheme as ThemeMode | null) ?? seedState.theme,
          cart: storedCart ? (JSON.parse(storedCart) as CartItem[]) : seedState.cart,
          adminSession: storedAdmin ? (JSON.parse(storedAdmin) as AppState["adminSession"]) : null,
        };

        const customerOrders = storedOrders ? (JSON.parse(storedOrders) as Order[]) : [];
        const orderMap = new Map(bootstrapState.orders.map((order) => [order.orderNumber, order]));
        customerOrders.forEach((order) => orderMap.set(order.orderNumber, order));

        setState({
          ...seedState,
          ...bootstrapState,
          ...sessionState,
          orders: Array.from(orderMap.values()),
          banners: storedBanners ? (JSON.parse(storedBanners) as Banner[]) : seedState.banners,
        });
        setCustomerSession(storedCustomer?.customer ?? null);
        setCustomerAddresses(storedAddresses ? (JSON.parse(storedAddresses) as CustomerAddress[]) : []);
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
    window.localStorage.setItem(SESSION_KEYS.addresses, JSON.stringify(customerAddresses));
    window.localStorage.setItem(SESSION_KEYS.orders, JSON.stringify(state.orders.filter((order) => order.customerId?.startsWith("customer-"))));
    window.localStorage.setItem(SESSION_KEYS.banners, JSON.stringify(state.banners));
    document.documentElement.dataset.theme = state.theme;
  }, [hydrated, state, customerSession, customerAddresses]);

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
        orders: [...current.orders.filter((order) => order.customerId?.startsWith("customer-")), ...bootstrapState.orders.filter((order) => !current.orders.some((currentOrder) => currentOrder.orderNumber === order.orderNumber))],
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
    const product = state.products.find((item) => item.id === productId);
    if (product) {
      setCartNotice(`${product.name} ditambahkan ke keranjang.`);
    }
  };

  const dismissCartNotice = () => setCartNotice(null);

  const registerCustomer = async (data: Omit<CustomerSession, "id"> & { password: string }) => {
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) return { ok: false, message: result.message };
      setCustomerSession(result.customer); return { ok: true };
    } catch { return { ok: false, message: "Tidak dapat terhubung ke layanan akun." }; }
  };

  const loginCustomer = async (email: string, password: string) => {
    try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const result = await response.json(); if (!response.ok) return { ok: false, message: result.message }; setCustomerSession(result.customer); return { ok: true }; } catch { return { ok: false, message: "Tidak dapat terhubung ke layanan akun." }; }
  };

  const logoutCustomer = () => { setCustomerSession(null); void fetch("/api/auth/logout", { method: "POST" }); };

  const saveCustomerAddress = (address: Omit<CustomerAddress, "id">) => {
    setCustomerAddresses((current) => {
      const next = { ...address, id: `address-${Date.now()}` };
      return address.isPrimary ? [next, ...current.map((item) => ({ ...item, isPrimary: false }))] : [...current, next];
    });
  };

  const deleteCustomerAddress = (addressId: string) => {
    setCustomerAddresses((current) => current.filter((item) => item.id !== addressId));
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
    if (!customerSession) return null;
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

    const shippingFee = payload.shippingFee;
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
      // Pembayaran transfer baru dianggap selesai setelah diverifikasi admin.
      paymentStatus: "UNPAID",
      paymentMethodId: paymentMethod.id,
      paymentProofUrl: payload.paymentProofUrl,
      totalAmount,
      shippingFee,
      adminNote: "",
      customerId: customerSession.id,
      paymentDueAt: paymentMethod.type === "COD" ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

  const createBanner = (draft: BannerDraft) => {
    setState((current) => ({ ...current, banners: [{ ...draft, id: `banner-${Date.now()}` }, ...current.banners] }));
  };

  const updateBanner = (bannerId: string, draft: BannerDraft) => {
    setState((current) => ({ ...current, banners: current.banners.map((banner) => banner.id === bannerId ? { ...banner, ...draft } : banner) }));
  };

  const deleteBanner = (bannerId: string) => {
    setState((current) => ({ ...current, banners: current.banners.filter((banner) => banner.id !== bannerId) }));
  };

  const value: StoreContextValue = {
    ...state,
    hydrated,
    toggleTheme,
    loginAdmin,
    logoutAdmin,
    addToCart,
    dismissCartNotice,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    saveCustomerAddress,
    deleteCustomerAddress,
    customerSession,
    customerAddresses,
    cartNotice,
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
    createBanner,
    updateBanner,
    deleteBanner,
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
