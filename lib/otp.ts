import "server-only";

import { createHash, randomInt } from "crypto";

export const OTP_PURPOSES = ["REGISTER", "PROFILE", "RESET_PASSWORD"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const hashOtp = (code: string) => createHash("sha256").update(`${code}:${process.env.AUTH_SECRET ?? "development-only-change-this-secret"}`).digest("hex");
export const makeOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const subject =
    purpose === "REGISTER"
      ? "Kode verifikasi pendaftaran"
      : purpose === "RESET_PASSWORD"
        ? "Kode verifikasi reset password"
        : "Kode verifikasi perubahan akun";
  const html = `<p>Kode OTP Golden Store Anda:</p><h1 style="letter-spacing:6px">${code}</h1><p>Berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.</p>`;
  if (!apiKey || !from) {
    // Memungkinkan alur diuji secara lokal tanpa membocorkan OTP di produksi.
    if (process.env.NODE_ENV !== "production") return { delivered: false, debugCode: code };
    throw new Error("Email service is not configured");
  }
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject, html }) });
  if (!response.ok) throw new Error("Email delivery failed");
  return { delivered: true };
}
