"use client";

import Link from "next/link";
import { ArrowRight, CircleDollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { useGoldenStore } from "@/lib/store";
import { createSalesSeries, formatCurrency, topProductsFromOrders } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { products, orders, categories } = useGoldenStore();
  const revenue = orders.reduce((sum, order) => sum + (order.status === "CANCELLED" ? 0 : order.totalAmount), 0);
  const activeProducts = products.filter((product) => product.isActive).length;
  const salesSeries = createSalesSeries(orders);
  const maxSales = Math.max(...salesSeries.map((point) => point.value), 1);
  const topProducts = topProductsFromOrders(orders);

  return (
    <AdminShell
      title="Dashboard utama"
      description="Pantau penjualan, total produk, total pesanan, dan grafik penjualan harian."
      action={
        <Link href="/admin/products" className="button">
          Kelola Produk
          <ArrowRight size={16} />
        </Link>
      }
    >
      <div className="grid grid-4">
        <StatCard label="Total Penjualan" value={formatCurrency(revenue)} icon={<CircleDollarSign size={16} />} />
        <StatCard label="Total Produk" value={`${products.length}`} icon={<Package size={16} />} />
        <StatCard label="Total Pesanan" value={`${orders.length}`} icon={<ShoppingBag size={16} />} />
        <StatCard label="Produk Aktif" value={`${activeProducts}`} icon={<TrendingUp size={16} />} />
      </div>

      <section className="panel">
        <div className="section-title" style={{ marginBottom: 12 }}>
          <div>
            <div className="eyebrow">Grafik penjualan</div>
            <h2 style={{ marginBottom: 0 }}>Penjualan 7 hari terakhir</h2>
          </div>
        </div>
        <div className="chart">
          {salesSeries.map((point) => (
            <div key={point.label} className="chart-bar">
              <div className="chart-bar__track">
                <div className="chart-bar__fill" style={{ height: `${(point.value / maxSales) * 100}%` }} />
              </div>
              <div className="tiny muted">{point.label}</div>
              <strong className="tiny">{formatCurrency(point.value)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-2">
        <div className="panel">
          <div className="eyebrow">Ringkasan</div>
          <h2>Quick overview</h2>
          <div className="stack">
            <div className="muted-box">Kategori aktif: {categories.filter((category) => category.isActive).length}</div>
            <div className="muted-box">Produk stok habis: {products.filter((product) => product.stock <= 0).length}</div>
            <div className="muted-box">Pesanan pending: {orders.filter((order) => order.status === "PENDING").length}</div>
          </div>
        </div>

        <div className="panel">
          <div className="eyebrow">Produk terlaris</div>
          <h2>Top produk</h2>
          <div className="stack">
            {topProducts.length > 0 ? (
              topProducts.map((item) => (
                <div key={item.productId} className="muted-box">
                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <strong>{item.name}</strong>
                    <span>{item.quantity} pcs</span>
                  </div>
                  <div className="muted tiny">{formatCurrency(item.revenue)}</div>
                </div>
              ))
            ) : (
              <div className="muted-box">Belum ada data produk terlaris.</div>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

