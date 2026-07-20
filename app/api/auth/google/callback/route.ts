import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookie, signCustomerSession, stateHash } from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url); const origin = requestUrl.origin; const code = requestUrl.searchParams.get("code"); const stateWithNext = requestUrl.searchParams.get("state") || ""; const [state, encodedNext] = stateWithNext.split("."); const next = encodedNext ? decodeURIComponent(encodedNext) : "/account";
  if (!code || !state || request.cookies.get("golden_google_state")?.value !== stateHash(state)) return NextResponse.redirect(new URL("/account?error=google_failed", origin));
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", redirect_uri: `${origin}/api/auth/google/callback`, grant_type: "authorization_code" }) });
    const token = await tokenResponse.json(); if (!token.access_token) throw new Error("No Google token");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } }); const profile = await profileResponse.json(); if (!profile.sub || !profile.email) throw new Error("No Google profile");
    const baseName = String(profile.name || profile.email.split("@")[0]).trim(); let name = baseName; let suffix = 1;
    while (await prisma.user.findFirst({ where: { name, NOT: { googleId: profile.sub } } })) { name = `${baseName}-${suffix++}`; }
    const user = await prisma.user.upsert({ where: { email: String(profile.email).toLowerCase() }, update: { googleId: profile.sub, name }, create: { email: String(profile.email).toLowerCase(), name, googleId: profile.sub, role: "CUSTOMER" } });
    const customer = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" }; const response = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/account", origin)); response.cookies.set(customerCookie(signCustomerSession(customer))); response.cookies.delete("golden_google_state"); return response;
  } catch { return NextResponse.redirect(new URL("/account?error=google_failed", origin)); }
}
