# QuickBooks Integration - Mobile App Requirements

## Context & Workflow Understanding

### The Problem with Current Implementation
The current QuickBooks screen in the mobile app is based on incorrect assumptions:
- ❌ Auto-sync toggle (not needed)
- ❌ Bulk sync options for Invoices/Estimates/Customers (wrong approach)
- ❌ Generic "Sync Now" button (too vague)

### The Actual Workflow

**User's Requirement:** Push-on-demand, not automatic syncing. The app should push to QuickBooks when explicitly told to, following a specific workflow.

---

## Draft → Estimate → Publish Workflow

### 1. **Draft Section**
- Start with project description
- AI helps turn description into estimate
- Continue working on estimate details

### 2. **Calculator Section**
- Work out pricing for the estimate
- Calculate costs, materials, labor, etc.
- Finalize numbers

### 3. **Publish Page** (Where QB Integration Happens)
- **This is where the "Push to QuickBooks" button lives**
- Once estimate is ready and priced, push it to QB from here
- One-way push: Mobile App → QuickBooks

### 4. **QuickBooks Side** (Outside Mobile App)
- Admin finishes estimate in QuickBooks web interface
- Send estimate via email from QuickBooks
- QuickBooks marks estimate as sent

### 5. **Pull Back to App** (Automatic)
- App periodically checks QB API for status updates
- Pulls completed/sent estimates back
- Links QB estimate to project automatically via API
- Updates project status in mobile app

---

## Connection Management Requirements

### Primary Requirement: **Persistent Connection**
- QuickBooks connection should remain active/available whenever app or website is in use
- Connection should be permanent if possible
- If not permanent, auto-reconnect when admin accesses the app

### OAuth Token Management
- QuickBooks OAuth tokens last ~100 days with refresh capability
- Implement automatic token refresh in background
- Store refresh token securely in Firestore
- Auto-reconnect when admin opens app (if token expired)

### Connection Monitoring
- Need a QB page/screen to monitor connection health
- Manual reconnect button in case connection breaks
- Show connection status at all times
- Log last successful API call timestamp

---

## Implementation Requirements

### 1. QuickBooks Settings Screen (Revised Purpose)
**Transform from "Settings & Sync Options" to "Connection Status Dashboard"**

**Should Include:**
- Connection Status (Connected ✓ / Disconnected ✗)
- Last successful API call timestamp
- Company ID and basic info
- Manual "Reconnect" button if connection broken
- Recent activity log (last 10 push/pull operations)
- OAuth token expiry date
- Auto-reconnect toggle (reconnect when admin opens app)

**Should NOT Include:**
- Auto-sync toggle (removed)
- Sync Invoices/Estimates/Customers toggles (removed)
- Generic "Sync Now" button (removed)

### 2. Estimate Publishing Feature (New - Core Feature)

**Location:** Part of the Draft/Estimate workflow, final step before QB push

**Button Placement:** "Publish to QuickBooks" button on Publish page

**Push Logic:**
```
When user clicks "Push to QuickBooks":
1. Validate estimate is complete (description, pricing, etc.)
2. Check QB connection status (is token valid?)
3. If not connected, prompt to reconnect
4. Transform estimate data to QB format
5. POST to QB API: Create new estimate
6. Store QB estimate ID in project document
7. Mark as "pushed" with timestamp
8. Show success confirmation
9. Prevent duplicate pushes (already pushed = show "View in QB" instead)
```

**Estimate Structure to Push:**
- Customer/Client info (linked to QB customer)
- Line items from calculator section
- Pricing, taxes, totals
- Project description
- Due date if applicable

### 3. Background Pull/Sync (Automatic)

**When to Check QB API:**
- Every 15-30 minutes when app is active (admin logged in)
- When admin opens a project that was pushed to QB
- Manual "Check Status" button on project detail

**What to Pull:**
- Estimate status (Draft, Pending, Accepted, Declined, etc.)
- Sent date (when estimate was emailed from QB)
- Client response (if they accepted/declined)
- Any updates made in QB

**Update Project:**
- Sync status back to project document
- Update project status based on estimate status
- Notify admin of changes (optional push notification later)

