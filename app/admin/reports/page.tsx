"use client";

import { useMemo } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore } from "@/lib/store";
import { createMonthlySeries, downloadCsv, formatCurrency, topProductsFromOrders } from "@/lib/utils";

export default function AdminReportsPage() {
  const { orders } = useGoldenStore();
  const monthlySeries = createMonthlySeries(orders);
  const maxSales = Math.max(...monthlySeries.map((point) => point.value), 1);
  const topProducts = useMemo(() => topProductsFromOrders(orders), [orders]);
  const revenue = orders.reduce((sum, order) => sum + (order.status === "CANCELLED" ? 0 : order.totalAmount), 0);

  const exportExcel = () => {
    downloadCsv("golden-store-reports.csv", [
      ["Order", "Nama", "Status", "Total"],
      ...orders.map((order) => [order.orderNumber, order.customerName, order.status, String(order.totalAmount)]),
    ]);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <AdminShell
      title="Laporan penjualan"
      description="Lihat penjualan harian, bulanan, produk terlaris, dan pendapatan."
      action={
        <div className="row-actions">
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
      <section className="grid grid-4">
        <div className="panel">
          <div className="muted tiny">Pendapatan</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{formatCurrency(revenue)}</div>
        </div>
        <div className="panel">
          <div className="muted tiny">Penjualan harian</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{orders.length}</div>
        </div>
        <div className="panel">
          <div className="muted tiny">Produk terlaris</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{topProducts.length}</div>
        </div>
        <div className="panel">
          <div className="muted tiny">Total order</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{orders.length}</div>
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
            {topProducts.map((item, index) => (
              <div key={item.productId} className="muted-box">
                <div className="nav-links" style={{ justifyContent: "space-between" }}>
                  <strong>
                    {index + 1}. {item.name}
                  </strong>
                  <span>{item.quantity} pcs</span>
                </div>
                <div className="tiny muted">{formatCurrency(item.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Catatan export</h2>
          <div className="muted-box">
            <p style={{ marginTop: 0 }}>
              Tombol PDF memakai print browser, sehingga kamu bisa simpan sebagai PDF. Tombol Excel menghasilkan CSV
              yang bisa dibuka langsung di Microsoft Excel atau LibreOffice.
            </p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

