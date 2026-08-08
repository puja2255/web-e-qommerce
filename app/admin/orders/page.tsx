"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MessageCircle, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, orderStatusLabel, paymentStatusLabel, shortDate, whatsappLink } from "@/lib/utils";

const statusOptions = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export default function AdminOrdersPage() {
  const { orders, paymentMethods, products, categories, refreshData, updateOrderStatus } = useGoldenStore();
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    void refreshData();
    const timer = window.setInterval(() => void refreshData(), 30000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  const paymentMethodMap = useMemo(() => new Map(paymentMethods.map((method) => [method.id, method])), [paymentMethods]);
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
  };

  const visibleOrders = useMemo(() => {
    const needle = query.toLowerCase();
    const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const to = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const month = monthFilter ? Number(monthFilter) : null;
    const year = yearFilter ? Number(yearFilter) : null;

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle) ||
        order.customerPhone.toLowerCase().includes(needle) ||
        order.customerAddress.toLowerCase().includes(needle);
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

      return matchesSearch && matchesRange && matchesMonth && matchesYear && matchesProduct && matchesCategory;
    });
  }, [orders, query, startDate, endDate, monthFilter, yearFilter, productFilter, categoryFilter, productMap]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const selectedPaymentMethod = selectedOrder ? paymentMethodMap.get(selectedOrder.paymentMethodId) : undefined;

  return (
    <AdminShell
      title="Manajemen pesanan"
      description="Cari pesanan, filter riwayat pembeli, lihat detail lengkap, dan kirim update ke WhatsApp pembeli."
    >
      <section className="panel">
        <div className="field">
          <label>Search pesanan</label>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 14, opacity: 0.7 }} />
            <input
              className="input"
              style={{ paddingLeft: 42 }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order number, nama, alamat, atau nomor WA..."
            />
          </div>
        </div>
        <div className="row-actions" style={{ justifyContent: "space-between", marginTop: 16 }}>
          <div className="muted tiny">Gunakan popup filter untuk mempersempit riwayat pesanan.</div>
          <button className="button-outline" type="button" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal size={16} />
            Filter
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status</th>
                <th>Pembayaran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => {
                const paymentMethod = paymentMethodMap.get(order.paymentMethodId);
                return (
                  <tr key={order.id}>
                    <td>
                      <button
                        type="button"
                        className="button-ghost"
                        style={{ paddingInline: 0, textAlign: "left", display: "grid", gap: 2 }}
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <strong>{order.orderNumber}</strong>
                        <span className="tiny muted">{shortDate(order.createdAt)}</span>
                      </button>
                    </td>
                    <td>
                      <strong>{order.customerName}</strong>
                      <div className="tiny muted">{order.customerPhone}</div>
                      <div className="tiny muted">{order.customerAddress}</div>
                    </td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`status-pill ${order.status.toLowerCase()}`}>{orderStatusLabel(order.status)}</span>
                    </td>
                    <td>
                      <div className="stack" style={{ gap: 6 }}>
                        <span className="status-pill pending" style={{ width: "fit-content" }}>
                          {paymentMethod?.type === "COD" ? "COD" : paymentMethod?.label ?? "Metode"}
                        </span>
                        <span className="tiny muted">{paymentStatusLabel(order.paymentStatus)}</span>
                        {order.paymentProofUrl ? (
                          <a className="button-ghost" href={order.paymentProofUrl} target="_blank" rel="noreferrer" style={{ width: "fit-content", paddingInline: 0 }}>
                            Lihat bukti
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="stack" style={{ gap: 8 }}>
                        <select
                          className="select"
                          value={order.status}
                          onChange={(event) => updateOrderStatus(order.id, event.target.value as (typeof statusOptions)[number])}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {orderStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                        <a
                          className="button-outline"
                          href={whatsappLink(
                            order.customerPhone,
                            `Halo ${order.customerName}, status pesanan ${order.orderNumber} sekarang ${orderStatusLabel(order.status)}.`,
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={16} />
                          WA pembeli
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleOrders.length === 0 ? <div className="muted-box">Tidak ada pesanan yang sesuai filter.</div> : null}
      </section>

      {showFilters ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFilters(false)}>
          <div className="modal-card filter-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card__head">
              <div>
                <div className="eyebrow">
                  <SlidersHorizontal size={14} />
                  Filter pesanan
                </div>
                <h2>Atur filter riwayat</h2>
              </div>
              <button className="button-ghost" type="button" onClick={() => setShowFilters(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="field-grid">
              <div className="field">
                <label>
                  <CalendarDays size={14} /> Dari tanggal
                </label>
                <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="field">
                <label>
                  <CalendarDays size={14} /> Sampai tanggal
                </label>
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

      {selectedOrder ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedOrderId(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card__head">
              <div>
                <div className="eyebrow">
                  <PackageSearch size={14} />
                  Detail pesanan
                </div>
                <h2>{selectedOrder.orderNumber}</h2>
              </div>
              <button className="button-ghost" type="button" onClick={() => setSelectedOrderId(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-2">
              <div className="muted-box stack">
                <strong>Data pembeli</strong>
                <span>Nama: {selectedOrder.customerName}</span>
                <span>WA: {selectedOrder.customerPhone}</span>
                <span>Status order: {orderStatusLabel(selectedOrder.status)}</span>
              </div>
              <div className="muted-box stack">
                <strong>Pembayaran</strong>
                <span>Metode: {selectedPaymentMethod?.type === "COD" ? "COD" : selectedPaymentMethod?.label ?? "-"}</span>
                <span>Status: {paymentStatusLabel(selectedOrder.paymentStatus)}</span>
                {selectedPaymentMethod?.type !== "COD" && selectedPaymentMethod ? (
                  <>
                    <span>Akun: {selectedPaymentMethod.accountName || "-"}</span>
                    <span>No/Rek: {selectedPaymentMethod.accountNumber || "-"}</span>
                    <span>Detail: {selectedPaymentMethod.details || "-"}</span>
                  </>
                ) : (
                  <span>Bayar saat pesanan diterima.</span>
                )}
                {selectedOrder.paymentProofUrl ? (
                  <a className="button-outline" href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer" style={{ width: "fit-content" }}>
                    Lihat bukti pembayaran
                  </a>
                ) : null}
              </div>
            </div>

            <div className="muted-box stack">
              <strong>Alamat & catatan</strong>
              <span>{selectedOrder.customerAddress}</span>
              {selectedOrder.mapsLink ? (
                <a className="button-ghost" href={selectedOrder.mapsLink} target="_blank" rel="noreferrer" style={{ width: "fit-content", paddingInline: 0 }}>
                  Buka Maps
                </a>
              ) : null}
              <span>Catatan: {selectedOrder.notes || "-"}</span>
            </div>

            <div className="stack">
              <strong>Item pesanan</strong>
              {selectedOrder.items.map((item) => (
                <div className="muted-box" key={item.productId}>
                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <strong>{item.productName}</strong>
                    <span>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                  <div className="tiny muted">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-2">
              <div className="muted-box">
                <div className="tiny muted">Ongkir</div>
                <strong>{formatCurrency(selectedOrder.shippingFee)}</strong>
              </div>
              <div className="muted-box">
                <div className="tiny muted">Total</div>
                <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
