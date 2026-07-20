import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customerCookie, hashPassword, signCustomerSession } from "@/lib/customer-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (name.length < 3 || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 8 || password.length < 8) return NextResponse.json({ message: "Nama, email, nomor WhatsApp, dan password minimal 8 karakter wajib diisi." }, { status: 400 });
  try {
    const user = await prisma.user.create({ data: { name, email, phone, passwordHash: hashPassword(password), role: "CUSTOMER" } });
    const customer = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" };
    const response = NextResponse.json({ customer }, { status: 201 });
    response.cookies.set(customerCookie(signCustomerSession(customer)));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ message: "Nama atau email ini sudah digunakan. Silakan gunakan yang lain." }, { status: 409 });
    return NextResponse.json({ message: "Pendaftaran belum dapat diproses." }, { status: 503 });
  }
}
