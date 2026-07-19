import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="panel" style={{ textAlign: "center" }}>
      <div className="eyebrow">404</div>
      <h1>Halaman tidak ditemukan</h1>
      <p className="muted">Coba kembali ke beranda atau buka katalog produk.</p>
      <div className="row-actions" style={{ justifyContent: "center" }}>
        <Link href="/" className="button">
          Beranda
        </Link>
        <Link href="/products" className="button-outline">
          Katalog
        </Link>
      </div>
    </section>
  );
}

