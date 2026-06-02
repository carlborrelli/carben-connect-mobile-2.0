# Carben Connect Mobile 2.0 — Definitive Technical Specification

*Prepared for redesign planning. Synthesized from per-subsystem static analysis of the existing codebase (React Native / Expo, Firebase backend). Status badges: ✅ complete · 🟡 partial · 🔲 stub · 🔴 broken.*

---

## 1. Executive Summary

Carben Connect Mobile 2.0 is an **iOS-targeted React Native (Expo) construction project-management app** for a contracting business. It serves two roles:

- **Admins** (contractors / office staff): full visibility into all projects, clients, estimates, accounting integrations, user management, and an "AI-assisted estimate" workflow.
- **Clients** (homeowners / customers): a scoped view of their own projects, photos, estimate values, and a messaging thread with the contractor.

The app's differentiated capabilities are **voice-to-project creation** (speak a job, get a structured project) and an **AI estimate engine** (generate/refine estimate descriptions, build a costed calculator, push to QuickBooks). It integrates two accounting systems — **QuickBooks** and **FreshBooks** — and uses **Expo push notifications** driven by Firestore Cloud Function triggers.

**Overall maturity: mid-stage, uneven.** The UI/design layer is polished, consistent, and largely complete (Apple-HIG token system, haptics, light/dark theming, custom branded components). The data layer and several subsystems are architecturally naive or unfinished:

- **Production-ready:** Auth, theming/navigation, FreshBooks integration (and its Cloud Functions), admin user management, push-notification plumbing, the photo/voice pipelines, AI estimate generation.
- **Half-built / decorative:** QuickBooks integration (UI shell with placeholder Connect/Test/Sync), Settings screen, Calendar screen, Recent Activity, message read/unread state.
- **Pervasive cross-cutting issues:** schema drift across four project data sources, in-memory-only state (impersonation, AI chat), committed secrets, no canonical conversations model, client-side filtering that won't scale, and a notable amount of dead/orphaned code.

A rewrite should **keep the design system, integration wiring (especially FreshBooks + OAuth Cloud Functions), voice/AI pipelines, and the role/impersonation model**, while **rebuilding the data model, messaging backbone, QuickBooks integration, and the placeholder screens**.

---

## 2. Architecture Overview

### Tech Stack

| Layer | Technology |
|---|---|
| App framework | React Native via **Expo** |
| Language | Mostly JavaScript (`.js`); a few TypeScript utilities (`lib/api.ts`, `lib/images.ts`, `lib/secureStore.ts`, `components/AppErrorBoundary.tsx`) |
| Navigation | React Navigation — bottom tabs + per-tab native stacks |
| State | React Context (no Redux/MobX); Firestore real-time listeners as the live data store |
| Auth | Firebase Auth (email/password) with AsyncStorage persistence |
| Database | Cloud Firestore (real-time `onSnapshot` + one-shot reads) |
| File storage | Firebase Storage |
| Backend logic | Firebase Cloud Functions (Node 20, firebase-functions **v4 / Gen1**) |
| AI | OpenAI (Whisper, GPT-4o, TTS) — accessed via **Vercel HTTP endpoints** at `carbenconnect.com/api/ai/*` (the app does **not** call OpenAI or the parallel Firebase callable AI functions directly) |
| Accounting | QuickBooks (Intuit OAuth), FreshBooks (OAuth) |
| Push | Expo Push API (`exp.host/--/api/v2/push/send`) |
| Media | `expo-audio` (recording), `expo-image-picker`, `expo-image-manipulator`, `expo-haptics`, `expo-linear-gradient` |

### Provider Composition (`App.js`)

```
SafeAreaProvider
└─ ThemeProvider          (outermost so the loading spinner can be themed)
   └─ AuthProvider
      └─ NotificationProvider   (depends on Auth)
         └─ QuickBooksProvider  (depends on Auth; admin-only token refresh)
            └─ AppContent       (branches on {user, loading})
```

`AppContent` shows: a spinner while `loading`, `LoginScreen` when unauthenticated, or `StatusBar + ViewModeBanner + Navigation` when authenticated.

### Navigation Structure (`navigation.js`)

- **5-tab bottom navigator**, `initialRouteName: Home`: **Projects · Inbox · Home (center) · NewProject · More**.
- Custom iOS-style tab bar (`CustomTabBar`) with a **raised circular orange center "Home" button** (hardcoded `index === 2`), themed focus icons, haptics, and keyboard-aware hiding (Inbox opts in).
- Each tab is its **own native stack**; shared screens (Calendar, Profile, PrivacyPolicy, TermsOfService, Conversation, ProjectDetail, etc.) are **duplicated across 4–5 stacks** so they're reachable from anywhere.
- **Tab-blur stack reset:** a `screenListeners` blur handler dispatches `StackActions.popToTop` targeted at the blurred tab's child navigator key, so leaving a tab resets it to root.
- A `navigationRef` is captured and handed to `NotificationContext` for push-notification deep linking.

### State Management & Data Flow

- **Contexts:** `ThemeContext` (palette + `themeMode`), `AuthContext` (user, profile, impersonation, role helpers), `NotificationContext` (push token, tap routing), `QuickBooksContext` (OAuth token keep-alive).
- **Data flow:** List/home/inbox screens use **`onSnapshot` real-time listeners**; detail and add-photo screens use **one-shot `getDoc`/`getDocs`** (so detail views can show stale data after a list-side change). All mutations go straight to Firestore from the client **except** FreshBooks and admin password ops, which route through Cloud Functions.
- **Role scoping pattern (reused everywhere):** admin → full collection query; client → `where('clientId','==', userProfile.id)`. Enforcement ultimately depends on Firestore security rules; the `isAdmin()` gate is client-side only.

---

