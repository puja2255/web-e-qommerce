import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";
import { hashOtp, makeOtp, OTP_PURPOSES, sendOtpEmail } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const purpose = body?.purpose;
  if (!/^\S+@\S+\.\S+$/.test(email) || !OTP_PURPOSES.includes(purpose)) return NextResponse.json({ message: "Permintaan OTP tidak valid." }, { status: 400 });
  const session = getCustomerSession();
  if (purpose === "PROFILE" && (!session || session.email !== email)) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (purpose === "REGISTER" && await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ message: "Email sudah digunakan." }, { status: 409 });
  const code = makeOtp();
  await prisma.otpCode.deleteMany({ where: { email, purpose, usedAt: null } });
  await prisma.otpCode.create({ data: { email, purpose, codeHash: hashOtp(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000), userId: session?.id } });
  try {
    const delivery = await sendOtpEmail(email, code, purpose);
    return NextResponse.json({ ok: true, ...(delivery.delivered ? {} : { debugCode: delivery.debugCode }) });
  } catch {
    return NextResponse.json({ message: "OTP belum dapat dikirim. Coba lagi nanti." }, { status: 503 });
  }
}
