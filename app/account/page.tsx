"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, LogOut, MapPin, PackageCheck, PackageOpen, Truck, UserRound } from "lucide-react";
import { AddressForm } from "@/components/address-form";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, shortDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "COMPLETED"] as const;
const stepLabel: Record<(typeof STEPS)[number], string> = { PENDING: "Pesanan dibuat", CONFIRMED: "Dikonfirmasi", PACKED: "Dikemas", SHIPPED: "Dikirim", COMPLETED: "Selesai" };
const statusIcon: Record<OrderStatus, typeof PackageOpen> = { PENDING: Clock3, CONFIRMED: CheckCircle2, PACKED: PackageOpen, SHIPPED: Truck, COMPLETED: PackageCheck, CANCELLED: Clock3 };

function Countdown({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const remaining = new Date(dueAt).getTime() - now;
  if (remaining <= 0) return <div className="payment-countdown payment-countdown--expired">Waktu pembayaran telah berakhir</div>;
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return <div className="payment-countdown"><Clock3 size={16} /><span>Selesaikan pembayaran dalam</span><strong>{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong></div>;
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const Icon = statusIcon[order.status];
  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const isAwaitingPayment = order.paymentStatus === "UNPAID" && Boolean(order.paymentDueAt);
  return <article className="order-card" style={{ animationDelay: `${index * 70}ms` }}>
    <div className="order-card__top">
      <div className="order-status-icon"><Icon size={19} /></div>
      <div className="order-card__identity"><span className="muted tiny">{shortDate(order.createdAt)}</span><strong>{order.orderNumber}</strong></div>
      <span className={`order-status order-status--${order.status.toLowerCase()}`}>{stepLabel[order.status as keyof typeof stepLabel] ?? "Dibatalkan"}</span>
    </div>
    <div className="order-card__summary">
      <div><span className="muted tiny">Total belanja</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
      <div><span className="muted tiny">Pembayaran</span><strong>{isAwaitingPayment ? "Menunggu pembayaran" : order.paymentStatus === "VERIFIED" ? "Terverifikasi" : "Diproses"}</strong></div>
    </div>
    {isAwaitingPayment && order.paymentDueAt ? <Countdown dueAt={order.paymentDueAt} /> : null}
    <div className="order-progress" aria-label={`Status ${stepLabel[order.status as keyof typeof stepLabel] ?? order.status}`}>
      {STEPS.map((step, stepIndex) => <div key={step} className={`order-progress__step ${stepIndex <= currentStep ? "is-active" : ""} ${stepIndex === currentStep ? "is-current" : ""}`}><span>{stepIndex < currentStep ? <CheckCircle2 size={13} /> : stepIndex + 1}</span><small>{stepLabel[step]}</small></div>)}
    </div>
  </article>;
}

export default function AccountPage() {
  const router = useRouter();
  const { customerSession, customerAddresses, orders, registerCustomer, loginCustomer, logoutCustomer, saveCustomerAddress, deleteCustomerAddress } = useGoldenStore();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState<"login" | "register">("login"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const next = typeof window === "undefined" ? "/account" : new URLSearchParams(window.location.search).get("next") || "/account";
  const register = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(""); const result = mode === "login" ? await loginCustomer(email, password) : await registerCustomer({ name, email, phone, password }); setBusy(false); if (!result.ok) { setError(result.message ?? "Akun tidak dapat diproses."); return; } router.push(next); };
  const myOrders = useMemo(() => customerSession ? orders.filter((order) => order.customerId === customerSession.id) : [], [customerSession, orders]);

  if (!customerSession) return <section className="panel auth-shell" style={{ maxWidth: 620, margin: "0 auto" }}><div className="eyebrow"><UserRound size={14} /> Akun pembeli</div><h1>{mode === "login" ? "Masuk ke akunmu" : "Buat akun untuk belanja lebih mudah"}</h1><p className="muted">Checkout, ulasan, alamat, dan riwayat pesanan tersimpan aman di akunmu.</p><div className="auth-switch"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Masuk</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Daftar</button></div><form className="stack" onSubmit={register}>{mode === "register" ? <><div className="field"><label>Nama lengkap (unik)</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={3} required /></div></> : null}<div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>{mode === "register" ? <div className="field"><label>No. WhatsApp</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} minLength={8} required /></div> : null}<div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></div>{error ? <p className="review-feedback">{error}</p> : null}<button className="button" type="submit" disabled={busy}><UserRound size={16} />{busy ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}</button><a className="button-outline google-button" href={`/api/auth/google?next=${encodeURIComponent(next)}`}>G <span>Masuk dengan Google</span></a></form></section>;

  return <div className="stack account-page"><section className="account-hero"><div><div className="eyebrow"><UserRound size={14} /> Akun Saya</div><h1>Halo, {customerSession.name.split(" ")[0]}!</h1><p>{customerSession.email} · {customerSession.phone}</p></div><div className="account-hero__stats"><div><strong>{myOrders.length}</strong><span>Pesanan</span></div><div><strong>{myOrders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status)).length}</strong><span>Sedang berjalan</span></div></div><button className="button-outline" onClick={logoutCustomer}><LogOut size={16} /> Keluar</button></section><section className="grid grid-2"><div className="panel"><div className="eyebrow"><MapPin size={14} /> Pusat alamat</div><h2>Pengiriman, toko & retur</h2><AddressForm addresses={customerAddresses} recipientName={customerSession.name} phone={customerSession.phone} onSave={saveCustomerAddress} onDelete={deleteCustomerAddress} /></div><div className="panel orders-panel"><div className="orders-panel__heading"><div><div className="eyebrow"><PackageCheck size={14} /> Pesanan saya</div><h2>Riwayat & status</h2></div><span className="orders-count">{myOrders.length} pesanan</span></div>{myOrders.length === 0 ? <div className="orders-empty"><PackageOpen size={30} /><strong>Belum ada pesanan</strong><span>Pesanan yang dibuat dari akun ini akan tampil di sini.</span></div> : <div className="order-list">{myOrders.map((order, index) => <OrderCard order={order} index={index} key={order.id} />)}</div>}</div></section></div>;
}
