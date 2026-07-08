"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShoppingCart, Sparkles, Star } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, getMainImage } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const { products, categories, addToCart } = useGoldenStore();
  const product = products.find((item) => item.slug === slug);

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
              {product.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        </div>
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