## 3. Complete Feature Inventory

### 3.1 Auth & Navigation

| Feature | Status | Notes |
|---|---|---|
| Email/Password sign-in | ✅ | Friendly error mapping (invalid-email, user-not-found, wrong-password, too-many-requests); haptics. Omits `auth/invalid-credential`, `auth/network-request-failed`. |
| Auth state persistence & bootstrap | ✅ | `onAuthStateChanged` + `initializeAuth`/`getReactNativePersistence` over AsyncStorage. |
| User profile loading & caching | 🟡 | Reads `users/{uid}`, caches to AsyncStorage `'userProfile'` — **but cache is never read back** (no offline hydration). Errors only `console.error`; failed load leaves `userProfile` null while still "logged in". |
| Sign out | ✅ | `firebaseSignOut` + clears cached profile and state. |
| View as Client (admin impersonation) | 🟡 | Swaps `userProfile` to client's; `originalAdmin` stashed; `isAdmin()` false while impersonating, `isRealAdmin()` still true. **In-memory only (lost on reload)**; sets global `loading` which can flash the spinner. |
| Theme system (light/dark + tokens) | ✅ | Full Apple-style palette, typography, spacing, radius, shadows, animation, touch targets. |
| Theme preference persistence | ✅ | AsyncStorage `'@carben_theme_mode'`, default `automatic`. |
| Tab navigation (5 tabs + stacks) | ✅ | See §2. |
| Tab-blur stack reset | ✅ | Targets child navigator key for `popToTop`. |
| Custom tab bar (raised center button) | ✅ | Themed icons, haptics, keyboard-aware hide; `index === 2` magic number. |
| NavigationRef wiring for push | ✅ | Passed to `NotificationContext`. |
| Auth-gated root composition | ✅ | Provider nesting order is load-bearing. |
| Sign-up / password reset / forgot-password | 🔲 | **Not implemented** — LoginScreen has sign-in only. |
| ViewModeBanner rendering | 🔴 | References `COLORS.carbenOrange` / `COLORS.white` which **don't exist** in theme.js → undefined background/text. Also uses static `COLORS` not `useTheme()` (won't adapt to dark mode). |

### 3.2 Projects (Home hub, list, detail, creation, photos)

| Feature | Status | Notes |
|---|---|---|
| Home hub (stats, quick actions) | ✅ | Active-project + unread-message stats, Quick Actions, header Calendar/Profile shortcuts. |
| Active projects count | ✅ | Real-time, role-scoped (`status != COMPLETE/PAID`). |
| Call Ben / Call Carl buttons (clients) | 🟡 | `tel:` deep links to **hardcoded numbers** (Ben 6104056901, Carl 4849479597) — was dynamic, hardcoded "to avoid Firestore permission issues" (build 16). |
| Project list (real-time) | ✅ | `onSnapshot`, role-scoped, `orderBy createdAt desc`; loading/empty/no-results states. |
| Search / status filter / sort / client+location filter | ✅ | All **in-memory client-side**; admin gets expandable client→location dropdown built from `qbCustomers`. |
| Multi-select bulk delete (admin) | ✅ | Hard delete, no undo; **does not clean up Storage photos, messages, or invoices** (orphans). |
| Project detail view | ✅ | One-shot `getDoc`; status badge, client/location, FreshBooks/QB invoice numbers, Project Value card, photo grid + full-screen viewer. |
| Status change (admin) | ✅ | Modal picker → `updateDoc` status + `updatedAt`. |
| Invoices section (admin) | ✅ | `invoices where matchedToProject == projectId`. |
| Navigation to Estimate / Messages | ✅ | Estimate → EstimateWorkspace; Messages → Conversation; PDF links open externally. |
| Create new project | ✅ | Client/location picker, voice capture, photos, writes project + `contractorIds = all admins` (required for website cross-compat), uploads photos, optional SYSTEM transcription message. |
| Add photos to existing project | ✅ | Standalone screen; richer photo objects `{url, uploadedAt, uploadedBy, uploadedByName}`. |
| ProjectCard component | ✅ | Handles lookup-based + imported clients; OR's overlapping value fields. |
| Unread messages count (Home) | 🔴 | Client query (`clientId + unread`) unreliable — voice/general messages lack `clientId`; needs composite index. |
| Pull-to-refresh | 🔲 | `handleRefresh` only sets `refreshing=true`; relies on listener that never re-fires. |
| Recent Activity (Home) | 🔲 | Permanent "No recent activity" placeholder. |

### 3.3 Estimates Engine (admin-only)

| Feature | Status | Notes |
|---|---|---|
| Estimate workspace shell + 4-tab nav | ✅ | Real-time `estimateProgress` drives tab checkmarks; non-admins see Access Restricted. |
| Project Overview tab | ✅ | Client contact, QB locations (Current badge), description, photo grid. One-shot read. |
| AI Estimate description tab (active) | ✅ | 2s debounced auto-save; Import Description / Import with AI; AI Instructions + AI Assistant chat; finalize/edit toggle. |
| AI chat assistant (in Estimate tab) | 🟡 | Posts to `/api/ai/chat`; optimistic send/rollback. **Chat history in-memory only**, lost on unmount. |
| Additional AI instructions | ✅ | Local state only (not persisted); feeds generate + chat context. |
| Cost Calculator tab (active) | ✅ | Materials/Subcontractors (line items + markup %), Labor (rate presets + days), Profit (%/$); grand total; debounced auto-save with `editingFieldRef` anti-clobber guard. |
| QuickBooks customer assignment | ✅ | Fetches QB customers from backend, modal picker, writes `qbCustomerId/Name` to project. |
| Estimate progress tracking | ✅ | Single `estimateProgress` doc of booleans (merge writes) drives all tab status. |
| Send to QuickBooks tab | 🟡 | Pre-flight checklist + POST to create-estimate. **Reads `subtotal/taxRate/taxAmount/estimateNumber` that the active CalculatorTab never writes** → always $0/null; only `grandTotal` is correct. |
| PricingCalculatorTab | 🔴 | **Orphaned dead code** — not imported. Writes the very fields the QB tab expects; source of the schema mismatch. |
| EstimateDescriptionTab | 🔴 | **Orphaned dead code**; stubbed "AI coming soon" alert. |
| ProjectInfoTab | 🔴 | **Orphaned dead code**; superseded by ProjectOverviewTab. |

