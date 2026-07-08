"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleMore, Sparkles, Store } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { adminWhatsappLink } from "@/lib/contact";
import { useGoldenStore } from "@/lib/store";

export default function HomePage() {
  const { products, categories, addToCart, theme } = useGoldenStore();
  const featuredProducts = products.filter((product) => product.isFeatured && product.isActive).slice(0, 3);
  const activeCategories = categories.filter((category) => category.isActive);
  const showcaseProducts = [...featuredProducts, ...featuredProducts, ...featuredProducts];

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section className="hero">
        <div className="hero-panel">
          <div className="eyebrow">
            <Sparkles size={14} />
            Golden Store premium marketplace
          </div>
          <h1>Belanja terasa mewah, cepat, dan rapi dalam satu tempat.</h1>
          <p>
            Golden Store adalah e-commerce bernuansa kuning emas dengan katalog produk, keranjang belanja, checkout,
            pembayaran COD/DANA/bank, serta dashboard admin untuk pengelolaan toko.
          </p>
          <div className="hero-actions">
            <Link href="/products" className="button">
              Lihat Produk
              <ArrowRight size={16} />
            </Link>
            <a
              href={adminWhatsappLink("Halo admin Golden Store, saya ingin bertanya tentang produk.")}
              className="button-outline"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircleMore size={16} />
              Tanya WA
            </a>
          </div>
        </div>

        <div className="hero-art panel">
          <div className="hero-art-card">
            <div className="eyebrow">
              <Store size={14} />
              Tema {theme === "dark" ? "gelap" : "terang"}
            </div>
            <h3 style={{ fontSize: "1.8rem", marginTop: 18, marginBottom: 8 }}>Nuansa emas yang premium</h3>
            <p className="muted">
              Desain dibuat supaya tetap tegas saat gelap dan tetap hangat saat terang. Cocok untuk brand yang ingin
              terlihat eksklusif.
            </p>
          </div>
          <div className="muted-box">
            Pembeli bisa menghubungi admin langsung via WhatsApp untuk tanya stok, detail produk, atau bantuan order.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <div>
            <div className="eyebrow">
              <Sparkles size={14} />
              Kategori pilihan
            </div>
            <h2>Produk terstruktur per kategori</h2>
          </div>
        </div>
        <div className="grid grid-4">
          {activeCategories.map((category) => (
            <div key={category.id} className="panel">
              <span className="badge">{category.name}</span>
              <p className="muted" style={{ marginBottom: 0 }}>
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <div>
            <div className="eyebrow">
              <Store size={14} />
              Featured products
            </div>
            <h2>Produk unggulan Golden Store</h2>
          </div>
          <Link href="/products" className="button-ghost">
            Semua produk
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="featured-carousel">
          <div className="featured-track">
            {showcaseProducts.map((product, index) => {
              const categoryName = categories.find((category) => category.id === product.categoryId)?.name ?? "Produk";
              return (
                <div key={`${product.id}-${index}`} className="featured-item">
                  <ProductCard product={product} categoryName={categoryName} onAddToCart={addToCart} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="section-copy tiny" style={{ marginTop: 10 }}>
          Gulir produk unggulan otomatis ke samping untuk menampilkan lebih banyak pilihan.
        </div>
      </section>
    </div>
  );
}
