import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProductRecord } from "@/lib/server-data";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const product = await updateProductRecord(params.id, {
    name: body.name,
    description: body.description,
    categoryId: body.categoryId,
    price: Number(body.price),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
    stock: Number(body.stock),
    sku: body.sku,
    isFeatured: Boolean(body.isFeatured),
    isActive: Boolean(body.isActive),
    images: Array.isArray(body.images) ? body.images : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    rating: Number(body.rating ?? 4.5),
    reviewsCount: Number(body.reviewsCount ?? 0),
  });

  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.product.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

