"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircleMore, ShoppingBag, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminWhatsappLink } from "@/lib/contact";
import { useGoldenStore } from "@/lib/store";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Produk" },
  { href: "/cart", label: "Keranjang" },
  { href: "/checkout", label: "Checkout" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { cart } = useGoldenStore();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 16);
      setHidden(currentY > lastY && currentY > 90);
      lastY = currentY;
      if (currentY < 24) {
        setHidden(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-shell site-header ${hidden ? "site-header--hidden" : ""} ${scrolled ? "site-header--scrolled" : ""}`}>
      <div className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="Golden Store">
            <span className="brand-mark">
              <Store size={20} />
            </span>
            <span>
              Golden Store
              <span className="tiny muted" style={{ display: "block" }}>
                E-commerce terpercaya untuk produk terbaik
              </span>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Navigasi utama">
            {links.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link key={link.href} href={link.href} className={`nav-link ${isActive ? "active" : ""}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="nav-links">
            {/* <Link href="/cart" className="button-icon" aria-label="Keranjang" title="Keranjang">
              <ShoppingBag size={18} />
              <span className="badge-float">{cart.length}</span>
            </Link> */}
            <a
              className="button-icon"
              href={adminWhatsappLink("Halo admin Golden Store, saya ingin bertanya tentang produk.")}
              target="_blank"
              rel="noreferrer"
              aria-label="Tanya WA admin"
              title="Tanya WA admin"
            >
              <MessageCircleMore size={18} />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
