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

  // Hapus awalan "Rp"
  const formattedPriceNumber = formatCurrency(product.price)
    .replace(/Rp\s?/gi, "")
    .trim();

  return (
    <article
      className="card product-card"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "180px",
        aspectRatio: "3 / 4", /* Mengunci rasio 3:4 secara mutlak */
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        border: "1px solid var(--line)",
        justifySelf: "center",
      }}
    >
      {/* Gambar Background */}
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

      {/* Overlay Shading */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)",
        }}
      />

      {/* Detail Ringkas Produk */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {/* Nama Produk */}
        <h3 style={{ margin: 0 }}>
          <Link
            href={`/products/${product.slug}`}
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
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

        {/* Baris Harga & Tombol */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "4px",
            width: "100%",
            minHeight: "24px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#f1c64a",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {formattedPriceNumber}
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
              height: "24px",
              padding: "0 6px",
              fontSize: "0.68rem",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              flexShrink: 0,
              borderRadius: "6px",
            }}
          >
            <ShoppingCart size={11} />
            <span>{outOfStock ? "Habis" : "Tambah"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}