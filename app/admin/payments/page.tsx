"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useGoldenStore, PaymentMethodDraft } from "@/lib/store";

const emptyDraft: PaymentMethodDraft = {
  type: "COD",
  label: "",
  details: "",
  accountName: "",
  accountNumber: "",
  isActive: true,
};

export default function AdminPaymentsPage() {
  const { paymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useGoldenStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PaymentMethodDraft>(emptyDraft);

  const startEdit = (paymentMethodId: string) => {
    const paymentMethod = paymentMethods.find((item) => item.id === paymentMethodId);
    if (!paymentMethod) return;
    setEditingId(paymentMethodId);
    setDraft({
      type: paymentMethod.type,
      label: paymentMethod.label,
      details: paymentMethod.details,
      accountName: paymentMethod.accountName,
      accountNumber: paymentMethod.accountNumber,
      isActive: paymentMethod.isActive,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      updatePaymentMethod(editingId, draft);
    } else {
      createPaymentMethod(draft);
    }
    resetForm();
  };

  return (
    <AdminShell
      title="Manajemen pembayaran"
      description="CRUD metode pembayaran yang tampil di checkout."
      action={
        <button className="button" type="button" onClick={resetForm}>
          <Plus size={16} />
          Metode baru
        </button>
      }
    >
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>{editingId ? "Edit pembayaran" : "Tambah pembayaran"}</h2>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label>Tipe</label>
              <select className="select" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as PaymentMethodDraft["type"] })}>
                <option value="COD">COD</option>
                <option value="DANA">DANA</option>
                <option value="BANK">BANK</option>
              </select>
            </div>
            <div className="field">
              <label>Label</label>
              <input className="input" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Detail</label>
              <input className="input" value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} />
            </div>
            <div className="field">
              <label>Nama akun</label>
              <input className="input" value={draft.accountName} onChange={(event) => setDraft({ ...draft, accountName: event.target.value })} />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Nomor akun</label>
              <input className="input" value={draft.accountNumber} onChange={(event) => setDraft({ ...draft, accountNumber: event.target.value })} />
            </div>
            <label className="muted-box">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Aktif
            </label>
          </div>

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
        <h2 style={{ marginTop: 0 }}>Daftar pembayaran</h2>
        <div className="grid grid-2">
          {paymentMethods.map((method) => (
            <article key={method.id} className="muted-box">
              <div className="badge-soft">{method.type}</div>
              <h3>{method.label}</h3>
              <div className="muted tiny">{method.details}</div>
              {method.type !== "COD" ? (
                <div className="tiny" style={{ marginTop: 8 }}>
                  {method.accountName} - {method.accountNumber}
                </div>
              ) : null}
              <div className="row-actions">
                <button className="button-outline" type="button" onClick={() => startEdit(method.id)}>
                  <Edit2 size={16} />
                  Edit
                </button>
                <button className="button-danger" type="button" onClick={() => deletePaymentMethod(method.id)}>
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
