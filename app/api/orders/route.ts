import { NextResponse } from "next/server";
import { createOrderRecord, getBootstrapState } from "@/lib/server-data";

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json({ orders: state.orders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const order = await createOrderRecord({
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress,
    mapsLink: body.mapsLink ?? "",
    notes: body.notes ?? "",
    paymentMethodId: body.paymentMethodId,
    paymentProofUrl: body.paymentProofUrl ?? undefined,
    items: Array.isArray(body.items) ? body.items : [],
  });

  return NextResponse.json(order, { status: 201 });
}

