import "server-only";

import { createHash, randomInt } from "crypto";

export const OTP_PURPOSES = ["REGISTER", "PROFILE", "RESET_PASSWORD"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 5 * 60 * 1000;

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
  const html = `<p>Kode OTP Golden Store Anda:</p><h1 style="letter-spacing:6px">${code}</h1><p>Berlaku selama 5 menit. Jangan berikan kode ini kepada siapa pun.</p>`;
  if (!apiKey || !from) {
    throw new Error("Konfigurasi email belum diset. Isi RESEND_API_KEY dan EMAIL_FROM di .env.");
  }
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject, html }) });
  if (!response.ok) throw new Error("Email delivery failed");
  return { delivered: true };
}
