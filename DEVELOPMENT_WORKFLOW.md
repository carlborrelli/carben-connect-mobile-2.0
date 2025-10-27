# Carben Connect Mobile 2.0 - Development Workflow

## Core Principle

**GitHub is the Single Source of Truth**

All code lives in GitHub. The Mac is just a working directory that syncs with GitHub. No more Ubuntu container editing. No more file sync confusion.

## Directory Structure

### Mac (Primary Development)
```
/Users/carlborrelli/carben-connect-mobile-2.0/
├── .git/                    # Git repository
├── .gitignore              # Ignore node_modules, .env, etc.
├── App.js                  # Main app entry
├── app.json                # Expo config
├── package.json            # Dependencies
├── README.md               # Setup instructions
├── CREDENTIALS.md          # Credentials (NOT in git)
├── FEATURES.md             # Feature documentation
├── APPLE_DESIGN_GUIDELINES.md  # Design system
├── screens/                # All screen components
├── components/             # Reusable components
├── config/                 # Configuration files
├── contexts/               # React contexts
├── assets/                 # Images, fonts, etc.
└── node_modules/           # NPM packages (not in git)
```

### GitHub Repository
```
github.com/carlborrelli/carben-connect-mobile-2.0
```

### Ubuntu Container (DEPRECATED)
- **Do not use** for development
- Only used by Claude for file operations when explicitly needed
- Never the source of truth

## Git Workflow

### Initial Setup (One Time)

1. **Create new GitHub repository:**
   ```bash
   # Done via GitHub web interface
   # Repo: carlborrelli/carben-connect-mobile-2.0
   # Private repository
   # No README (we'll create our own)
   ```

2. **Initialize on Mac:**
   ```bash
   cd ~/carben-connect-mobile-2.0
   git init
   git branch -M main
   git remote add origin https://github.com/carlborrelli/carben-connect-mobile-2.0.git
   ```

3. **Create .gitignore:**
   ```
   # Dependencies
   node_modules/
   .expo/
   .expo-shared/

   # Environment
   .env
   .env.local
   .env.*.local

   # Credentials (NEVER commit these)
   CREDENTIALS.md

   # OS
   .DS_Store
   Thumbs.db

   # IDE
   .vscode/
   .idea/

   # Logs
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*

   # Build
   dist/
   build/
   ```

4. **Initial commit:**
   ```bash
   git add .
   git commit -m "Initial commit - Carben Connect Mobile 2.0"
   git push -u origin main
   ```

### Daily Development Workflow

**Step 1: Start Development Session**
```bash
cd ~/carben-connect-mobile-2.0

# Pull latest changes (if working with team)
git pull origin main

# Create feature branch
git checkout -b feature/apple-design-buttons
```

**Step 2: Make Changes**
```bash
# Edit files
# Test in simulator
# Verify changes work
```

**Step 3: Commit Changes**
```bash
# Stage changes
git add screens/HomeScreen.js
git add components/Button.js

# Commit with descriptive message
git commit -m "feat: Implement Apple-style buttons with haptic feedback"
```

**Step 4: Push to GitHub**
```bash
# Push feature branch
git push origin feature/apple-design-buttons
```

**Step 5: Merge to Main**
```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature/apple-design-buttons

# Push to GitHub
git push origin main

# Delete feature branch
git branch -d feature/apple-design-buttons
git push origin --delete feature/apple-design-buttons
```

### Commit Message Convention

Use conventional commits:

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, etc.)
refactor: Code refactoring
test: Adding tests
chore: Maintenance tasks
```

Examples:
```
feat: Add dark mode support to HomeScreen
fix: Resolve Firebase auth timeout issue
docs: Update setup instructions in README
style: Apply Apple design guidelines to buttons
refactor: Extract color system to theme file
```

## Claude Development Guidelines

### What Claude CAN Do:
1. Read files from Mac via SSH
2. Create/edit files on Mac via SSH
3. Run git commands on Mac
4. Run npm/expo commands on Mac
5. Push/pull from GitHub
6. Read from Ubuntu container (for reference only)

### What Claude CANNOT Do:
1. Edit files in Ubuntu container as source of truth
2. Sync files from Ubuntu to Mac
3. Overwrite Mac files with Ubuntu versions
4. Make assumptions about which version is "correct"

### Claude Workflow:
1. **Always work on Mac first**
   ```bash
   sshpass -p 'Cb136479' ssh carlborrelli@10.30.82.252 "cd ~/carben-connect-mobile-2.0 && [command]"
   ```

2. **Never assume Ubuntu has the right version**
   - Ubuntu is for temporary operations only
   - Never copy from Ubuntu to Mac
   - Only copy from Mac to Ubuntu if needed

3. **Always commit to GitHub**
   - After making changes, commit
   - Push to GitHub immediately
   - GitHub is the backup

4. **Ask before major operations**
   - Deleting files/folders
   - Overwriting existing files
   - Merging branches
   - Force pushing

## Metro Bundler Workflow

### Starting Development Server

**On Mac (via SSH):**
```bash
sshpass -p 'Cb136479' ssh carlborrelli@10.30.82.252 "cd ~/carben-connect-mobile-2.0 && npx expo start --clear"
```

### Reloading After Changes
- Metro watches for file changes automatically
- Manual reload: Press `r` in terminal or Cmd+R in simulator
- Clear cache: `npx expo start --clear`

### Running Simulator
```bash
# iOS
npx expo start --ios