### 3.4 Messaging & Notifications

| Feature | Status | Notes |
|---|---|---|
| Inbox conversation list | ✅ | Groups flat `messages` by `project-{id}` or `client-{id}`; latest per conversation; tap → Conversation. |
| Conversation thread view | ✅ | Bubbles, date separators, auto-scroll, keyboard-aware composer, optimistic send + rollback. |
| Compose new message | ✅ | Optional project attach; resolves `clientId` then writes. |
| Push token registration & storage | ✅ | Permissions, Expo token (hardcoded EAS projectId), Android channel, writes `users.expoPushToken`; skips when impersonating. |
| Server: estimate & project notifications | ✅ | `onEstimateCreated` → client; `onProjectCreated` → all admins. |
| Expo push helper (single + batch) | ✅ | Batch validates `ExponentPushToken` prefix; single does **not**. |
| DraftsScreen (estimate pipeline) | ✅ | Mis-filed here; admin estimate-progress board. **Orphaned after nav link removal (commit 6c2f798).** |
| Notification tap routing (deep link) | 🟡 | `type` → tab+screen; fragile `setTimeout(100)` navigate-twice hack; unknown types only log. |
| Server: on new message notification | 🟡 | Requires `message.projectId` (no guard) **and** `project.contractorIds`; **general messages and admin pushes likely silently broken**. |
| Read/unread status | 🔴 | Computed heuristically in Inbox; `read:false/unread:true` written on send and **never updated**. Opening a thread does not mark read. Persisted fields are dead. |

### 3.5 Clients (admin-facing directory; read-only)

| Feature | Status | Notes |
|---|---|---|
| Client list (directory) | ✅ | `users where role=='client'`, JS-sorted; non-admin sees only self. |
| Client card rendering | ✅ | Avatar initial; handles 3 QB data shapes. |
| Client detail + projects list | ✅ | Client passed via nav params (**stale snapshot**); projects live via `onSnapshot`. |
| View-as-client selector modal | ✅ | Page-sheet, live search; parent performs impersonation. |
| AI client summary (homepage) | ✅ | `httpsCallable('generateClientSummary')`; parses `Title[projectId]` into tappable links; cache indicator. |
| QuickBooks info display | 🟡 | Display only; no sync/fetch/write here. |
| Add/create/edit/delete client | 🔲 | **No mutation path anywhere** despite empty-state copy "add your first client." |

*Subsystem-specific bugs:* ClientSelectorModal uses static `COLORS` (no dark mode); non-admin query targets a stored `id` field not doc id; ProjectCard always rendered with `isAdmin={false}`; pull-to-refresh is a no-op.

### 3.6 QuickBooks & FreshBooks Integrations (admin-only)

**QuickBooks (UI shell, mostly unfinished):**

| Feature | Status | Notes |
|---|---|---|
| Settings persistence (load/save) | ✅ | Reads/writes `settings/quickbooks`. |
| Automatic token refresh (context) | 🟡 | Real wiring: `onSnapshot` + AppState foreground re-check + 30-min pre-expiry refresh via `refreshQuickBooksToken` CF. Undermined because no real tokens are ever produced. |
| Connect (OAuth) | 🔲 | Placeholder Alert; no OAuth. |
| Test Connection | 🔲 | Placeholder ("real API call would go here"). |
| Sync Now | 🔲 | Simulated — only writes `lastSync`. |
| Auto Sync toggle | 🔲 | Persisted but nothing consumes it. |

**FreshBooks (genuinely functional):**

| Feature | Status | Notes |
|---|---|---|
| Connect (OAuth) | ✅ | `freshbooksConnect` CF → authUrl → system browser; `freshbooksCallback` exchanges code. |
| Connection status display | ✅ | Reads `settings/freshbooks`. |
| Disconnect | ✅ | `freshbooksDisconnect` CF. |
| Invoice selection + client/location mapping | ✅ | Per-invoice client + conditional location (`qbCustomers.length>1`); import-time validation. |
| Bulk import (invoices → projects/estimates) | ✅ | `freshbooksBulkImport`, `createEstimates:true`. |
| Clear All Imported Data (Danger Zone) | ✅ | `freshbooksClearImported`. |
| Fetch invoices (date range + pagination) | 🟡 | Works for page 1 only — **pagination UI dead** (`currentPage` fixed at 1); date inputs unvalidated free-text. |

### 3.7 AI & Voice

| Feature | Status | Notes |
|---|---|---|
| Voice-to-Project recording (VoiceRecorder) | ✅ | `expo-audio` → m4a → `/api/ai/transcribe` (Whisper) → `/api/ai/generate-project` (GPT-4o) → `{title, description, transcription, summary}`. |
| AI Estimate generation (Import with AI) | ✅ | `generateEstimate()` → `/api/ai/generate-estimate`. |
| AI Estimate chat assistant | ✅ | (chat history not persisted — see 3.3). |
| Additional AI instructions input | ✅ | Local only. |
| Firebase Callable AI fns (transcribe/generateProject/textToSpeech) | 🟡 | Fully implemented in `functions/index.js` but **never called by the app** (app uses Vercel endpoints) — dead/orphaned. TTS has no client UI. |
| `config/openai.js` helpers (generateProject, transcribeAudio, aiChat) | 🔲 | Dead code; only `generateEstimate` imported. `aiChat` body shape (`history`) doesn't even match live API (`conversationHistory`). |
| Generic API client (`lib/api.ts`) | ✅ | Solid typed fetch wrapper — **unused by AI paths** (which hardcode fetch with no timeout/auth). |

