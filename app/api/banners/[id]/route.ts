import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toBannerResponse(banner: {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
}) {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl,
    link: banner.link,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
  };
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Data banner tidak valid." }, { status: 400 });
  }

  const banner = await prisma.banner.update({
    where: { id: params.id },
    data: {
      title: typeof body.title === "string" ? body.title.trim() : "",
      subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      link: typeof body.link === "string" ? body.link.trim() : "/products",
      isActive: body.isActive !== false,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });

  return NextResponse.json({ banner: toBannerResponse(banner) });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.banner.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
