import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const TENANT_ID = process.env.TENANT_ID!;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  priority: "high";
  channelId: string;
  data: Record<string, unknown>;
};

type ExpoTicket = { status: "ok" | "error"; id?: string; details?: { error?: string } };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Admin-only: fan a notification out to every registered native device via the
 * Expo Push API. Mirrors `/api/push/send` (web-push) but for the mobile app.
 *
 * Body: { title, body, url?, type?, id?, channelId? }
 *  - `type`/`id` drive in-app deep-linking (see the app's routeFromData()).
 *  - `channelId` selects the Android channel (events|fame|community|general).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    title,
    body = "",
    url = "/",
    type = "general",
    id,
    channelId = "general",
  } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const devices = await prisma.deviceToken.findMany({ where: { tenantId: TENANT_ID } });
  if (devices.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No devices registered yet" });
  }

  const data = { type, id, channelId, url };
  const messages: ExpoMessage[] = devices.map((d) => ({
    to: d.token,
    title: title.trim(),
    body: String(body).trim(),
    sound: "default",
    priority: "high",
    channelId,
    data,
  }));

  let sent = 0;
  let failed = 0;
  const staleTokens: string[] = [];

  // Expo accepts up to 100 messages per request.
  for (const batch of chunk(messages, 100)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];
      tickets.forEach((t, i) => {
        if (t.status === "ok") {
          sent++;
        } else {
          failed++;
          if (t.details?.error === "DeviceNotRegistered") staleTokens.push(batch[i].to);
        }
      });
    } catch (err) {
      console.error("[push/send-native] batch failed:", err);
      failed += batch.length;
    }
  }

  // Prune tokens Expo says are dead so we don't keep retrying them.
  if (staleTokens.length > 0) {
    await prisma.deviceToken.deleteMany({ where: { token: { in: staleTokens } } });
  }

  return NextResponse.json({ sent, failed, total: devices.length });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await prisma.deviceToken.count({ where: { tenantId: TENANT_ID } });
  return NextResponse.json({ devices: count });
}
