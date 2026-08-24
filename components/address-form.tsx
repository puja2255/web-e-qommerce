"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Crosshair, PencilLine, Plus, ShieldCheck, X } from "lucide-react";
import { googleMapsEmbedUrl, googleMapsUrl } from "@/lib/address-service";
import type { CustomerAddress } from "@/lib/types";

type AddressInput = Omit<CustomerAddress, "id"> & { id?: string };

type Props = {
  addresses: CustomerAddress[];
  recipientName: string;
  phone: string;
  onSave: (address: AddressInput) => void;
  onDelete: (id: string) => void;
};

const emptyPosition = null as { latitude: number; longitude: number } | null;

export function AddressForm({ addresses, recipientName, phone, onSave, onDelete }: Props) {
  const recipientAddresses = useMemo(
    () => addresses.filter((address) => (address.type ?? "RECIPIENT") === "RECIPIENT"),
    [addresses],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("Rumah");
  const [recipientNameInput, setRecipientNameInput] = useState(recipientName);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [detail, setDetail] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [position, setPosition] = useState(emptyPosition);
  const [message, setMessage] = useState("Masukkan alamat dan titik lokasi.");
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const verified = Boolean(detail.trim() && (position || mapsLink.trim()));

  useEffect(() => {
    if (editingId) return;
    setRecipientNameInput(recipientName);
    setPhoneInput(phone);
  }, [recipientName, phone, editingId]);

  const resetForm = () => {
    setEditingAddress(null);
    setEditingId(null);
    setLabel("Rumah");
    setRecipientNameInput(recipientName);
    setPhoneInput(phone);
    setDetail("");
    setMapsLink("");
    setPostalCode("");
    setPosition(emptyPosition);
    setMessage("Masukkan alamat dan titik lokasi.");
  };

  const loadAddressToForm = (address: CustomerAddress) => {
    setEditingAddress(address);
    setEditingId(address.id);
    setLabel(address.label);
    setRecipientNameInput(address.recipientName);
    setPhoneInput(address.phone);
    setDetail(address.detail);
    setPostalCode(address.postalCode ?? "");
    setMapsLink(address.mapsUrl ?? "");
    setPosition(
      address.latitude != null && address.longitude != null
        ? { latitude: address.latitude, longitude: address.longitude }
        : emptyPosition,
    );
    setMessage("Alamat siap diedit.");
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setMessage("GPS tidak tersedia.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (value) => {
        setPosition({ latitude: value.coords.latitude, longitude: value.coords.longitude });
        setMessage("Titik GPS tersimpan.");
      },
      () => setMessage("Izin GPS ditolak."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!detail || !verified) {
      setMessage("Lengkapi alamat dan titik lokasi.");
      return;
    }

    onSave({
      id: editingId ?? undefined,
      type: "RECIPIENT",
      label,
      recipientName: recipientNameInput,
      phone: phoneInput,
      province: "",
      city: "",
      district: "",
      detail,
      postalCode,
      isPrimary: !recipientAddresses.length || recipientAddresses.some((item) => item.id === editingId && item.isPrimary),
      latitude: position?.latitude,
      longitude: position?.longitude,
      mapsUrl: mapsLink || (position ? googleMapsUrl(position.latitude, position.longitude) : undefined),
      isVerified: true,
    });
    resetForm();
    setMessage("Alamat tersimpan.");
  };

  return (
    <div className="address-system">
      <div className="address-list">
        {recipientAddresses.map((address) => (
          <div className="address-card" key={address.id}>
            <div>
              <strong>
                {address.label} {address.isPrimary ? " - Utama" : ""}
              </strong>
              <div>
                {address.recipientName} | {address.phone}
              </div>
              <div className="muted tiny">
                {address.detail}
                {address.postalCode ? `, ${address.postalCode}` : ""}
              </div>
            </div>
            <div className="row-actions" style={{ marginTop: 0 }}>
              <button className="button-outline" type="button" onClick={() => loadAddressToForm(address)}>
                <PencilLine size={14} />
                Edit
              </button>
              <button className="button-ghost" type="button" onClick={() => onDelete(address.id)}>
                <X size={14} />
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      <form className="stack" onSubmit={submit} style={{ marginTop: 14 }}>
        <div className="field-grid">
          <div className="field">
            <label>Nama penerima</label>
            <input className="input" value={recipientNameInput} onChange={(e) => setRecipientNameInput(e.target.value)} />
          </div>
          <div className="field">
            <label>No WA</label>
            <input className="input" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Label alamat</label>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Kode pos</label>
            <input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Link Maps</label>
            <input className="input" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="Tempel link Google Maps" />
          </div>
          <div className="field">
            <label>Titik GPS</label>
            <div className="location-row">
              <button className="button-outline" type="button" onClick={useGps}>
                <Crosshair size={16} />
                Gunakan GPS
              </button>
              <span className={verified ? "location-status ready" : "location-status"}>
                <ShieldCheck size={15} />
                {message}
              </span>
            </div>
          </div>
        </div>

        <div className="field">
          <label>Alamat lengkap</label>
          <textarea className="textarea" value={detail} onChange={(e) => setDetail(e.target.value)} required />
        </div>

        {position ? <iframe className="address-map" title="Validasi lokasi" src={googleMapsEmbedUrl(position.latitude, position.longitude)} loading="lazy" /> : null}

        <div className="row-actions">
          <button className="button-outline" type="submit">
            <Plus size={16} />
            {editingId ? "Simpan perubahan" : "Simpan alamat"}
          </button>
          {editingId ? (
            <button className="button-ghost" type="button" onClick={resetForm}>
              Batal edit
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
