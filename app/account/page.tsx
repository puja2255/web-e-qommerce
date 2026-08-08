"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  PackageCheck,
  PackageOpen,
  PencilLine,
  ShieldCheck,
  Star,
  Truck,
  Upload,
  UserRound,
} from "lucide-react";
import { AddressForm } from "@/components/address-form";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, shortDate } from "@/lib/utils";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/types";


const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "COMPLETED"] as const;
const stepLabel: Record<(typeof STEPS)[number], string> = {
  PENDING: "Pesanan dibuat",
  CONFIRMED: "Dikonfirmasi",
  PACKED: "Dikemas",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
};
const statusIcon: Record<OrderStatus, typeof PackageOpen> = {
  PENDING: Clock3,
  CONFIRMED: CheckCircle2,
  PACKED: PackageOpen,
  SHIPPED: Truck,
  COMPLETED: PackageCheck,
  CANCELLED: Clock3,
};

type OtpPurpose = "REGISTER" | "PROFILE" | "RESET_PASSWORD";

function formatOtpCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function Countdown({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = new Date(dueAt).getTime() - now;
  if (remaining <= 0) {
    return <div className="payment-countdown payment-countdown--expired">Waktu pembayaran telah berakhir</div>;
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return (
    <div className="payment-countdown">
      <Clock3 size={16} />
      <span>Selesaikan pembayaran dalam</span>
      <strong>
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </strong>
    </div>
  );
}

function OtpCountdown({ label, expiresAt }: { label: string; expiresAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) {
    return <span className="tiny muted">OTP belum dikirim.</span>;
  }

  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) {
    return <span className="tiny muted">OTP kedaluwarsa. Silakan kirim ulang.</span>;
  }

  return (
    <span className="tiny muted">
      {label} tersisa <strong>{formatOtpCountdown(remaining)}</strong>
    </span>
  );
}

function OrderCard({
  order,
  paymentMethod,
  index,
  onProof,
  onReceived,
}: {
  order: Order;
  paymentMethod?: PaymentMethod;
  index: number;
  onProof: (orderId: string, file: File) => Promise<void>;
  onReceived: (orderId: string) => void;
}) {
  const Icon = statusIcon[order.status];
  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const isAwaitingPayment = order.paymentStatus === "UNPAID" && Boolean(order.paymentDueAt);
  const paymentExpired = Boolean(order.paymentDueAt && new Date(order.paymentDueAt).getTime() <= Date.now());
  const canUploadProof = paymentMethod?.type !== "COD" && order.status !== "CANCELLED" && order.paymentStatus === "UNPAID" && !paymentExpired;
  const paymentSummary =
    paymentMethod?.type === "COD"
      ? "COD"
      : paymentMethod
        ? `${paymentMethod.label}${paymentMethod.accountNumber ? `  -  ${paymentMethod.accountNumber}` : ""}`
        : "Metode pembayaran tidak ditemukan";
  const [proofBusy, setProofBusy] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");

  const submitReview = async (productId: string) => {
    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: order.orderNumber, rating, comment }),
    });
    const result = await response.json();
    setFeedback(response.ok ? "Ulasan terkirim. Terima kasih!" : result.message ?? "Ulasan gagal dikirim.");
    if (response.ok) {
      setReviewing(null);
      setComment("");
    }
  };

  return (
    <article className="order-card" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="order-card__top">
        <div className="order-status-icon">
          <Icon size={19} />
        </div>
        <div className="order-card__identity">
          <span className="muted tiny">{shortDate(order.createdAt)}</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <span className={`order-status order-status--${order.status.toLowerCase()}`}>
          {stepLabel[order.status as keyof typeof stepLabel] ?? "Dibatalkan"}
        </span>
      </div>

      <div className="order-card__summary">
        <div>
          <span className="muted tiny">Total belanja</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
        <div>
          <span className="muted tiny">Pembayaran</span>
          <strong>
            {paymentMethod?.type === "COD"
              ? "COD"
              : isAwaitingPayment
                ? "Menunggu pembayaran"
                : order.paymentStatus === "VERIFIED"
                  ? "Terverifikasi"
                  : "Diproses"}
          </strong>
        </div>
      </div>

      <div className="muted-box" style={{ display: "grid", gap: 4 }}>
        <span className="tiny muted">Metode pembayaran</span>
        <strong>{paymentSummary}</strong>
        {paymentMethod?.type === "COD" ? (
          <span className="tiny muted">Bayar saat pesanan diterima.</span>
        ) : paymentMethod ? (
          <span className="tiny muted">
            {paymentMethod.accountName || paymentMethod.label}
            {paymentMethod.details ? `  -  ${paymentMethod.details}` : ""}
          </span>
        ) : null}
      </div>

      {isAwaitingPayment && order.paymentDueAt ? <Countdown dueAt={order.paymentDueAt} /> : null}

      {paymentExpired ? (
        <div className="muted-box" style={{ marginTop: 12 }}>
          {order.status === "CANCELLED"
            ? "Tenggat 24 jam habis. Pesanan dibatalkan otomatis dan bukti pembayaran tidak bisa diupload lagi."
            : "Tenggat 24 jam sudah habis. Pesanan akan dibatalkan otomatis dan bukti pembayaran tidak bisa diupload lagi."}
        </div>
      ) : null}

      {canUploadProof ? (
        <label className="button-outline" style={{ marginTop: 12, display: "inline-flex", width: "fit-content" }}>
          <Upload size={16} />
          {proofBusy ? "Mengunggah..." : "Upload bukti pembayaran"}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={proofBusy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setProofBusy(true);
              await onProof(order.id, file);
              setProofBusy(false);
            }}
          />
        </label>
      ) : order.paymentProofUrl ? (
        <a className="button-outline" style={{ marginTop: 12, display: "inline-flex", width: "fit-content" }} href={order.paymentProofUrl} target="_blank" rel="noreferrer">
          Lihat bukti pembayaran
        </a>
      ) : null}

      <div className="order-progress" aria-label={`Status ${stepLabel[order.status as keyof typeof stepLabel] ?? order.status}`}>
        {STEPS.map((step, stepIndex) => (
          <div key={step} className={`order-progress__step ${stepIndex <= currentStep ? "is-active" : ""} ${stepIndex === currentStep ? "is-current" : ""}`}>
            <span>{stepIndex < currentStep ? <CheckCircle2 size={13} /> : stepIndex + 1}</span>
            <small>{stepLabel[step]}</small>
          </div>
        ))}
      </div>

      {order.status === "SHIPPED" ? (
        <div className="muted-box" style={{ marginTop: 14 }}>
          <div className="row-actions" style={{ marginTop: 0 }}>
            <button className="button" type="button" onClick={() => onReceived(order.id)}>
              <Truck size={16} />
              Pesanan Diterima
            </button>
          </div>
        </div>
      ) : null}

      {order.status === "COMPLETED" ? (
        <div className="stack" style={{ marginTop: 16, gap: 8 }}>
          <strong>Beri ulasan produk</strong>
          {order.items.map((item) => (
            <div className="muted-box" key={item.productId}>
              <strong>{item.productName}</strong>
              {reviewing === item.productId ? (
                <div className="stack" style={{ marginTop: 8, gap: 8 }}>
                  <select className="select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option value={value} key={value}>
                        {value} bintang
                      </option>
                    ))}
                  </select>
                  <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis ulasan minimal 3 karakter" />
                  <div className="row-actions">
                    <button className="button" type="button" onClick={() => void submitReview(item.productId)}>
                      <Star size={16} />
                      Kirim ulasan
                    </button>
                    <button className="button-ghost" type="button" onClick={() => setReviewing(null)}>
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button className="button-outline" type="button" style={{ marginTop: 8 }} onClick={() => { setReviewing(item.productId); setFeedback(""); }}>
                  <Star size={16} />
                  Beri ulasan
                </button>
              )}
            </div>
          ))}
          {feedback ? <span className="muted tiny">{feedback}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const {
    customerSession,
    customerAddresses,
    paymentMethods,
    orders,
    registerCustomer,
    loginCustomer,
    requestOtp,
    updateCustomerProfile,
    resetCustomerPassword,
    logoutCustomer,
    saveCustomerAddress,
    deleteCustomerAddress,
    updateOrderStatus,
    uploadPaymentProof,
    refreshData,
  } = useGoldenStore();

  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [tab, setTab] = useState<"profile" | "addresses" | "orders">("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileOtp, setProfileOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<Record<string, string>>({});
  const [clock, setClock] = useState(() => Date.now());

  const next = typeof window === "undefined" ? "/account" : new URLSearchParams(window.location.search).get("next") || "/account";

  useEffect(() => {
    if (customerSession) {
      setProfileName(customerSession.name);
    }
  }, [customerSession]);

  useEffect(() => {
    if (!customerSession) return;
    void refreshData();
    const timer = window.setInterval(() => void refreshData(), 30000);
    return () => window.clearInterval(timer);
  }, [customerSession, refreshData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const myOrders = useMemo(() => (customerSession ? orders.filter((order) => order.customerId === customerSession.id) : []), [customerSession, orders]);
  const paymentMethodMap = useMemo(() => new Map(paymentMethods.map((method) => [method.id, method])), [paymentMethods]);

  const otpTarget = (purpose: OtpPurpose) => (purpose === "PROFILE" ? customerSession?.email ?? email : email).trim().toLowerCase();
  const otpKey = (purpose: OtpPurpose, target: string) => `${purpose}:${target}`;
  const currentOtpExpiry = (purpose: OtpPurpose) => {
    const target = otpTarget(purpose);
    return otpExpiresAt[otpKey(purpose, target)] ?? null;
  };
  const isOtpCoolingDown = (purpose: OtpPurpose) => {
    const expiresAt = currentOtpExpiry(purpose);
    return Boolean(expiresAt && new Date(expiresAt).getTime() > clock);
  };

  const sendOtp = async (purpose: OtpPurpose) => {
    const target = otpTarget(purpose);
    const result = await requestOtp(target, purpose);
    setToast(result.ok ? result.message ?? "OTP telah dikirim ke email." : result.message ?? "OTP gagal dikirim.");
    if (result.ok || result.retryAfterSeconds) {
      const expiresAt = result.expiresAt ?? new Date(Date.now() + (result.retryAfterSeconds ?? 300) * 1000).toISOString();
      setOtpExpiresAt((current) => ({ ...current, [otpKey(purpose, target)]: expiresAt }));
    }
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    let result: { ok: boolean; message?: string } = { ok: false };

    if (mode === "login") {
      result = await loginCustomer(email, password);
    } else if (mode === "register") {
      result = await registerCustomer({ name, email, password, otp });
    } else {
      result = await resetCustomerPassword({ email, password, otp });
    }

    setBusy(false);
    if (!result.ok) {
      setError(result.message ?? "Akun tidak dapat diproses.");
      return;
    }

    router.push(next);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const result = await updateCustomerProfile({ name: profileName || undefined, password: profilePassword || undefined, otp: profileOtp });
    setError(result.ok ? "Profil diperbarui." : result.message ?? "Profil gagal diperbarui.");
    if (result.ok) {
      setProfilePassword("");
      setProfileOtp("");
    }
  };

  const uploadProof = async (orderId: string, file: File) => {
    await uploadPaymentProof(orderId, file);
  };

  if (!customerSession) {
    return (
      <section className="panel auth-shell" style={{ maxWidth: 620, margin: "0 auto" }}>
        <div className="eyebrow">
          <UserRound size={14} />
          Akun pembeli
        </div>
        <h1>{mode === "login" ? "Masuk ke akunmu" : mode === "register" ? "Buat akun untuk belanja lebih mudah" : "Lupa password"}</h1>
        <p className="muted">
          {mode === "reset"
            ? "Masukkan email, kirim OTP, lalu set password baru."
            : "Login cukup pakai nama atau email dan password."}
        </p>

        <div className="auth-switch">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>
            Masuk
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>
            Daftar
          </button>
        </div>

        <form className="stack" onSubmit={submitAuth}>
          {mode === "register" ? (
            <div className="field">
              <label>Nama lengkap (unik)</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={3} required />
            </div>
          ) : null}

          <div className="field">
            <label>{mode === "login" ? "Nama atau email" : "Email"}</label>
            <input className="input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            {mode === "login" ? (
              <button
                className="button-ghost auth-forgot"
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError("");
                }}
              >
                Lupa password?
              </button>
            ) : null}
          </div>

          {mode !== "login" ? (
            <div className="field">
              <label>OTP email</label>
              <div className="stack" style={{ gap: 10 }}>
                <div className="row-actions">
                  <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
                  <button
                    className="button-outline"
                    type="button"
                    disabled={isOtpCoolingDown(mode === "register" ? "REGISTER" : "RESET_PASSWORD")}
                    onClick={() => void sendOtp(mode === "register" ? "REGISTER" : "RESET_PASSWORD")}
                  >
                    {isOtpCoolingDown(mode === "register" ? "REGISTER" : "RESET_PASSWORD") ? "OTP aktif" : "Kirim OTP"}
                  </button>
                </div>
                <OtpCountdown
                  label="Timer OTP"
                  expiresAt={currentOtpExpiry(mode === "register" ? "REGISTER" : "RESET_PASSWORD")}
                />
              </div>
            </div>
          ) : null}

          {error ? <div className="muted-box" style={{ color: "var(--danger)" }}>{error}</div> : null}

          <button className="button" type="submit" disabled={busy}>
            <UserRound size={16} />
            {busy ? "Memproses..." : mode === "login" ? "Masuk" : mode === "register" ? "Buat akun" : "Lupa password"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="stack account-page">
      {toast ? (
        <div className="toast-notice" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
      <section className="account-hero panel">
        <div className="account-hero__main">
          {/* Badge Akun Saya */}
          <div className="eyebrow">
            <UserRound size={14} />
            Akun Saya
          </div>

          <div className="account-nav" style={{ marginTop: "12px", width: "100%", maxWidth: "220px" }}>
            <select
              id="account-nav"
              className="select"
              value={tab}
              onChange={(event) => setTab(event.target.value as typeof tab)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text)",
                border: "1px solid var(--line)",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <option value="profile" style={{ background: "#1e1710", color: "#f7f0dd" }}>
                Profil Saya
              </option>
              <option value="addresses" style={{ background: "#1e1710", color: "#f7f0dd" }}>
                Alamat Saya
              </option>
              <option value="orders" style={{ background: "#1e1710", color: "#f7f0dd" }}>
                Pesanan Saya
              </option>
            </select>
          </div>

          <h1 style={{ marginTop: "16px" }}>Halo, {customerSession.name.split(" ")[0]}!</h1>
          <p>
            {customerSession.email}  |  {customerSession.phone}
          </p>
        </div>

        <div className="account-hero__stats">
          <div>
            <strong>{myOrders.length}</strong>
            <span>Pesanan</span>
          </div>
          <div>
            <strong>{myOrders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status)).length}</strong>
            <span>Sedang berjalan</span>
          </div>
        </div>

        <button className="button-outline account-logout" type="button" onClick={logoutCustomer}>
          <LogOut size={16} />
          Keluar
        </button>
      </section>

      {tab === "profile" ? (
        <section className="panel profile-shell">
          <div className="profile-summary">
            <div className="eyebrow">
              <PencilLine size={14} />
              Profil saya
            </div>
            <h2>{customerSession.name}</h2>
            <p className="muted">
              {customerSession.email}  |  {customerSession.phone}
            </p>
          </div>

          <div className="muted-box profile-detail">
            <div>
              <span className="tiny muted">Email</span>
              <strong>{customerSession.email}</strong>
            </div>
            <div>
              <span className="tiny muted">No WA</span>
              <strong>{customerSession.phone}</strong>
            </div>
            <div>
              <span className="tiny muted">Password</span>
              <strong>Disembunyikan</strong>
            </div>
          </div>

          <form className="stack profile-form" onSubmit={saveProfile}>
            <div className="eyebrow">
              <PencilLine size={14} />
              Edit profil
            </div>
            <h2>Ubah nama atau password</h2>
            <p className="muted">Setiap perubahan harus diverifikasi dengan OTP email.</p>

            <div className="field">
              <label>Nama</label>
              <input className="input" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </div>
            <div className="field">
              <label>Password baru</label>
              <input className="input" type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} minLength={8} placeholder="Kosongkan jika tidak diubah" />
            </div>
            <div className="field">
              <label>OTP email</label>
              <div className="stack" style={{ gap: 10 }}>
                <div className="row-actions">
                  <input className="input" value={profileOtp} onChange={(event) => setProfileOtp(event.target.value)} maxLength={6} required />
                  <button
                    className="button-outline"
                    type="button"
                    disabled={isOtpCoolingDown("PROFILE")}
                    onClick={() => void sendOtp("PROFILE")}
                  >
                    {isOtpCoolingDown("PROFILE") ? "OTP aktif" : "Kirim OTP"}
                  </button>
                </div>
                <OtpCountdown label="Timer OTP" expiresAt={currentOtpExpiry("PROFILE")} />
              </div>
            </div>
            <button className="button" type="submit">
              <ShieldCheck size={16} />
              Simpan profil
            </button>
          </form>
        </section>
      ) : null}

      {tab === "addresses" ? (
        <section className="panel">
          <div className="eyebrow">
            <MapPin size={14} />
            Pusat alamat
          </div>
          <h2>Alamat pengiriman</h2>
          <AddressForm
            addresses={customerAddresses}
            recipientName={customerSession.name}
            phone={customerSession.phone}
            onSave={saveCustomerAddress}
            onDelete={deleteCustomerAddress}
          />
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className="panel orders-panel">
          <div className="orders-panel__heading">
            <div>
              <div className="eyebrow">
                <PackageCheck size={14} />
                Pesanan saya
              </div>
              <h2>Riwayat & status</h2>
            </div>
            <span className="orders-count">{myOrders.length} pesanan</span>
          </div>
          {myOrders.length === 0 ? (
            <div className="orders-empty">
              <PackageOpen size={30} />
              <strong>Belum ada pesanan</strong>
              <span>Pesanan yang dibuat dari akun ini akan tampil di sini.</span>
            </div>
          ) : (
            <div className="order-list">
              {myOrders.map((order, index) => (
                <OrderCard
                  order={order}
                  paymentMethod={paymentMethodMap.get(order.paymentMethodId)}
                  index={index}
                  key={order.id}
                  onProof={uploadProof}
                  onReceived={(orderId) => updateOrderStatus(orderId, "COMPLETED")}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

