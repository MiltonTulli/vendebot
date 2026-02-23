/**
 * Order tracking — generate public tracking links and tokens
 */

import { randomBytes } from "crypto";

/** Generate a unique tracking token */
export function generateTrackingToken(): string {
  return randomBytes(16).toString("hex");
}

/** Build the public tracking URL */
export function getTrackingUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  return `${baseUrl}/tracking/${token}`;
}
