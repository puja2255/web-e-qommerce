"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin, Navigation, Send, Truck } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { calcCartSubtotal, formatCurrency } from "@/lib/utils";
import {
  distanceInKm,
  googleMapsUrl,
  isLampungAddress,
  shippingQuote,
  warehouseLocation,
  type ShippingService,
} from "@/lib/address-service";

const FREE_SHIPPING_TAG = "FREE_SHIPPING";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, paymentMethods, createOrder, customerAddresses, customerSession, products } = useGoldenStore();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLabel, setAddressLabel] = useState("Rumah");
  const [customerAddress, setCustomerAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressMode, setAddressMode] = useState<"saved" | "manual">("saved");
  const [shippingService, setShippingService] = useState<ShippingService>("REGULER");
  const [geoPoint, setGeoPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const recipientAddresses = customerAddresses.filter((address) => (address.type ?? "RECIPIENT") === "RECIPIENT");
  const selectedAddress = recipientAddresses.find((address) => address.id === selectedAddressId) ?? recipientAddresses.find((address) => address.isPrimary);
  const cartHasFreeShipping = cart.some((item) => products.find((product) => product.id === item.productId)?.tags.includes(FREE_SHIPPING_TAG));
  const selectedCoordinates =
    addressMode === "saved" && selectedAddress?.latitude != null && selectedAddress.longitude != null
      ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
      : geoPoint;
  const distance = selectedCoordinates ? distanceInKm(warehouseLocation, selectedCoordinates) : null;
  const shippingTargetText = addressMode === "saved" ? selectedAddress?.province ?? selectedAddress?.city ?? "" : customerAddress;
  const instantAllowed = isLampungAddress(shippingTargetText);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calcCartSubtotal(cart);
  const shippingFee =
    cart.length === 0
      ? 0
      : cartHasFreeShipping
        ? 0
        : distance !== null
          ? shippingQuote(distance, shippingService, totalItems)
          : 0;
  const total = subtotal + shippingFee;
  const selectedPayment = paymentMethods.find((method) => method.id === paymentMethodId);

  useEffect(() => {
    if (!recipientAddresses.length) {
      setAddressMode("manual");
      return;
    }

    if (addressMode === "saved" && !selectedAddressId && recipientAddresses[0]) {
      setSelectedAddressId(recipientAddresses[0].id);
    }
  }, [addressMode, recipientAddresses, selectedAddressId]);

  useEffect(() => {
    if (!customerSession) {
      router.replace("/account?next=/checkout");
    }
  }, [customerSession, router]);

  useEffect(() => {
    if (!paymentMethods.some((method) => method.id === paymentMethodId)) {
      setPaymentMethodId(paymentMethods.find((method) => method.isActive)?.id ?? "");
    }
  }, [paymentMethodId, paymentMethods]);

  const chooseAddress = (id: string) => {
    const address = recipientAddresses.find((item) => item.id === id);
    setSelectedAddressId(id);
    if (!address) return;

    setAddressLabel(address.label);
    setCustomerName(address.recipientName);
    setCustomerPhone(address.phone);
    setPostalCode(address.postalCode ?? "");
    setCustomerAddress(`${address.detail}, ${address.district}, ${address.city}, ${address.province}`);
    setMapsLink(address.mapsUrl ?? "");
    setGeoPoint(
      address.latitude != null && address.longitude != null
        ? { latitude: address.latitude, longitude: address.longitude }
        : null,
    );
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setError("GPS tidak tersedia di browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (value) => {
        setGeoPoint({ latitude: value.coords.latitude, longitude: value.coords.longitude });
        setError("");
      },
      () => setError("Izin GPS ditolak."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!customerSession) return router.push("/account?next=/checkout");
    if (!cart.length) return setError("Keranjang masih kosong.");
    if (addressMode === "manual" && (!customerName || !customerPhone || !customerAddress || !postalCode || !mapsLink)) {
      return setError("Lengkapi data manual, alamat, dan titik lokasi/maps.");
    }
    if (addressMode === "saved" && !selectedAddress) {
      return setError("Pilih alamat tersimpan terlebih dahulu.");
    }
    if (!selectedCoordinates) {
      return setError("GPS atau alamat tersimpan wajib ada supaya ongkir bisa dihitung.");
    }
    if (shippingService === "INSTANT" && !instantAllowed) {
      return setError("Kurir instan hanya untuk alamat Lampung.");
    }

    setLoading(true);
    const order = await createOrder({
      customerName,
      customerPhone,
      customerAddress: `${addressLabel} - ${postalCode} - ${customerAddress}`,
      mapsLink,
      notes,
      paymentMethodId,
      customerId: customerSession.id,
      shippingFee,
    });
    setLoading(false);

    if (!order) {
      return setError("Pesanan gagal dibuat. Coba lagi.");
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

      <form className="stack" onSubmit={submit}>
        {recipientAddresses.length ? (
          <div className="address-checkout">
            <div className="eyebrow">
              <MapPin size={14} />
              Alamat pengiriman
            </div>
            <div className="auth-switch">
              <button type="button" className={addressMode === "saved" ? "active" : ""} onClick={() => setAddressMode("saved")}>
                Alamat tersimpan
              </button>
              <button
                type="button"
                className={addressMode === "manual" ? "active" : ""}
                onClick={() => {
                  setAddressMode("manual");
                  setSelectedAddressId("");
                  setGeoPoint(null);
                }}
              >
                Isi manual
              </button>
            </div>

            {addressMode === "saved" ? (
              <>
                <select className="select" value={selectedAddress?.id ?? ""} onChange={(event) => chooseAddress(event.target.value)}>
                  <option value="">Pilih alamat penerima</option>
                  {recipientAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label}
                      {address.isPrimary ? " (Utama)" : ""} - {address.city}
                    </option>
                  ))}
                </select>
                {selectedAddress ? (
                  <div className="checkout-address-preview">
                    <strong>{selectedAddress.recipientName}</strong>
                    <span>{selectedAddress.phone}</span>
                    <span>
                      {selectedAddress.detail}, {selectedAddress.district}, {selectedAddress.city}, {selectedAddress.province}
                    </span>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="muted tiny">Masukkan alamat manual, lalu aktifkan GPS supaya ongkir dapat dihitung.</p>
            )}
          </div>
        ) : null}

        {addressMode === "manual" ? (
          <>
            <div className="field-grid">
              <div className="field">
                <label>Nama</label>
                <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div className="field">
                <label>No WA</label>
                <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
              </div>
            </div>

            <div className="field-grid">
              <div className="field">
                <label>Label alamat</label>
                <input className="input" value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} required />
              </div>
              <div className="field">
                <label>Kode pos</label>
                <input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
            </div>

            <div className="field">
              <label>Alamat lengkap</label>
              <textarea className="textarea" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
            </div>

            <div className="field-grid">
              <div className="field">
                <label>Link Maps</label>
                <input className="input" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="Link Google Maps" />
              </div>
              <div className="field">
                <label>Catatan</label>
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan untuk kurir / admin" />
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <label>Catatan</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan untuk kurir / admin" />
          </div>
        )}

        <div className="field-grid">
          <div className="field">
            <label>
              <Navigation size={14} /> Titik GPS
            </label>
            <div className="row-actions" style={{ marginTop: 0 }}>
              <button className="button-outline" type="button" onClick={useGps}>
                Gunakan GPS
              </button>
              <span className="muted tiny">
                {selectedCoordinates ? `Titik terdeteksi ${selectedCoordinates.latitude.toFixed(5)}, ${selectedCoordinates.longitude.toFixed(5)}` : "Belum ada titik lokasi."}
              </span>
            </div>
          </div>
          <div className="field">
            <label>
              <Truck size={14} /> Kurir
            </label>
            <select className="select" value={shippingService} onChange={(e) => setShippingService(e.target.value as ShippingService)}>
              <option value="REGULER">Reguler</option>
              <option value="INSTANT">Instan</option>
            </select>
            {shippingService === "INSTANT" && !instantAllowed ? <span className="muted tiny">Instan hanya bisa dipakai untuk alamat Lampung.</span> : null}
          </div>
        </div>

        <div className="field">
          <label>Estimasi ongkir</label>
          <div className="shipping-quote">
            {cartHasFreeShipping ? "Gratis ongkir aktif" : formatCurrency(shippingFee)}
            <span>
              {distance !== null ? `${shippingService} · ${distance} km` : `${shippingService} · wajib GPS / alamat tersimpan`} · {totalItems} barang
            </span>
          </div>
        </div>

        <div className="field">
          <label>Metode Pembayaran</label>
          <select className="select" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
            {paymentMethods.filter((method) => method.isActive).map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {selectedPayment?.type !== "COD" ? (
          <div className="payment-preview">
            <strong>{selectedPayment?.label}</strong>
            <div className="payment-preview__account">
              {selectedPayment?.accountName}
              <strong>{selectedPayment?.accountNumber}</strong>
            </div>
            <div className="payment-window">
              <Clock3 size={17} /> Bayar setelah pesanan dibuat, maksimal 24 jam.
            </div>
          </div>
        ) : null}

        {cartHasFreeShipping ? (
          <div className="muted-box">
            Promo gratis ongkir aktif untuk salah satu produk di keranjang.
          </div>
        ) : null}

        {error ? <div className="muted-box" style={{ color: "var(--danger)" }}>{error}</div> : null}

        <div className="checkout-summary">
          <div className="checkout-summary__title">Ringkasan order</div>
          <div className="checkout-summary__rows">
            {cart.map((item) => (
              <div key={item.productId} className="checkout-summary__row">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div className="checkout-summary__row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="checkout-summary__row">
              <span>Ongkir</span>
              <strong>{cartHasFreeShipping ? "Gratis" : formatCurrency(shippingFee)}</strong>
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
