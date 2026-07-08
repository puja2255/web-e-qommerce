"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Send, ImagePlus, X } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, calcCartSubtotal } from "@/lib/utils";

const MAX_PROOF_SIZE = 3 * 1024 * 1024;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, paymentMethods, createOrder } = useGoldenStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentProofName, setPaymentProofName] = useState("");
  const [paymentProofError, setPaymentProofError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPayment = paymentMethods.find((method) => method.id === paymentMethodId);
  const subtotal = calcCartSubtotal(cart);
  const shippingFee = cart.length > 0 ? 25000 : 0;
  const total = subtotal + shippingFee;
  const proofRequired = selectedPayment?.type !== "COD";

  const handleProof = async (file: File | null) => {
    setPaymentProofError("");

    if (!file) {
      setPaymentProofUrl("");
      setPaymentProofName("");
      return;
    }

    if (file.size > MAX_PROOF_SIZE) {
      setPaymentProofError("Ukuran file maksimal 3 MB.");
      setPaymentProofUrl("");
      setPaymentProofName("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPaymentProofUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
    setPaymentProofName(file.name);
  };

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

    if (proofRequired && !paymentProofUrl) {
      setError("Upload bukti transfer untuk pembayaran non-COD.");
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
      paymentProofUrl,
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
        Masukkan nama, no WA, alamat, link maps, catatan, dan metode pembayaran.
      </p>

      <form className="stack" onSubmit={handleSubmit}>
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
              <div className="payment-preview__account">
                <div>{selectedPayment.accountName}</div>
                <strong>{selectedPayment.accountNumber}</strong>
              </div>
            ) : null}
          </div>
        ) : null}

        {proofRequired ? (
          <div className="upload-card">
            <div className="upload-card__top">
              <div>
                <strong>Bukti transfer</strong>
                <div className="muted tiny">Format gambar JPG, PNG, atau WEBP. Maksimal 3 MB.</div>
              </div>
              <ImagePlus size={18} />
            </div>
            <label className="upload-dropzone">
              <input
                className="upload-input"
                type="file"
                accept="image/*"
                onChange={(event) => handleProof(event.target.files?.[0] ?? null)}
              />
              {paymentProofUrl ? (
                <div className="upload-preview">
                  <img src={paymentProofUrl} alt={paymentProofName || "Bukti transfer"} />
                  <div className="upload-preview__meta">
                    <strong>{paymentProofName || "Bukti transfer"}</strong>
                    <span className="muted tiny">Klik area ini untuk mengganti file</span>
                  </div>
                </div>
              ) : (
                <div className="upload-dropzone__empty">
                  <FileUp size={18} />
                  <span>Upload bukti transfer</span>
                </div>
              )}
            </label>
            {paymentProofError ? <div className="muted-box" style={{ color: "var(--danger)" }}>{paymentProofError}</div> : null}
            {paymentProofUrl ? (
              <button
                type="button"
                className="button-ghost"
                style={{ width: "fit-content" }}
                onClick={() => {
                  setPaymentProofUrl("");
                  setPaymentProofName("");
                }}
              >
                <X size={16} />
                Hapus file
              </button>
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
          {loading ? "Memproses..." : "Buat Pesanan"}
        </button>
      </form>
    </section>
  );
}
