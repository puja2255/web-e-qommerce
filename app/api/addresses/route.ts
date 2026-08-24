import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

function mapAddress(address: {
  id: string;
  customerId: string;
  type: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  isPrimary: boolean;
  isVerified: boolean;
}) {
  return {
    id: address.id,
    customerId: address.customerId,
    type: (address.type as "RECIPIENT" | "STORE" | "RETURN") ?? "RECIPIENT",
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    postalCode: address.postalCode ?? undefined,
    latitude: address.latitude ?? undefined,
    longitude: address.longitude ?? undefined,
    mapsUrl: address.mapsUrl ?? undefined,
    isPrimary: address.isPrimary,
    isVerified: address.isVerified,
  };
}

async function listAddresses(customerId: string) {
  const addresses = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return addresses.map(mapAddress);
}

export async function GET() {
  const customer = getCustomerSession();
  if (!customer) {
    return NextResponse.json({ addresses: [] });
  }

  return NextResponse.json({ addresses: await listAddresses(customer.id) });
}

export async function POST(request: Request) {
  const customer = getCustomerSession();
  if (!customer) {
    return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Data alamat tidak valid." }, { status: 400 });
  }

  const existingCount = await prisma.customerAddress.count({ where: { customerId: customer.id } });
  const isPrimary = body.isPrimary === true || existingCount === 0;

  if (isPrimary) {
    await prisma.customerAddress.updateMany({
      where: { customerId: customer.id },
      data: { isPrimary: false },
    });
  }

  await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      type: typeof body.type === "string" ? body.type : "RECIPIENT",
      label: typeof body.label === "string" ? body.label.trim() : "",
      recipientName: typeof body.recipientName === "string" ? body.recipientName.trim() : "",
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      province: typeof body.province === "string" ? body.province.trim() : "",
      city: typeof body.city === "string" ? body.city.trim() : "",
      district: typeof body.district === "string" ? body.district.trim() : "",
      detail: typeof body.detail === "string" ? body.detail.trim() : "",
      postalCode: typeof body.postalCode === "string" ? body.postalCode.trim() : null,
      latitude: typeof body.latitude === "number" ? body.latitude : null,
      longitude: typeof body.longitude === "number" ? body.longitude : null,
      mapsUrl: typeof body.mapsUrl === "string" ? body.mapsUrl.trim() : null,
      isPrimary,
      isVerified: Boolean(body.isVerified),
    },
  });

  return NextResponse.json({ addresses: await listAddresses(customer.id) }, { status: 201 });
}
