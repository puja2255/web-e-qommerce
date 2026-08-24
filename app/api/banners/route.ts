import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    banners: banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      link: banner.link,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Data banner tidak valid." }, { status: 400 });
  }

  const banner = await prisma.banner.create({
    data: {
      title: typeof body.title === "string" ? body.title.trim() : "",
      subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      link: typeof body.link === "string" ? body.link.trim() : "/products",
      isActive: body.isActive !== false,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });

  return NextResponse.json({
    banner: {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      link: banner.link,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    },
  }, { status: 201 });
}