---

## Mobile App Implementation Plan

### Phase 1: Update QuickBooks Screen
- Remove auto-sync and bulk sync toggles
- Transform to Connection Status Dashboard
- Add activity log section
- Implement auto-reconnect on app launch
- Keep OAuth configuration section

### Phase 2: Build Draft/Estimate Workflow (NEW FEATURE)
**Note:** Need to examine web implementation first

Based on web draft section, implement:
1. **Draft Screen** - Create/edit estimate draft
2. **AI Assistant** - Turn description into estimate
3. **Calculator Screen** - Price out estimate
4. **Publish Screen** - Final review + "Push to QB" button

### Phase 3: Implement Push Logic
- QB API integration for creating estimates
- Transform app estimate data to QB format
- Link customers to QB customer IDs
- Prevent duplicate pushes
- Success/error handling

### Phase 4: Implement Pull Logic
- Background service to check QB API
- Pull estimate status updates
- Update project documents
- Activity logging

---

## Technical Considerations

### OAuth Flow
- QuickBooks uses OAuth 2.0
- Authorization URL redirects to callback
- Exchange code for access + refresh tokens
- Refresh token lasts 100 days, can be renewed
- Store in secure Firestore collection

### API Endpoints Needed
```
POST /v3/company/{companyId}/estimate - Create estimate
GET /v3/company/{companyId}/estimate/{estimateId} - Get estimate details
GET /v3/company/{companyId}/customer - List customers
POST /v3/company/{companyId}/customer - Create customer if not exists
```

### Data Mapping
**App → QuickBooks:**
- Project.clientId → Customer.Id (lookup or create)
- Estimate line items → Line[]
- Project description → Estimate.PrivateNote
- Calculator totals → TotalAmt

**QuickBooks → App:**
- Estimate.Id → Project.quickbooksEstimateId
- Estimate.EmailStatus → Project.estimateStatus
- Estimate.TxnDate → Project.estimateSentDate

---

## Questions to Resolve

1. **Web Implementation Reference:**
   - Where is the web app code located?
   - How to access the draft section implementation?
   - What's the current QB OAuth setup?
   - How are estimates structured in the web app?

2. **Estimate Data Structure:**
   - Are estimates stored separately from projects?
   - Do we need an "estimates" collection in Firestore?
   - Or are they embedded in project documents?

3. **Calculator Section:**
   - What fields are in the calculator?
   - Line items, quantities, unit prices?
   - Tax calculations?
   - Markup percentages?

4. **AI Integration:**
   - What AI service is used to turn descriptions into estimates?
   - Is this already implemented in web app?
   - Should mobile app use same AI endpoint?

---

## Next Steps

1. **Examine Web Implementation:**
   - Access web app codebase
   - Study draft section structure
   - Review QB integration code
   - Document estimate data model

2. **Design Mobile Estimate Workflow:**
   - Based on web implementation
   - Adapt for mobile UI/UX
   - Plan screen flow

3. **Update QB Settings Screen:**
   - Remove incorrect features
   - Add connection dashboard
   - Implement auto-reconnect

4. **Build Estimate Workflow:**
   - Draft screen
   - Calculator screen
   - Publish screen with QB push

5. **Test Integration:**
   - Test QB API calls
   - Verify data mapping
   - Test push and pull flow

---

## Key Takeaways

✅ **Push-on-demand, not auto-sync** - User controls when estimates go to QB
✅ **Workflow-based** - Draft → Calculate → Publish → Push to QB
✅ **Persistent connection** - OAuth tokens auto-refresh, reconnect on app launch
✅ **Status monitoring** - QB screen shows connection health, not sync settings
✅ **One button to push** - "Push to QuickBooks" on Publish page, not scattered everywhere
✅ **Automatic pull** - App checks QB API periodically for updates
✅ **No duplicates** - Track which estimates already pushed, prevent re-pushing

---

## References

- QuickBooks API Documentation: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/estimate
- Web App Implementation: [TO BE ADDED - need access to web codebase]
- OAuth 2.0 Flow: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
