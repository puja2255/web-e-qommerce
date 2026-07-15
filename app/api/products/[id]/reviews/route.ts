import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serializeReview(review: {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}) {
  return { ...review, createdAt: review.createdAt.toISOString() };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews: reviews.map(serializeReview) });
  } catch {
    return NextResponse.json({ message: "Ulasan belum tersedia. Pastikan database dan migrasi ulasan sudah aktif." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Data ulasan tidak valid." }, { status: 400 });
  }

  try {
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 1000) {
    return NextResponse.json({ message: "Rating harus 1-5 bintang dan ulasan 3-1000 karakter." }, { status: 400 });
  }

  const orderItem = await prisma.orderItem.findFirst({
    where: {
      productId: params.id,
      order: {
        orderNumber,
        status: "COMPLETED",
      },
    },
    include: { order: true, review: true },
  });

  if (!orderItem) {
    return NextResponse.json({ message: "Pesanan selesai untuk produk ini tidak ditemukan." }, { status: 403 });
  }

  if (orderItem.review) {
    return NextResponse.json({ message: "Produk ini sudah diberi ulasan untuk pesanan tersebut." }, { status: 409 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        productId: params.id,
        orderItemId: orderItem.id,
        customerName: orderItem.order.customerName,
        rating,
        comment,
      },
    });
    const aggregate = await tx.review.aggregate({
      where: { productId: params.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.product.update({
      where: { id: params.id },
      data: {
        rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
        reviewsCount: aggregate._count.rating,
      },
    });
    return {
      review: created,
      rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      reviewsCount: aggregate._count.rating,
    };
  });

    return NextResponse.json({ ...result, review: serializeReview(result.review) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Ulasan belum dapat dikirim. Pastikan DATABASE_URL tersedia dan migrasi ulasan sudah dijalankan." },
      { status: 503 },
    );
  }
}
