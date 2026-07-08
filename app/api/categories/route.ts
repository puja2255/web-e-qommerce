import { NextResponse } from "next/server";
import { createCategoryRecord, getBootstrapState } from "@/lib/server-data";

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json({ categories: state.categories });
}

export async function POST(request: Request) {
  const body = await request.json();
  const category = await createCategoryRecord({
    name: body.name,
    description: body.description ?? "",
    isActive: Boolean(body.isActive),
  });

  return NextResponse.json(category, { status: 201 });
}

