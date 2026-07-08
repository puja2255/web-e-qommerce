import { CartItem, DashboardSeriesPoint, Order, Product } from "@/lib/types";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function shortDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function makeOrderNumber(index: number) {
  return `GS-${String(index).padStart(5, "0")}`;
}

export function calcCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calcOrderTotal(order: Pick<Order, "items" | "shippingFee">) {
  return order.items.reduce((sum, item) => sum + item.subtotal, 0) + order.shippingFee;
}

export function getMainImage(product: Product) {
  return product.images[0] ?? "";
}

export function orderStatusLabel(status: Order["status"]) {
  const map: Record<Order["status"], string> = {
    PENDING: "Menunggu",
    CONFIRMED: "Dikonfirmasi",
    PACKED: "Dikemas",
    SHIPPED: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };

  return map[status];
}

export function paymentStatusLabel(status: Order["paymentStatus"]) {
  const map: Record<Order["paymentStatus"], string> = {
    UNPAID: "Belum Bayar",
    PAID: "Sudah Bayar",
    VERIFIED: "Terverifikasi",
    REFUNDED: "Refund",
  };

  return map[status];
}

export function createSalesSeries(orders: Order[]): DashboardSeriesPoint[] {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  return days.map((day) => {
    const label = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day);
    const value = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getFullYear() === day.getFullYear() &&
          orderDate.getMonth() === day.getMonth() &&
          orderDate.getDate() === day.getDate() &&
          order.status !== "CANCELLED"
        );
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { label, value };
  });
}

export function createMonthlySeries(orders: Order[]): DashboardSeriesPoint[] {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return date;
  });

  return months.map((month) => {
    const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(month);
    const value = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getFullYear() === month.getFullYear() &&
          orderDate.getMonth() === month.getMonth() &&
          order.status !== "CANCELLED"
        );
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { label, value };
  });
}

export function topProductsFromOrders(orders: Order[]) {
  const buckets = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const item of order.items) {
      const current = buckets.get(item.productId) ?? {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += item.subtotal;
      buckets.set(item.productId, current);
    }
  }

  return Array.from(buckets.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadTextFile(filename, csv, "text/csv;charset=utf-8");
}

export function whatsappLink(phone: string, message: string) {
  const normalized = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

