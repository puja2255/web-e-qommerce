import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCategoryRecord } from "@/lib/server-data";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const category = await updateCategoryRecord(params.id, {
    name: body.name,
    description: body.description ?? "",
    isActive: Boolean(body.isActive),
  });

  return NextResponse.json(category);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.category.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

