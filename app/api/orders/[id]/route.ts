import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: body.status,
      paymentStatus: body.paymentStatus,
      adminNote: body.adminNote ?? undefined,
    },
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
  });

  return NextResponse.json({
    ...order,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      image: item.imageUrl,
    })),
    createdAt: order.createdAt.toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.order.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

