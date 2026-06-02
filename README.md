# CTK Alumni — Android App 🎓

A warm, nostalgic mobile companion for the **Christ The King Alumni Association**, built with
Expo (React Native) + Expo Router. It talks to the existing Next.js backend
(`https://alum-app-tau.vercel.app`) — no separate API is needed.

The design leans into reminiscence: aged-paper creams, heritage navy and antique gold, a
serif "yearbook" type system (Playfair Display), and handwritten captions (Caveat).

## Features

- **Home** — regal hero with live site content & stats, quick links, upcoming events,
  Wall of Fame carousel, and a "Photo Memories" archive strip.
- **Events** — upcoming / past ("Memories") / all, with rich event detail + register link.
- **Memories (Gallery)** — albums shown as polaroids, full photo grid, and a full-screen viewer.
- **Alumni Directory** — debounced search + detailed alumni profiles (skills, education, work, socials).
- **More** — account (JWT sign-in via Secure Store), Wall of Fame, Careers, Leadership,
  Principals, Give Back, and Membership plans.
- **Auth** — login (email *or* mobile) and registration against the backend's JWT endpoints.
- **Notifications** (Zomato/Swiggy-style) — friendly first-launch permission primer, per-content
  Android channels (Events, Wall of Fame, Community, General), an in-app inbox with an unread
  badge on every header bell, deep-linking on tap (cold-start aware), event "Remind me" alerts,
  and a settings screen with live test/preview notifications.

## Tech

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Expo SDK 56, React Native 0.85, React 19            |
| Navigation     | Expo Router (file-based, typed routes)              |
| Data           | TanStack Query (`@tanstack/react-query`)            |
| Auth storage   | `expo-secure-store` (JWT)                           |
| Images         | `expo-image`                                        |
| Fonts          | Playfair Display, Inter, Caveat (Google Fonts)      |
| Notifications  | `expo-notifications` (local + Expo push), `expo-device` |
| Local storage  | `@react-native-async-storage/async-storage` (inbox)  |

## Run it

```bash
npm install
npx expo start            # then press 'a' for Android, or scan the QR in Expo Go
```

> The app loads live data from the production backend, so a network connection is required.
> No `.env` is needed — the API base lives in `src/lib/api.ts` (`API_BASE`).

## Build a downloadable APK (EAS)

The repo includes `eas.json` with a `preview` profile that produces an installable `.apk`.

```bash
npm install -g eas-cli
eas login                 # your Expo account
eas build -p android --profile preview
```

EAS builds in the cloud and returns a download link for the `.apk`. For a Play Store
bundle (`.aab`) use the `production` profile instead.

### Local APK (optional)

With Android Studio + JDK installed you can build locally:

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK lands in android/app/build/outputs/apk/release/
```

## Project layout

```
src/
  app/                 # Expo Router routes
    (tabs)/            # Home, Events, Memories, Alumni, More
    event/[id].tsx     # detail screens
    news/[id].tsx  news.tsx
    album/[id].tsx
    alumni/[id].tsx
    jobs / leadership / principals / donate / membership
    login.tsx  register.tsx
  components/          # Text, Crest, cards, PageHeader, Avatar, ui primitives
  lib/                 # api client + types, auth context, query client, helpers
  theme/               # colors, fonts, spacing, gradients, shadows
```

## Notes on the backend

Read endpoints (events, news, gallery, albums, alumni, jobs, leadership, principals,
membership plans, site content) are public and consumed directly. The personalised
dashboard endpoints are protected by the web app's NextAuth session cookie, so the mobile
app uses the JWT `/api/auth/login` endpoint for sign-in state and deep-links to the website
for flows that require that session (event registration, donations, membership checkout).

## Notifications

Everything that drives the in-app experience works **out of the box** with no backend change:
local reminders ("Remind me" on events), the permission primer, channels, the inbox, badge
counts and deep-linking all run on-device. In **Expo Go** remote push is unavailable, so token
registration no-ops gracefully — local notifications still demo the full UX. Building a
dev/standalone APK (with an EAS `projectId`) enables real Expo push tokens.

**Remote ("server-sent") push** needs a small backend addition, because the existing web-push
(VAPID) routes only reach browsers. The app posts its Expo token to `POST /api/push/register-device`.
Drop-in reference implementations for the alum-app backend live in [`backend-push/`](./backend-push)
(with their own README):

- `prisma/schema.additions.prisma` → a `DeviceToken` model (token `@unique @db.VarChar(255)`,
  tenantId, platform, userId), then `npx prisma migrate dev`.
- `app/api/push/register-device/route.ts` → `POST`/`DELETE` to upsert/remove a device token.
- `app/api/push/send-native/route.ts` → ADMIN-only fan-out via the Expo Push API
  (`https://exp.host/--/api/v2/push/send`, batched 100/req, prunes `DeviceNotRegistered`).

Send payload mirrors the app's deep-link map: `{ title, body, type, id, channelId, url }`.
