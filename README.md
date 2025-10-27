# Carben Connect Mobile 2.0

Construction project management mobile app with Apple design language.

## Features

- **Project Management** - View, create, and manage construction projects
- **Photo Management** - Upload and view project photos
- **Estimates** - Create, view, and approve estimates
- **AI Features** - Voice project creation, AI-generated descriptions
- **Messaging** - Real-time project communication
- **QuickBooks Integration** - Sync customers and estimates
- **Admin Tools** - User management, login history, active users
- **Apple Design** - Native iOS experience with haptics and animations

## Tech Stack

- **Framework**: React Native (Expo)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Navigation**: React Navigation 6
- **API**: www.carbenconnect.com
- **Integrations**: QuickBooks, OpenAI

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (Mac) or physical iOS device
- Firebase account
- QuickBooks Developer account (for admin features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/carlborrelli/carben-connect-mobile-2.0.git
   cd carben-connect-mobile-2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Copy `CREDENTIALS.md.example` to `CREDENTIALS.md`
   - Update Firebase config in `config/firebase.js`

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on iOS**
   - Press `i` in terminal, or
   - `npx expo start --ios`

## Project Structure

```
carben-connect-mobile-2.0/
├── App.js                     # Main app entry
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── screens/                   # Screen components
├── components/                # Reusable components
├── config/                    # Configuration files
│   └── firebase.js           # Firebase setup
├── contexts/                  # React contexts
├── assets/                    # Images, fonts, etc.
├── FEATURES.md               # Complete feature list
├── APPLE_DESIGN_GUIDELINES.md # Design system
└── DEVELOPMENT_WORKFLOW.md    # Git workflow
```

## Development Workflow

### Git Workflow

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m feat: Add your feature description
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Merge to main**
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Documentation

- **FEATURES.md** - Complete list of 50+ features
- **APPLE_DESIGN_GUIDELINES.md** - Design system and component specs
- **DEVELOPMENT_WORKFLOW.md** - Detailed git workflow and best practices
- **VISSION_FRAMEWORK.md** - Project vision and guiding principles
- **PREPARATION_SUMMARY.md** - Project setup phases

## Firebase Collections

- **users** - User profiles (admin/client roles)
- **projects** - Construction projects
- **estimates** - Project estimates
- **messages** - Project messages
- **estimateTemplates** - AI training templates
- **loginHistory** - User activity tracking
- **quickbooksTokens** - QB OAuth tokens

## API Endpoints

- `/api/ai/transcribe` - Voice to text
- `/api/ai/generate-project` - AI project descriptions
- `/api/ai/generate-estimate` - AI estimate descriptions
- `/api/quickbooks/create-estimate` - Create QB estimates
- `/api/quickbooks/sync-customers` - Sync QB customers

## Development Notes

- **Metro Bundler**: Watches for file changes automatically
- **Hot Reload**: Press `r` in terminal or Cmd+R in simulator
- **Clear Cache**: `npx expo start --clear`
- **GitHub is Source of Truth**: Always commit and push changes

## License

Private - Carben Connect LLC

## Contact

Carl Borrelli - Carben Connect LLC

---

**Last Updated:** 2025-10-27
