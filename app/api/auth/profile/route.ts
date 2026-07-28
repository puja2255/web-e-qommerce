import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customerCookie, getCustomerSession, hashPassword, signCustomerSession } from "@/lib/customer-auth";
import { hashOtp } from "@/lib/otp";

export async function PUT(request: Request) {
  const session = getCustomerSession();
  if (!session) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  if ((!name && !password) || (name && name.length < 3) || (password && password.length < 8) || !/^\d{6}$/.test(otp)) return NextResponse.json({ message: "Masukkan perubahan yang valid dan OTP 6 digit." }, { status: 400 });
  const verification = await prisma.otpCode.findFirst({ where: { email: session.email, purpose: "PROFILE", codeHash: hashOtp(otp), usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!verification) return NextResponse.json({ message: "OTP salah atau sudah kedaluwarsa." }, { status: 400 });
  try {
    const user = await prisma.$transaction(async (tx) => {
      await tx.otpCode.update({ where: { id: verification.id }, data: { usedAt: new Date() } });
      return tx.user.update({ where: { id: session.id }, data: { ...(name ? { name } : {}), ...(password ? { passwordHash: hashPassword(password) } : {}) } });
    });
    const customer = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" };
    const response = NextResponse.json({ customer }); response.cookies.set(customerCookie(signCustomerSession(customer))); return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ message: "Nama tersebut sudah digunakan." }, { status: 409 });
    return NextResponse.json({ message: "Profil belum dapat diperbarui." }, { status: 503 });
  }
}
