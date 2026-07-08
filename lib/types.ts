export type ThemeMode = "light" | "dark";
export type PaymentKind = "COD" | "DANA" | "BANK";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "VERIFIED" | "REFUNDED";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  type: PaymentKind;
  label: string;
  details: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  tags: string[];
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  mapsLink: string;
  notes: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethodId: string;
  paymentProofUrl?: string;
  totalAmount: number;
  shippingFee: number;
  adminNote: string;
  items: OrderItem[];
  createdAt: string;
}

export interface DashboardSeriesPoint {
  label: string;
  value: number;
}

export interface AppState {
  theme: ThemeMode;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  adminSession: {
    email: string;
    name: string;
  } | null;
}

