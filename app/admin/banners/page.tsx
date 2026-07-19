"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Edit2, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { BannerDraft, useGoldenStore } from "@/lib/store";

const emptyDraft: BannerDraft = { title: "", subtitle: "", imageUrl: "", link: "/products", isActive: true };

export default function AdminBannersPage() {
  const { banners, createBanner, updateBanner, deleteBanner } = useGoldenStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BannerDraft>(emptyDraft);
  const reset = () => { setEditingId(null); setDraft(emptyDraft); };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.title || !draft.imageUrl) return; if (editingId) updateBanner(editingId, draft); else createBanner(draft); reset(); };
  const edit = (id: string) => { const banner = banners.find((item) => item.id === id); if (!banner) return; setEditingId(id); setDraft({ title: banner.title, subtitle: banner.subtitle, imageUrl: banner.imageUrl, link: banner.link, isActive: banner.isActive }); };

  return <AdminShell title="Banner halaman utama" description="Atur gambar, teks, tautan, dan urutan banner slider di beranda." action={<button className="button" onClick={reset}><Plus size={16} /> Banner baru</button>}>
    <section className="panel"><h2 style={{ marginTop: 0 }}>{editingId ? "Edit banner" : "Tambah banner"}</h2><form className="stack" onSubmit={submit}>
      <div className="field-grid"><div className="field"><label>Judul banner</label><input className="input" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div className="field"><label>Tautan saat diklik</label><input className="input" value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} placeholder="/products" /></div></div>
      <div className="field"><label>Deskripsi singkat</label><input className="input" value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></div>
      <div className="field"><label>URL gambar banner</label><input className="input" type="url" required value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} placeholder="https://..." /></div>
      {draft.imageUrl ? <img className="banner-form-preview" src={draft.imageUrl} alt="Pratinjau banner" /> : null}
      <div className="row-actions"><label className="muted-box"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Tampilkan di slider</label><button className="button" type="submit"><Save size={16} /> Simpan banner</button>{editingId ? <button className="button-ghost" type="button" onClick={reset}>Batal</button> : null}</div>
    </form></section>
    <section className="panel"><h2 style={{ marginTop: 0 }}>Banner tersedia</h2><div className="banner-admin-list">{banners.map((banner) => <article className="banner-admin-card" key={banner.id}><img src={banner.imageUrl} alt={banner.title} /><div><span className={banner.isActive ? "badge" : "badge-soft"}>{banner.isActive ? "Aktif" : "Nonaktif"}</span><h3>{banner.title}</h3><p className="muted tiny">{banner.subtitle}</p><div className="row-actions"><button className="button-outline" onClick={() => edit(banner.id)}><Edit2 size={16} /> Edit</button><button className="button-danger" onClick={() => deleteBanner(banner.id)}><Trash2 size={16} /> Hapus</button></div></div></article>)}</div></section>
  </AdminShell>;
}
