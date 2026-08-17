import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customerCookie, getCustomerSession, signCustomerSession } from "@/lib/customer-auth";

export async function PUT(request: Request) {
  const session = getCustomerSession();
  if (!session) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length < 3) return NextResponse.json({ message: "Nama minimal 3 karakter." }, { status: 400 });
  try {
    const user = await prisma.user.update({ where: { id: session.id }, data: { name } });
    const customer = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" };
    const response = NextResponse.json({ customer }); response.cookies.set(customerCookie(signCustomerSession(customer))); return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ message: "Nama tersebut sudah digunakan." }, { status: 409 });
    return NextResponse.json({ message: "Profil belum dapat diperbarui." }, { status: 503 });
  }
}
