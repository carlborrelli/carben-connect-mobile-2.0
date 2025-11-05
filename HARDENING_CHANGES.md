# Carben Connect Mobile - Security & Infrastructure Hardening

**Date:** November 5, 2025
**Build:** Infrastructure Refactor v1.0

---

## Summary

Comprehensive security hardening and infrastructure improvements for the Carben Connect mobile app. This update adds environment-driven configuration, API abstraction, security rules, linting, CI/CD, and developer tooling **without touching any existing `.md` credential files**.

---

## Changes Made

### 1. Environment Configuration (`app.config.ts`)
- ✅ Converted `app.json` to TypeScript config
- ✅ Added environment variable support via `EXPO_PUBLIC_*`
- ✅ Centralized API URL configuration
- ✅ Added iOS permission strings (Camera, Photos, Microphone)
- ✅ Enhanced Android permissions

**Usage:**
```bash
# Create .env file (not committed)
EXPO_PUBLIC_API_URL=https://www.carbenconnect.com
```

### 2. API Client (`lib/api.ts`)
- ✅ Centralized fetch wrapper with timeout support
- ✅ Automatic auth token injection
- ✅ Request timeout protection (15s default)
- ✅ Abort controller for cancellation
- ✅ Environment-driven base URL
- ✅ Helper methods: `apiClient.get()`, `.post()`, `.put()`, `.delete()`

**Usage:**
```typescript
import { api, apiClient } from './lib/api';

// Simple GET
const data = await apiClient.get('/api/projects', token);

// POST with body
await apiClient.post('/api/projects', { name: 'New Project' }, token);
```

### 3. Secure Token Storage (`lib/secureStore.ts`)
- ✅ iOS Keychain integration
- ✅ Android EncryptedSharedPreferences
- ✅ Web localStorage fallback (with warning)
- ✅ Predefined keys for session management

**Usage:**
```typescript
import { secureStore, SecureStoreKeys } from './lib/secureStore';

// Store session token
await secureStore.set(SecureStoreKeys.SESSION_TOKEN, token);

// Retrieve token
const token = await secureStore.get(SecureStoreKeys.SESSION_TOKEN);
```

### 4. Firestore Security Rules (`firestore.rules`)
- ✅ Blocks client modification of server-owned fields (`approved`, `paid`, `finalized`)
- ✅ Prevents users from changing their own role
- ✅ Enforces admin-only operations (delete users, clients)
- ✅ Message immutability (no edits/deletes from clients)
- ✅ Project ownership validation

**Key Rules:**
- Users can only update their own profiles (except role field)
- Only project owners can update projects
- Server-owned fields protected from client writes
- Admin-only operations clearly defined

### 5. Storage Security Rules (`storage.rules`)
- ✅ 15MB file size limit for project uploads
- ✅ 5MB limit for profile images
- ✅ Content type validation (images, audio, PDF only)
- ✅ User-scoped access control

### 6. Image Compression (`lib/images.ts`)
- ✅ Auto-resize to 1600px width before upload
- ✅ 75% JPEG compression
- ✅ Thumbnail generation (400px, 60% quality)
- ✅ Fallback to original if compression fails

**Usage:**
```typescript
import { compressForUpload } from './lib/images';

const compressedUri = await compressForUpload(imageUri);
// Now upload compressedUri to Firebase Storage
```

### 7. Error Boundary (`components/AppErrorBoundary.tsx`)
- ✅ Catches React component errors
- ✅ Prevents full app crashes
- ✅ Shows friendly error screen with retry
- ✅ Dev mode: displays full error stack
- ✅ Prepared for Sentry integration (TODO marker)

**Usage:**
```tsx
import { AppErrorBoundary } from './components/AppErrorBoundary';

// Wrap your app root
<AppErrorBoundary>
  <App />
</AppErrorBoundary>
```

### 8. Linting & Formatting
- ✅ ESLint 8 with TypeScript support
- ✅ Prettier for code formatting
- ✅ React Hooks rules
- ✅ Expo-specific configs

**Scripts:**
```bash
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
npm run typecheck # TypeScript type checking
```

### 9. EAS Build Profiles (`eas.json`)
- ✅ `development` profile (internal, development client)
- ✅ `preview` profile (internal testing)
- ✅ `production` profile (App Store submission)
- ✅ Auto-increment build numbers
- ✅ Pre-configured Apple IDs

