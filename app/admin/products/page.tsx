"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Edit2, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore, ProductDraft } from "@/lib/store";
import { formatCurrency, getMainImage } from "@/lib/utils";

type ImageDraft = {
  name: string;
  src: string;
};

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const FREE_SHIPPING_TAG = "FREE_SHIPPING";

const emptyDraft: ProductDraft = {
  name: "",
  description: "",
  categoryId: "",
  categoryIds: [],
  price: 0,
  compareAtPrice: undefined,
  stock: 0,
  sku: "",
  isFeatured: false,
  isActive: true,
  images: [],
  tags: [],
  freeShippingPromo: false,
};

export default function AdminProductsPage() {
  const { products, categories, createProduct, updateProduct, deleteProduct } = useGoldenStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [imagesText, setImagesText] = useState("");
  const [imageUploads, setImageUploads] = useState<ImageDraft[]>([]);
  const [imageError, setImageError] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (categories.length > 0 && draft.categoryIds.length === 0) {
      setDraft((current) => ({ ...current, categoryId: categories[0].id, categoryIds: [categories[0].id] }));
    }
  }, [categories, draft.categoryIds.length]);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.stock - a.stock), [products]);

  const startEdit = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setEditingId(productId);
    setDraft({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      categoryIds: product.categoryIds?.length ? product.categoryIds : [product.categoryId],
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      sku: product.sku ?? "",
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      images: product.images,
      tags: product.tags.filter((tag) => tag !== FREE_SHIPPING_TAG),
      freeShippingPromo: product.tags.includes(FREE_SHIPPING_TAG),
    });
    setImagesText("");
    setImageUploads(product.images.map((src, index) => ({ name: `Gambar ${index + 1}`, src })));
    setTagsText(product.tags.filter((tag) => tag !== FREE_SHIPPING_TAG).join(", "));
    setDiscountPercent(product.compareAtPrice && product.price > 0 ? Math.round((1 - product.compareAtPrice / product.price) * 100) : 0);
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      categoryId: categories[0]?.id ?? "",
    });
    setImagesText("");
    setImageUploads([]);
    setImageError("");
    setTagsText("");
    setDiscountPercent(0);
  };

  const handleImageFiles = async (files: FileList | null) => {
    setImageError("");
    if (!files?.length) {
      return;
    }

    const accepted = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<ImageDraft | null>((resolve) => {
            if (file.size > MAX_IMAGE_SIZE) {
              resolve(null);
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, src: String(reader.result ?? "") });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          }),
      ),
    );

    const rejected = Array.from(files).some((file) => file.size > MAX_IMAGE_SIZE);
    if (rejected) {
      setImageError("Ada file yang melebihi 3 MB dan tidak dimasukkan.");
    }

    setImageUploads((current) => [...current, ...(accepted.filter(Boolean) as ImageDraft[])]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const textImages = imagesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      ...draft,
      images: [...imageUploads.map((item) => item.src), ...textImages],
      tags: tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      createProduct(payload);
    }

    resetForm();
  };

  return (
    <AdminShell
      title="Manajemen produk"
      description="Tambah, edit, hapus produk, upload banyak gambar, dan atur ketersediaan barang."
      action={
        <button className="button" type="button" onClick={resetForm}>
          <Plus size={16} />
          Produk baru
        </button>
      }
    >
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>{editingId ? "Edit produk" : "Tambah produk"}</h2>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label>Nama produk</label>
              <input className="input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div className="field">
              <label>Kategori</label>
              <div className="muted-box stack" style={{ gap: 8, maxHeight: 150, overflowY: "auto" }}>
                {categories.map((category) => {
                  const checked = draft.categoryIds.includes(category.id);
                  return (
                    <label key={category.id} className="nav-links" style={{ gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const categoryIds = checked
                            ? draft.categoryIds.filter((id) => id !== category.id)
                            : [...draft.categoryIds, category.id];
                          setDraft({ ...draft, categoryIds, categoryId: categoryIds[0] ?? "" });
                        }}
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Deskripsi</label>
            <textarea className="textarea" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Harga</label>
              <input className="input" type="number" value={draft.price} onChange={(event) => {
                const price = Number(event.target.value);
                setDraft({ ...draft, price, compareAtPrice: discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : draft.compareAtPrice });
              }} />
            </div>
            <div className="field">
              <label>Harga promo (opsional)</label>
              <input className="input" type="number" value={draft.compareAtPrice ?? ""} onChange={(event) => {
                const compareAtPrice = event.target.value ? Number(event.target.value) : undefined;
                setDraft({ ...draft, compareAtPrice });
                setDiscountPercent(compareAtPrice && draft.price > 0 ? Math.max(0, Math.round((1 - compareAtPrice / draft.price) * 100)) : 0);
              }} />
            </div>
            <div className="field">
              <label>Diskon persen (opsional)</label>
              <input className="input" type="number" min="0" max="100" value={discountPercent || ""} onChange={(event) => {
                const percent = Math.min(100, Math.max(0, Number(event.target.value) || 0));
                setDiscountPercent(percent);
                setDraft({ ...draft, compareAtPrice: percent > 0 ? Math.round(draft.price * (1 - percent / 100)) : undefined });
              }} />
            </div>
            <div className="field">
              <label>Stok</label>
              <input className="input" type="number" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} />
            </div>
            <div className="field">
              <label>SKU</label>
              <input className="input" value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Upload gambar produk</label>
              <label className="upload-dropzone">
                <input
                  className="upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void handleImageFiles(event.target.files)}
                />
                <div className="upload-dropzone__empty">
                  <ImagePlus size={18} />
                  <span>Pilih file gambar, maksimal 3 MB per file</span>
                </div>
              </label>
              {imageError ? <div className="muted tiny" style={{ color: "var(--danger)" }}>{imageError}</div> : null}
              {imageUploads.length > 0 ? (
                <div className="upload-grid">
                  {imageUploads.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="upload-thumb">
                      <img src={item.src} alt={item.name} />
                      <div className="upload-thumb__meta">
                        <span className="tiny">{item.name}</span>
                        <button type="button" className="button-icon button-icon--small" disabled={index === 0} onClick={() => setImageUploads((current) => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} aria-label="Naikkan gambar"><ArrowUp size={14} /></button>
                        <button type="button" className="button-icon button-icon--small" disabled={index === imageUploads.length - 1} onClick={() => setImageUploads((current) => { const next = [...current]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next; })} aria-label="Turunkan gambar"><ArrowDown size={14} /></button>
                        <button
                          type="button"
                          className="button-icon button-icon--small"
                          onClick={() =>
                            setImageUploads((current) => current.filter((_, currentIndex) => currentIndex !== index))
                          }
                          aria-label={`Hapus ${item.name}`}
                          title={`Hapus ${item.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="muted tiny">Atau tempel URL gambar di bawah jika diperlukan.</div>
              <textarea
                className="textarea"
                value={imagesText}
                onChange={(event) => setImagesText(event.target.value)}
                placeholder="Satu URL per baris"
              />
            </div>
            <div className="field">
              <label>Tags, pisahkan dengan koma</label>
              <textarea className="textarea" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
            </div>
          </div>

          <div className="field-grid">
            <label className="muted-box">
              <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft({ ...draft, isFeatured: event.target.checked })} /> Produk unggulan
            </label>
            <label className="muted-box">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Tampilkan aktif
            </label>
            <label className="muted-box">
              <input
                type="checkbox"
                checked={draft.freeShippingPromo}
                onChange={(event) => setDraft({ ...draft, freeShippingPromo: event.target.checked })}
              />{" "}
              Promo gratis ongkir
            </label>
          </div>

          <div className="row-actions">
            <button className="button" type="submit">
              <Save size={16} />
              {editingId ? "Simpan perubahan" : "Tambah produk"}
            </button>
            {editingId ? (
              <button className="button-ghost" type="button" onClick={resetForm}>
                Batal edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Daftar produk</h2>
        <div className="grid grid-2">
          {sortedProducts.map((product) => {
            const categoryName = categories.filter((category) => (product.categoryIds?.length ? product.categoryIds : [product.categoryId]).includes(category.id)).map((category) => category.name).join(", ") || "Produk";
            return (
              <article key={product.id} className="muted-box">
                <div className="nav-links" style={{ alignItems: "start" }}>
                  <div className="card-media" style={{ width: 88, aspectRatio: "1 / 1", borderRadius: 16 }}>
                    <img src={getMainImage(product)} alt={product.name} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="badge-soft">{categoryName}</div>
                    {product.tags.includes(FREE_SHIPPING_TAG) ? <div className="badge" style={{ marginLeft: 8 }}>Gratis ongkir</div> : null}
                    <h3 style={{ margin: "10px 0 6px" }}>{product.name}</h3>
                    <div className="tiny muted">
                      {product.compareAtPrice ? <><strong>{formatCurrency(product.compareAtPrice)}</strong> <span style={{ textDecoration: "line-through" }}>{formatCurrency(product.price)}</span></> : formatCurrency(product.price)}
                    </div>
                    <div className="tiny muted">Stok: {product.stock}</div>
                  </div>
                </div>
                <div className="row-actions">
                  <button className="button-outline" type="button" onClick={() => startEdit(product.id)}>
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button className="button-danger" type="button" onClick={() => deleteProduct(product.id)}>
                    <Trash2 size={16} />
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
