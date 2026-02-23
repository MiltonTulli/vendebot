/**
 * GET /api/mercadopago/oauth — Redirect tenant to MercadoPago OAuth
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOAuthUrl } from "@/lib/mercadopago";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = getOAuthUrl(userId);
  return NextResponse.redirect(url);
}
