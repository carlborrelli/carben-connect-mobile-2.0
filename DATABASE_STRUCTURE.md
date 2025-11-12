# Database Structure

## Overview
This document describes the normalized database structure for Carben Connect mobile app. The database has been optimized to eliminate redundancy and maintain single sources of truth.

## Collections

### `users`
**Purpose**: Single source of truth for all users (both clients and admins)

**Key Fields**:
- `id` - Document ID (Firebase Auth UID)
- `name` - Full name
- `email` - Email address
- `phone` - Phone number
- `company` - Company name
- `role` - `'client'` or `'admin'`
- `locationIds` - Array of location document IDs (for clients with multiple locations)
- `qbCustomerId` - QuickBooks customer ID (single location clients)
- `address` - Physical address
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Key Relationships**:
- `locationIds` → references `locations` collection
- Referenced by `projects.clientId`
- Referenced by `locations.clientId`

**Notes**:
- ✅ Removed: `qbCustomers` array (redundant - now use `locationIds`)
- ✅ Removed: Old `clients` collection (migrated all to `users` with role='client')

---

### `locations`
**Purpose**: Single source of truth for all client locations

**Key Fields**:
- `id` - Document ID
- `name` - Full location name (e.g., "Rothman Orthopaedics Specialty Hospital - Bensalem")
- `nickname` - Short display name (e.g., "ROSH") - used ONLY in filter UI for space-saving
- `clientId` - References `users` collection
- `qbCustomerId` - QuickBooks customer ID (used for syncing)
- `address` - Physical address
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Key Relationships**:
- `clientId` → references `users` collection
- Referenced by `users.locationIds[]`
- Referenced by `projects.locationId`

**Notes**:
- ✅ `qbCustomerId` is the primary sync key with QuickBooks (NOT name)
- ✅ Display full `name` everywhere EXCEPT filter button (use `nickname`)

---

### `projects`
**Purpose**: Stores project/invoice data

**Key Fields**:
- `id` - Document ID
- `title` - AI-generated project title
- `description` - Project description
- `clientId` - References `users` collection
- `locationId` - References `locations` collection
- `status` - Project status (NEW, ESTIMATE_SENT, APPROVED, IN_PROGRESS, COMPLETE, PAID)
- `totalAmount` - Project total price
- `quickbooksInvoiceNumber` - QB invoice number (if synced from QB)
- `freshbooksInvoiceNumber` - FreshBooks invoice number (if synced from FB)
- `invoicePdfLink` - Link to invoice PDF
- `estimatePdfLink` - Link to estimate PDF
- `txnDate` - Transaction date (from QB/FB)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Key Relationships**:
- `clientId` → references `users` collection
- `locationId` → references `locations` collection
- Referenced by `estimateProgress` collection

**Notes**:
- ✅ Removed: `locationName` (redundant - use `locationId` lookup)
- ✅ Removed: `qbCustomerName` (redundant - use `locationId` lookup)
- ⚠️ `clientName` still exists on imported projects (historical data) - OK to keep for display

---

### `estimateProgress`
**Purpose**: Tracks estimate workflow progress

**Key Fields**:
- `id` - Document ID (matches project ID)
- `descriptionGenerated` - Boolean
- `descriptionFinalized` - Boolean
- `calculatorStarted` - Boolean
- `calculatorComplete` - Boolean
- `sentToQuickBooks` - Boolean

**Key Relationships**:
- Document ID matches `projects.id`

---

## Data Normalization Rules

### ✅ Single Source of Truth
- **User data** → `users` collection only
- **Location data** → `locations` collection only
- **Project data** → `projects` collection only

### ✅ Use References, Not Duplication
- Store IDs (e.g., `clientId`, `locationId`), NOT full data
- Perform lookups when displaying data
- Example: Store `locationId`, display `locations[locationId].name`

### ✅ QuickBooks Sync Strategy
- **Always sync by `qbCustomerId`**, never by name
- Names can change, IDs are permanent
- When syncing from QB:
  1. Find location by `qbCustomerId`
  2. Update `name` if changed in QB
  3. Never create duplicates based on name changes

---

## Display Guidelines

### Location Names
- **Full name** (`location.name`): Use in project listings, project details, drafts, dropdown menus
- **Nickname** (`location.nickname`): Use ONLY in filter button for space-saving
- Example: "Rothman Orthopaedics Specialty Hospital - Bensalem" → show "ROSH" in filter button

### Client Filter (Admin View)
1. Select client
2. Optionally select location (from client's `locationIds`)
3. Filter shows full names, button displays nickname

### Location Filter (Client View)
- Only show if client has multiple locations (`locationIds.length > 1`)
- Show client's locations from `locationIds` lookup
- Dropdown shows full names, button displays nickname

---

## Migration History

### 2025-01 Database Normalization
1. ✅ Removed `locationName` from projects → use `locationId` reference
2. ✅ Removed `qbCustomers` from users → use `locationIds` array
3. ✅ Deleted obsolete `clients` collection → merged into `users` with role='client'
4. ✅ Fixed location `clientId` references to point to current user IDs
5. ✅ Added `locationIds` array to user records

**Benefits**:
- No data duplication
- Single source of truth for all data
- Updates in one place reflect everywhere
- Impossible for data to get out of sync
- Cleaner, more maintainable database

---

## Future Considerations

### When Adding New Fields
- Ask: "Is this data duplicating something that exists elsewhere?"
- Prefer references over duplication
- Document any intentional duplication (e.g., `clientName` on imported projects)

### When Syncing with External Systems
- Always sync by ID, never by name
- Names are for humans, IDs are for computers
- Update names if they change, but keep the ID mapping stable
