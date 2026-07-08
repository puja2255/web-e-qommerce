"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore, CategoryDraft } from "@/lib/store";

const emptyDraft: CategoryDraft = {
  name: "",
  description: "",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory } = useGoldenStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft);

  const startEdit = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;
    setEditingId(categoryId);
    setDraft({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      updateCategory(editingId, draft);
    } else {
      createCategory(draft);
    }
    resetForm();
  };

  return (
    <AdminShell
      title="Manajemen kategori"
      description="CRUD kategori untuk menyusun katalog produk dengan rapi."
      action={
        <button className="button" type="button" onClick={resetForm}>
          <Plus size={16} />
          Kategori baru
        </button>
      }
    >
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>{editingId ? "Edit kategori" : "Tambah kategori"}</h2>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label>Nama kategori</label>
              <input className="input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div className="field">
              <label>Deskripsi</label>
              <input className="input" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
          </div>
          <label className="muted-box">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Aktifkan kategori
          </label>
          <div className="row-actions">
            <button className="button" type="submit">
              <Save size={16} />
              Simpan
            </button>
            {editingId ? (
              <button className="button-ghost" type="button" onClick={resetForm}>
                Batal
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Daftar kategori</h2>
        <div className="grid grid-2">
          {categories.map((category) => (
            <article key={category.id} className="muted-box">
              <div className="badge-soft">{category.slug}</div>
              <h3>{category.name}</h3>
              <div className="muted tiny">{category.description}</div>
              <div className="row-actions">
                <button className="button-outline" type="button" onClick={() => startEdit(category.id)}>
                  <Edit2 size={16} />
                  Edit
                </button>
                <button className="button-danger" type="button" onClick={() => deleteCategory(category.id)}>
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
