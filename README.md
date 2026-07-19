# Golden Store

Golden Store adalah starter e-commerce bertema kuning emas dengan mode gelap dan terang.

## Fitur inti

- Login admin
- Dashboard admin
- Manajemen produk
- Manajemen kategori
- Keranjang belanja
- Checkout dengan metode COD / DANA / bank
- Upload bukti transfer
- Manajemen pesanan
- Laporan penjualan

## Stack

- Next.js + React
- Prisma
- PostgreSQL

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env`
2. Isi `DATABASE_URL`
3. Jalankan `npm install`
4. Jalankan `npx prisma generate`
5. Jalankan migrasi pertama dengan `npx prisma migrate dev`
6. Jalankan seed data dengan `npx prisma db seed`
7. Jalankan aplikasi dengan `npm run dev`

## Catatan Windows

Kalau PowerShell menolak `npx` dengan error `running scripts is disabled`, pakai:

```powershell
cmd /c npx prisma generate
cmd /c npx prisma migrate dev
cmd /c npx prisma db seed
```

## Catatan

- UI frontend sudah disiapkan agar bisa dipakai sebagai prototipe langsung.
- Skema Prisma sudah disediakan untuk backend PostgreSQL.
- Jika ingin membuat aplikasi mobile React Native nanti, struktur data dan flow sudah tinggal dipindahkan.
