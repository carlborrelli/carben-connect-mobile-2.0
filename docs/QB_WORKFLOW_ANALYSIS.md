# QuickBooks Workflow Analysis - From Old Mobile App

Based on examination of `carben-connect-mobile` backup files.

---

## Architecture Overview

### Firestore Collections Structure

```
projects/{projectId}
├── title, clientId, description
├── qbCustomerId          // Assigned QB customer ID
└── qbCustomerName        // Assigned QB customer name

estimateDescriptions/{projectId}
├── description           // Raw description text
├── aiGeneratedText       // AI-generated estimate text
├── finalizedText         // Final edited version
└── isFinalized           // Boolean flag

estimateCalculators/{projectId}
├── lineItems[]           // Array of line items
│   ├── description
│   ├── quantity
│   ├── rate
│   └── amount
├── subtotal
├── taxRate
├── taxAmount
└── grandTotal

estimates/{projectId}              // Created AFTER sending to QB
├── estimateNumber        // QB estimate number
├── estimateId            // QB estimate ID
├── pdfUrl                // QB-generated PDF link
├── projectId
├── sentAt                // Timestamp
└── grandTotal

estimateProgress/{projectId}
├── descriptionComplete   // Boolean flags for progress
├── calculatorComplete
├── sentToQuickBooks
└── lastEditedAt
```

---

## Workflow Steps (From Old App)

### Step 1: Draft Section - Create Description
**Screen:** `DraftsScreen.js` → `EstimateWorkspaceScreen.js` (Description Tab)

**Process:**
1. Start with project description
2. AI generates estimate text (via API call)
3. User can edit AI-generated text
4. Mark as "finalized" when ready
5. Saves to `estimateDescriptions/{projectId}`

**Data Saved:**
```javascript
{
  description: "original project description",
  aiGeneratedText: "AI-generated estimate details",
  finalizedText: "edited final version",
  isFinalized: true
}
```

### Step 2: Calculator Section - Price It Out
**Screen:** `EstimateWorkspaceScreen.js` (Calculator Tab)
**Component:** `PricingCalculatorTab.js`

**Process:**
1. Add line items (description, quantity, rate)
2. Calculate amounts per line item
3. Calculate subtotal
4. Add tax rate and calculate tax
5. Calculate grand total
6. Saves to `estimateCalculators/{projectId}`

**Data Saved:**
```javascript
{
  lineItems: [
    {
      id: "unique-id",
      description: "Materials",
      quantity: 10,
      rate: 50.00,
      amount: 500.00
    },
    // ... more line items
  ],
  subtotal: 5000.00,
  taxRate: 8.5,
  taxAmount: 425.00,
  grandTotal: 5425.00,
  updatedAt: timestamp
}
```

### Step 3: Publish Section - Send to QuickBooks
**Screen:** `EstimateWorkspaceScreen.js` (Publish Tab)
**Component:** `SendToQuickBooksTab.js`

**Pre-Flight Checklist:**
```javascript
const checklist = [
  {
    id: 'description',
    label: 'Estimate description finalized',
    passed: description?.isFinalized && description?.finalizedText?.length > 0
  },
  {
    id: 'calculator',
    label: 'Pricing calculator complete',
    passed: calculator?.grandTotal > 0
  },
  {
    id: 'project',
    label: 'Project has valid client',
    passed: !!project?.clientId
  },
  {
    id: 'qbCustomer',
    label: 'QuickBooks customer assigned',
    passed: !!project?.qbCustomerId
  }
];
```

**QB Customer Assignment:**
- Fetches list from `/api/quickbooks/customers`
- User selects customer from list
- OR manual entry if API unavailable
- Saves `qbCustomerId` and `qbCustomerName` to project document

**Send to QuickBooks:**
```javascript
// API Call
POST /api/quickbooks/create-estimate
Body: {
  projectId,
  description: description.finalizedText,
  grandTotal: calculator.grandTotal,
  qbCustomerId: project.qbCustomerId,
  qbCustomerName: project.qbCustomerName,
  calculator: {
    lineItems: [...],
    subtotal: x,
    taxRate: y,
    taxAmount: z,
    grandTotal: total
  }
}

// Response
{
  estimateNumber: "1234",
  estimateId: "qb-estimate-id",
  pdfUrl: "https://..."
}

// Save to Firestore
estimates/{projectId} = {
  estimateNumber,
  estimateId,
  pdfUrl,
  projectId,
  sentAt: serverTimestamp(),
  grandTotal: calculator.grandTotal
}

// Update Progress
estimateProgress/{projectId} = {
  sentToQuickBooks: true,
  lastEditedAt: serverTimestamp()
}
```

**Update Existing Estimate:**
- If estimate already sent, show "Update" button instead
- Same API structure but different endpoint: `/api/quickbooks/update-estimate`
- Updates QB estimate and refreshes PDF

---

## API Endpoints Required

