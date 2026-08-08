"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftFromLine,
  ArrowRightToLine,
  BarChart3,
  Images,
  Boxes,
  CreditCard,
  LogIn,
  LogOut,
  PackageSearch,
  Receipt,
  Shield,
  Tags,
  Users,
} from "lucide-react";
import { useGoldenStore } from "@/lib/store";

const menu = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/products", label: "Produk", icon: Boxes },
  { href: "/admin/categories", label: "Kategori", icon: Tags },
  { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/banners", label: "Banner", icon: Images },
  { href: "/admin/orders", label: "Pesanan", icon: PackageSearch },
  { href: "/admin/reports", label: "Laporan", icon: Receipt },
];

export function AdminShell({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const pathname = usePathname();
  const { adminSession, logoutAdmin } = useGoldenStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerActions = useMemo(
    () =>
      adminSession ? (
        <div className="nav-links">
          <button className="button-outline" type="button" onClick={() => setSidebarOpen((current) => !current)}>
            {sidebarOpen ? <ArrowLeftFromLine size={16} /> : <ArrowRightToLine size={16} />}
            Sidebar
          </button>
          <button className="button-outline" type="button" onClick={logoutAdmin}>
            <LogOut size={16} />
            Logout
          </button>
          {action}
        </div>
      ) : (
        action
      ),
    [action, adminSession, logoutAdmin, sidebarOpen],
  );

  if (!adminSession) {
    return (
      <section className="panel">
        <div className="eyebrow">
          <Shield size={14} />
          Akses admin
        </div>
        <h1 style={{ marginBottom: 8 }}>{title}</h1>
        <p className="muted">{description}</p>
        <div className="muted-box" style={{ marginTop: 18 }}>
          <p style={{ marginTop: 0 }}>
            Kamu perlu login admin untuk membuka dashboard, manajemen produk, pesanan, dan laporan.
          </p>
          <Link href="/login" className="button">
            <LogIn size={16} />
            Login Admin
          </Link>
        </div>
    </section>
  );
  }

  return (
    <section className="admin-shell">
      {sidebarOpen ? <button type="button" aria-label="Tutup sidebar" className="admin-overlay" onClick={() => setSidebarOpen(false)} /> : null}

      <div className="admin-layout">
        <aside className={`sidebar panel ${sidebarOpen ? "is-open" : ""}`}>
          <div className="sidebar__head">
            <div>
              <strong>{adminSession.name}</strong>
              <div className="tiny muted">{adminSession.email}</div>
            </div>
            <button className="button-ghost" type="button" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar">
              <ArrowLeftFromLine size={16} />
            </button>
          </div>
          <div className="muted-box">
            <Users size={16} /> Kelola produk, pesanan, dan laporan dari satu tempat.
          </div>
          <div className="stack">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`sidebar-link ${active ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="admin-content stack">
          <div className="section-title">
            <div>
              <div className="eyebrow">
                <Shield size={14} />
                Dashboard Admin
              </div>
              <h2>{title}</h2>
              <div className="section-copy">{description}</div>
            </div>
            {headerActions ? <div>{headerActions}</div> : null}
          </div>

          {children}
        </div>
      </div>
    </section>
  );
}
