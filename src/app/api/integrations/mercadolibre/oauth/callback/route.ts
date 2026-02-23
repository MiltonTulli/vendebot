import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MercadoLibreClient } from "@/lib/integrations/mercadolibre";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect("/sign-in");

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.MERCADOLIBRE_CLIENT_ID!;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/mercadolibre/oauth/callback`;

  try {
    const tokens = await MercadoLibreClient.exchangeCode(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    await db
      .update(tenants)
      .set({
        mercadolibreAccessToken: tokens.access_token,
        mercadolibreRefreshToken: tokens.refresh_token,
        mercadolibreUserId: String(tokens.user_id),
        updatedAt: new Date(),
      })
      .where(eq(tenants.clerkUserId, userId));

    return NextResponse.redirect("/app/settings/integrations?meli=connected");
  } catch (error) {
    return NextResponse.redirect(
      `/app/settings/integrations?meli=error&msg=${encodeURIComponent(
        error instanceof Error ? error.message : "Error"
      )}`
    );
  }
}
