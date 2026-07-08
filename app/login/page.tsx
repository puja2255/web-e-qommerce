"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, UserRound } from "lucide-react";
import { useGoldenStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { loginAdmin, adminSession } = useGoldenStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminSession) {
      router.push("/admin");
    }
  }, [adminSession, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = loginAdmin(email, password);
    if (!success) {
      setError("Email atau password admin salah.");
      return;
    }
    router.push("/admin");
  };

  return (
    <section className="panel auth-shell" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="eyebrow">
        <LockKeyhole size={14} />
        Login admin
      </div>
      <h1 style={{ marginBottom: 8 }}>Masuk ke dashboard Golden Store</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Gunakan akun demo untuk membuka dashboard admin.
      </p>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Masukkan email admin" autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" autoComplete="current-password" />
        </div>
        {error ? <div className="muted-box" style={{ color: "var(--danger)" }}>{error}</div> : null}
        <button className="button" type="submit">
          <UserRound size={16} />
          Masuk
        </button>
      </form>
    </section>
  );
}
