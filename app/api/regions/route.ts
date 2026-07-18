import { NextResponse } from "next/server";

const BASE_URL = "https://wilayah.id/api";
const paths = {
  provinces: "provinces.json",
  regencies: (id: string) => `regencies/${id}.json`,
  districts: (id: string) => `districts/${id}.json`,
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const parentId = searchParams.get("parentId");
  const path = level === "provinces" ? paths.provinces : level === "regencies" && parentId ? paths.regencies(parentId) : level === "districts" && parentId ? paths.districts(parentId) : null;
  if (!path) return NextResponse.json({ message: "Parameter wilayah tidak valid." }, { status: 400 });
  try {
    const response = await fetch(`${BASE_URL}/${path}`, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Region API unavailable");
    const payload = (await response.json()) as { data?: Array<{ code: string; name: string }> };
    const regions = (payload.data ?? []).map((item) => ({ id: item.code, name: item.name }));
    return NextResponse.json(regions, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return NextResponse.json({ message: "Data wilayah sementara tidak dapat dimuat." }, { status: 503 });
  }
}
