import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookie, signCustomerSession, verifyPassword } from "@/lib/customer-auth";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const identity = typeof body?.identity === "string" ? body.identity.trim() : ""; const password = typeof body?.password === "string" ? body.password : "";
  const user = await prisma.user.findFirst({ where: { OR: [{ email: identity.toLowerCase() }, { name: identity }] } });
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ message: "Nama/email atau password salah." }, { status: 401 });
  const customer = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" }; const response = NextResponse.json({ customer }); response.cookies.set(customerCookie(signCustomerSession(customer))); return response;
}
