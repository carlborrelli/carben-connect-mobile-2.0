# Location Display Implementation Summary

## Problem
Projects in the mobile app were not showing the client name AND location properly. For clients with multiple locations (like Rothman Orthopedics with "Jefferson Surgery Center - Cherry Hill", "Paoli Surgery Center", etc.), the specific location wasn't being displayed on:
1. Project listing pages
2. Drafts & Estimates page
3. When clicking on a project

## Solution
Updated all project displays to match the website's logic:
- **For admins with multi-location clients:** Show location name (e.g., "Jefferson Surgery Center - Cherry Hill")
- **For admins with single-location clients:** Show client company or name (e.g., "Rothman Orthopedics")
- **For clients with multiple locations:** Show location name
- **For clients with single location:** Show nothing (they know their own company)

## Files Updated

### 1. ProjectCard.js ✅
**Location:** `~/carben-connect-mobile-2.0/components/ProjectCard.js`

**Changes:**
- Added `client` and `isAdmin` props
- Added `getLocationLabel()` function that implements website logic
- Added location label display above project title
- Location appears with business icon and light text

**Display Logic:**
```javascript
const getLocationLabel = () => {
  if (!client) return null;

  const hasMultipleLocations = client.qbCustomers && client.qbCustomers.length > 1;

  if (isAdmin) {
    if (hasMultipleLocations) {
      // Show specific location
      return project.qbCustomerName;
    } else {
      // Show company/client name
      return client.company || client.name;
    }
  } else {
    // Client only sees location if they have multiple
    if (hasMultipleLocations) {
      return project.qbCustomerName;
    }
    return null;
  }
};
```

### 2. DraftsScreen.js ✅
**Location:** `~/carben-connect-mobile-2.0/screens/DraftsScreen.js`

**Changes:**
- Added `clients` state (map of clientId -> client data)
- Added client fetching in useEffect
- Added `getLocationLabel(project)` helper function
- Updated renderProject to display location label instead of just client name

**Example Display:**
```
Project Title: "ROSH Backside Dryvit Joint Renewal"
Location: "Jefferson Surgery Center - Cherry Hill"
```

### 3. ProjectsScreen.js ✅
**Location:** `~/carben-connect-mobile-2.0/screens/ProjectsScreen.js`

**Changes:**
- Added `clients` state
- Added getDocs to imports
- Added useEffect to fetch all clients
- Updated FlatList renderItem to pass `client` and `isAdmin` to ProjectCard

**Code:**
```javascript
renderItem={({ item }) => (
  <ProjectCard
    project={item}
    onPress={handleProjectPress}
    client={clients[item.clientId]}
    isAdmin={isAdmin()}
  />
)}
```

### 4. ClientDetailScreen.js ✅
**Location:** `~/carben-connect-mobile-2.0/screens/ClientDetailScreen.js`

**Changes:**
- Updated ProjectCard rendering to pass `client` and `isAdmin`
- Uses client from route params (already available)

**Code:**
```javascript
<ProjectCard
  key={project.id}
  project={project}
  onPress={handleProjectPress}
  client={client}
  isAdmin={false}
/>
```

## Data Structure

### Client with Multiple Locations (Rothman Orthopedics)
```javascript
{
  id: "4mLiLnIRuDzKQHdK4QOR",
  name: "Branden Sternbach",
  company: "Rothman Orthopedics",
  role: "client",
  qbCustomers: [
    {
      id: "QB_CUST_001",
      name: "Jefferson Surgery Center - Cherry Hill"
    },
    {
      id: "QB_CUST_002",
      name: "Paoli Surgery Center"
    }
    // ... more locations
  ]
}
```

### Project with Location
```javascript
{
  id: "proj123",
  title: "ROSH Backside Dryvit Joint Renewal",
  description: "...",
  status: "NEW",
  clientId: "4mLiLnIRuDzKQHdK4QOR",
  qbCustomerId: "QB_CUST_001",               // Selected location ID
  qbCustomerName: "Jefferson Surgery Center - Cherry Hill",
  contractorIds: ["admin1", "admin2"],
  createdAt: Date,
  updatedAt: Date
}
```

## Display Examples

### Drafts & Estimates Page
```
┌─────────────────────────────────────┐
│ ROSH Backside Dryvit Joint Renewal  │
│ Jefferson Surgery Center - CH       │  ← Location shown
│ ████████████░░░░░░░░ 60%           │
└─────────────────────────────────────┘
```

### Projects List (Admin View)
```
┌─────────────────────────────────────┐
│ 🏢 Jefferson Surgery Center - CH    │  ← Location label
│ Kitchen Renovation                   │
│ [New] Oct 29, 2025                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏢 Small Local Company              │  ← Company name (single location)
│ Bathroom Remodel                     │
│ [In Progress] Oct 28, 2025          │
└─────────────────────────────────────┘
```

### Projects List (Client View - Rothman)
```
┌─────────────────────────────────────┐
│ 🏢 Jefferson Surgery Center - CH    │  ← Their location
│ ROSH Backside Dryvit Joint Renewal  │
│ [New] Oct 29, 2025                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏢 Paoli Surgery Center             │  ← Different location
│ Parking Lot Resurfacing              │
│ [Approved] Oct 20, 2025             │
└─────────────────────────────────────┘
```

## Testing Checklist

### Test 1: Drafts & Estimates Page
1. ✅ Open Drafts & Estimates
2. ✅ Find "ROSH Backside Dryvit Joint Renewal"
3. ✅ **VERIFY:** Shows "Jefferson Surgery Center - Cherry Hill" (or similar location)
4. ✅ **VERIFY:** Not just "Rothman Orthopedics"

### Test 2: Projects Screen (Admin)
1. ✅ Go to Projects tab
2. ✅ Look at Rothman Orthopedics projects
3. ✅ **VERIFY:** Each shows its specific location
4. ✅ Look at single-location client projects
5. ✅ **VERIFY:** Shows company/client name

### Test 3: Client Detail Screen
1. ✅ Go to Clients → Branden Sternbach (Rothman)
2. ✅ Scroll to projects list
3. ✅ **VERIFY:** Each project shows its location
4. ✅ **VERIFY:** Different projects show different locations

### Test 4: New Project Creation
1. ✅ Create new project
2. ✅ Select Rothman Orthopedics
3. ✅ **VERIFY:** Location picker appears
4. ✅ Select "Jefferson Surgery Center - Cherry Hill"
5. ✅ Create project
6. ✅ **VERIFY:** Project displays with location on all screens

## Benefits

1. **Clear Location Identification:** Admins can immediately see which location a project is for
2. **Matches Website:** Mobile app now displays projects exactly like the website
3. **Multi-Location Support:** Properly handles clients with many locations
4. **Backward Compatible:** Still works with old single-location clients

## Technical Notes

- Client data is fetched once and stored in state (efficient)
- Uses same logic as website's `getProjectLocationLabel()` function
- Falls back gracefully if client data not yet loaded
- All changes follow Apple design guidelines with proper typography and spacing

## Related Files

Previous fixes that enable this:
- NewProjectScreen.js - Adds qbCustomerId and qbCustomerName when creating projects
- ProjectOverviewTab.js - Shows all client locations with current highlighted
- ClientCard.js - Shows location count for multi-location clients