### 3.8 Admin, Settings & Misc Screens

| Feature | Status | Notes |
|---|---|---|
| User Management list (admin) | ✅ | Live list, search, role filter, stats. |
| User editing (profile fields) | ✅ | Writes `users/{id}`. |
| Send password reset email | ✅ | Firebase Auth `sendPasswordResetEmail`. |
| Admin force-change password | ✅ | `Alert.prompt` (**iOS-only**) → `changeUserPassword` CF. |
| More hub / nav menu | ✅ | Profile, theme, admin links, support, sign out, version. |
| Theme mode switching | ✅ | Automatic/Light/Dark, persisted. |
| Profile view | ✅ | Read-only (despite "edit" comment). |
| View as Client (impersonation) | ✅ | Via AuthContext. |
| Sign out | ✅ | In More + Profile. |
| Privacy Policy (static) | ✅ | 10 hardcoded sections; date stale. |
| Terms of Service (static) | ✅ | 14 hardcoded sections; date stale. |
| Delete user | 🟡 | Deletes Firestore doc only — **orphans the Firebase Auth account**. |
| Settings screen | 🔲 | Notification toggles non-persisted; Clear Cache fake; Report a Bug = alert; version hardcoded `2.0.0`. |
| Calendar | 🔲 | Month grid works; **Today button no-op**; Events permanently empty (no data). |

### 3.9 Cloud Functions (backend)

| Feature | Status | Notes |
|---|---|---|
| Admin: change user password | ✅ | Role-gated, audit-logged, `auth().updateUser`. |
| AI: Whisper transcription | ✅ | base64 → Readable stream w/ fake `.path`; language forced `en`. |
| AI: generate project (GPT-4o) | ✅ | JSON-mode structured prompt; supports incremental append. |
| AI: text-to-speech (tts-1) | ✅ | Returns base64 mp3 — **no client consumes it**. |
| FreshBooks: OAuth callback (token exchange) | ✅ | Public `onRequest`; styled HTML success/error pages. |
| FreshBooks: refresh / get invoices / single import / disconnect | ✅ | Full pipeline; inline refresh-if-near-expiry. |
| Push: on estimate / on project created | ✅ | `onProjectCreated` **fires for FreshBooks bulk imports** (admin spam risk). |
| Expo push helper | ✅ | Batch filters token prefix; single does not. |
| Admin: send welcome email | 🟡 | Generates reset link but **sends no email** (no provider wired). |
| QuickBooks token refresh | 🟡 | **Only** QB function — no connect/callback/list/import. Builds form body via unencoded interpolation. |
| FreshBooks: connect / get auth URL | 🟡 | **Hardcoded clientId/clientSecret/accountId committed in source.** |
| Push: on new message | 🟡 | No `projectId` guard (breaks general messages); depends on `contractorIds`. |
| FreshBooks: bulk import | 🔴 | Uses non-standard `exports.freshbooksImportInvoice.run(...)` on a Gen1 onCall handler — fragile/likely broken; inconsistent result shape. |
| FreshBooks: clear imported | ✅* | Single Firestore batch, **no 500-op chunking** — fails past 500 docs. |

### 3.10 Design System & Data Layer

| Feature | Status | Notes |
|---|---|---|
| Design token system | ✅ | Apple-HIG typography, light/dark semantic colors, 8pt spacing, radius, shadows, animation, touch targets. |
| Firebase init / SDK wiring | ✅ | Auth (AsyncStorage), Firestore, Storage, Functions. |
| Firestore security rules | ✅* | Role-aware; but broad "any authed" read on projects & unguarded update on top-level messages. |
| Storage security rules | ✅ | Per-bucket size/content-type limits. |
| Image compression utility | ✅ | 1600px/75% upload, 400px/60% thumbnail (`createThumbnail` unused). |
| Branded components (BrandWelcomeHeader, GlowingCallButton, StripedCallButton) | ✅ | Gradient branding (orange `#F97316` / blue `#3B82F6`); GlowingCallButton self-scales by height. |
| App error boundary | 🟡 | Friendly screen + reset; **Sentry/remote reporting is TODO**, errors only console-logged. |
| `getTheme()` / `COLORS_DARK` exports | 🟡 | Vestigial — dark mode flows through ThemeContext's own duplicate palettes; static `COLORS` import breaks dark mode in 2 components. |
| Firestore composite indexes | 🟡 | Only 2 defined; likely under-specified for app's query set. |
| Secure storage wrapper (`lib/secureStore.ts`) | 🔲 | Fully implemented Keychain wrapper — **never imported** (dead). |

---

## 4. Feature Map & Primary User Journeys

### Dependency Map

- **Auth** underpins everything; `userProfile.id` + `isAdmin()/isRealAdmin()` drive every query's role scoping. **Theme** is the only context above Auth.
- **Projects** is the hub collection. Estimates, Messaging, Clients, Photos, and both accounting integrations all key off `projects` (by `projectId`, `clientId`, `matchedToProject`, `source`, `contractorIds`).
- **Estimates** depend on Projects (context) + the backend AI/QuickBooks endpoints; drive `estimateProgress` and `estimateDescriptions`/`estimateCalculators` docs, consumed by DraftsScreen and the QB tab.
- **Messaging** depends on Projects (for project-scoped threads) and Notifications (push). The Cloud Function fan-out depends on `project.contractorIds` (populated by NewProjectScreen) + `users.expoPushToken` (populated by NotificationContext).
- **FreshBooks/QuickBooks** import into Projects/Estimates and reuse the `users.qbCustomers` field as the client/location source of truth (cross-integration coupling — QB customer list doubles as FreshBooks location list).
- **AI/Voice** feeds Project creation (voice → title/description) and Estimates (generate/chat). Voice transcription is silently injected as a SYSTEM message into the project thread.

