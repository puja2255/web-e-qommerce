import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-shell">
      <div className="footerbar">
        <div className="footer-inner">
          <div>
            <strong>Golden Store</strong>
            <div className="tiny muted">Temukan produk terbaik untuk kebutuhan Anda.</div>
          </div>
          <div className="nav-links">
            <Link href="/products" className="nav-link">
              Produk
            </Link>
            <Link href="/checkout" className="nav-link">
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