# Specific device
npx expo start --ios --device "iPhone 15 Pro"
```

## Version Control Best Practices

### Branch Strategy

**Main Branch:**
- Always deployable
- Only merge tested features
- Protected branch (require reviews if team)

**Feature Branches:**
- One branch per feature
- Name: `feature/feature-name`
- Short-lived (delete after merge)

**Fix Branches:**
- For bug fixes
- Name: `fix/bug-description`
- Short-lived (delete after merge)

### When to Commit

✅ **DO commit:**
- After completing a feature
- After fixing a bug
- Before switching tasks
- At end of day
- After making working progress

❌ **DON'T commit:**
- Broken code
- Code with errors
- Large uncommitted changes
- node_modules or build files
- Credentials or secrets

### Pull Request Workflow (If Team)

1. Create feature branch
2. Make changes and commit
3. Push to GitHub
4. Create Pull Request on GitHub
5. Request review
6. Address feedback
7. Merge when approved
8. Delete branch

## Backup Strategy

### Three-Level Backup

**Level 1: Git Commits**
- Commit frequently
- Every commit is a restore point
- Can revert to any commit

**Level 2: GitHub Repository**
- Push daily (minimum)
- Push after significant changes
- Remote backup of all code

**Level 3: GitHub Releases**
- Tag major versions
- Create releases for milestones
- Permanent snapshots

### Creating a Release

```bash
# Tag a version
git tag -a v2.0.0 -m "Version 2.0.0 - Apple Design Launch"

# Push tag to GitHub
git push origin v2.0.0

# Create release on GitHub web interface
```

## Disaster Recovery

### If Mac Files Are Lost:

1. **Clone from GitHub:**
   ```bash
   cd ~
   git clone https://github.com/carlborrelli/carben-connect-mobile-2.0.git
   cd carben-connect-mobile-2.0
   npm install
   ```

2. **Restore credentials:**
   - Copy CREDENTIALS.md from secure location
   - Update config/firebase.js with credentials

3. **Resume development:**
   ```bash
   npx expo start
   ```

### If Wrong Version Is Running:

1. **Check Git status:**
   ```bash
   git status
   git log --oneline -10
   ```

2. **Verify current branch:**
   ```bash
   git branch
   ```

3. **Pull latest from GitHub:**
   ```bash
   git pull origin main
   ```

4. **If local changes conflict:**
   ```bash
   # Stash local changes
   git stash

   # Pull latest
   git pull origin main

   # Review stashed changes
   git stash show

   # Apply if needed
   git stash apply
   ```

## File Organization

### Naming Conventions

**Files:**
- Components: PascalCase (Button.js, ProjectCard.js)
- Screens: PascalCase with "Screen" suffix (HomeScreen.js)
- Utilities: camelCase (apiClient.js, formatters.js)
- Constants: UPPER_SNAKE_CASE (API_ENDPOINTS.js)

**Folders:**
- Lowercase with hyphens (components, screens, config)
- Group related files together

### Import Order

```javascript
// 1. React/React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// 3. Local imports (absolute)
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

// 4. Components
import Button from '../components/Button';
import ProjectCard from '../components/ProjectCard';

// 5. Utilities/Constants
import { COLORS, TYPOGRAPHY } from '../theme';
import { formatDate } from '../utils/formatters';
```

## Development Checklist

### Before Starting Feature:
- [ ] Pull latest from GitHub
- [ ] Create feature branch
- [ ] Review requirements

### During Development:
- [ ] Test changes in simulator
- [ ] Follow Apple design guidelines
- [ ] Add comments for complex logic
- [ ] Check for console errors/warnings

### Before Committing:
- [ ] Test all changed functionality
- [ ] Check for TypeScript/linting errors
- [ ] Remove console.log statements
- [ ] Verify no credentials in code

### Before Pushing:
- [ ] Write descriptive commit message
- [ ] Verify branch is correct
- [ ] Check file changes are intended
- [ ] Push to correct remote

---

**Remember:** GitHub is the source of truth. When in doubt, check GitHub. Never trust old backups or Ubuntu versions.

**Last Updated:** 2025-10-27
