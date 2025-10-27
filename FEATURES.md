# Carben Connect Mobile 2.0 - Complete Feature List

## Core Features (From Existing App)

### Authentication & User Management
- **Firebase Authentication** - Email/password login
- **Role-Based Access** - Admin vs Client roles
- **User Profiles** - Name, email, role, QuickBooks customer data
- **Persistent Login** - AsyncStorage session management
- **Password Management** - Reset via email (Resend API)
- **Login History Tracking** - Track user activity with device/browser info
- **Active Users Dashboard** - Real-time active user monitoring (5m/15m/1h/24h windows)

### Project Management
- **Project List** - View all projects (admin) or assigned projects (client)
- **Project Details** - Full project information display
- **Project Creation** - Admin creates projects for clients
- **Project Status Tracking** - Multi-stage status (NEW → ESTIMATE_SENT → APPROVED → IN_PROGRESS → COMPLETE → PAID)
- **Draft Projects** - Save incomplete projects as drafts
- **Client Filtering** - Filter projects by client and QB location (admin only)
- **Status Updates** - Admin can update project status with buttons
- **Inline Editing** - Admin can edit project title/description inline
- **Real-Time Sync** - Firebase onSnapshot listeners for live updates

### Photo & File Management
- **Photo Upload** - Camera or gallery selection (expo-image-picker)
- **Multiple Photos** - Upload multiple photos per project
- **Firebase Storage** - Cloud storage for all photos
- **Full-Screen Viewer** - Tap to enlarge photos in modal
- **Photo Gallery** - Horizontal scrollable photo gallery

### Estimates & Pricing
- **Estimate Creation** - 4-tab workspace for creating estimates:
  1. **Project Info Tab** - Select client, view project photos
  2. **Description Tab** - AI-powered estimate description generation with auto-save
  3. **Pricing Calculator Tab** - Materials, subcontractors, labor, profit margin
  4. **Send to QuickBooks Tab** - Pre-flight checks, create/update QB estimates
- **Estimate Viewing** - Read-only estimate display for clients
- **Estimate Approval** - Clients can approve/reject estimates with signature
- **PDF Generation** - View estimates as PDFs
- **QuickBooks Integration** - Create and update estimates in QuickBooks
- **Pricing Breakdown** - Materials with markup (30%), subcontractors with markup (15%), labor (daily rates), profit margin
- **Progress Tracking** - 5-stage progress bar (0% → 100%)
- **Auto-Save** - 1.5-second debounce for description tab

### AI Features
- **Voice Project Creation** - Record voice description, AI transcribes and enhances:
  - Transcription (OpenAI Whisper)
  - Enhancement (GPT-4)
  - Text-to-speech playback
  - Multiple recordings accumulation
- **Voice Change Orders** - Conversation-based voice chat for change orders:
  - AI dialogue system
  - Conversation history display
  - Auto-generate change order descriptions
  - Save as project messages
- **AI Estimate Description** - GPT-4 generates professional estimate descriptions
- **AI Training Templates** - Admin manages estimate templates to train AI writing style

### Messaging & Communication
- **Project Messages** - Message threads per project
- **Real-Time Messages** - Live message updates
- **Unread Indicators** - Show unread message counts
- **Conversation View** - Group messages by project

### QuickBooks Integration
- **OAuth Connection** - Connect to QuickBooks account
- **Customer Sync** - Sync customers from QB to Firestore
- **Estimate Sync** - Sync estimates from QB to Firestore
- **Multi-Location Support** - Handle multiple QB locations per customer
- **Company Info** - Display connected QB company details
- **Connection Status** - Show connected/disconnected state
- **Data Sync Dashboard** - View sync statistics (created/updated/skipped/errors)

### Admin Tools
- **User Management** - Full CRUD operations on users
  - Create new users
  - Edit user details
  - Set passwords directly
  - Delete users with confirmation
  - Manage QB customer associations
- **AI Template Management** - Create/delete estimate templates
- **Login History** - View all login activity
- **Active Users** - Monitor currently active users
- **QB Integration Dashboard** - Manage QuickBooks connection

