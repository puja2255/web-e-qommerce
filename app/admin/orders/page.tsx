"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore } from "@/lib/store";
import { orderStatusLabel, paymentStatusLabel, shortDate, whatsappLink, formatCurrency } from "@/lib/utils";

const statusOptions = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useGoldenStore();
  const [query, setQuery] = useState("");

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const needle = query.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle) ||
        order.customerPhone.toLowerCase().includes(needle)
      );
    });
  }, [orders, query]);

  return (
    <AdminShell
      title="Manajemen pesanan"
      description="Cari pesanan, ubah status, dan kirim update ke WhatsApp pembeli."
    >
      <section className="panel">
        <div className="field">
          <label>Search pesanan</label>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 14, opacity: 0.7 }} />
            <input className="input" style={{ paddingLeft: 42 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order number, nama, atau nomor WA..." />
          </div>
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
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    <div className="tiny muted">{shortDate(order.createdAt)}</div>
                  </td>
                  <td>
                    <strong>{order.customerName}</strong>
                    <div className="tiny muted">{order.customerPhone}</div>
                  </td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>{orderStatusLabel(order.status)}</span>
                  </td>
                  <td>{paymentStatusLabel(order.paymentStatus)}</td>
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
              ))}
            </tbody>
          </table>
        </div>

        {visibleOrders.length === 0 ? <div className="muted-box">Tidak ada pesanan yang sesuai pencarian.</div> : null}
      </section>
    </AdminShell>
  );
}