### 10. CI/CD (`.github/workflows/ci.yml`)
- ✅ Runs on PR and main branch pushes
- ✅ ESLint checks
- ✅ TypeScript type checking
- ✅ Non-blocking (won't fail builds yet)

### 11. Git Configuration (`.gitignore`)
- ✅ Excludes `.env` files (secrets stay local)
- ✅ Includes `.env.example` template
- ✅ Standard Expo/React Native ignores
- ✅ **Preserves all `.md` files** (intentionally)

---

## New Dependencies Added

### Production Dependencies:
- `dotenv` - Environment variable loading
- `expo-constants` - Runtime config access
- `expo-image-manipulator` - Image compression
- `expo-secure-store` - Keychain/secure storage

### Dev Dependencies:
- `eslint` (v8.57.0) + TypeScript plugins
- `prettier` (v3.3.0)
- `typescript` (v5.6.0)
- React/hooks ESLint plugins

---

## Files Created/Modified

### New Files:
```
app.config.ts                       # Environment-driven config
.env.example                         # Environment template
.gitignore                           # Git exclusions
eas.json                             # Build profiles
firestore.rules                      # Firestore security
storage.rules                        # Storage security
lib/api.ts                           # API client
lib/secureStore.ts                   # Secure storage
lib/images.ts                        # Image utilities
components/AppErrorBoundary.tsx      # Error boundary
.eslintrc.json                       # ESLint config
.prettierrc                          # Prettier config
.prettierignore                      # Prettier exclusions
.github/workflows/ci.yml             # CI/CD pipeline
```

### Modified Files:
```
package.json                         # Scripts + dependencies
```

### Unchanged:
```
**/*.md                              # All MD files preserved
```

---

## Next Steps (Manual)

### 1. Deploy Firebase Rules
```bash
# Navigate to Firebase Console
# Firestore → Rules → Copy contents of firestore.rules → Publish
# Storage → Rules → Copy contents of storage.rules → Publish
```

### 2. Create Local `.env` File
```bash
# Copy template
cp .env.example .env

# Edit with your values
EXPO_PUBLIC_API_URL=https://www.carbenconnect.com
```

### 3. Test Build
```bash
# Development build
npm start

# Production build
npx eas build --platform ios --profile production
```

### 4. Future Refactoring (Optional)
Replace hardcoded API URLs in code:
```typescript
// OLD:
fetch('https://www.carbenconnect.com/api/projects')

// NEW:
import { apiClient } from './lib/api';
apiClient.get('/api/projects')
```

---

## Security Notes

### What's Protected:
✅ Session tokens (via expo-secure-store)
✅ Server-owned Firestore fields
✅ File upload sizes and types
✅ User role modifications

### What's NOT in This Update:
❌ Long-lived provider secrets (QuickBooks, OpenAI) - These remain in `.md` files as requested
❌ API URL refactoring in existing code - Can be done incrementally
❌ Sentry integration - TODO marker added for future

### Important:
- **All `.md` files with credentials are intentionally unchanged**
- Secrets should eventually move to server-side or environment variables
- Current setup is transitional for development

---

## Testing Checklist

- [ ] App builds successfully (`expo start`)
- [ ] All screens load without errors
- [ ] User login works
- [ ] Project creation works
- [ ] Image uploads work (with compression)
- [ ] Firebase rules don't block legitimate operations
- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`npm run typecheck`)

---

## Troubleshooting

### Build fails with "Cannot find module"
```bash
npm install --legacy-peer-deps
```

### Firebase rules blocking legitimate operations
Check console errors, may need to adjust `firestore.rules` `isAdmin()` function

### ESLint errors
```bash
npm run lint -- --fix
```

### Type errors
```bash
npm run typecheck
```

---

## Commit Message

```
Infrastructure hardening and security improvements

- Add environment-driven configuration (app.config.ts)
- Implement centralized API client with timeout/auth
- Add secure token storage (iOS Keychain, Android EncryptedSharedPreferences)
- Create Firestore/Storage security rules
- Add image compression before uploads
- Implement error boundary component
- Add ESLint, Prettier, and TypeScript checking
- Configure EAS build profiles
- Set up GitHub Actions CI/CD
- Install required dependencies

Note: All .md credential files intentionally unchanged

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
