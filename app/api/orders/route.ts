import { NextResponse } from "next/server";
import { createOrderRecord, getBootstrapState } from "@/lib/server-data";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const state = await getBootstrapState();
  return NextResponse.json({ orders: state.orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Data pesanan tidak valid." },
        { status: 400 },
      );
    }

    const requiredFields = ["customerName", "customerPhone", "customerAddress", "paymentMethodId"] as const;
    const missingField = requiredFields.find(
      (field) => typeof body[field] !== "string" || !body[field].trim(),
    );

    if (missingField) {
      return NextResponse.json(
        { message: `Data ${missingField} wajib diisi.` },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: "Pesanan harus memiliki minimal satu produk." },
        { status: 400 },
      );
    }

    const customer = getCustomerSession();
    if (!customer) return NextResponse.json({ message: "Silakan masuk terlebih dahulu untuk checkout." }, { status: 401 });
    const order = await createOrderRecord({
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerAddress: body.customerAddress.trim(),
      mapsLink: typeof body.mapsLink === "string" ? body.mapsLink : "",
      notes: typeof body.notes === "string" ? body.notes : "",
      paymentMethodId: body.paymentMethodId,
      paymentProofUrl: typeof body.paymentProofUrl === "string" ? body.paymentProofUrl : undefined,
      customerId: customer.id,
      shippingFee: typeof body.shippingFee === "number" ? body.shippingFee : undefined,
      paymentDueAt: typeof body.paymentDueAt === "string" ? body.paymentDueAt : undefined,
      items: body.items,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat pesanan:", error);
    return NextResponse.json(
      { message: "Pesanan gagal dibuat. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
