export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";
import { hashOtp, makeOtp, OTP_PURPOSES, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS, sendOtpEmail } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const purpose = body?.purpose;
  if (!/^\S+@\S+\.\S+$/.test(email) || !OTP_PURPOSES.includes(purpose)) return NextResponse.json({ message: "Permintaan OTP tidak valid." }, { status: 400 });
  const session = getCustomerSession();
  if (purpose === "PROFILE" && (!session || session.email !== email)) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (purpose === "REGISTER" && await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ message: "Email sudah digunakan." }, { status: 409 });

  if (purpose === "RESET_PASSWORD") {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
  }

  const cooldownStart = new Date(Date.now() - OTP_RESEND_COOLDOWN_MS);
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      email,
      purpose,
      usedAt: null,
      createdAt: { gt: cooldownStart },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const remaining = OTP_RESEND_COOLDOWN_MS - (Date.now() - recentOtp.createdAt.getTime());
    const secondsLeft = Math.max(1, Math.ceil(remaining / 1000));
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return NextResponse.json(
      {
        message: `OTP sudah dikirim. Coba lagi dalam ${minutes > 0 ? `${minutes} menit ` : ""}${seconds} detik.`,
      },
      { status: 429 },
    );
  }

  const code = makeOtp();
  const otpRecord = await prisma.otpCode.create({
    data: {
      email,
      purpose,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      userId: session?.id,
    },
  });

  try {
    await sendOtpEmail(email, code, purpose);
    return NextResponse.json({
      ok: true,
      message: "OTP telah dikirim ke email.",
      expiresAt: otpRecord.expiresAt.toISOString(),
      retryAfterSeconds: Math.max(1, Math.ceil(OTP_TTL_MS / 1000)),
    });
  } catch (error) {
    await prisma.otpCode.delete({ where: { id: otpRecord.id } }).catch(() => null);
    const message = error instanceof Error ? error.message : "OTP belum dapat dikirim. Coba lagi nanti.";
    return NextResponse.json({ message }, { status: 503 });
  }
}
