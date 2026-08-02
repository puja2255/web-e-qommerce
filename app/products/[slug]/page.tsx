"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, MessageSquareText, ShoppingCart, Sparkles, Star } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { Review } from "@/lib/types";
import { formatCurrency, getMainImage } from "@/lib/utils";

const FREE_SHIPPING_TAG = "FREE_SHIPPING";

async function readApiJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body) {
    throw new Error("Server tidak mengirim respons. Pastikan database dan migrasi ulasan sudah aktif.");
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error("Respons server tidak valid. Coba muat ulang halaman.");
  }
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const { products, categories, addToCart } = useGoldenStore();
  const product = products.find((item) => item.slug === slug);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState({ rating: product?.rating ?? 0, reviewsCount: product?.reviewsCount ?? 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [, setFeedback] = useState("");

  useEffect(() => {
    if (!product) {
      setLoadingReviews(false);
      return;
    }

    let active = true;
    setReviewSummary({ rating: product.rating, reviewsCount: product.reviewsCount });
    setLoadingReviews(true);
    fetch(`/api/products/${product.id}/reviews`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Gagal memuat ulasan");
        return readApiJson<{ reviews: Review[] }>(response);
      })
      .then((data) => {
        if (active) setReviews(data.reviews);
      })
      .catch(() => {
        if (active) setFeedback("Ulasan belum dapat dimuat. Coba muat ulang halaman.");
      })
      .finally(() => {
        if (active) setLoadingReviews(false);
      });

    return () => {
      active = false;
    };
  }, [product]);

  if (!product) {
    return (
      <section className="panel">
        <div className="eyebrow">Produk tidak ditemukan</div>
        <h1>Maaf, produk yang kamu cari belum ada.</h1>
        <Link href="/products" className="button">
          Kembali ke katalog
        </Link>
      </section>
    );
  }

  const categoryName = categories.find((category) => category.id === product.categoryId)?.name ?? "Produk";
  const mainImage = getMainImage(product);
  const relatedProducts = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 3);

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link href="/products" className="button-ghost" style={{ width: "fit-content" }}>
        <ArrowLeft size={16} />
        Kembali ke katalog
      </Link>

      <section className="grid grid-2">
        <div className="panel">
          <div className="card-media" style={{ borderRadius: 22 }}>
            <img src={mainImage} alt={product.name} />
          </div>
          <div className="grid grid-3" style={{ marginTop: 14 }}>
            {product.images.map((image) => (
              <div key={image} className="card-media" style={{ borderRadius: 18, aspectRatio: "1 / 1" }}>
                <img src={image} alt={product.name} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="nav-links" style={{ justifyContent: "space-between" }}>
            <span className="badge">{categoryName}</span>
            <span className="badge-soft">
              <Star size={14} />
              {product.rating} dari {product.reviewsCount} ulasan
            </span>
          </div>

          {product.tags.includes(FREE_SHIPPING_TAG) ? <span className="badge">Gratis ongkir</span> : null}

          <h1 style={{ marginBottom: 10 }}>{product.name}</h1>
          <p className="muted">{product.description}</p>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{formatCurrency(product.price)}</div>
          {product.compareAtPrice ? (
            <div className="muted" style={{ textDecoration: "line-through" }}>
              {formatCurrency(product.compareAtPrice)}
            </div>
          ) : null}

          <div className="row-actions">
            <button className="button" type="button" onClick={() => addToCart(product.id)} disabled={product.stock <= 0}>
              <ShoppingCart size={16} />
              {product.stock <= 0 ? "Stok habis" : "Tambah ke keranjang"}
            </button>
            <span className="badge-soft">
              <CheckCircle2 size={14} />
              {product.stock > 0 ? `${product.stock} stok tersedia` : "Produk habis"}
            </span>
          </div>

          <div className="muted-box" style={{ marginTop: 18 }}>
            <strong>Highlight</strong>
            <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
              {product.tags
                .filter((tag) => tag !== FREE_SHIPPING_TAG)
                .map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="review-layout">
        <div className="panel">
          <div className="eyebrow">
            <MessageSquareText size={14} />
            Ulasan pembeli
          </div>
          <div className="review-summary">
            <strong>{reviewSummary.rating.toFixed(1)}</strong>
            <div>
              <div className="review-stars" aria-label={`Rating ${reviewSummary.rating} dari 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={18} fill={index < Math.round(reviewSummary.rating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="muted">{reviewSummary.reviewsCount} ulasan terverifikasi</span>
            </div>
          </div>

          <div className="review-list" aria-live="polite">
            {loadingReviews ? <p className="muted">Memuat ulasan...</p> : null}
            {!loadingReviews && reviews.length === 0 ? <p className="muted">Belum ada ulasan dari pembeli untuk produk ini.</p> : null}
            {reviews.map((review) => (
              <article className="review-item" key={review.id}>
                <div className="review-item__top">
                  <strong>{review.customerName}</strong>
                  <time className="muted tiny" dateTime={review.createdAt}>
                    {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(review.createdAt))}
                  </time>
                </div>
                <div className="review-stars" aria-label={`${review.rating} dari 5 bintang`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={15} fill={index < review.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel review-form"><div className="eyebrow">Ulasan terverifikasi</div><h2>Sudah membeli produk ini?</h2><p className="muted">Berikan rating dan ulasan melalui riwayat pesanan setelah pesanan selesai.</p><Link href="/account" className="button-outline">Buka riwayat pesanan</Link></aside>
      </section>

      <section className="panel">
        <div className="eyebrow">
          <Sparkles size={14} />
          Produk terkait
        </div>
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {relatedProducts.map((item) => {
            const relatedCategory = categories.find((category) => category.id === item.categoryId)?.name ?? "Produk";
            return (
              <div key={item.id} className="card">
                <Link href={`/products/${item.slug}`} className="card-media">
                  <img src={getMainImage(item)} alt={item.name} />
                </Link>
                <div className="card-body">
                  <div className="badge-soft">{relatedCategory}</div>
                  <h3 className="card-title">{item.name}</h3>
                  <div className="muted tiny">{formatCurrency(item.price)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
