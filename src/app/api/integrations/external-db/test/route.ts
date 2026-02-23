import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { testExternalDbConnection } from "@/lib/integrations/external-db";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, connectionUrl } = await req.json() as {
    type: "postgresql" | "mysql";
    connectionUrl: string;
  };

  const result = await testExternalDbConnection(type, connectionUrl);
  return NextResponse.json(result);
}
