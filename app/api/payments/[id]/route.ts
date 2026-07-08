import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePaymentMethodRecord } from "@/lib/server-data";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const paymentMethod = await updatePaymentMethodRecord(params.id, {
    type: body.type,
    label: body.label,
    details: body.details ?? "",
    accountName: body.accountName ?? "",
    accountNumber: body.accountNumber ?? "",
    isActive: Boolean(body.isActive),
  });

  return NextResponse.json(paymentMethod);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.paymentMethod.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

