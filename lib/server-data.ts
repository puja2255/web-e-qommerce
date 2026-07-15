import "server-only";

import { prisma } from "@/lib/prisma";
import { seedState } from "@/lib/mock-data";
import { AppState, Category, Order, PaymentMethod, Product } from "@/lib/types";
import { slugify } from "@/lib/utils";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

function fallbackState(): Pick<AppState, "categories" | "paymentMethods" | "products" | "orders"> {
  return {
    categories: seedState.categories,
    paymentMethods: seedState.paymentMethods,
    products: seedState.products,
    orders: seedState.orders,
  };
}

function mapCategory(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    isActive: category.isActive,
  };
}

function mapPaymentMethod(method: {
  id: string;
  type: "COD" | "DANA" | "BANK";
  label: string;
  details: string | null;
  accountName: string | null;
  accountNumber: string | null;
  isActive: boolean;
}): PaymentMethod {
  return {
    id: method.id,
    type: method.type,
    label: method.label,
    details: method.details ?? "",
    accountName: method.accountName ?? "",
    accountNumber: method.accountNumber ?? "",
    isActive: method.isActive,
  };
}

function mapProduct(product: {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  isFeatured: boolean;
  isActive: boolean;
  tags: unknown;
  rating: number;
  reviewsCount: number;
  images: Array<{ url: string }>;
}): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    stock: product.stock,
    sku: product.sku ?? undefined,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    images: product.images.map((item) => item.url),
    tags: toStringArray(product.tags),
    rating: product.rating,
    reviewsCount: product.reviewsCount,
  };
}

function mapOrder(order: {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  mapsLink: string | null;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "VERIFIED" | "REFUNDED";
  paymentMethodId: string;
  paymentProofUrl: string | null;
  totalAmount: number;
  shippingFee: number;
  adminNote: string | null;
  customerId: string | null;
  paymentDueAt: Date | null;
  createdAt: Date;
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    imageUrl: string;
  }>;
}): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    mapsLink: order.mapsLink ?? "",
    notes: order.notes ?? "",
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethodId: order.paymentMethodId,
    paymentProofUrl: order.paymentProofUrl ?? undefined,
    totalAmount: order.totalAmount,
    shippingFee: order.shippingFee,
    adminNote: order.adminNote ?? "",
    customerId: order.customerId ?? undefined,
    paymentDueAt: order.paymentDueAt?.toISOString(),
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      image: item.imageUrl,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

async function queryState(): Promise<Pick<AppState, "categories" | "paymentMethods" | "products" | "orders">> {
  const [categories, paymentMethods, products, orders] = await Promise.all([
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.paymentMethod.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          orderBy: { id: "asc" },
        },
      },
    }),
  ]);

  if (categories.length === 0 && paymentMethods.length === 0 && products.length === 0 && orders.length === 0) {
    return fallbackState();
  }

  return {
    categories: categories.map(mapCategory),
    paymentMethods: paymentMethods.map(mapPaymentMethod),
    products: products.map(mapProduct),
    orders: orders.map(mapOrder),
  };
}

export async function getBootstrapState() {
  try {
    return await queryState();
  } catch {
    return fallbackState();
  }
}

async function nextUniqueSlug(
  table: "product" | "category",
  baseName: string,
  currentId?: string,
): Promise<string> {
  const baseSlug = slugify(baseName);

  let slug = baseSlug;
  let index = 1;
  while (
    await (table === "product"
      ? prisma.product.findFirst({
          where: currentId ? { slug, NOT: { id: currentId } } : { slug },
        })
      : prisma.category.findFirst({
          where: currentId ? { slug, NOT: { id: currentId } } : { slug },
        }))
  ) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

export async function createCategoryRecord(data: {
  name: string;
  description: string;
  isActive: boolean;
}) {
  const slug = await nextUniqueSlug("category", data.name);
  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      isActive: data.isActive,
    },
  });
}

export async function updateCategoryRecord(
  id: string,
  data: {
    name: string;
    description: string;
    isActive: boolean;
  },
) {
  const slug = await nextUniqueSlug("category", data.name, id);
  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description,
      isActive: data.isActive,
    },
  });
}

export async function createProductRecord(data: {
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
}) {
  const slug = await nextUniqueSlug("product", data.name);
  return prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      stock: data.stock,
      sku: data.sku,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      tags: data.tags,
      rating: data.rating,
      reviewsCount: data.reviewsCount,
      images: {
        create: data.images.map((url, index) => ({
          url,
          alt: data.name,
          sortOrder: index,
        })),
      },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function updateProductRecord(
  id: string,
  data: {
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
  },
) {
  const slug = await nextUniqueSlug("product", data.name, id);
  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      stock: data.stock,
      sku: data.sku,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      tags: data.tags,
      rating: data.rating,
      reviewsCount: data.reviewsCount,
      images: {
        deleteMany: {},
        create: data.images.map((url, index) => ({
          url,
          alt: data.name,
          sortOrder: index,
        })),
      },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function createPaymentMethodRecord(data: {
  type: "COD" | "DANA" | "BANK";
  label: string;
  details: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
}) {
  return prisma.paymentMethod.create({
    data,
  });
}

export async function updatePaymentMethodRecord(
  id: string,
  data: {
    type: "COD" | "DANA" | "BANK";
    label: string;
    details: string;
    accountName: string;
    accountNumber: string;
    isActive: boolean;
  },
) {
  return prisma.paymentMethod.update({
    where: { id },
    data,
  });
}

export async function createOrderRecord(data: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  mapsLink: string;
  notes: string;
  paymentMethodId: string;
  paymentProofUrl?: string;
  customerId?: string;
  shippingFee?: number;
  paymentDueAt?: string;
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    image: string;
  }>;
}) {
  const nextCount = await prisma.order.count();
  const orderNumber = `GS-${String(nextCount + 1).padStart(5, "0")}`;
  const shippingFee = Math.max(0, Number(data.shippingFee) || 25000);
  const totalAmount = data.items.reduce((sum, item) => sum + item.subtotal, 0) + shippingFee;
  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id: data.paymentMethodId },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      mapsLink: data.mapsLink,
      notes: data.notes,
      paymentMethodId: data.paymentMethodId,
      paymentProofUrl: data.paymentProofUrl,
      customerId: data.customerId || undefined,
      paymentDueAt: data.paymentDueAt ? new Date(data.paymentDueAt) : undefined,
      totalAmount,
      shippingFee,
      status: "PENDING",
      paymentStatus: "UNPAID",
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          imageUrl: item.image,
        })),
      },
    },
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
  });

  return mapOrder(order);
}

export { mapCategory, mapPaymentMethod, mapProduct, mapOrder };
