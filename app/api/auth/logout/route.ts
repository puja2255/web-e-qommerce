import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE } from "@/lib/customer-auth";
export async function POST() { const response = NextResponse.json({ ok: true }); response.cookies.set({ name: CUSTOMER_COOKIE, value: "", path: "/", maxAge: 0 }); return response; }
