import "server-only";

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const CUSTOMER_COOKIE = "golden_customer_session";
const secret = process.env.AUTH_SECRET || "development-only-change-this-secret";

export type AuthCustomer = { id: string; name: string; email: string; phone: string };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

export function signCustomerSession(customer: AuthCustomer) {
  const payload = Buffer.from(JSON.stringify(customer)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function getCustomerSession(): AuthCustomer | null {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()) as AuthCustomer; } catch { return null; }
}

export function customerCookie(value: string) {
  return { name: CUSTOMER_COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 };
}

export function googleState() { return randomBytes(24).toString("base64url"); }
export function stateHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
