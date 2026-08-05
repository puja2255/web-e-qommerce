"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/lib/types";
import { formatCurrency, getMainImage } from "@/lib/utils";

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  categoryName?: string;
  onAddToCart: (productId: string) => void;
}) {
  const mainImage = getMainImage(product);
  const outOfStock = product.stock <= 0;

  return (
    <article
      className="card product-card"
      style={{
        position: "relative",
        height: "220px", /* Kunci tinggi preview ringkas */
        borderRadius: "18px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        border: "1px solid var(--line)",
      }}
    >
      {/* 1. GAMBAR BACKGROUND (Klik untuk Detail Lengkap) */}
      <Link
        href={`/products/${product.slug}`}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
        aria-label={`Lihat detail ${product.name}`}
      >
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </Link>

      {/* 2. OVERLAY SHADING TRANSPARAN (Gradasi Gelap) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none", /* Agar klik di area shading tetap menembus ke gambar */
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)",
        }}
      />

      {/* 3. INFO PRODUK (Nama, Harga, & Keranjang) */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Nama Produk (1 Baris) */}
        <h3 style={{ margin: 0 }}>
          <Link
            href={`/products/${product.slug}`}
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {product.name}
          </Link>
        </h3>

        {/* Harga & Tombol Tambah Keranjang */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "#f1c64a",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {formatCurrency(product.price)}
          </span>

          <button
            className="button"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            disabled={outOfStock}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
            }}
          >
            <ShoppingCart size={14} />
            {outOfStock ? "Habis" : "Tambah"}
          </button>
        </div>
      </div>
    </article>
  );
}