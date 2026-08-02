import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customerCookie, hashPassword, signCustomerSession } from "@/lib/customer-auth";
import { hashOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ message: "Email, password minimal 8 karakter, dan OTP wajib diisi." }, { status: 400 });
  }

  try {
    const verification = await prisma.otpCode.findFirst({
      where: {
        email,
        purpose: "RESET_PASSWORD",
        codeHash: hashOtp(otp),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ message: "OTP salah atau sudah kedaluwarsa." }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.otpCode.update({ where: { id: verification.id }, data: { usedAt: new Date() } });
      return tx.user.update({
        where: { email },
        data: { passwordHash: hashPassword(password) },
      });
    });

    const customer = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    };
    const response = NextResponse.json({ ok: true, customer });
    response.cookies.set(customerCookie(signCustomerSession(customer)));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Password belum dapat direset." }, { status: 503 });
  }
}
