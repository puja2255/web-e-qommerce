import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(request: Request) {
  if (!getCustomerSession()) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File tidak valid." }, { status: 400 });
  }
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return NextResponse.json({ message: "Format file tidak didukung. Pilih foto atau video." }, { status: 400 });
  }

  if (isImage && file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: "Ukuran foto maksimal 5 MB." }, { status: 400 });
  }

  if (isVideo && file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ message: "Ukuran video maksimal 20 MB." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || (isImage ? "jpg" : "mp4");
  const name = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
