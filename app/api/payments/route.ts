import { NextResponse } from "next/server";
import { createPaymentMethodRecord, getBootstrapState } from "@/lib/server-data";

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json({ paymentMethods: state.paymentMethods });
}

export async function POST(request: Request) {
  const body = await request.json();
  const paymentMethod = await createPaymentMethodRecord({
    type: body.type,
    label: body.label,
    details: body.details ?? "",
    accountName: body.accountName ?? "",
    accountNumber: body.accountNumber ?? "",
    isActive: Boolean(body.isActive),
  });

  return NextResponse.json(paymentMethod, { status: 201 });
}

