import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { MercadoLibreClient } from "@/lib/integrations/mercadolibre";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.MERCADOLIBRE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/mercadolibre/oauth/callback`;

  const url = MercadoLibreClient.getAuthUrl(clientId, redirectUri);
  return NextResponse.redirect(url);
}
