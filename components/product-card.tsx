import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/lib/types";
import { getMainImage } from "@/lib/utils";

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  categoryName?: string; // Opsional jika dari halaman utama masih mengirim prop ini
  onAddToCart: (productId: string) => void;
}) {
  const mainImage = getMainImage(product);
  const outOfStock = product.stock <= 0;

  return (
    <article 
      className="card" 
      style={{ 
        position: "relative", 
        height: "320px", /* Kunci tinggi agar seragam dan kompak */
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        borderRadius: "22px" /* Biar membulatnya elegan seperti fotomu */
      }}
    >
      {/* 1. GAMBAR FULL BACKGROUND */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <img 
          src={mainImage} 
          alt={product.name} 
          loading="lazy" 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            objectPosition: "center" 
          }} 
        />
        {/* Gradasi gelap tipis di bawah supaya teks nama produk kontras */}
        <div 
          style={{ 
            position: "absolute", 
            inset: 0, 
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" 
          }} 
        />
      </div>

      {/* 2. KONTEN (Hanya Nama, Detail, & Keranjang) */}
      <div className="card-body" style={{ position: "relative", zIndex: 2, padding: "14px" }}>
        <div className="stack" style={{ gap: 12 }}>
          
          {/* Nama Produk */}
          <h3 
            className="card-title" 
            style={{ 
              fontSize: "0.95rem", 
              fontWeight: "700", 
              margin: 0,
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)"
            }}
          >
            {product.name}
          </h3>

          {/* Footer Aksi (Detail & Tambah) */}
          <div className="card-footer" style={{ marginTop: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link 
              href={`/products/${product.slug}`} 
              className="button-ghost" 
              style={{ color: "#f7f0dd", padding: "6px 12px", fontSize: "0.85rem" }}
            >
              Detail
            </Link>
            
            <button 
              className="button" 
              type="button" 
              onClick={() => onAddToCart(product.id)} 
              disabled={outOfStock}
              style={{ padding: "8px 14px", fontSize: "0.85rem" }}
            >
              <ShoppingCart size={14} />
              {outOfStock ? "Habis" : "Tambah"}
            </button>
          </div>

        </div>
      </div>
    </article>
  );
}