"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Crosshair, PencilLine, Plus, ShieldCheck, X } from "lucide-react";
import { googleMapsEmbedUrl, googleMapsUrl } from "@/lib/address-service";
import type { CustomerAddress } from "@/lib/types";

type Region = { id: string; name: string };

type AddressInput = Omit<CustomerAddress, "id"> & { id?: string };

type Props = {
  addresses: CustomerAddress[];
  recipientName: string;
  phone: string;
  onSave: (address: AddressInput) => void;
  onDelete: (id: string) => void;
};

async function loadRegions(level: "provinces" | "regencies" | "districts", parentId?: string) {
  const response = await fetch(`/api/regions?level=${level}${parentId ? `&parentId=${parentId}` : ""}`);
  if (!response.ok) throw new Error("Wilayah tidak dapat dimuat");
  return (await response.json()) as Region[];
}

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
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [position, setPosition] = useState(emptyPosition);
  const [message, setMessage] = useState("Pilih wilayah dan titik lokasi.");
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const province = provinces.find((item) => item.id === provinceId)?.name ?? "";
  const city = cities.find((item) => item.id === cityId)?.name ?? "";
  const district = districts.find((item) => item.id === districtId)?.name ?? "";
  const verified = Boolean(provinceId && cityId && districtId && (position || mapsLink));

  useEffect(() => {
    void loadRegions("provinces")
      .then(setProvinces)
      .catch(() => setMessage("Data wilayah belum dapat dimuat."));
  }, []);

  useEffect(() => {
    if (provinceId) void loadRegions("regencies", provinceId).then(setCities);
  }, [provinceId]);

  useEffect(() => {
    if (cityId) void loadRegions("districts", cityId).then(setDistricts);
  }, [cityId]);

  useEffect(() => {
    if (!editingAddress) return;

    const provinceMatch = provinces.find((item) => item.name === editingAddress.province);
    const cityMatch = cities.find((item) => item.name === editingAddress.city);
    const districtMatch = districts.find((item) => item.name === editingAddress.district);

    if (provinceMatch && provinceId !== provinceMatch.id) setProvinceId(provinceMatch.id);
    if (cityMatch && cityId !== cityMatch.id) setCityId(cityMatch.id);
    if (districtMatch && districtId !== districtMatch.id) setDistrictId(districtMatch.id);
  }, [editingAddress, provinces, cities, districts, provinceId, cityId, districtId]);

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
    setProvinceId("");
    setCityId("");
    setDistrictId("");
    setPostalCode("");
    setPosition(emptyPosition);
    setMessage("Pilih wilayah dan titik lokasi.");
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
    setProvinceId(provinces.find((item) => item.name === address.province)?.id ?? "");
    setCityId(cities.find((item) => item.name === address.city)?.id ?? "");
    setDistrictId(districts.find((item) => item.name === address.district)?.id ?? "");
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
      setMessage("Lengkapi wilayah, alamat, dan titik lokasi.");
      return;
    }

    onSave({
      id: editingId ?? undefined,
      type: "RECIPIENT",
      label,
      recipientName: recipientNameInput,
      phone: phoneInput,
      province,
      city,
      district,
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
                {address.detail}, {address.district}, {address.city}, {address.province} {address.postalCode}
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
            <label>Provinsi</label>
            <select
              className="select"
              value={provinceId}
              onChange={(e) => {
                setProvinceId(e.target.value);
                setCityId("");
                setDistrictId("");
              }}
              required
            >
              <option value="">Pilih provinsi</option>
              {provinces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Kabupaten/Kota</label>
            <select
              className="select"
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setDistrictId("");
              }}
              disabled={!provinceId}
              required
            >
              <option value="">Pilih kabupaten/kota</option>
              {cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Kecamatan</label>
            <select className="select" value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!cityId} required>
              <option value="">Pilih kecamatan</option>
              {districts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
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
