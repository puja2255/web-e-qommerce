"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useGoldenStore } from "@/lib/store";
import { formatCurrency, calcCartSubtotal } from "@/lib/utils";

export default function CartPage() {
  const { cart, products, updateCartQuantity, removeFromCart, clearCart } = useGoldenStore();
  const subtotal = calcCartSubtotal(cart);
  const shippingFee = cart.length > 0 ? 25000 : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="stack" style={{ gap: 22 }}>
      <section className="panel">
        <div className="eyebrow">
          <ShoppingCart size={14} />
          Keranjang belanja
        </div>
        <h1 style={{ marginBottom: 8 }}>Isi keranjang kamu</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Ubah jumlah produk, hapus item, atau lanjut ke checkout kapan saja.
        </p>
        {cart.length > 0 ? (
          <div className="row-actions">
            <button className="button-danger" type="button" onClick={clearCart}>
              <Trash2 size={16} />
              Kosongkan keranjang
            </button>
            <Link href="/checkout" className="button">
              Lanjut Checkout
            </Link>
          </div>
        ) : null}
      </section>

      {cart.length === 0 ? (
        <section className="panel">
          <p className="muted" style={{ margin: 0 }}>
            Keranjang masih kosong. Silakan pilih produk dari katalog.
          </p>
          <div className="row-actions">
            <Link href="/products" className="button">
              Lihat Produk
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid" style={{ gap: 18 }}>
          {cart.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            return (
              <article key={item.productId} className="panel">
                <div className="grid grid-2" style={{ alignItems: "center" }}>
                  <div className="nav-links" style={{ alignItems: "center" }}>
                    <div className="card-media" style={{ width: 120, aspectRatio: "1 / 1", borderRadius: 18 }}>
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div>
                      <h3 style={{ marginTop: 0 }}>{item.name}</h3>
                      <div className="muted tiny">{formatCurrency(item.price)}</div>
                      {product ? <div className="muted tiny">Sisa stok: {product.stock}</div> : null}
                    </div>
                  </div>

                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <div className="nav-links">
                      <button className="button-outline" type="button" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>
                        <Minus size={16} />
                      </button>
                      <span className="badge-soft">{item.quantity}</span>
                      <button className="button-outline" type="button" onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800 }}>{formatCurrency(item.price * item.quantity)}</div>
                      <button className="button-ghost" type="button" onClick={() => removeFromCart(item.productId)}>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          <section className="panel">
            <div className="grid grid-2">
              <div className="muted-box">
                <strong>Ringkasan</strong>
                <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <span>Ongkir</span>
                    <strong>{formatCurrency(shippingFee)}</strong>
                  </div>
                  <div className="nav-links" style={{ justifyContent: "space-between" }}>
                    <span>Total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>
              <div className="stack">
                <Link href="/checkout" className="button">
                  Checkout sekarang
                </Link>
                <Link href="/products" className="button-outline">
                  Lanjut belanja
                </Link>
              </div>
            </div>
          </section>
        </section>
      )}
    </div>
  );
}

