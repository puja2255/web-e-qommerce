"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Send, MapPin, Truck } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, calcCartSubtotal } from "@/lib/utils";
import { distanceInKm, shippingQuote, warehouseLocation } from "@/lib/address-service";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, paymentMethods, createOrder, customerAddresses, customerSession } = useGoldenStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [courier, setCourier] = useState<"JNE" | "J&T" | "SICEPAT">("JNE");

  const selectedPayment = paymentMethods.find((method) => method.id === paymentMethodId);
  const subtotal = calcCartSubtotal(cart);
  const recipientAddresses = customerAddresses.filter((address) => (address.type ?? "RECIPIENT") === "RECIPIENT");
  const selectedAddress = recipientAddresses.find((address) => address.id === selectedAddressId) ?? recipientAddresses.find((address) => address.isPrimary);
  const distance = selectedAddress?.latitude != null && selectedAddress?.longitude != null ? distanceInKm(warehouseLocation, selectedAddress) : null;
  const shippingFee = cart.length > 0 ? (distance !== null ? shippingQuote(distance, courier) : 25000) : 0;
  const total = subtotal + shippingFee;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (!customerName || !customerPhone || !customerAddress || !mapsLink || !paymentMethodId) {
      setError("Lengkapi semua data checkout.");
      return;
    }

    setLoading(true);
    const order = createOrder({
      customerName,
      customerPhone,
      customerAddress,
      mapsLink,
      notes,
      paymentMethodId,
      customerId: customerSession?.id,
      shippingFee,
    });
    setLoading(false);

    if (!order) {
      setError("Gagal membuat pesanan. Coba lagi.");
      return;
    }

    router.push(`/checkout/success?order=${order.orderNumber}`);
  };

  return (
    <section className="panel checkout-shell">
      <div className="eyebrow">
        <Send size={14} />
        Checkout
      </div>
      <h1 style={{ marginBottom: 8 }}>Isi data pengiriman</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Lengkapi data pengiriman, pilih metode pembayaran, lalu selesaikan pembayaran hingga 24 jam setelah pesanan dibuat.
      </p>

      <form className="stack" onSubmit={handleSubmit}>
        {recipientAddresses.length ? <div className="address-checkout"><div className="eyebrow"><MapPin size={14} /> Alamat tersimpan</div><select className="select" value={selectedAddress?.id ?? ""} onChange={(event) => { const address = recipientAddresses.find((item) => item.id === event.target.value); setSelectedAddressId(event.target.value); if (address) { setCustomerName(address.recipientName); setCustomerPhone(address.phone); setCustomerAddress(`${address.detail}, ${address.district}, ${address.city}, ${address.province} ${address.postalCode ?? ""}`); setMapsLink(address.mapsUrl ?? ""); } }}><option value="">Pilih alamat penerima</option>{recipientAddresses.map((address) => <option key={address.id} value={address.id}>{address.label}{address.isPrimary ? " (Utama)" : ""} — {address.city}</option>)}</select>{selectedAddress ? <div className="muted tiny">{selectedAddress.isVerified ? "Wilayah terverifikasi" : "Alamat belum diverifikasi"}{distance !== null ? ` · Jarak estimasi ${distance} km` : " · Gunakan GPS di halaman Akun untuk ongkir berbasis jarak"}</div> : null}</div> : null}
        <div className="field-grid">
          <div className="field">
            <label>Nama</label>
            <input className="input" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nama pembeli" />
          </div>
          <div className="field">
            <label>No WA</label>
            <input className="input" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="0812..." />
          </div>
        </div>

        <div className="field-grid"><div className="field"><label><Truck size={14} /> Kurir</label><select className="select" value={courier} onChange={(event) => setCourier(event.target.value as typeof courier)}><option value="JNE">JNE Reguler</option><option value="J&T">J&T EZ</option><option value="SICEPAT">SiCepat BEST</option></select></div><div className="field"><label>Estimasi ongkir</label><div className="shipping-quote">{formatCurrency(shippingFee)}<span>{distance !== null ? `${courier} · ${distance} km` : `${courier} · estimasi wilayah`}</span></div></div></div>

        <div className="field">
          <label>Alamat</label>
          <textarea className="textarea" value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} placeholder="Alamat lengkap pengiriman" />
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Link Maps</label>
            <input className="input" value={mapsLink} onChange={(event) => setMapsLink(event.target.value)} placeholder="Link Google Maps" />
          </div>
          <div className="field">
            <label>Catatan</label>
            <input className="input" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan tambahan" />
          </div>
        </div>

        <div className="field">
          <label>Metode Pembayaran</label>
          <select className="select" value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>
            {paymentMethods
              .filter((method) => method.isActive)
              .map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
          </select>
        </div>

        {selectedPayment ? (
          <div className="payment-preview">
            <div className="payment-preview__header">
              <div>
                <strong>{selectedPayment.label}</strong>
                <div className="muted tiny">{selectedPayment.details}</div>
              </div>
              <span className="badge-soft">{selectedPayment.type}</span>
            </div>
            {selectedPayment.type !== "COD" ? (
              <>
                <div className="payment-preview__account">
                  <div>{selectedPayment.accountName}</div>
                  <strong>{selectedPayment.accountNumber}</strong>
                </div>
                <div className="payment-window"><Clock3 size={17} /><span><strong>Bayar setelah pesanan dibuat</strong> — kamu punya waktu 24 jam untuk menyelesaikan pembayaran.</span></div>
              </>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="muted-box" style={{ color: "var(--danger)" }}>{error}</div> : null}

        <div className="checkout-summary">
          <div className="checkout-summary__title">Ringkasan order</div>
          <div className="checkout-summary__rows">
            {cart.map((item) => (
              <div key={item.productId} className="checkout-summary__row">
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted tiny">{item.quantity} x {formatCurrency(item.price)}</div>
                </div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div className="checkout-summary__row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="checkout-summary__row">
              <span>Ongkir</span>
              <strong>{formatCurrency(shippingFee)}</strong>
            </div>
            <div className="checkout-summary__row checkout-summary__row--total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>
        </div>

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Memproses..." : selectedPayment?.type === "COD" ? "Buat Pesanan COD" : "Buat Pesanan & Bayar Nanti"}
        </button>
      </form>
    </section>
  );
}
