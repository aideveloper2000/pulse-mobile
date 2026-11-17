# Pulse Mobile

Mobile client for the Pulse music catalog, built with Expo + React Native +
TypeScript. Mirrors the web app (`pulse-web`) and talks to the same Supabase
backend (`pulse-backend`).

> **Catalog note.** Pulse does not ship the Spotify catalog. Spotify's catalogue
> cannot be licensed or reproduced in a third-party app, and its terms forbid
> full-song playback outside Spotify's own clients. Pulse streams a
> freely-licensed catalogue from the Internet Archive (Free Music Archive,
> netlabels, 78rpm) plus per-user private uploads.

## Stack

- Expo SDK 54, React Native 0.81, React 19
- React Navigation 7 (native-stack + bottom-tabs)
- zustand for the player / likes / toast stores
- @supabase/supabase-js for auth, catalog, library and uploads
- expo-audio for playback, expo-document-picker + expo-file-system for uploads
- lucide-react-native for icons

## Getting started

```bash
npm install
npx expo start          # iOS / Android / web
npx expo export --platform web
```

The Supabase URL and anon key live in `src/config.ts` (the anon key is public).
Auth uses email/password with PKCE; sessions persist via AsyncStorage.

## Features

- Sign in / create account
- Home: greeting, quick picks, trending, genre mixes, new releases, popular
  artists, browse genres
- Search: genre grid when empty, songs / artists / albums results
- Library tabs: Playlists, Liked Songs, Uploads
- Playlist, album, artist and genre detail screens
- Upload audio to the `uploads` bucket at `<user_id>/<uuid>.<ext>`; playback
  resolves a signed URL through `supabase.storage.from('uploads')`
- Full-screen player (queue, shuffle, repeat off/all/one, seek, volume) plus a
  mini-player above the tab bar

## Scripts

```bash
npm run typecheck    # tsc --noEmit
npm run export:web   # expo export --platform web
```

## Structure

```
App.tsx                 navigators, providers, mini-player mount
src/navigation.ts       param lists
src/theme.ts            tokens, type styles, spacing
src/config.ts           Supabase URL + anon key
src/lib/api.ts          catalog, search, playlists, likes, uploads
src/lib/useAuth.ts      session + profile
src/store/              player (queue/order/shuffle/repeat), likes, toast
src/components/         TrackList, cards, MiniPlayer, FullPlayer, PlayerEngine, Toaster
src/screens/            Auth, Home, Search, Library, Upload, Album, Artist, Playlist, Genre
```

## Design

Same world as the web app: base `#0a0a0e`, surface `#121219`, raised `#1a1a23`,
line `#23232e`, fg `#f5f5f7`, muted `#a7a7b4`, accent `#1ee06f`. Accent is
reserved for play, save and live state. Body text clears 4.5:1. Artwork
fallbacks are a neutral surface ramp with a drawn mark — never a gradient.

## Known limits

- **Audio output is not verified in this sandbox.** The headless browser here
  cannot decode media at all (even a generated WAV fails), so playback was
  verified as far as: the signed URL serves `audio/mpeg`, the player state
  advances, and the queue/seek/repeat controls drive it. Sound itself needs a
  real device.
- The web preview needs `enableScreens()` (set in `App.tsx`) or inactive tabs
  stay visible; native builds use native screens throughout.
- Uploads are private to the uploading account and play through signed URLs.
- Anonymous visitors can read the catalogue; only signed-in users write.
