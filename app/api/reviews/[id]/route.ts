import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const customer = getCustomerSession();
  if (!customer) {
    return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
  }

  try {
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const images = Array.isArray(body.images) ? body.images : [];
    const videos = Array.isArray(body.videos) ? body.videos : [];

    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 1000) {
      return NextResponse.json({ message: "Rating harus 1-5 bintang dan ulasan 3-1000 karakter." }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: { orderItem: { include: { order: true } } },
    });

    if (!review) {
      return NextResponse.json({ message: "Ulasan tidak ditemukan." }, { status: 404 });
    }

    if (review.orderItem.order.customerId !== customer.id) {
      return NextResponse.json({ message: "Anda tidak memiliki akses untuk mengubah ulasan ini." }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: params.id },
        data: {
          rating,
          comment,
          images,
          videos,
        },
      });

      const aggregate = await tx.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
          reviewsCount: aggregate._count.rating,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: "Gagal memperbarui ulasan." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const customer = getCustomerSession();
  if (!customer) {
    return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: { orderItem: { include: { order: true } } },
    });

    if (!review) {
      return NextResponse.json({ message: "Ulasan tidak ditemukan." }, { status: 404 });
    }

    if (review.orderItem.order.customerId !== customer.id) {
      return NextResponse.json({ message: "Anda tidak memiliki akses untuk menghapus ulasan ini." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: params.id },
      });

      const aggregate = await tx.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
          reviewsCount: aggregate._count.rating,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menghapus ulasan." }, { status: 500 });
  }
}