### Journey A — Client creates and tracks a project
Login → Home (active count, Call Ben/Carl, AI client summary) → New Project tab → (optionally) **tap mic → speak the job** → voice transcription fills title/description → add photos → Create (writes project, uploads photos, posts SYSTEM transcription message) → Projects tab → Project Detail (status badge, photos, Project Value) → Messages → Conversation thread with contractor → push notification when an estimate arrives.

### Journey B — Admin produces an estimate and pushes to QuickBooks
Login (admin) → Projects → Project Detail → **Estimate** → EstimateWorkspace: **Overview** (client/QB context) → **Estimate** tab (Import with AI / chat assistant → finalize) → **Calculator** (materials/subs/labor/profit → grand total) → **QuickBooks** tab (assign QB customer → pre-flight checklist → POST create-estimate). Progress checkmarks update live via `estimateProgress`. *Known gap:* tax/subtotal/line-items reach QB as $0/empty due to the calculator schema mismatch.

### Journey C — Admin imports historical invoices from FreshBooks
More → FreshBooks → Connect (browser OAuth) → set date range → Fetch Invoices → select invoices → assign client (+ location if multi) → Import Selected → invoices become projects (`status COMPLETE`, `source=freshbooks`) + approved estimates. Each new project fires an admin push (spam during bulk import).

### Journey D — Admin manages users / impersonates a client
More → User Management → search/filter → edit user (profile, password reset, force-change password) — or — Profile → View as Client → select client → app re-scopes all queries to that client (orange ViewModeBanner shown, *currently broken styling*) → Exit Client View.

---

## 5. Data Model

### Firestore Collections

| Collection | Key Fields | Relationships / Notes |
|---|---|---|
| **users** | `id` (stored, mirrors doc id), `name`, `email`, `phone`, `role` (`admin`\|`client`), `quickbooksCustomerId`, `qbCustomers[]` ({id, name}), `qbLocationName` (legacy), `qbCustomerId` (legacy), `expoPushToken`, `deviceType`, `updatedAt` | `qbCustomers` doubles as client **locations** for both QB and FreshBooks flows. Non-admin queries use the stored `id` field, not doc id. |
| **projects** | `title`/`name`, `description`, `status` (NEW, ESTIMATE_SENT, APPROVED, IN_PROGRESS, COMPLETE, PAID), `clientId`, `clientName`, `contractorIds[]` (all admins — needed for website), `locationId`, `qbCustomerId`, `qbCustomerName`, `photos[]` (**dual shape**: URL strings *or* objects), `txnDate`, `createdAt`, `updatedAt`, value fields (`totalAmount` / `estimatedTotal` / `totalPrice` — overlapping), `quickbooksInvoiceNumber`, `quickbooksEstimateNumber`, `freshbooksInvoiceNumber`, `freshbooksInvoiceId`, `invoicePdfLink`, `estimatePdfLink`, `source` (`freshbooks`…), `importedBy` | Central hub. **Sourced from 4 systems** (manual, website import, QuickBooks, FreshBooks) → heavy schema drift. |
| **messages** (top-level) | `projectId` (null for general), `projectTitle`, `clientId`, `senderId`, `senderName`, `senderRole`, `message` + `text` (both set), `createdAt` (**client `new Date()`**, not serverTimestamp), `read:false`, `unread:true` (**never updated**) | No canonical `conversations` collection — threads reconstructed at runtime by grouping. |
| **projects/{id}/messages** (subcollection) | sender-validated; immutable | Distinct from top-level messages; rules differ. |
| **estimateProgress/{projectId}** | `descriptionGenerated`, `descriptionFinalized`, `calculatorStarted`, `calculatorComplete`, `sentToQuickBooks`, `lastEditedBy/At` | Booleans drive tab checkmarks + DraftsScreen (20%/stage). |
| **estimateDescriptions/{projectId}** | `description`, `aiGeneratedText`, `finalizedText`, `isFinalized`, `finalizedAt/By`, `lastEditedAt/By` | Live `onSnapshot`. |
| **estimateCalculators/{projectId}** | **Active shape:** `materials[]`, `materialsMarkup`, `subcontractors[]`, `subcontractorsMarkup`, `labor[]`, `profitType`, `profitValue`, `grandTotal`. **Orphaned/QB-expected shape:** `lineItems[]`, `subtotal`, `taxRate`, `taxAmount`. | **Two incompatible schemas** — root cause of the QB $0 bug. |
| **estimates/{projectId}** | read by app to compute "already sent"; **written only server-side** (FreshBooks import / undocumented coupling) | |
| **invoices** | `invoiceNumber`, `paymentStatus`, `txnDate`, `totalAmount`, `matchedToProject` | Surfaced in ProjectDetail (admin). |
| **locations** | `name`, `nickname` | Compared by **name string** to `qbCustomers.name` (fragile). |
| **clients** | `name`, `email`, `qbCustomers[]` | Admin-write only per rules; used by FreshBooks mapping. |
| **settings/quickbooks** | `enabled`, `companyId`, `clientId`, `clientSecret`, `accessToken`, `refreshToken`, `tokenExpiry`, sync flags, `lastSync` | **Secrets stored plaintext, written from client.** |
| **settings/freshbooks** | `accountId`, `clientId`, `clientSecret`, `accessToken`, `refreshToken`, `tokenExpiry`, `connected`, `redirectUri`, `lastImport/Clear/Refresh` | Mutated only via Cloud Functions (good separation). |
| **audit_logs** | `action`, actor, target | Written for admin password/welcome actions. |
| **drafts**, **adminInfo**, **estimateCalculators** | per rules | drafts: creator/admin scoped; adminInfo: authed read / admin write. |

