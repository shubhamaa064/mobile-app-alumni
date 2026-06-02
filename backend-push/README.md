# Backend additions for native (mobile) push

These files are **for the `alum-app` Next.js backend**, not the mobile app. The mobile app
already works without them (local notifications, inbox, reminders, deep-linking all run
on-device). Add these only when you want to send **server-initiated** push to the Android/iOS
app — the existing web-push (VAPID) routes can't reach native apps.

## Why a new table?

Web push stores a VAPID `endpoint` + `p256dh`/`auth` keys (`PushSubscription`). Native push
via Expo needs only a single `ExponentPushToken[…]` string, delivered through the Expo Push
API. So native tokens get their own `DeviceToken` table.

## Install

1. **Schema** — paste the model from `prisma/schema.additions.prisma` into
   `prisma/schema.prisma` (next to `PushSubscription`), then:
   ```bash
   npx prisma migrate dev --name device_tokens
   ```
2. **Routes** — copy into the matching paths in the backend:
   - `app/api/push/register-device/route.ts` — `POST` upserts a token, `DELETE` removes it.
     The mobile app calls this automatically on launch (best-effort). No auth required: the
     app authenticates with a JWT, not the NextAuth cookie, so an optional `userId` is passed
     in the body.
   - `app/api/push/send-native/route.ts` — **ADMIN-only**. Fans a notification out to every
     registered device via `https://exp.host/--/api/v2/push/send` (batched 100/request) and
     prunes tokens Expo reports as `DeviceNotRegistered`.

## Sending a push

```bash
curl -X POST https://alum-app-tau.vercel.app/api/push/send-native \
  -H 'Content-Type: application/json' \
  --cookie '<admin NextAuth session>' \
  -d '{ "title": "New on the Wall of Fame 🏅",
        "body": "Priya (Batch 2009) just made the news!",
        "type": "news", "id": "<articleId>", "channelId": "fame" }'
```

`type` + `id` drive in-app deep-linking (see `src/lib/notifications.ts` → `routeFromData`),
and `channelId` picks the Android channel (`events` | `fame` | `community` | `general`).