### Navigation & UI
- **5-Tab Navigation** - Projects, Inbox, Home, Clients, More
- **Circular Home Button** - Center tab with elevated circular button
- **Stack Navigation** - Nested navigation for detail screens
- **Modal Screens** - Settings, Profile, Admin screens
- **Pull-to-Refresh** - Refresh data on all list screens
- **Loading States** - ActivityIndicators for async operations
- **Error Handling** - User-friendly error messages

### Legal & Compliance
- **Privacy Policy** - 12-section comprehensive privacy policy (CCPA compliant)
- **Terms of Service** - 14-section detailed terms and conditions
- **Dynamic Dates** - JavaScript-generated "Last updated" dates

### Settings & Profile
- **Settings Screen** - App preferences
- **Profile Screen** - User information display
- **Menu Screen** - Navigation to all features organized by category:
  - Quick Actions
  - Projects & Work
  - Tools & Features (AI Templates)
  - Admin Tools (User Mgmt, Login History, QB Integration)
  - Legal (Privacy, Terms)
  - Account (Settings, Logout)

## Design & Styling

### Current Theme
- **Primary Color:** Orange (#F97316)
- **Background:** Light gray (#F9FAFB)
- **Cards:** White (#FFFFFF) with shadows
- **Text Colors:** Dark gray (#111827), medium gray (#6B7280), light gray (#9CA3AF)
- **Icons:** Ionicons from @expo/vector-icons

### Layout Patterns
- **Card-Based Design** - Content in white cards with rounded corners (8-12px)
- **Grid Layouts** - 2-column grids for dashboard cards
- **List Views** - FlatList for scrollable content
- **Form Layouts** - Vertical stacked form fields
- **Modal Presentations** - Full-screen and bottom sheet modals

## Technical Stack

### Framework & Libraries
- **React Native** - Cross-platform mobile framework
- **Expo SDK 54.0.0** - Development and build platform
- **React Navigation 6.x** - Navigation library
- **Firebase SDK 10.7.1** - Backend services
- **expo-av ~15.0.1** - Audio/video recording
- **expo-image-picker ~17.0.8** - Camera and gallery access
- **@react-native-async-storage/async-storage** - Local storage

### Backend Services
- **Firebase Authentication** - User auth
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Custom API** - www.carbenconnect.com backend
- **QuickBooks API** - Accounting integration
- **OpenAI API** - AI features (via backend)

## New Features for 2.0 (Apple Design Language)

### Design Enhancements
- **SF Pro Typography** - System font with proper hierarchy
- **iOS Semantic Colors** - Use system colors for light/dark mode
- **Native Components** - iOS-style switches, pickers, alerts
- **Haptic Feedback** - Tactile feedback for interactions
- **Swipe Gestures** - Swipe to delete, swipe back navigation
- **Bottom Sheets** - iOS-style bottom sheet modals
- **Larger Tap Targets** - 44pt minimum touch targets
- **Increased Spacing** - More generous white space
- **Refined Shadows** - Subtle, realistic shadow depths
- **Rounded Corners** - Consistent 12-16px radius

### Interaction Improvements
- **Pull-to-Refresh** - Already have, but enhance with iOS style
- **Contextual Menus** - Long-press menus for actions
- **Action Sheets** - iOS-style action sheets instead of alerts
- **Native Alerts** - iOS-style alert dialogs
- **Loading Indicators** - iOS-style activity indicators
- **Toast Notifications** - iOS-style toast messages

### Dark Mode Support
- **System Theme Detection** - Auto-detect device theme
- **Dark Color Scheme** - Dark mode color palette
- **Dynamic Colors** - Colors that adapt to theme
- **Consistent Experience** - All screens support dark mode

### Accessibility
- **VoiceOver Support** - Screen reader compatibility
- **Dynamic Type** - Respect system font size
- **High Contrast** - Support high contrast mode
- **Reduced Motion** - Respect reduced motion preference

## Feature Priority for 2.0

### Must Have (Phase 1)
1. Authentication & Login
2. Project List & Details
3. Photo Upload & Viewing
4. Basic Navigation
5. Firebase Integration

### Should Have (Phase 2)
1. Estimate Viewing
2. Estimate Approval
3. Messaging
4. Status Updates
5. Apple Design Language

### Nice to Have (Phase 3)
1. Estimate Creation Workspace
2. AI Voice Features
3. QuickBooks Integration
4. Admin Tools
5. Dark Mode

---

Total Features: 50+ major features across 8 categories
Last Updated: 2025-10-27