### 1. `/api/quickbooks/customers`
**Method:** GET
**Purpose:** Fetch list of QB customers for assignment
**Response:**
```json
{
  "customers": [
    {
      "Id": "123",
      "DisplayName": "John Doe Construction",
      "FullyQualifiedName": "John Doe Construction",
      "CompanyName": "JDC LLC"
    }
  ]
}
```

### 2. `/api/quickbooks/create-estimate`
**Method:** POST
**Purpose:** Create new estimate in QuickBooks
**Request Body:**
```json
{
  "projectId": "proj-123",
  "description": "Full estimate description...",
  "grandTotal": 5425.00,
  "qbCustomerId": "123",
  "qbCustomerName": "John Doe Construction",
  "calculator": {
    "lineItems": [...],
    "subtotal": 5000.00,
    "taxRate": 8.5,
    "taxAmount": 425.00,
    "grandTotal": 5425.00
  }
}
```
**Response:**
```json
{
  "estimateNumber": "1234",
  "estimateId": "qb-estimate-id-abc123",
  "pdfUrl": "https://quickbooks.com/..."
}
```

### 3. `/api/quickbooks/update-estimate`
**Method:** POST
**Purpose:** Update existing QB estimate
**Request Body:** Same as create, plus:
```json
{
  "estimateId": "qb-estimate-id-abc123",
  ...other fields same as create
}
```
**Response:**
```json
{
  "pdfUrl": "https://quickbooks.com/..."
}
```

---

## UI Components Breakdown

### Tab Structure (EstimateWorkspaceScreen)

**Tab 1: Project Info**
- Project details
- Client info
- Basic metadata

**Tab 2: Description**
- Raw description input
- AI generate button
- Edit AI-generated text
- Finalize button

**Tab 3: Calculator**
- Line items list
- Add/edit/delete line items
- Subtotal calculation
- Tax rate input
- Grand total display

**Tab 4: Publish (Send to QB)**
- Estimate summary
- Pre-flight checklist
- QB customer assignment
- Send/Update button
- View PDF button (if sent)

---

## Key Features to Implement

### ✅ Already Understood:
1. Firestore collections structure
2. Tab-based workflow
3. Pre-flight checklist validation
4. QB customer assignment
5. Send/Update logic
6. PDF viewing

### 🔨 Need to Build:
1. **Adapt for new mobile app structure:**
   - Use new navigation patterns
   - Match Apple design system (COLORS, TYPOGRAPHY, etc.)
   - Use new screen/component structure

2. **Description Tab with AI:**
   - Text input for description
   - Button to generate AI estimate
   - Edit generated text
   - Mark as finalized

3. **Calculator Tab:**
   - Line items CRUD
   - Real-time calculations
   - Tax calculations
   - Grand total

4. **Publish Tab:**
   - Pre-flight checklist UI
   - QB customer selection/assignment
   - Send/Update buttons
   - Success/error handling

5. **API Integration:**
   - Need backend API endpoints
   - Or implement QB SDK directly in app (not recommended)
   - Store API base URL in config

---

## Next Steps

1. **Review API Implementation:**
   - Check if backend API exists
   - Review `/api/quickbooks/*` endpoints
   - Confirm OAuth token management

2. **Design New Mobile Screens:**
   - DraftsScreen (list of projects needing estimates)
   - EstimateWorkspaceScreen (tab-based workflow)
   - Match new app's Apple design system

3. **Implement Firestore Collections:**
   - estimateDescriptions
   - estimateCalculators
   - estimates
   - estimateProgress

4. **Build Components:**
   - Description editor with AI
   - Calculator with line items
   - QB publish section

5. **Test QB Integration:**
   - Test customer fetching
   - Test estimate creation
   - Test PDF generation
   - Test update flow

---

## Questions for User

1. **Backend API:**
   - Does the backend API (`/api/quickbooks/*`) already exist?
   - Is it deployed and accessible?
   - What's the API_BASE_URL?

2. **AI Integration:**
   - What AI service generates estimate descriptions?
   - Is there an API endpoint for this?
   - Or should we implement it fresh?

3. **OAuth Management:**
   - How is QB OAuth handled currently?
   - Is token refresh automatic?
   - Where are tokens stored?

4. **Priority:**
   - Should we build this estimate workflow now?
   - Or focus on other features first?

---

## Summary

The old mobile app had a complete Draft → Calculate → Publish workflow that:
- ✅ Used tab-based interface
- ✅ Stored data in separate Firestore collections
- ✅ Had pre-flight validation
- ✅ Assigned QB customers
- ✅ Created/updated QB estimates via API
- ✅ Generated PDFs in QuickBooks

We can adapt this for the new mobile app by:
1. Modernizing the UI to match Apple design system
2. Using new navigation structure
3. Keeping the same Firestore collections
4. Using same API endpoints
5. Improving UX based on lessons learned
