import { NextResponse } from "next/server";
import { getBootstrapState } from "@/lib/server-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
