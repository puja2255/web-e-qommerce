"use client";

import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { Product } from "@/lib/types";
import { getMainImage } from "@/lib/utils";

const FREE_SHIPPING_TAG = "FREE_SHIPPING";

export function ProductCard({
  product,
  categoryName,
  onAddToCart,
}: {
  product: Product;
  categoryName?: string;
  onAddToCart: (productId: string) => void;
}) {
  const mainImage = getMainImage(product);
  const outOfStock = product.stock <= 0;
  const freeShipping = product.tags.includes(FREE_SHIPPING_TAG);

  return (
    <article className="card product-card">
      <Link href={`/products/${product.slug}`} className="card-media">
        <img src={mainImage} alt={product.name} loading="lazy" />
      </Link>

      <div className="card-body">
        <div className="stack" style={{ gap: 10 }}>
          <div className="nav-links" style={{ justifyContent: "space-between" }}>
            <span className="badge-soft">{categoryName ?? "Produk"}</span>
            <span className="badge-soft">
              <Star size={14} />
              {product.rating}
            </span>
          </div>

          <div>
            <h3 className="card-title">{product.name}</h3>
            <div className="muted tiny">{product.description}</div>
          </div>

          {freeShipping ? <span className="badge">Gratis ongkir</span> : null}

          <div className="card-price">{product.price.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>

          <div className="card-footer">
            <Link href={`/products/${product.slug}`} className="button-ghost">
              Detail
            </Link>
            <button className="button" type="button" onClick={() => onAddToCart(product.id)} disabled={outOfStock}>
              <ShoppingCart size={16} />
              {outOfStock ? "Habis" : "Tambah"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
