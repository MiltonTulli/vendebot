/**
 * GET /api/mercadopago/oauth/callback — Handle MercadoPago OAuth callback
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { exchangeCodeForToken } from "@/lib/mercadopago";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // clerkUserId

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/app/settings?mp_error=missing_params", request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(code);

    await db
      .update(tenants)
      .set({
        mercadopagoAccessToken: tokenData.access_token,
        mercadopagoRefreshToken: tokenData.refresh_token,
        mercadopagoUserId: String(tokenData.user_id),
        updatedAt: new Date(),
      })
      .where(eq(tenants.clerkUserId, state));

    return NextResponse.redirect(
      new URL("/app/settings?mp_connected=true", request.url)
    );
  } catch (error) {
    console.error("MercadoPago OAuth error:", error);
    return NextResponse.redirect(
      new URL("/app/settings?mp_error=oauth_failed", request.url)
    );
  }
}
