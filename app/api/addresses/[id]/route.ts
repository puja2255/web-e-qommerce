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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const customer = getCustomerSession();
  if (!customer) {
    return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const existing = await prisma.customerAddress.findFirst({
    where: { id: params.id, customerId: customer.id },
  });
  if (!existing) {
    return NextResponse.json({ message: "Alamat tidak ditemukan." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Data alamat tidak valid." }, { status: 400 });
  }

  const isPrimary = body.isPrimary === true;
  if (isPrimary) {
    await prisma.customerAddress.updateMany({
      where: { customerId: customer.id, NOT: { id: params.id } },
      data: { isPrimary: false },
    });
  }

  await prisma.customerAddress.update({
    where: { id: params.id },
    data: {
      type: typeof body.type === "string" ? body.type : existing.type,
      label: typeof body.label === "string" ? body.label.trim() : existing.label,
      recipientName: typeof body.recipientName === "string" ? body.recipientName.trim() : existing.recipientName,
      phone: typeof body.phone === "string" ? body.phone.trim() : existing.phone,
      province: typeof body.province === "string" ? body.province.trim() : existing.province,
      city: typeof body.city === "string" ? body.city.trim() : existing.city,
      district: typeof body.district === "string" ? body.district.trim() : existing.district,
      detail: typeof body.detail === "string" ? body.detail.trim() : existing.detail,
      postalCode: typeof body.postalCode === "string" ? body.postalCode.trim() : existing.postalCode,
      latitude: typeof body.latitude === "number" ? body.latitude : existing.latitude,
      longitude: typeof body.longitude === "number" ? body.longitude : existing.longitude,
      mapsUrl: typeof body.mapsUrl === "string" ? body.mapsUrl.trim() : existing.mapsUrl,
      isPrimary: body.isPrimary === undefined ? existing.isPrimary : Boolean(body.isPrimary),
      isVerified: body.isVerified === undefined ? existing.isVerified : Boolean(body.isVerified),
    },
  });

  return NextResponse.json({ addresses: await listAddresses(customer.id) });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const customer = getCustomerSession();
  if (!customer) {
    return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const existing = await prisma.customerAddress.findFirst({
    where: { id: params.id, customerId: customer.id },
  });
  if (!existing) {
    return NextResponse.json({ message: "Alamat tidak ditemukan." }, { status: 404 });
  }

  await prisma.customerAddress.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ addresses: await listAddresses(customer.id) });
}
