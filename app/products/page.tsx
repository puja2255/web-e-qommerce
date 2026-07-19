"use client";

import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useGoldenStore } from "@/lib/store";

type SortKey = "relevance" | "price-asc" | "price-desc" | "stock-desc";

export default function ProductsPage() {
  const { products, categories, addToCart } = useGoldenStore();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("relevance");

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;

      return product.isActive && matchesQuery && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "stock-desc":
          return b.stock - a.stock;
        default:
          return Number(b.isFeatured) - Number(a.isFeatured);
      }
    });

    return sorted;
  }, [products, query, categoryId, sortKey]);

  return (
    <div className="stack" style={{ gap: 22 }}>
      <section className="panel">
        <div className="eyebrow">
          <Filter size={14} />
          Katalog produk
        </div>
        <h1 style={{ marginBottom: 8 }}>Temukan produk terbaik</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Cari produk, filter berdasarkan kategori, lalu urutkan sesuai kebutuhan belanja.
        </p>

        <div className="field-grid" style={{ marginTop: 18 }}>
          <div className="field">
            <label>Search produk</label>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: 14, opacity: 0.7 }} />
              <input className="input" style={{ paddingLeft: 42 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, deskripsi, atau tag..." />
            </div>
          </div>
          <div className="field">
            <label>Kategori</label>
            <select className="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="all">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Urutkan</label>
            <div style={{ position: "relative" }}>
              <SlidersHorizontal size={16} style={{ position: "absolute", left: 14, top: 14, opacity: 0.7 }} />
              <select className="select" style={{ paddingLeft: 42 }} value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                <option value="relevance">Relevansi</option>
                <option value="price-asc">Harga termurah</option>
                <option value="price-desc">Harga termahal</option>
                <option value="stock-desc">Stok terbanyak</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-3">
        {visibleProducts.map((product) => {
          const categoryName = categories.find((category) => category.id === product.categoryId)?.name ?? "Produk";
          return <ProductCard key={product.id} product={product} categoryName={categoryName} onAddToCart={addToCart} />;
        })}
      </section>

      {visibleProducts.length === 0 ? (
        <section className="panel">
          <p className="muted" style={{ margin: 0 }}>
            Tidak ada produk yang cocok dengan pencarian atau filter saat ini.
          </p>
        </section>
      ) : null}
    </div>
  );
}
