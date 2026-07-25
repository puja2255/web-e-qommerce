import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapOrder } from "@/lib/server-data";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
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

