import { NextResponse } from "next/server";
import { googleState, stateHash } from "@/lib/customer-auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/account?error=google_not_configured", origin));
  const state = googleState(); const next = new URL(request.url).searchParams.get("next") || "/account";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: `${origin}/api/auth/google/callback`, response_type: "code", scope: "openid email profile", state: `${state}.${encodeURIComponent(next)}`, prompt: "select_account" }).toString();
  const response = NextResponse.redirect(url); response.cookies.set("golden_google_state", stateHash(state), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 }); return response;
}
