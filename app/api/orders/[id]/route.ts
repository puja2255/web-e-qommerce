import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapOrder } from "@/lib/server-data";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const existingOrder = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      status: true,
      paymentStatus: true,
      paymentDueAt: true,
      paymentMethodId: true,
    },
  });

  if (!existingOrder) {
    return NextResponse.json({ message: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id: existingOrder.paymentMethodId },
    select: { type: true },
  });

  const isExpired = Boolean(existingOrder.paymentDueAt && existingOrder.paymentDueAt.getTime() < Date.now());
  const isPaymentUpdate = typeof body.paymentProofUrl === "string" || body.paymentStatus === "PAID";

  if (isPaymentUpdate) {
    if (existingOrder.status === "CANCELLED" || isExpired) {
      return NextResponse.json(
        { message: "Tenggat pembayaran sudah lewat. Bukti tidak bisa diupload." },
        { status: 400 },
      );
    }

    if (paymentMethod?.type === "COD") {
      return NextResponse.json(
        { message: "Pembayaran COD tidak memakai upload bukti." },
        { status: 400 },
      );
    }
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: body.status,
      paymentStatus: body.paymentStatus,
      paymentProofUrl: typeof body.paymentProofUrl === "string" ? body.paymentProofUrl : undefined,
      adminNote: body.adminNote ?? undefined,
    },
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
  });

  return NextResponse.json(mapOrder(order));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.order.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

