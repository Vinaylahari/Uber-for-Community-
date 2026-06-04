# Sahayam — Community Help Portal (MVP)

Sahayam connects community members with volunteers for medicine, grocery, emergency, and other help. Three portals: **Member** (phone OTP), **Volunteer** (email/password), and **Admin** (email/password).

## Tech stack

- React (Vite) + Tailwind CSS v4
- Firebase Auth, Firestore, Storage
- React Router v6, Context + `useReducer` (`RequestContext`)
- react-i18next (English / Telugu)
- recharts (admin reports)
- react-hot-toast

## Project structure

```
sahayam/
├── firebase/seed.js          # Test data seeder
├── functions/index.js        # Cloud Function: auto-assign on request create
├── rules.firestore           # Security rules (deploy to Firebase Console)
├── src/
│   ├── pages/member/         # Home, RaiseRequest, TrackRequest, Profile
│   ├── pages/volunteer/      # Feed, ActiveTask, History
│   ├── pages/admin/          # Dashboard, Volunteers, Requests, Reports
│   ├── components/           # Shared UI (spinner, badges, error boundary)
│   ├── context/              # AuthContext, RequestContext
│   ├── hooks/                # useAuth, useRequests, useVolunteer
│   ├── firebase/             # config + helpers (client auto-assign)
│   └── locales/              # en.json, te.json
└── .env.example
```

## Setup

### 1. Install

```bash
cd sahayam
npm install
```

### 2. Firebase project

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication**: Phone (members), Email/Password (volunteers & admin).
3. Create **Firestore** (production mode) and **Storage**.
4. Copy `.env.example` to `.env` and fill in your web app config:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_VAPID_KEY` | Web Push VAPID key (FCM) |

### 3. Firestore rules & indexes

- Paste `rules.firestore` into **Firestore → Rules** and publish.
- Create composite indexes when the console prompts (common ones):
  - `requests`: `memberId` + `createdAt`
  - `requests`: `status` + `createdAt`
  - `requests`: `status` + `priority` + `createdAt`
  - `requests`: `assignedVolunteerId` + `updatedAt`

### 4. Seed test data (optional)

Uses the same `.env` keys (client SDK writes; rules must allow or use emulator):

```bash
npm run seed
```

Creates 1 admin, 2 members, 3 volunteers, 5 requests in mixed states.

### 5. Cloud Functions (optional)

For server-side auto-assign (recommended in production):

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Client-side `autoAssignVolunteer` in `src/firebase/helpers.js` still runs on submit if functions are not deployed.

### 6. Push notifications (FCM, optional)

1. Firebase Console → **Project settings** → **Cloud Messaging** → generate **Web Push certificate** (VAPID key).
2. Add `VITE_FIREBASE_VAPID_KEY` to `.env`.
3. Regenerate the service worker (also runs automatically before `npm run build`):

```bash
npm run generate:sw
```

4. Deploy Cloud Functions so pushes fire on request create/update:

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

Browsers ask for notification permission after login. Tokens are stored on `users/{uid}.fcmTokens`.

### 7. Run the app

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Firebase Hosting deploy

1. Install CLI: `npm install -g firebase-tools`
2. `firebase login`
3. Set your project ID in `.firebaserc` (`default` → your `project-id`).
4. Build and deploy:

```bash
npm run deploy:hosting
# or full stack (hosting + rules + functions):
npm run deploy:firebase
```

Hosting serves the Vite `dist/` folder with SPA rewrites to `index.html`.

## Admin: create volunteers with real login

The admin **Add Volunteer** form uses a **secondary Firebase Auth instance** so the admin session is not replaced. It creates:

- Firebase Auth user (email + password you set)
- `users/{uid}` with `role: 'volunteer'`
- `volunteers/{uid}` profile

Share the email and password with the volunteer for staff login.

## Test accounts

After seeding Firestore documents, create matching **Firebase Auth** users:

| Role | Login | Notes |
|------|--------|--------|
| Admin | `admin@sahayam.com` + password | Set `users/{uid}.role = 'admin'` |
| Volunteer | email from seed + password | `role: 'volunteer'` in `users` |
| Member | Phone OTP | New phones auto-create `users` with `role: 'member'` |

Phone auth requires reCAPTCHA and authorized domains in Firebase Auth settings.

## Features overview

- **Member**: Large touch targets, EN/TE toggle, raise/track requests, rate volunteers.
- **Volunteer**: Feed tabs (Pending / Emergency / Active / Completed), accept/decline, active task flow.
- **Admin**: Live stats, emergency panel, volunteer CRUD, request assign/cancel, charts & leaderboard.

## Build for production

```bash
npm run build
npm run preview
```

Deploy `dist/` to Firebase Hosting, Vercel, or Netlify with the same `VITE_*` env vars.
