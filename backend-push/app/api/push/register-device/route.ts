import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TENANT_ID = process.env.TENANT_ID!;

/**
 * Native (Expo) push token registration for the mobile app.
 *
 * The Android/iOS app posts the Expo push token it gets from
 * `Notifications.getExpoPushTokenAsync()`. Unlike the web `/push/subscribe`
 * route (which stores VAPID endpoint + p256dh/auth), native delivery only
 * needs the single token string, sent later through the Expo Push API.
 *
 * Auth note: the mobile app authenticates with a JWT (not the NextAuth
 * session cookie), so we accept an optional `userId` in the body rather than
 * reading the session here. The token alone is enough to deliver pushes.
 */
export async function POST(req: NextRequest) {
  const { token, platform, userId } = (await req.json()) as {
    token?: string;
    platform?: string;
    userId?: string | null;
  };

  if (!token || !token.startsWith("ExponentPushToken")) {
    return NextResponse.json({ error: "Valid Expo push token required" }, { status: 400 });
  }

  await prisma.deviceToken.upsert({
    where: { token },
    create: { tenantId: TENANT_ID, token, platform: platform ?? null, userId: userId ?? null },
    update: { platform: platform ?? null, userId: userId ?? null },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { token } = (await req.json()) as { token?: string };
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  await prisma.deviceToken.deleteMany({ where: { tenantId: TENANT_ID, token } });
  return NextResponse.json({ success: true });
}
