export type AddressSuggestion = {
  label: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};

// Dapat diganti endpoint Google Places di production. Daftar ini membuat fitur
// autocomplete dan verifikasi wilayah tetap berfungsi tanpa API key di demo.
export const addressSuggestions: AddressSuggestion[] = [
  { label: "Menteng, Kota Jakarta Pusat, DKI Jakarta", province: "DKI Jakarta", city: "Jakarta Pusat", district: "Menteng", postalCode: "10310", latitude: -6.195, longitude: 106.832 },
  { label: "Kebayoran Baru, Kota Jakarta Selatan, DKI Jakarta", province: "DKI Jakarta", city: "Jakarta Selatan", district: "Kebayoran Baru", postalCode: "12190", latitude: -6.244, longitude: 106.8 },
  { label: "Cakung, Kota Jakarta Timur, DKI Jakarta", province: "DKI Jakarta", city: "Jakarta Timur", district: "Cakung", postalCode: "13910", latitude: -6.185, longitude: 106.948 },
  { label: "Cicendo, Kota Bandung, Jawa Barat", province: "Jawa Barat", city: "Bandung", district: "Cicendo", postalCode: "40171", latitude: -6.91, longitude: 107.58 },
  { label: "Depok, Kota Depok, Jawa Barat", province: "Jawa Barat", city: "Depok", district: "Pancoran Mas", postalCode: "16431", latitude: -6.4, longitude: 106.82 },
  { label: "Klojen, Kota Malang, Jawa Timur", province: "Jawa Timur", city: "Malang", district: "Klojen", postalCode: "65111", latitude: -7.98, longitude: 112.63 },
  { label: "Tegalsari, Kota Surabaya, Jawa Timur", province: "Jawa Timur", city: "Surabaya", district: "Tegalsari", postalCode: "60262", latitude: -7.26, longitude: 112.74 },
];

// Master wilayah yang dipakai dropdown bertingkat: provinsi → kabupaten/kota → kecamatan.
// Tambahkan data wilayah lain di sini atau ganti dengan API wilayah resmi pada production.
export const regionCatalog = addressSuggestions.reduce<Record<string, Record<string, string[]>>>((catalog, item) => {
  catalog[item.province] ??= {};
  catalog[item.province][item.city] ??= [];
  if (!catalog[item.province][item.city].includes(item.district)) catalog[item.province][item.city].push(item.district);
  return catalog;
}, {});

export function findRegionLocation(province: string, city: string, district: string) {
  return addressSuggestions.find((item) => item.province === province && item.city === city && item.district === district);
}

export const warehouseLocation = { latitude: -6.1754, longitude: 106.8272 };

export function googleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function googleMapsEmbedUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
}

export function distanceInKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function shippingQuote(distanceKm: number, courier: "JNE" | "J&T" | "SICEPAT") {
  const tariff = { JNE: { base: 9000, perKm: 170 }, "J&T": { base: 10000, perKm: 155 }, SICEPAT: { base: 8500, perKm: 165 } }[courier];
  return Math.max(12000, Math.round((tariff.base + distanceKm * tariff.perKm) / 500) * 500);
}
