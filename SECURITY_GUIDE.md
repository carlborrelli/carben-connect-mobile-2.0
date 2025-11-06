# Security Guide - Credentials Management

## Overview

This guide explains how to securely manage credentials for the Carben Connect Mobile app.

## File Structure

### Local Files (NEVER commit to git)
- **CREDENTIALS.md** - Your actual credentials (gitignored)
- **.env** - Environment variables for local development (gitignored)
- **DARK_MODE_IMPLEMENTATION_MEMORY.md** - Contains server passwords (gitignored)
- **DEVELOPMENT_WORKFLOW.md** - Contains tokens (gitignored)

### Template Files (safe to commit)
- **CREDENTIALS_TEMPLATE.md** - Empty template for credentials
- **.env.example** - Template for environment variables

## Setup Instructions

### 1. Create Your Local Credentials File

```bash
cp CREDENTIALS_TEMPLATE.md CREDENTIALS.md
# Edit CREDENTIALS.md with your actual values
```

### 2. Create Your Local .env File

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Verify .gitignore

Ensure these lines are in .gitignore:
```
CREDENTIALS.md
DARK_MODE_IMPLEMENTATION_MEMORY.md
DEVELOPMENT_WORKFLOW.md
.env
.env.local
```

## Credential Rotation Schedule

### After Exposure (IMMEDIATE)
1. **GitHub Token** - Regenerate at https://github.com/settings/tokens
2. **Expo Token** - Rotate at https://expo.dev
3. **Apple App Password** - Revoke/regenerate at https://appleid.apple.com
4. **Mac Server Password** - Change via System Preferences

### Regular Rotation (Every 90 days)
- GitHub Personal Access Tokens
- Expo Access Tokens
- Apple App-Specific Passwords

### Never Rotate (unless compromised)
- Firebase API Keys (public by design, protected by Firestore rules)

## Current Status (as of 2025-11-05)

### ⚠️ EXPOSED - Need to Rotate:
1. **Mac Server Password** (Cb136479)
2. **Apple App Password** (kzcf-vqrp-htts-xtfh)

### ✅ ROTATED:
- GitHub Token (rotated 2025-11-05, old token: ghp_eC87...)
- Expo Token (rotated 2025-11-05, old token: Zvo154...)

## Best Practices

1. **Never commit credentials to git**
2. **Use environment variables for app config**
3. **Keep CREDENTIALS.md local only**
4. **Rotate tokens after any exposure**
5. **Use different passwords for different services**
6. **Enable 2FA on all accounts**

## Emergency Response

If credentials are accidentally committed:

1. **Immediately rotate the exposed credentials**
2. **Remove from current codebase** (git rm --cached)
3. **Add to .gitignore**
4. **Consider rewriting git history** (advanced, risky)
5. **Monitor for unauthorized access**

## Helpful Links

- GitHub Tokens: https://github.com/settings/tokens
- Expo Tokens: https://expo.dev/accounts/[account]/settings/access-tokens
- Apple ID: https://appleid.apple.com/account/manage
- Firebase Console: https://console.firebase.google.com

