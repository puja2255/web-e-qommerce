"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin, Send, Truck } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { calcCartSubtotal, formatCurrency } from "@/lib/utils";
import { distanceInKm, shippingQuote, warehouseLocation } from "@/lib/address-service";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, paymentMethods, createOrder, customerAddresses, customerSession } = useGoldenStore();
  const [customerName, setCustomerName] = useState(""); const [customerPhone, setCustomerPhone] = useState(""); const [customerAddress, setCustomerAddress] = useState(""); const [mapsLink, setMapsLink] = useState(""); const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? ""); const [selectedAddressId, setSelectedAddressId] = useState(""); const [addressMode, setAddressMode] = useState<"saved" | "manual">("saved"); const [courier, setCourier] = useState<"JNE" | "J&T" | "SICEPAT">("JNE"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const recipientAddresses = customerAddresses.filter((address) => (address.type ?? "RECIPIENT") === "RECIPIENT");
  const selectedAddress = recipientAddresses.find((address) => address.id === selectedAddressId) ?? recipientAddresses.find((address) => address.isPrimary);
  const coordinates = addressMode === "saved" && selectedAddress?.latitude != null && selectedAddress.longitude != null ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude } : null;
  const distance = coordinates ? distanceInKm(warehouseLocation, coordinates) : null;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = !cart.length ? 0 : distance !== null ? shippingQuote(distance, courier, totalItems) : 18000 + Math.max(0, totalItems - 1) * 1000;
  const subtotal = calcCartSubtotal(cart); const total = subtotal + shippingFee; const selectedPayment = paymentMethods.find((method) => method.id === paymentMethodId);

  useEffect(() => { if (!customerSession) router.replace("/account?next=/checkout"); }, [customerSession, router]);
  useEffect(() => { if (!paymentMethods.some((method) => method.id === paymentMethodId)) setPaymentMethodId(paymentMethods.find((method) => method.isActive)?.id ?? ""); }, [paymentMethodId, paymentMethods]);
  const chooseAddress = (id: string) => { const address = recipientAddresses.find((item) => item.id === id); setSelectedAddressId(id); if (address) { setCustomerName(address.recipientName); setCustomerPhone(address.phone); setCustomerAddress(`${address.detail}, ${address.district}, ${address.city}, ${address.province} ${address.postalCode ?? ""}`); setMapsLink(address.mapsUrl ?? ""); } };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(""); if (!customerSession) return router.push("/account?next=/checkout"); if (!cart.length) return setError("Keranjang masih kosong."); if (!customerName || !customerPhone || !customerAddress || !paymentMethodId) return setError("Lengkapi data checkout."); setLoading(true); const order = await createOrder({ customerName, customerPhone, customerAddress, mapsLink, notes, paymentMethodId, customerId: customerSession.id, shippingFee }); setLoading(false); if (!order) return setError("Pesanan gagal dibuat. Coba lagi."); router.push(`/checkout/success?order=${order.orderNumber}`); };

  return <section className="panel checkout-shell"><div className="eyebrow"><Send size={14} /> Checkout</div><h1 style={{ marginBottom: 8 }}>Isi data pengiriman</h1><form className="stack" onSubmit={submit}>
    {recipientAddresses.length ? <div className="address-checkout"><div className="eyebrow"><MapPin size={14} /> Alamat pengiriman</div><div className="auth-switch"><button type="button" className={addressMode === "saved" ? "active" : ""} onClick={() => setAddressMode("saved")}>Alamat tersimpan</button><button type="button" className={addressMode === "manual" ? "active" : ""} onClick={() => { setAddressMode("manual"); setSelectedAddressId(""); }}>Isi manual</button></div>{addressMode === "saved" ? <select className="select" value={selectedAddress?.id ?? ""} onChange={(event) => chooseAddress(event.target.value)}><option value="">Pilih alamat penerima</option>{recipientAddresses.map((address) => <option key={address.id} value={address.id}>{address.label}{address.isPrimary ? " (Utama)" : ""} — {address.city}</option>)}</select> : <p className="muted tiny">Masukkan alamat lengkap di bawah. Ongkir dihitung dari wilayah dan jumlah barang.</p>}</div> : null}
    <div className="field-grid"><div className="field"><label>Nama</label><input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div><div className="field"><label>No WA</label><input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required /></div></div>
    <div className="field"><label>Alamat</label><textarea className="textarea" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required /></div>
    <div className="field-grid"><div className="field"><label>Link Maps <span className="muted tiny">(opsional)</span></label><input className="input" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="Link Google Maps" /></div><div className="field"><label>Catatan</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div></div>
    <div className="field-grid"><div className="field"><label><Truck size={14} /> Kurir</label><select className="select" value={courier} onChange={(e) => setCourier(e.target.value as typeof courier)}><option value="JNE">JNE Reguler</option><option value="J&T">J&T EZ</option><option value="SICEPAT">SiCepat BEST</option></select></div><div className="field"><label>Estimasi ongkir</label><div className="shipping-quote">{formatCurrency(shippingFee)}<span>{distance !== null ? `${courier} · ${distance} km` : `${courier} · estimasi wilayah`} · {totalItems} barang</span></div></div></div>
    <div className="field"><label>Metode Pembayaran</label><select className="select" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>{paymentMethods.filter((method) => method.isActive).map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}</select></div>
    {selectedPayment?.type !== "COD" ? <div className="payment-preview"><strong>{selectedPayment?.label}</strong><div className="payment-preview__account">{selectedPayment?.accountName}<strong>{selectedPayment?.accountNumber}</strong></div><div className="payment-window"><Clock3 size={17} /> Bayar setelah pesanan dibuat, maksimal 24 jam.</div></div> : null}
    {error ? <div className="muted-box" style={{ color: "var(--danger)" }}>{error}</div> : null}
    <div className="checkout-summary"><div className="checkout-summary__title">Ringkasan order</div><div className="checkout-summary__rows">{cart.map((item) => <div key={item.productId} className="checkout-summary__row"><span>{item.name} × {item.quantity}</span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}<div className="checkout-summary__row"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="checkout-summary__row"><span>Ongkir</span><strong>{formatCurrency(shippingFee)}</strong></div><div className="checkout-summary__row checkout-summary__row--total"><span>Total</span><strong>{formatCurrency(total)}</strong></div></div></div>
    <button className="button" type="submit" disabled={loading}>{loading ? "Memproses..." : selectedPayment?.type === "COD" ? "Buat Pesanan COD" : "Buat Pesanan & Bayar Nanti"}</button>
  </form></section>;
}