### Storage

| Path | Limits | Notes |
|---|---|---|
| `projectUploads/{projectId}/{file}` | <15MB; image\|audio\|pdf | Rules path. **App code writes to `projects/{projectId}/...`** (verify alignment with rules). |
| `profileImages/{userId}/{file}` | <5MB image, owner-only | |
| `estimateAttachments/{estimateId}/{file}` | <10MB; image\|pdf | |

Upload recipe: `expo-image-picker → fetch(uri) → blob → uploadBytes → getDownloadURL → arrayUnion`. Two divergent paths (NewProject = URL strings; AddPhotos = rich objects).

### Security Rules Summary

- **Helpers:** `authed()`, `uid()`, `isAdmin()` (reads `users/{uid}.role=='admin'`).
- **users:** self/admin read; self create; self update (role-change guarded); admin delete.
- **projects:** **any authed read/create**; owner update blocked from setting `approved/paid/finalized`; owner-or-admin delete.
- **projects/*/messages:** authed read; sender-only create; immutable.
- **messages (top-level):** authed read/create/**update (no sender/owner check)**; admin delete; create lacks `senderId` validation.
- **clients:** admin-write only. **drafts:** creator/admin. **adminInfo:** authed read / admin write.
- **Exposure:** broad project read + unguarded top-level message update are the real attack surface; `isAdmin()` client gate is not a boundary.
- **Indexes:** composite on `projects(clientId ASC, createdAt DESC)` and `messages(clientId ASC, createdAt DESC)`; likely under-specified.

---

## 6. Integrations & Setup-Cost ("What to Harvest")

| Integration | What it does | How it's wired | Port as-is? |
|---|---|---|---|
| **FreshBooks** | Full accounting import: OAuth connect, callback token exchange, refresh, list invoices (date range), single + bulk import → projects/estimates, disconnect, clear-imported. | Admin screen → Cloud Functions (`freshbooksConnect`, `freshbooksCallback` onRequest, `freshbooksRefresh`, `freshbooksGetInvoices`, `freshbooksImportInvoice`, `freshbooksBulkImport`, `freshbooksDisconnect`, `freshbooksClearImported`). Tokens in `settings/freshbooks`; mutations via CF only. | **YES — highest-value, hardest-to-rebuild asset.** Port the full OAuth lifecycle, invoice normalization, invoice→project+estimate mapping (incl. line items), and styled HTML callback pages. **Fix first:** committed secrets (→ Secret Manager), the `.run()` bulk-import call, 500-op batch chunking, hardcoded redirectUri, dead pagination, date-picker validation. |
| **QuickBooks** | *Intended:* OAuth connect, customer fetch, push estimate. *Actual:* customer fetch + create-estimate via backend; **token-refresh keep-alive is the only complete piece**. | `QuickBooksContext` (onSnapshot + AppState refresh via `refreshQuickBooksToken` CF) + EstimateWorkspace QB tab (customer picker, create-estimate POST). Connect/Test/Sync screen buttons are placeholders. | **PARTIALLY — port the token-refresh harness and the customer-picker/create-estimate wiring (real, domain-specific).** Rebuild the server side (no connect/callback/import functions exist) and reconcile the calculator schema before the QB payload is usable. |
| **OpenAI (via Vercel)** | Whisper transcription, GPT-4o project + estimate generation, chat assistant, TTS. | App posts to `carbenconnect.com/api/ai/{transcribe,generate-project,generate-estimate,chat}` (no auth header, no timeout). A parallel **Firebase callable** implementation exists but is unused. | **Port the prompts and pipelines, not the duplication.** Keep: GPT-4o JSON-mode contractor prompts (new + incremental), the base64→Readable-stream Whisper trick, the m4a multipart upload, estimate auto-save/finalize state machine. **Decide one backend** (Vercel vs Firebase callable), route through `lib/api.ts` for timeout/auth, and pin the loosely-defined response contracts. |
| **Firebase** | Auth (AsyncStorage persistence), Firestore (real-time), Storage, Functions; security rules; audit logs. | `config/firebase.js` single init; rules in `firestore.rules`/`storage.rules`. | **Port the rules (security baseline), the Auth+AsyncStorage persistence wiring, the admin role-gating + audit_logs pattern.** Move API key/config out of source; tighten projects/messages rules; expand indexes. |
| **Expo Push** | Token registration + permission flow; Firestore onCreate triggers fan out to message/estimate/project recipients. | `NotificationContext` (token → `users.expoPushToken`, tap routing via `navigationRef`) + `functions/notificationFunctions.js` + `sendPushNotification.js`. | **YES — port the whole pipeline.** Fix the `onMessageCreated` `projectId`/`contractorIds` gaps, the single-token prefix validation, and the bulk-import admin-spam. Externalize hardcoded EAS projectId + channel color. |

**Laborious-to-rebuild, port verbatim:** FreshBooks OAuth + import pipeline · QuickBooks token-refresh harness + customer-picker/create-estimate · OpenAI prompts + voice/transcribe pipeline · Expo push fan-out + tap routing · Firestore/Storage security rules · the Apple-HIG design token system.

---

## 7. Incomplete & Unfinished Work (consolidated, de-duplicated)

### 🔴 Critical (broken / data-integrity / security)

1. **Committed FreshBooks secrets** (clientId/secret/accountId) in `functions/index.js` — rotate + move to Secret Manager.
2. **Firebase web API key/config committed** in `config/firebase.js`; security rests entirely on rules.
3. **QuickBooks secrets stored plaintext in Firestore**, written from client, re-read into TextInputs — anyone with read access to `settings/quickbooks` gets them.
4. **Calculator ↔ QuickBooks schema mismatch** — QB tab reads `subtotal/taxRate/taxAmount/estimateNumber` the active CalculatorTab never writes → estimates pushed with $0 tax/subtotal/no line items.
5. **`freshbooksBulkImport` uses non-standard `.run()`** on a Gen1 onCall handler — fragile/likely broken; extract a shared helper.
6. **`freshbooksClearImported` single batch, no 500-op chunking** — fails past 500 docs.
7. **Message read/unread never persisted** — heuristic in Inbox; opening a thread never marks read; persisted fields dead.
8. **`onMessageCreated` push broken for general messages** (no `projectId` guard) and for admins (depends on unwritten `contractorIds`).
9. **ViewModeBanner color tokens undefined** (`COLORS.carbenOrange`/`COLORS.white`) → banner renders broken; also not theme-aware.
10. **Three orphaned Estimate components** (PricingCalculatorTab, EstimateDescriptionTab, ProjectInfoTab) shipped as dead code.
11. **Broad Firestore rules:** any authed user can read all projects and update any top-level message; create lacks `senderId` validation.
12. **Delete user orphans Firebase Auth account**; editing email updates Firestore but not Auth (silent drift).

### 🟡 High (functional gaps / unreliable)

13. **QuickBooks Connect / Test / Sync are placeholders** — entire QB OAuth + sync server side missing.
14. **FreshBooks pagination dead** (`currentPage` fixed at 1); date inputs unvalidated free-text.
15. **Impersonation state in-memory only** — lost on reload; `viewAsClient` can flash the global spinner.
16. **Cached `userProfile` written but never read** — no offline hydration; profile-load failure silently leaves null.
17. **AI chat history + additional instructions ephemeral** — never persisted, lost on unmount.
18. **`createdAt` uses client clock** (`new Date()`), not `serverTimestamp` — ordering skew across devices.
19. **In-memory client-side search/filter/sort over full collections** — won't scale; defeats pagination.
20. **`sendWelcomeEmail` sends no email** (no provider wired).
21. **No sign-up / password-reset / forgot-password** flow in the app.
22. **No client CRUD** despite "add your first client" copy.
23. **`onProjectCreated` mass-notifies admins during FreshBooks bulk import.**
24. **Whisper language hard-forced to `en`** — non-English mis-transcribed.
25. **Detail/Add-Photos use one-shot reads** while lists use `onSnapshot` → stale detail data.
26. **Bulk project delete leaves orphaned** Storage photos, messages, invoices.
27. **OpenAI placeholder-key fallback** fails silently instead of loudly.
28. **Firestore indexes under-specified** for the app's query set.

### 🔲 Stub / Placeholder (decorative)

29. **Settings:** notification toggles non-persisted; Clear Cache fake; Report a Bug = alert; version hardcoded.
30. **Calendar:** Events permanently empty (no data); Today button no-op.
31. **Recent Activity (Home):** permanent empty placeholder.
32. **Pull-to-refresh** is a no-op on Projects, Inbox, Clients, ClientDetail, UserManagement (all rely on listeners).
33. **`config/openai.js`** generateProject/transcribeAudio/aiChat — dead (aiChat body shape mismatches live API).
34. **`lib/secureStore.ts`** fully implemented but never imported.
35. **`createThumbnail`**, **`lib/api.ts`** (in AI paths), Firebase callable AI functions, TTS — implemented but unwired.
36. **AppErrorBoundary** Sentry/remote reporting is TODO (console-only).

### Cross-cutting code hygiene

- Schema drift: project value fields, `title`/`name`, photo URL-string vs object, `txnDate`/`createdAt`, `clientName`-on-doc vs lookup.
- Hardcoded URLs/IDs scattered (`carbenconnect.com` vs `www.`, EAS projectId, redirectUri, region/project, `#FF6B35`).
- Incomplete `useEffect` deps (`isAdmin` omitted; empty arrays referencing `userProfile`) → stale-closure footguns.
- Duplicate StyleSheet keys (paddingBottom, invoiceHeader) = dead values.
- Leftover debug `console.log`, unused imports/styles, stale `index.js.backup`/`.bak`, hardcoded `bsternbach` branding in two screens, hardcoded labor rates / 30% markup / 8.5% tax / stale legal dates / `© 2025`.
- Three different HTTP clients in functions (axios, global fetch, node-fetch).
- All functions Gen1, no region/memory/timeout/App Check config.

---

## 8. Design System

The design layer is the app's strongest, most consistent asset — an **Apple HIG–based token system** (`theme.js`), consumed app-wide via `useTheme()` (`ThemeContext.js`). Preserve as the baseline.

### Tokens (`theme.js`)

- **TYPOGRAPHY:** `largeTitle → caption2` scale with exact `fontSize`, `letterSpacing`, `lineHeight`.
- **Colors:** light + dark **iOS semantic palettes** — system backgrounds (`systemGroupedBackground`, `secondarySystemBackground`), labels (`label`, `secondaryLabel`), fills, separators, semantic (success/warning/error), grays, and **Carben brand orange** (`#F97316`) + accent **blue** (`#3B82F6`).
- **SPACING:** 8pt grid. **RADIUS:** corner tokens. **SHADOWS:** three levels. **ANIMATION:** timings. **TOUCH_TARGET:** 44pt minimum. **TAB_BAR_HEIGHT:** platform-aware.
- **Theme mode:** `automatic` (follows OS) / `light` / `dark`, persisted to AsyncStorage `'@carben_theme_mode'`.

> **Caveat:** color palettes are **duplicated** between `theme.js` (LIGHT/DARK_COLORS) and `ThemeContext.js`; dark mode actually flows through ThemeContext. The static `COLORS`/`COLORS_DARK`/`getTheme()` exports are vestigial — any component importing static `COLORS` (ViewModeBanner, ClientSelectorModal) silently breaks dark mode. **Consolidate to one source of truth.**

### Custom Components (look & feel to preserve)

| Component | Worth keeping for |
|---|---|
| **CustomTabBar** | Raised circular orange center "Home" button, themed focus icons, haptics, keyboard-aware hide. |
| **GlowingCallButton** | Gradient border + soft halo glow; self-measuring `onLayout` scales radius/padding/font/icon/halo by height. |
| **StripedCallButton** | Orange-top / blue-bottom gradient stripes + centered phone icon. |
| **BrandWelcomeHeader** | "Welcome back, {name}" with orange+blue gradient accent lines. |
| **VoiceRecorder** | Mic UI with live duration timer, haptics, processing spinner. |
| **ClientSummary** | AI text with inline `Title[projectId]` → tappable nav links; cache indicator. |
| **ProjectCard / ClientCard / MessageCard** | Consistent avatar-from-initial, status badges, card layouts. |

### Conventions

`createStyles(colors)` factory + `useTheme()` per screen · `SafeAreaView` top edge · 44pt touch targets · haptics on nearly every interaction · `systemGroupedBackground` card patterns · section/status-card/danger-zone layouts. The aesthetic is coherent, iOS-native, and brand-consistent (orange `#F97316` / blue `#3B82F6`).

---

## 9. Rewrite vs Continue — Recommendations by Subsystem

| Subsystem | Decision | One-line rationale |
|---|---|---|
| **Design system & tokens** | **Keep** | Polished, complete Apple-HIG system — just consolidate the duplicated palettes into one source. |
| **Custom components** (tab bar, call buttons, header, cards) | **Keep** | Non-trivial, brand-defining UI; fix the static-`COLORS` dark-mode regressions. |
| **Auth + role/impersonation model** | **Keep, harden** | Clean `isAdmin`/`isRealAdmin` separation and impersonation pattern; add persistence + offline hydration + sign-up/reset. |
| **Navigation** | **Keep** | Tab + stack structure and blur-reset pattern are solid; deduplicate shared screens via a screen group. |
| **Projects data model** | **Rebuild** | Four-source schema drift, overlapping fields, dual photo shapes — normalize a canonical schema first. |
| **Projects UI/pipelines** (photo/voice upload, cards, detail) | **Keep** | Pipelines and UI are reusable; switch detail to live listeners and add server-side filtering/pagination. |
| **Estimates Engine** | **Keep core, fix schema** | Auto-save/anti-clobber, progress-stepper, and pricing math are valuable; reconcile the calculator↔QB schema and delete the 3 orphaned tabs. |
| **AI / Voice** | **Keep pipelines, consolidate backend** | Prompts and voice flow are differentiated assets; pick one backend (Vercel vs Firebase callable), route via `lib/api.ts`, pin response contracts, add auth/timeout. |
| **Messaging** | **Rebuild backbone, keep UI** | No canonical conversations collection, dead read/unread, client-clock ordering — rebuild the data model; the composer/thread UX is harvestable. |
| **Notifications (push)** | **Keep, fix triggers** | Token + fan-out plumbing is real; fix the general-message/`contractorIds` gaps and bulk-import spam. |
| **Clients** | **Keep, extend** | Solid read-only directory; add the missing CRUD, re-fetch detail by id, fix theming + non-admin query. |
| **FreshBooks integration** | **Keep (port as-is)** | The most complete, hardest-to-rebuild integration; fix secrets, `.run()`, batch chunking, pagination. |
| **QuickBooks integration** | **Rebuild server, keep refresh + picker** | Connect/Test/Sync are placeholders and the server side is absent; keep the token-refresh harness and customer-picker/create-estimate wiring. |
| **Admin user management** | **Keep** | Genuine backend integration (reset/force-change/audit); fix Auth-account orphaning + email drift; replace iOS-only `Alert.prompt`. |
| **Settings / Calendar / Recent Activity** | **Rebuild** | Decorative shells that don't function — implement persistence + real data or remove. |
| **Cloud Functions** | **Keep logic, modernize** | Sound business logic; migrate Gen1→Gen2 (region/memory/timeout/secrets/App Check), extract shared `assertAdmin`, fix `.run()` and batch limits. |
| **Firestore/Storage rules** | **Keep, tighten** | Good role baseline; close the broad project read + unguarded message update, validate `senderId`, expand indexes. |
| **Secrets/config management** | **Rebuild** | Committed FreshBooks + Firebase + plaintext-QuickBooks secrets must move to env/Secret Manager and be rotated. |
| **Dead code** (secureStore, callable AI fns, config/openai helpers, orphaned tabs, `.bak` files) | **Drop** | Implemented-but-unwired or superseded — remove to reduce drift. |

### Suggested sequencing for a continue-and-fix path
1. **Security:** rotate/relocate all committed secrets; tighten Firestore rules.
2. **Schema:** define canonical `projects` + introduce a real `conversations`/read-state model; reconcile the calculator schema.
3. **Correctness:** fix ViewModeBanner, message push triggers, `freshbooksBulkImport` `.run()`, batch chunking, server-side timestamps.
4. **Scale:** server-side project/message filtering + pagination; expand indexes.
5. **Finish or cut:** QuickBooks server side, Settings/Calendar/Recent Activity, sign-up/reset.
6. **Hygiene:** delete dead code, consolidate theme source, externalize URLs/config, add Sentry, modernize functions to Gen2.