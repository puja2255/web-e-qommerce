import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
export async function GET() { return NextResponse.json({ customer: getCustomerSession() }); }
