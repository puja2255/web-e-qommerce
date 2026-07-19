"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircleMore, Sparkles, Store } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { adminWhatsappLink } from "@/lib/contact";
import { useGoldenStore } from "@/lib/store";

export default function HomePage() {
  const { products, categories, addToCart, banners } = useGoldenStore();
  const featuredProducts = products.filter((product) => product.isFeatured && product.isActive).slice(0, 3);
  const activeCategories = categories.filter((category) => category.isActive);
  const showcaseProducts = [...featuredProducts, ...featuredProducts, ...featuredProducts];
  const activeBanners = banners.filter((banner) => banner.isActive);
  const [slide, setSlide] = useState(0);
  useEffect(() => { setSlide(0); }, [activeBanners.length]);
  useEffect(() => { if (activeBanners.length < 2) return; const timer = window.setInterval(() => setSlide((current) => (current + 1) % activeBanners.length), 5000); return () => window.clearInterval(timer); }, [activeBanners.length]);
  const currentBanner = activeBanners[slide];

  return <div className="stack" style={{ gap: 28 }}>
    {currentBanner ? <section className="home-banner" style={{ backgroundImage: `linear-gradient(90deg, rgba(13,11,7,.82), rgba(13,11,7,.34)), url(${currentBanner.imageUrl})` }}>
      <div className="home-banner__content"><span className="eyebrow"><Sparkles size={14} /> Promo Golden Store</span><h1>{currentBanner.title}</h1><p>{currentBanner.subtitle}</p><Link href={currentBanner.link || "/products"} className="button">Lihat penawaran <ArrowRight size={16} /></Link></div>
      {activeBanners.length > 1 ? <><button className="banner-control banner-control--prev" onClick={() => setSlide((slide - 1 + activeBanners.length) % activeBanners.length)} aria-label="Banner sebelumnya"><ChevronLeft size={20} /></button><button className="banner-control banner-control--next" onClick={() => setSlide((slide + 1) % activeBanners.length)} aria-label="Banner berikutnya"><ChevronRight size={20} /></button><div className="banner-dots">{activeBanners.map((banner, index) => <button aria-label={`Tampilkan banner ${index + 1}`} className={index === slide ? "active" : ""} key={banner.id} onClick={() => setSlide(index)} />)}</div></> : null}
    </section> : null}
    <section className="hero">
      <div className="hero-panel"><div className="eyebrow"><Sparkles size={14} /> Golden Store</div><h1>Belanja mudah, cepat, dan aman dalam satu tempat.</h1><p>Golden Store adalah e-commerce katalog lengkap dengan harga terbaik. Temukan produk yang dibutuhkan tanpa ribet.</p><div className="hero-actions"><Link href="/products" className="button">Lihat Produk <ArrowRight size={16} /></Link><a href={adminWhatsappLink("Halo admin Golden Store, saya ingin bertanya tentang produk.")} className="button-outline" target="_blank" rel="noreferrer"><MessageCircleMore size={16} /> Tanya WA</a></div></div>
      <div className="hero-art panel"><div className="hero-art-card"><h3 style={{ fontSize: "1.8rem", marginTop: 18, marginBottom: 8 }}>Belanja jadi lebih praktis.</h3><p className="muted">Semua dibuat agar pelanggan mudah menemukan produk yang diinginkan dan langsung bertransaksi tanpa hambatan.</p></div><div className="muted-box">Anda bisa menghubungi admin langsung via WhatsApp untuk tanya stok, detail produk, atau bantuan order.</div></div>
    </section>
    <section className="section"><div className="section-title"><div><div className="eyebrow"><Sparkles size={14} /> Kategori pilihan</div><h2>Produk terstruktur per kategori</h2></div></div><div className="category-strip">{activeCategories.map((category) => <div key={category.id} className="panel category-card"><span className="badge">{category.name}</span><p className="muted" style={{ marginBottom: 0 }}>{category.description}</p></div>)}</div></section>
    <section className="section"><div className="section-title"><div><div className="eyebrow"><Store size={14} /> Featured products</div><h2>Produk unggulan Golden Store</h2></div><Link href="/products" className="button-ghost">Semua produk <ArrowRight size={16} /></Link></div><div className="featured-carousel"><div className="featured-track">{showcaseProducts.map((product, index) => <div key={`${product.id}-${index}`} className="featured-item"><ProductCard product={product} categoryName={categories.find((category) => category.id === product.categoryId)?.name ?? "Produk"} onAddToCart={addToCart} /></div>)}</div></div></section>
  </div>;
}
