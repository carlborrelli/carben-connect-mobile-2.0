# Data Structure Mismatch Analysis

## Problem Summary

The mobile app and website use different data structures for storing client locations and project information. This causes:
1. Clients with multiple locations (like "Branden") not displaying correctly in mobile app
2. Projects created in mobile app not appearing on website

## Key Differences

### 1. User/Client Structure

**Website (Correct Structure):**
```typescript
interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  company?: string;
  phone?: string;
  address?: string;
  qbCustomerId?: string;              // Legacy - single QB customer
  qbCustomers?: QBCustomer[];         // ARRAY of multiple QB customers (locations)
  lastActiveAt?: Date;
}

interface QBCustomer {
  id: string;          // QuickBooks Customer ID
  name: string;        // Display name (e.g., "Rothman Orthopedics - Cherry Hill")
}
```

**Mobile App (Incorrect Structure):**
The mobile app's ProjectOverviewTab.js expects:
```javascript
// Looking for this structure (WRONG):
clientDetails.locations = [
  {
    address: string,
    name: string,
    notes: string
  }
]
// OR
clientDetails.qbLocationName = string  // For single location
```

### 2. Project Structure

**Website (Correct Structure):**
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  clientId: string;
  contractorIds: string[];           // REQUIRED - array of admin user IDs
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  qbCustomerId?: string;            // QB Customer ID for project location
  qbCustomerName?: string;          // QB Customer display name
  // ... other fields
}
```

**Mobile App (Incorrect Structure):**
NewProjectScreen.js creates projects with:
```javascript
{
  title: string,
  description: string,
  status: 'NEW',
  clientId: string,
  clientName: string,              // Not in website types
  createdAt: Date,
  updatedAt: Date,
  photos: [],
  // MISSING: contractorIds        // Website requires this!
  // MISSING: qbCustomerId          // Not being set
  // MISSING: qbCustomerName        // Not being set
}
```

## Why Projects Don't Show on Website

The website's project listing likely filters or expects `contractorIds` array to exist. When mobile app creates projects without `contractorIds`, they may:
1. Not appear in admin's project list (filtered by contractorIds)
2. Fail validation checks
3. Missing in queries that filter by contractor

## Specific Example: "Branden with Multiple Locations"

**In Website Database:**
```json
{
  "id": "branden123",
  "name": "Branden",
  "email": "branden@example.com",
  "role": "client",
  "qbCustomers": [
    {
      "id": "QB_CUST_001",
      "name": "Branden - Location A"
    },
    {
      "id": "QB_CUST_002",
      "name": "Branden - Location B"
    }
  ]
}
```

**What Mobile App Looks For (WRONG):**
```javascript
clientDetails.locations  // undefined - doesn't exist!
```

**Result:**
- Mobile app doesn't see multiple locations
- ProjectOverviewTab shows single location fallback (qbLocationName) or nothing
- Location selection not available when creating projects

## Files That Need Fixing

### Mobile App Files to Update:

1. **NewProjectScreen.js**
   - Add `contractorIds` array when creating project
   - Auto-select all admins as contractors (like website does)
   - Add location selection for multi-location clients
   - Save `qbCustomerId` and `qbCustomerName` to project

2. **ProjectOverviewTab.js**
   - Change `clientDetails.locations` to `clientDetails.qbCustomers`
   - Update location display logic to use QB customer structure
   - Change property names: `location.address` → `qbCustomer.name`

3. **ClientCard.js and ClientDetailScreen.js**
   - Update to display `qbCustomers` array instead of single `qbLocationName`
   - Show all locations for multi-location clients

## Required Fixes

### Fix 1: Update NewProjectScreen.js

```javascript
// Load all admin users for contractorIds
const admins = allUsers.filter((u) => u.role === 'admin');
const contractorIds = admins.map((a) => a.id);

// Check if client has multiple locations
const selectedClient = users.find((u) => u.id === clientId);
const hasMultipleLocations = selectedClient?.qbCustomers &&
                             selectedClient.qbCustomers.length > 1;

// Show location picker if multiple locations
if (hasMultipleLocations && !selectedQbCustomerId) {
  Alert.alert('Error', 'Please select a location');
  return;
}

// Create project with correct structure
const projectData = {
  title: title.trim(),
  description: description.trim(),
  status: 'NEW',
  clientId,
  contractorIds,        // ADD THIS
  photos: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Add QB customer info if selected
if (selectedQbCustomerId) {
  projectData.qbCustomerId = selectedQbCustomerId;
  projectData.qbCustomerName = selectedQbCustomerName;
}
```

### Fix 2: Update ProjectOverviewTab.js

```javascript
// Change from:
const hasMultipleLocations = clientDetails?.locations &&
                             clientDetails.locations.length > 0;

// To:
const hasMultipleLocations = clientDetails?.qbCustomers &&
                             clientDetails.qbCustomers.length > 1;

// Change from:
clientDetails.locations.map((location, index) => {
  const isProjectLocation = location.address === projectLocation ||
                           location.name === projectLocation;

// To:
clientDetails.qbCustomers.map((qbCustomer, index) => {
  const isProjectLocation = qbCustomer.id === project.qbCustomerId ||
                           qbCustomer.name === project.qbCustomerName;
```

### Fix 3: Update ClientCard and ClientDetailScreen

Replace all references to:
- `client.qbLocationName` → `client.qbCustomers?.[0]?.name` (for single location)
- Add display for multiple locations using `client.qbCustomers.map()`

## Testing Checklist

After fixes:
- [ ] Create new project in mobile app
- [ ] Verify project appears on website immediately
- [ ] Check project has contractorIds array
- [ ] Test client with multiple locations (Branden)
- [ ] Verify location selection appears in mobile app
- [ ] Verify selected location saves to project
- [ ] Verify project overview shows all client locations
- [ ] Verify current location is highlighted correctly

## Migration Notes

Existing projects created by mobile app need migration:
1. Add empty `contractorIds: []` or populate with all admin IDs
2. If client has single `qbCustomerId`, keep it
3. If client has multiple locations, require manual location assignment
