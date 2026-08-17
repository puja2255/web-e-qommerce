"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
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
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<Record<string, "image" | "video">>({});
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { refreshData } = useGoldenStore();

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    const newUrls: string[] = [];
    const newTypes = { ...mediaTypes };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert(`Format file ${file.name} tidak didukung. Pilih foto atau video.`);
        continue;
      }

      if (isImage && file.size > 5 * 1024 * 1024) {
        alert(`Ukuran foto ${file.name} melebihi 5 MB.`);
        continue;
      }

      if (isVideo && file.size > 20 * 1024 * 1024) {
        alert(`Ukuran video ${file.name} melebihi 20 MB.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
          newTypes[data.url] = isImage ? "image" : "video";
        } else {
          alert(data.message || `Gagal mengunggah ${file.name}`);
        }
      } catch {
        alert(`Gagal mengunggah ${file.name}`);
      }
    }

    setMediaUrls((prev) => [...prev, ...newUrls]);
    setMediaTypes(newTypes);
    setUploadingMedia(false);
  };

  const removeUploadedMedia = (url: string) => {
    setMediaUrls((prev) => prev.filter((item) => item !== url));
    setMediaTypes((prev) => {
      const copy = { ...prev };
      delete copy[url];
      return copy;
    });
  };

  const submitReview = async (productId: string, reviewId?: string | null) => {
    const images = mediaUrls.filter((url) => mediaTypes[url] === "image");
    const videos = mediaUrls.filter((url) => mediaTypes[url] === "video");

    const endpoint = reviewId ? `/api/reviews/${reviewId}` : `/api/products/${productId}/reviews`;
    const method = reviewId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        rating,
        comment,
        images,
        videos,
      }),
    });
    const result = await response.json();
    setFeedback(response.ok ? "Ulasan berhasil dikirim!" : result.message ?? "Ulasan gagal dikirim.");
    if (response.ok) {
      setReviewing(null);
      setEditingReviewId(null);
      setComment("");
      setMediaUrls([]);
      setMediaTypes({});
      void refreshData();
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) return;
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: "DELETE",
    });
    const result = await response.json();
    setFeedback(response.ok ? "Ulasan berhasil dihapus." : result.message ?? "Ulasan gagal dihapus.");
    if (response.ok) {
      void refreshData();
    }
  };

  const startEditReview = (item: any) => {
    const rev = item.review;
    if (!rev) return;
    setReviewing(item.productId);
    setEditingReviewId(rev.id);
    setRating(rev.rating);
    setComment(rev.comment);
    setFeedback("");

    const urls = [...(rev.images || []), ...(rev.videos || [])];
    const types: Record<string, "image" | "video"> = {};
    (rev.images || []).forEach((u: string) => { types[u] = "image"; });
    (rev.videos || []).forEach((u: string) => { types[u] = "video"; });

    setMediaUrls(urls);
    setMediaTypes(types);
  };

  const cancelReview = () => {
    setReviewing(null);
    setEditingReviewId(null);
    setComment("");
    setMediaUrls([]);
    setMediaTypes({});
    setFeedback("");
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
              : order.paymentStatus === "PAID"
                ? "Sudah Bayar"
                : order.paymentStatus === "VERIFIED"
                  ? "Terverifikasi"
                  
                    : isAwaitingPayment
                      ? "Menunggu pembayaran"
                      : "Belum Bayar"}
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
          <strong>Ulasan produk</strong>
          {order.items.map((item) => {
            const hasReview = !!item.review;
            const isThisReviewing = reviewing === item.productId;

            return (
              <div className="muted-box" key={item.productId} style={{ display: "grid", gap: 6 }}>
                <strong>{item.productName}</strong>

                {isThisReviewing ? (
                  <div className="stack" style={{ marginTop: 8, gap: 8 }}>
                    <select className="select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option value={value} key={value}>
                          {value} bintang
                        </option>
                      ))}
                    </select>
                    <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis ulasan minimal 3 karakter" />
                    
                    {/* Media Upload */}
                    <div className="stack" style={{ gap: 6 }}>
                      <label className="button-outline" style={{ display: "inline-flex", width: "fit-content", cursor: "pointer" }}>
                        <Upload size={16} />
                        {uploadingMedia ? "Mengunggah..." : "Unggah Foto / Video"}
                        <input type="file" multiple accept="image/*,video/*" hidden onChange={handleMediaUpload} disabled={uploadingMedia} />
                      </label>
                      <span className="tiny muted">Maksimal ukuran foto 5MB dan video 20MB.</span>

                      {mediaUrls.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          {mediaUrls.map((url) => (
                            <div key={url} style={{ position: "relative", width: 80, height: 80, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                              {mediaTypes[url] === "image" ? (
                                <img src={url} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              )}
                              <button
                                type="button"
                                onClick={() => removeUploadedMedia(url)}
                                style={{
                                  position: "absolute",
                                  top: 2,
                                  right: 2,
                                  background: "rgba(0,0,0,0.6)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: 18,
                                  height: 18,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 10,
                                  cursor: "pointer",
                                }}
                              >
                                x
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="row-actions">
                      <button className="button" type="button" onClick={() => void submitReview(item.productId, editingReviewId)}>
                        <Star size={16} />
                        {editingReviewId ? "Simpan Perubahan" : "Kirim ulasan"}
                      </button>
                      <button className="button-ghost" type="button" onClick={cancelReview}>
                        Batal
                      </button>
                    </div>
                  </div>
                ) : hasReview && item.review ? (
                  <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                    <div className="nav-links" style={{ justifyContent: "space-between" }}>
                      <div className="review-stars" aria-label={`${item.review.rating} dari 5 bintang`}>
                        {Array.from({ length: 5 }, (_, idx) => (
                          <Star key={idx} size={13} fill={idx < item.review!.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="tiny muted">{shortDate(item.review.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.93rem" }}>{item.review.comment}</p>
                    
                    {/* Media Display */}
                    {item.review.images && item.review.images.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {item.review.images.map((imgUrl: string, idx: number) => (
                          <a href={imgUrl} target="_blank" rel="noreferrer" key={idx}>
                            <img src={imgUrl} alt="Review Media" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {item.review.videos && item.review.videos.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {item.review.videos.map((vidUrl: string, idx: number) => (
                          <video src={vidUrl} controls key={idx} style={{ width: 100, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                        ))}
                      </div>
                    ) : null}

                    <div className="row-actions" style={{ marginTop: 6 }}>
                      <button className="button-ghost" type="button" style={{ paddingInline: 0, fontSize: "0.8rem", display: "inline-flex", gap: 4 }} onClick={() => startEditReview(item)}>
                        <PencilLine size={13} />
                        Edit ulasan
                      </button>
                      <button className="button-ghost" type="button" style={{ paddingInline: 0, fontSize: "0.8rem", color: "var(--danger)", display: "inline-flex", gap: 4 }} onClick={() => void deleteReview(item.review!.id)}>
                        Hapus ulasan
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
            );
          })}
          {feedback ? <span className="muted tiny">{feedback}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

export default function AccountPage() {
  const {
    customerSession,
    customerAddresses,
    paymentMethods,
    orders,
    updateCustomerProfile,
    logoutCustomer,
    saveCustomerAddress,
    deleteCustomerAddress,
    updateOrderStatus,
    uploadPaymentProof,
    refreshData,
  } = useGoldenStore();

  const [tab, setTab] = useState<"profile" | "addresses" | "orders">("profile");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [profileName, setProfileName] = useState("");

  const next = typeof window === "undefined" ? "/account" : new URLSearchParams(window.location.search).get("next") || "/account";

  useEffect(() => {
    if (customerSession) {
      setProfileName(customerSession.name);
    }
  }, [customerSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "google_not_configured") {
      setError("Login Google belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env lalu restart server.");
    }
    if (error === "google_failed") {
      setError("Login Google gagal. Cek redirect URI, client secret, dan pastikan akun Google Console sudah benar.");
    }
  }, []);

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

  const myOrders = useMemo(() => (customerSession ? orders.filter((order) => order.customerId === customerSession.id) : []), [customerSession, orders]);
  const paymentMethodMap = useMemo(() => new Map(paymentMethods.map((method) => [method.id, method])), [paymentMethods]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const result = await updateCustomerProfile({ name: profileName || undefined });
    setError(result.ok ? "Profil diperbarui." : result.message ?? "Profil gagal diperbarui.");
  };

  const uploadProof = async (orderId: string, file: File) => {
    await uploadPaymentProof(orderId, file);
  };

  if (!customerSession) {
    const googleSignInUrl = `/api/auth/google?next=${encodeURIComponent(next)}`;
    return (
      <section className="panel auth-shell" style={{ maxWidth: 620, margin: "0 auto" }}>
        <div className="eyebrow">
          <UserRound size={14} />
          Akun pembeli
        </div>
        <h1>Masuk dengan Google</h1>

        <a className="button google-button" href={googleSignInUrl}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.2-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.4 4 24 4 16.2 4 9.5 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.5 35.4 27 36 24 36c-5.2 0-9.6-3.1-11.8-7.5l-6.5 5C8.8 39.6 15.8 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3 5.4-5.9 6.9l6.3 5.2C34.9 37.9 40 33 40 24c0-1.3-.1-2.2-.4-3.5z"/>
          </svg>
          Masuk dengan Google
        </a>
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
            <h2>Ubah nama akun</h2>
            <p className="muted">Karena login customer memakai Google, profil cukup ubah nama tanpa OTP.</p>

            <div className="field">
              <label>Nama</label>
              <input className="input" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
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

