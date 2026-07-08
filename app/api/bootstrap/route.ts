import { NextResponse } from "next/server";
import { getBootstrapState } from "@/lib/server-data";

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json(state);
}

