# TechBox learner app (Expo)

React Native (Expo) app for TechBox students: browse programs, apply, follow lessons (video, reading, quizzes), hand in assignments, track progress and read notifications.

Backend: `techbox_backend_nestjs` (NestJS API). Every endpoint used here is documented in the backend's `api-contract-mobile.md`.

## Requirements

- Node.js 24
- The backend running and reachable from the phone (same network)
- Expo Go or a development build

## Setup

```bash
npm install
# The phone cannot reach "localhost": use the computer's LAN address.
# .env.local is git-ignored (a plain .env would be committed).
echo "EXPO_PUBLIC_API_URL=http://192.168.137.1:5000" > .env.local
npx expo start
```

The backend's `PUBLIC_API_URL` must also use an address the phone can reach, or file links (receipts, attachments, reading files) will not open.

## Scripts

| Command | What it does |
|---------|--------------|
| `npx expo start` | Development server (Expo Go / dev build) |
| `npm run android` / `npm run ios` | Native builds |
| `npx tsc --noEmit` | Typecheck |
| `npm run lint` | Expo lint |

CI (`.github/workflows/ci.yml`) runs the typecheck (blocking) and lint (reported, not blocking yet) on every push and pull request.

## Structure

```
src/app/            screens (expo-router): tabs, course, lesson, quiz, assignment, enrollments
src/components/     UI by feature (programs, lessons, assignments, enrollment, common)
src/api/            API calls (one file per backend area) and error messages
src/hooks/          data hooks
src/services/       axios client (Bearer token, refresh on 401), token storage
src/store/          auth store
src/types/          *.contract.ts copied from the backend (do not edit), app types
```

## API contracts

`src/types/api.contract.ts`, `assignments.ts`, `nodes.contract.ts` and `submissions.contract.ts` mirror the backend's `src/types/`. Copy them again after a backend change; never edit them here.

## Auth

Tokens are kept in secure storage. On `401` the client refreshes once with the single-use refresh token and ends the session if the refresh is rejected (`src/services/api.ts`). Too many login attempts return `429`; the app shows the Arabic message for `TOO_MANY_REQUESTS`.
