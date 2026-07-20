import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookie, signCustomerSession, verifyPassword } from "@/lib/customer-auth";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""; const password = typeof body?.password === "string" ? body.password : "";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
  const customer = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" }; const response = NextResponse.json({ customer }); response.cookies.set(customerCookie(signCustomerSession(customer))); return response;
}
