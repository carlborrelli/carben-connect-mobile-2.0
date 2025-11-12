# Changelog

## 2025-01-12 - Database Normalization & Location Display

### 🎯 Major Changes

#### Database Normalization
- **Removed `qbCustomers` array from users collection**
  - Replaced with `locationIds` array (references to location documents)
  - Benefits: Single source of truth, no data duplication
  - Migration script: `/tmp/migrate_to_locationIds.js`

- **Removed `locationName` from projects collection**
  - Projects now use `locationId` reference only
  - Migration script: `/tmp/cleanup_locationName.js`

- **Deleted obsolete `clients` collection**
  - Merged into `users` collection with `role='client'`
  - Old client record (VezP5DyEI3qTwS4wrbgi) removed

- **Fixed location `clientId` references**
  - Updated all 7 locations to reference correct user IDs
  - All projects now correctly linked to Branden's current user ID

#### Location Display Strategy
- **Full names everywhere** except filter button
  - Project listings: Full name
  - Project detail: Full name
  - Drafts listing: Full name
  - Filter dropdown menus: Full name

- **Nicknames only in filter button** (space-saving)
  - Example: "Rothman Orthopaedics Specialty Hospital - Bensalem" → "ROSH" in button
  - Example: "Riverview Surgical Center - Navy Yard" → "Navy Yard" in button

#### Filter Improvements
- **Made filter dropdown scrollable**
  - Changed from `View` to `ScrollView` with `nestedScrollEnabled`
  - Removed 300px height limit issue
  - All 7 locations now accessible in admin filter

- **Client-side location filter**
  - Only shows if client has multiple locations
  - Uses `locationIds` lookup instead of `qbCustomers`

- **Admin cascading filter**
  - Select client first
  - Optionally filter by client's locations
  - Uses `locationIds` for location lookups

#### View as Client Feature
- **Added admin ability to view app as any client**
  - New `viewAsClient()` and `exitViewAsClient()` in AuthContext
  - Created `ClientSelectorModal` component
  - Created `ViewModeBanner` component with safe area handling
  - Added "View as Client" button in ProfileScreen
  - True client experience (not emulation)

### 📝 Files Modified

#### Core Files
- `contexts/AuthContext.js` - Added view-as-client functionality
- `App.js` - Added SafeAreaProvider and ViewModeBanner
- `screens/ProjectsScreen.js` - Updated to use locationIds, made filter scrollable
- `screens/ProjectDetailScreen.js` - Updated to use full location names
- `screens/DraftsScreen.js` - Updated to use locationIds
- `screens/ClientDetailScreen.js` - Updated to use locationIds, show all locations
- `screens/ProfileScreen.js` - Added view-as-client controls
- `components/ProjectCard.js` - Updated to use full location names
- `components/ViewModeBanner.js` - New component

### 🗄️ Database Changes

#### Collections Modified
- `users` - Added `locationIds`, removed `qbCustomers`
- `locations` - Fixed `clientId` references
- `projects` - Removed `locationName` field
- `clients` - Collection deleted (merged into users)

#### Data Integrity
- All 44 projects: `clientId` corrected to reference Branden's current user ID
- All 7 locations: `clientId` corrected to reference Branden's current user ID
- All 2 client users: Added `locationIds` array

### 🎨 UI/UX Improvements
- Filter button now displays location nicknames
- Filter dropdown shows full location names
- Filter dropdown is now scrollable (no more hidden options)
- Project listings show full location names
- Client detail screen shows all locations with nicknames

### 📚 Documentation
- Created `DATABASE_STRUCTURE.md` - Complete database schema documentation
- Documented normalization rules and guidelines
- Documented QuickBooks sync strategy

### 🔧 Migration Scripts Created
- `/tmp/migrate_to_locationIds.js` - Add locationIds to users
- `/tmp/cleanup_locationName.js` - Remove locationName from projects
- `/tmp/remove_qbCustomers.js` - Remove qbCustomers from users
- `/tmp/delete_clients_collection.js` - Delete obsolete clients collection
- `/tmp/check_location_clientIds.js` - Fix location clientId references
- `/tmp/audit_database_redundancy.js` - Audit tool for future use

### ⚠️ Breaking Changes
None - All changes are backward compatible. Old fields removed but code handles gracefully.

### 🐛 Bug Fixes
- Fixed filter dropdown not showing all locations (added scroll)
- Fixed location display showing nicknames instead of full names
- Fixed ViewModeBanner positioning in status bar area
- Fixed client filter showing "Unknown Client" (wrong collection query)

### 🎯 Future Recommendations

#### QuickBooks Sync
- Always sync by `qbCustomerId`, never by name
- Update location names if changed in QB, but keep ID mapping stable
- See `DATABASE_STRUCTURE.md` for detailed sync strategy

#### Data Entry
- Never store duplicate data (names, emails, etc.) - use references
- Use `locationId` and `clientId` for all lookups
- Only use `clientName` for historical imported data display

---

## Previous Changes
See git history for changes prior to 2025-01-12.
