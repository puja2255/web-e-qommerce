"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Printer, SlidersHorizontal, X } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore } from "@/lib/store";
import { createMonthlySeries, downloadCsv, formatCurrency, paymentStatusLabel, topProductsFromOrders } from "@/lib/utils";

export default function AdminReportsPage() {
  const { orders, products, categories } = useGoldenStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "success" | "failed">("all");
  const [showFilters, setShowFilters] = useState(false);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const years = useMemo(
    () => Array.from(new Set(orders.map((order) => new Date(order.createdAt).getFullYear()))).sort((a, b) => b - a),
    [orders],
  );
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setMonthFilter("");
    setYearFilter("");
    setProductFilter("");
    setCategoryFilter("");
    setResultFilter("all");
  };

  const filteredOrders = useMemo(() => {
    const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const to = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const month = monthFilter ? Number(monthFilter) : null;
    const year = yearFilter ? Number(yearFilter) : null;

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const isSuccess = order.status !== "CANCELLED";
      const matchesRange = (!from || orderDate >= from) && (!to || orderDate <= to);
      const matchesMonth = !month || orderDate.getMonth() + 1 === month;
      const matchesYear = !year || orderDate.getFullYear() === year;
      const matchesProduct =
        !productFilter || order.items.some((item) => item.productId === productFilter || item.productName === productFilter);
      const matchesCategory =
        !categoryFilter ||
        order.items.some((item) => {
          const product = productMap.get(item.productId);
          return product?.categoryId === categoryFilter;
        });
      const matchesResult =
        resultFilter === "all" ? true : resultFilter === "success" ? isSuccess : !isSuccess;

      return matchesRange && matchesMonth && matchesYear && matchesProduct && matchesCategory && matchesResult;
    });
  }, [orders, startDate, endDate, monthFilter, yearFilter, productFilter, categoryFilter, resultFilter, productMap]);

  const monthlySeries = useMemo(() => createMonthlySeries(filteredOrders), [filteredOrders]);
  const maxSales = Math.max(...monthlySeries.map((point) => point.value), 1);
  const topProducts = useMemo(() => topProductsFromOrders(filteredOrders), [filteredOrders]);
  const successfulOrders = filteredOrders.filter((order) => order.status !== "CANCELLED");
  const failedOrders = filteredOrders.filter((order) => order.status === "CANCELLED");
  const revenue = successfulOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const exportExcel = () => {
    downloadCsv("golden-store-reports.csv", [
      ["Order", "Nama", "Status", "Pembayaran", "Total"],
      ...filteredOrders.map((order) => [order.orderNumber, order.customerName, order.status, paymentStatusLabel(order.paymentStatus), String(order.totalAmount)]),
    ]);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <AdminShell
      title="Laporan penjualan"
      description="Filter penjualan harian/bulanan, produk terlaris, pendapatan, dan hasil penjualan berhasil atau gagal."
      action={
        <div className="row-actions">
          <button className="button-outline" type="button" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal size={16} />
            Filter
          </button>
          <button className="button-outline" type="button" onClick={exportPdf}>
            <Printer size={16} />
            Export PDF
          </button>
          <button className="button" type="button" onClick={exportExcel}>
            <Download size={16} />
            Export Excel
          </button>
        </div>
      }
    >
      <section className="panel">
        <div className="muted tiny">Gunakan popup filter untuk melihat penjualan harian, bulanan, produk, kategori, dan hasil berhasil/gagal.</div>
      </section>

      <section className="grid grid-4">
        <div className="panel">
          <div className="muted tiny">Pendapatan</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{formatCurrency(revenue)}</div>
        </div>
        <div className="panel">
          <div className="muted tiny">Berhasil</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{successfulOrders.length}</div>
        </div>
        <div className="panel">
          <div className="muted tiny">Gagal</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{failedOrders.length}</div>
        </div>
        <div className="panel">
          <div className="muted tiny">Total order</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{filteredOrders.length}</div>
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">
          <FileText size={14} />
          Penjualan bulanan
        </div>
        <div className="chart" style={{ marginTop: 18 }}>
          {monthlySeries.map((point) => (
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
          <h2 style={{ marginTop: 0 }}>Produk terlaris</h2>
          <div className="stack">
            {topProducts.length > 0 ? (
              topProducts.map((item, index) => (
                <div key={item.productId} className="muted-box">
                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <strong>
                      {index + 1}. {item.name}
                    </strong>
                    <span>{item.quantity} pcs</span>
                  </div>
                  <div className="tiny muted">{formatCurrency(item.revenue)}</div>
                </div>
              ))
            ) : (
              <div className="muted-box">Belum ada data produk terlaris.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Ringkasan filter</h2>
          <div className="stack">
            <div className="muted-box">Berhasil: {successfulOrders.length} pesanan</div>
            <div className="muted-box">Gagal: {failedOrders.length} pesanan</div>
            <div className="muted-box">Rentang: {startDate || "-"} s.d. {endDate || "-"}</div>
            <div className="muted-box">Filter hasil: {resultFilter === "success" ? "Berhasil" : resultFilter === "failed" ? "Gagal" : "Semua"}</div>
          </div>
        </div>
      </section>

      {showFilters ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFilters(false)}>
          <div className="modal-card filter-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card__head">
              <div>
                <div className="eyebrow">
                  <SlidersHorizontal size={14} />
                  Filter laporan
                </div>
                <h2>Atur filter laporan</h2>
              </div>
              <button className="button-ghost" type="button" onClick={() => setShowFilters(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="field-grid">
              <div className="field">
                <label>Dari tanggal</label>
                <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="field">
                <label>Sampai tanggal</label>
                <input className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
              <div className="field">
                <label>Bulan</label>
                <select className="select" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                  <option value="">Semua bulan</option>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(2026, month - 1, 1))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tahun</label>
                <select className="select" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                  <option value="">Semua tahun</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Produk</label>
                <select className="select" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
                  <option value="">Semua produk</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Kategori</label>
                <select className="select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">Semua kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Hasil penjualan</label>
                <select className="select" value={resultFilter} onChange={(event) => setResultFilter(event.target.value as typeof resultFilter)}>
                  <option value="all">Semua</option>
                  <option value="success">Berhasil</option>
                  <option value="failed">Gagal</option>
                </select>
              </div>
            </div>

            <div className="row-actions">
              <button className="button-outline" type="button" onClick={resetFilters}>
                Reset filter
              </button>
              <button className="button" type="button" onClick={() => setShowFilters(false)}>
                Terapkan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
