# Carben Connect Mobile 2.0 - Credentials & Configuration

## Server Access

### Mac Server
- **IP:** 10.30.82.252
- **Username:** carlborrelli
- **Password:** Cb136479

### Ubuntu Container (will be deprecated)
- **IP:** 10.30.82.110
- **Note:** No longer using for development in 2.0

## GitHub

### Old Repository (TO BE DELETED)
- **Repo:** carlborrelli/carben-connect-mobile
- **URL:** https://github.com/carlborrelli/carben-connect-mobile.git

### GitHub Token
- **Token:** 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
- **Usage:** For authenticated git operations

### New Repository (TO BE CREATED)
- **Repo:** carlborrelli/carben-connect-mobile-2.0
- **URL:** https://github.com/carlborrelli/carben-connect-mobile-2.0.git

## Firebase Configuration

### Project Details
- **Project ID:** carben-connect
- **Auth Domain:** carben-connect.firebaseapp.com
- **Storage Bucket:** carben-connect.firebasestorage.app

### API Credentials
- **API Key:** AIzaSyC6AIuhJVcVLdktRxjgWIb70VSuRuqCaxU
- **App ID:** 1:25867782405:web:11e29cf3c746b7c17f8f6c
- **Messaging Sender ID:** 25867782405

### Firebase Services Used
- **Authentication:** Email/password authentication
- **Firestore:** Real-time NoSQL database
- **Storage:** Cloud storage for photos/files

## Backend API

### Web Application
- **URL:** www.carbenconnect.com
- **API Base:** https://www.carbenconnect.com/api

### API Endpoints Used
```
/api/ai/transcribe              # Voice to text
/api/ai/generate-project        # AI project description
/api/ai/generate-estimate       # AI estimate description
/api/ai/chat                    # AI conversation
/api/ai/speak                   # Text to speech
/api/quickbooks/create-estimate # Create QB estimate
/api/quickbooks/update-estimate # Update QB estimate
/api/quickbooks/company-info    # QB company info
/api/quickbooks/sync-customers  # Sync QB customers
/api/quickbooks/sync-estimates  # Sync QB estimates
/api/users/[id]/set-password    # Set user password
/api/password-reset             # Password reset email
```

## Firestore Collections

### User Data
- **users** - User profiles with roles (admin/client)
- **loginHistory** - User activity tracking

### Project Data
- **projects** - Construction projects
- **estimates** - Project estimates
- **messages** - Project messages/conversations

### Admin Data
- **estimateTemplates** - AI training templates
- **quickbooksTokens** - QB OAuth tokens

## Development Workflow (2.0)

### Version Control Flow
1. All development happens on Mac at ~/carben-connect-mobile-2.0
2. Commit changes locally with git
3. Push to GitHub: carlborrelli/carben-connect-mobile-2.0
4. GitHub is the single source of truth
5. No more Ubuntu container editing

### File Sync Strategy
- **Primary:** Mac ~/carben-connect-mobile-2.0
- **Backup:** GitHub repository
- **Metro Bundler:** Runs on Mac
- **No more:** Ubuntu container sync confusion

## Security Notes

- Never commit credentials to git (use .env files)
- Keep GitHub token secure
- Firebase security rules must be properly configured
- Backend API requires authentication tokens

## Setup Checklist for 2.0

- [ ] Create new GitHub repo: carben-connect-mobile-2.0
- [ ] Initialize git on Mac in ~/carben-connect-mobile-2.0
- [ ] Create .gitignore for node_modules, .env files
- [ ] Set up GitHub auto-deploy (if possible)
- [ ] Document Apple design language guidelines
- [ ] Create fresh Expo project structure
- [ ] Configure Firebase connection
- [ ] Test push/pull workflow

---

Last Updated: 2025-10-27
