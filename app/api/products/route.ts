import { NextResponse } from "next/server";
import { createProductRecord, getBootstrapState } from "@/lib/server-data";

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json({ products: state.products });
}

export async function POST(request: Request) {
  const body = await request.json();
  const product = await createProductRecord({
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

  return NextResponse.json(product, { status: 201 });
}

