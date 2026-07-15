"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, shortDate, whatsappLink } from "@/lib/utils";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { orders } = useGoldenStore();
  const orderId = searchParams.get("order");
  const order = orderId ? orders.find((item) => item.orderNumber === orderId) : orders[0];

  if (!order) {
    return (
      <section className="panel">
        <h1>Pesanan belum ditemukan</h1>
        <Link href="/products" className="button">
          Kembali belanja
        </Link>
      </section>
    );
  }

  const message = `Halo Golden Store, saya ${order.customerName}. Saya ingin cek pesanan ${order.orderNumber}.`;

  return (
    <section className="panel" style={{ textAlign: "center" }}>
      <div className="eyebrow" style={{ margin: "0 auto" }}>
        <CheckCircle2 size={14} />
        Pesanan berhasil dibuat
      </div>
      <h1 style={{ marginBottom: 8 }}>Terima kasih, pesanan kamu sudah masuk.</h1>
      <p className="muted">
        Nomor pesanan <strong>{order.orderNumber}</strong> dibuat pada {shortDate(order.createdAt)}.
      </p>
      <div className="grid grid-3" style={{ marginTop: 18, textAlign: "left" }}>
        <div className="muted-box">
          <strong>Nama</strong>
          <div>{order.customerName}</div>
        </div>
        <div className="muted-box">
          <strong>Total</strong>
          <div>{formatCurrency(order.totalAmount)}</div>
        </div>
        <div className="muted-box">
          <strong>Status</strong>
          <div>{order.status}</div>
        </div>
      </div>
      <div className="row-actions" style={{ justifyContent: "center" }}>
        <Link href="/products" className="button">
          <ShoppingBag size={16} />
          Lanjut belanja
        </Link>
        <a href={whatsappLink(order.customerPhone, message)} className="button-outline" target="_blank" rel="noreferrer">
          <MessageCircle size={16} />
          Buka WhatsApp
        </a>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="panel">
          <p className="muted">Memuat detail pesanan...</p>
        </section>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
