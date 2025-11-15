# TestFlight Deployment Guide

This document describes the complete process for deploying a new build to TestFlight, including both the frontend (Xcode) and backend (Cloud Functions) steps.

## Overview

Deploying to TestFlight involves:
1. Incrementing build numbers
2. Creating an iOS archive in Xcode
3. Uploading to App Store Connect
4. Deploying Cloud Functions (if backend changes were made)

---

## Part 1: Incrementing Build Numbers

Before creating a new build, increment the build number in two places:

### 1. Update app.json

File: `~/carben-connect-mobile-2.0/app.json`

```bash
# SSH to Mac
ssh carlborrelli@10.30.82.252

# Edit app.json and increment buildNumber
# Example: Change "buildNumber": "8" to "buildNumber": "9"
cd ~/carben-connect-mobile-2.0
sed -i '' 's/"buildNumber": "8"/"buildNumber": "9"/' app.json
```

### 2. Update Info.plist

File: `~/carben-connect-mobile-2.0/ios/CarbenConnect/Info.plist`

```bash
# Update CFBundleVersion
sed -i '' 's/<string>8<\/string>/<string>9<\/string>/' ios/CarbenConnect/Info.plist
```

**Important:** Both files must have matching build numbers or the build will fail.

---

## Part 2: Creating Archive in Xcode

### Open Project

1. Navigate to the iOS workspace:
   ```
   /Users/carlborrelli/carben-connect-mobile-2.0/ios/CarbenConnect.xcworkspace
   ```

2. **IMPORTANT:** Open `CarbenConnect.xcworkspace` (NOT the .xcodeproj file)
   - The .xcworkspace file includes CocoaPods dependencies
   - Opening .xcodeproj directly will cause build failures

### Create Archive

1. In Xcode menu: **Product → Archive**
2. Wait for the archive process to complete (5-10 minutes)
3. The Organizer window will open automatically when done

### Distribute to TestFlight

1. In the Organizer window, select your new archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Select **Upload**
5. Keep default options and click **Next** through the screens
6. Review the summary and click **Upload**
7. Wait for upload to complete (5-10 minutes)

### Verify Upload

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → TestFlight
3. Your new build should appear under "Builds" (may take 5-10 minutes to process)
4. Once processed, the build is automatically available to internal testers

---

## Part 3: Deploying Cloud Functions (If Needed)

If you made changes to Cloud Functions, deploy them from the Mac.

### Location of Functions

Cloud Functions source code: `~/carben-connect-mobile-2.0/functions/`

Key files:
- `index.js` - Main functions file with all Cloud Function exports
- `notificationFunctions.js` - Push notification triggers
- `sendPushNotification.js` - Push notification helper
- `package.json` - Dependencies

### Deploy Functions

```bash
# SSH to Mac
ssh carlborrelli@10.30.82.252

# Navigate to functions directory
cd ~/carben-connect-mobile-2.0/functions

# Install dependencies (if package.json changed)
npm install

# Deploy functions to Firebase
npx firebase-tools deploy --only functions --force
```

### Verify Deployment

Check the Firebase Console:
```
https://console.firebase.google.com/project/carben-connect/functions
```

All functions should show "Healthy" status.

---

## Current Cloud Functions

The following functions are deployed:

### Notification Functions (New)
- `onMessageCreated` - Sends push notification when new message created
- `onEstimateCreated` - Sends push notification when estimate created
- `onProjectCreated` - Sends push notification when project created

### FreshBooks Integration
- `freshbooksConnect` - OAuth connection flow
- `freshbooksCallback` - OAuth callback handler
- `freshbooksDisconnect` - Disconnect FreshBooks account
- `freshbooksRefreshToken` - Refresh FreshBooks access token
- `freshbooksGetInvoices` - Fetch invoices from FreshBooks
- `freshbooksImportInvoice` - Import single invoice
- `freshbooksBulkImport` - Bulk import invoices
- `freshbooksClearImported` - Clear imported invoices flag

### QuickBooks Integration
- `refreshQuickBooksToken` - Refresh QuickBooks access token

### AI Features
- `generateProject` - AI-powered project generation
- `transcribeAudio` - Audio transcription
- `textToSpeech` - Text-to-speech conversion

### User Management
- `changeUserPassword` - Change user password
- `sendWelcomeEmail` - Send welcome email to new users

---

## Common Issues & Solutions

### Issue: Build number mismatch
**Error:** "The bundle version must be higher than the previous version"

**Solution:** Make sure both `app.json` and `Info.plist` have the same, incremented build number.

### Issue: Cannot find xcworkspace
**Error:** Build fails with CocoaPods errors

**Solution:** Always open `CarbenConnect.xcworkspace`, NOT `CarbenConnect.xcodeproj`

### Issue: Cloud Functions deployment fails
**Error:** "Cannot find module 'openai'" or similar

**Solution:** 
```bash
cd ~/carben-connect-mobile-2.0/functions
npm install
npx firebase-tools deploy --only functions --force
```

### Issue: Functions deleted accidentally
**Problem:** Used wrong index.js file that doesn't include all functions

**Solution:** The complete index.js is in `~/carben-connect-mobile-2.0/functions/index.js` (44KB file with all function exports). Never deploy from the web project's functions folder.

---

## Quick Reference Commands

### Update Build Numbers (Replace 8 and 9 with current/next numbers)
```bash
ssh carlborrelli@10.30.82.252
cd ~/carben-connect-mobile-2.0
sed -i '' 's/"buildNumber": "8"/"buildNumber": "9"/' app.json
sed -i '' 's/<string>8<\/string>/<string>9<\/string>/' ios/CarbenConnect/Info.plist
```

### Deploy Cloud Functions
```bash
ssh carlborrelli@10.30.82.252
cd ~/carben-connect-mobile-2.0/functions
npm install
npx firebase-tools deploy --only functions --force
```

### Check Current Build Number
```bash
ssh carlborrelli@10.30.82.252
grep buildNumber ~/carben-connect-mobile-2.0/app.json
grep CFBundleVersion ~/carben-connect-mobile-2.0/ios/CarbenConnect/Info.plist
```

---

## Notes

- Always use `--force` flag when deploying Cloud Functions to avoid interactive prompts
- TestFlight builds are automatically available to internal testers
- External testers require submission for beta review (separate step)
- Cloud Functions use Node.js 20 runtime
- The mobile app uses Expo with bare workflow
