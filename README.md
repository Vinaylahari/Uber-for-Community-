<p align="center">
  <img src="public/favicon.svg" alt="Sahayam Logo" width="80" />
</p>

<h1 align="center">🙏 Sahayam — Uber for Community Service</h1>

<p align="center">
  A real-time community help platform connecting elderly citizens with nearby volunteers for emergency assistance, medicine delivery, grocery runs, and more.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Features

### 👤 Community Member Portal (Mobile-First)
- **OTP Login** — Phone-based authentication via Firebase
- **Raise Help Requests** — Emergency, medicine, grocery, complaints, and general help
- **Real-Time Tracking** — Uber-style live status tracker for active requests
- **Star Ratings** — Rate volunteers after task completion
- **Bilingual** — English & Telugu (i18n via react-i18next)
- **Profile Management** — Edit name, age, address

### 🙋 Volunteer Portal (Mobile-First)
- **Email/Password Login** — Secure staff authentication
- **Live Feed** — Tabbed view of Pending & Emergency requests
- **Accept & Track Tasks** — Update status (On the Way → Completed)
- **Photo Upload** — Upload completion proof photos
- **Task History** — View past tasks and received ratings

### 🛡️ Admin Dashboard (Desktop-Optimized)
- **Overview Panel** — Real-time stats: today's requests, active emergencies, pending/completed counts
- **Volunteer Management** — Add, remove, toggle availability of volunteers
- **Request Management** — Filter by type/status/priority, manually assign or cancel
- **Reports & Analytics** — Charts (Recharts) for request trends + Volunteer leaderboard
- **Live Emergency Alerts** — Instant notification for new emergencies

### ⚙️ Under the Hood
- **Auto-Assign Algorithm** — Matches requests to the best available volunteer by area, availability, and rating
- **Real-Time Sync** — All data powered by Firestore real-time listeners (no polling)
- **Role-Based Routing** — Protected routes ensure users only access their portal
- **Firebase Security Rules** — Baseline Firestore & Storage rules

---

## 🛠️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 19, Vite 8, TailwindCSS 4 |
| Backend     | Firebase (Auth, Firestore, Storage) |
| Routing     | React Router v7 |
| State       | Context API + Firestore real-time listeners |
| Charts      | Recharts |
| i18n        | react-i18next (English + Telugu) |
| Icons       | react-icons |
| Toasts      | react-hot-toast |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Firebase** project with:
  - ✅ Firestore Database enabled
  - ✅ Authentication → Email/Password enabled
  - ✅ Authentication → Phone enabled
  - ✅ Storage enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Vinaylahari/Uber-for-Community-.git
cd Uber-for-Community-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Copy the example environment file and fill in your Firebase config:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

> 💡 Find these in **Firebase Console → Project Settings → General → Your apps → Config**

### 4. Seed Test Data (Optional)

Populate Firestore with sample users and requests:

```bash
npm run seed
```

This creates:
- 1 Admin, 2 Members, 3 Volunteers
- 5 Sample requests in various states

### 5. Run the Dev Server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Test Login Credentials

| Portal     | Method         | Credentials |
|------------|----------------|-------------|
| **Admin**  | Email/Password | `admin@sahayam.com` / `Admin@123` |
| **Member** | Phone OTP      | Any phone number (needs Firebase Phone Auth test numbers) |
| **Volunteer** | Email/Password | Created by Admin via the dashboard |

### Creating an Admin Account

1. Go to **Firebase Console → Authentication → Users**
2. Click **Add user** → Enter email & password
3. Copy the generated **UID**
4. In **Firestore → users collection**, create a document with ID = UID:
   ```json
   {
     "uid": "<UID>",
     "name": "Admin User",
     "email": "admin@sahayam.com",
     "role": "admin",
     "createdAt": "<timestamp>"
   }
   ```

---

## 📁 Project Structure

```
sahayam/
├── public/                 # Static assets & service worker
├── firebase/               # Seed script
├── functions/              # Cloud Functions (FCM notifications)
├── src/
│   ├── components/         # Shared UI components
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── PortalShell.jsx
│   │   ├── PriorityBadge.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/            # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── RequestContext.jsx
│   ├── firebase/           # Firebase config & helpers
│   │   ├── firebase.js     # Core Firebase init
│   │   ├── adminAuth.js    # Secondary app for admin operations
│   │   ├── helpers.js      # Auto-assign algorithm
│   │   └── messaging.js    # FCM setup
│   ├── hooks/              # Custom React hooks
│   ├── locales/            # i18n translations (en, te)
│   ├── pages/
│   │   ├── Login.jsx       # Dual-tab login (Citizen / Staff)
│   │   ├── member/         # Member portal pages
│   │   ├── volunteer/      # Volunteer portal pages
│   │   └── admin/          # Admin dashboard pages
│   ├── App.jsx             # Root component & routing
│   └── main.jsx            # Entry point
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── firebase.json           # Firebase hosting & deploy config
```

---

## 🌐 Deployment

### GitHub Pages (Automatic)

This repo includes a GitHub Actions workflow that auto-deploys on every push to `main`.

**One-time setup:**
1. Go to your repo → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Go to **Settings → Secrets and variables → Actions**
4. Add these **Repository Secrets**:

   | Secret Name | Value |
   |-------------|-------|
   | `VITE_FIREBASE_API_KEY` | Your Firebase API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
   | `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messaging sender ID |
   | `VITE_FIREBASE_APP_ID` | Your Firebase app ID |

5. Push to `main` — the site deploys automatically!

**Live URL:** `https://vinaylahari.github.io/Uber-for-Community-/`

### Firebase Hosting (Alternative)

```bash
npm run deploy:firebase
```

---

## 📊 Architecture

```
┌──────────────────────────────────────────────────┐
│                   React Frontend                  │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │   Member   │ │ Volunteer  │ │    Admin     │  │
│  │   Portal   │ │   Portal   │ │  Dashboard   │  │
│  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘  │
│        │              │               │           │
│  ┌─────┴──────────────┴───────────────┴─────┐     │
│  │         AuthContext + RequestContext      │     │
│  └─────────────────┬────────────────────────┘     │
└────────────────────┼──────────────────────────────┘
                     │ Real-time listeners
         ┌───────────┴───────────┐
         │     Firebase Cloud    │
         │  ┌─────────────────┐  │
         │  │   Firestore DB  │  │
         │  ├─────────────────┤  │
         │  │  Authentication │  │
         │  ├─────────────────┤  │
         │  │    Storage      │  │
         │  └─────────────────┘  │
         └───────────────────────┘
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Made with ❤️ for community service
</p>
