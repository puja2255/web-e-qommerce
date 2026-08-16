import type { Order } from "@/lib/types";

export interface FinancialReportEntry {
  month: string;
  label: string;
  revenue: number;
  shippingFee: number;
  operationalCost: number;
  netProfit: number;
  labaBersih: number;
  successfulOrders: number;
  cancelledOrders: number;
  totalOrders: number;
}

export function buildMonthlyFinancialReport(orders: Order[]): FinancialReportEntry[] {
  const buckets = new Map<string, {
    revenue: number;
    shippingFee: number;
    successfulOrders: number;
    cancelledOrders: number;
    totalOrders: number;
  }>();

  for (const order of orders) {
    const date = new Date(order.createdAt);
    if (Number.isNaN(date.getTime())) continue;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(monthKey) ?? {
      revenue: 0,
      shippingFee: 0,
      successfulOrders: 0,
      cancelledOrders: 0,
      totalOrders: 0,
    };

    bucket.totalOrders += 1;
    bucket.shippingFee += order.shippingFee;

    if (order.status === "CANCELLED") {
      bucket.cancelledOrders += 1;
    } else {
      bucket.revenue += order.totalAmount;
      bucket.successfulOrders += 1;
    }

    buckets.set(monthKey, bucket);
  }

  return Array.from(buckets.entries())
    .map(([month, value]) => {
      const [year, monthNumber] = month.split("-").map(Number);
      const revenue = value.revenue;
      const shippingFee = value.shippingFee;
      const operationalCost = shippingFee;
      const netProfit = revenue - operationalCost;

      return {
        month,
        label: new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
        }).format(new Date(year, monthNumber - 1, 1)),
        revenue,
        shippingFee,
        operationalCost,
        netProfit,
        labaBersih: netProfit,
        successfulOrders: value.successfulOrders,
        cancelledOrders: value.cancelledOrders,
        totalOrders: value.totalOrders,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}
