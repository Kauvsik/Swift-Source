# Swift Source - Vendor Bidding Management System

[![Salesforce](https://img.shields.io/badge/Salesforce-00A1E0?style=for-the-badge&logo=Salesforce&logoColor=white)](https://www.salesforce.com/)
[![Lightning Web Components](https://img.shields.io/badge/LWC-0070D2?style=for-the-badge&logo=salesforce&logoColor=white)](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
[![Apex](https://img.shields.io/badge/Apex-00A1E0?style=for-the-badge&logo=salesforce&logoColor=white)](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)

A comprehensive vendor bidding and project management system built on Salesforce platform. Allows clients to post projects, vendors to submit competitive bids, and provides intelligent bid recommendations for optimal vendor selection.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Components](#components)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

### Client Features
- **Project Management**: Create and manage project listings with deadlines
- **Smart Bid Recommendations**: Get 3 bid options automatically:
  - **Lowest Price** - Best for budget-conscious projects
  - **Fastest Delivery** - Best for time-sensitive projects
  - **Best Overall** - Balanced recommendation (60% price, 40% speed)
- **Visual Bid Comparison**: Interactive modal to compare vendor proposals
- **Vendor Assignment**: Seamless vendor assignment and project tracking

### Vendor Features
- **Browse Projects**: View all verified project opportunities
- **Bid Submission**: Submit competitive proposals with price and timeline
- **Real-time Deadline Tracking**: Live countdown timer for bid deadlines
- **Bid Management**: Edit or withdraw bids before deadline
- **Assignment Tracking**: Track assigned projects and deliverables

### System Features
- **Automated Bid Selection**: Auto-calculate best bids when deadline passes
- **Intelligent Scoring**: Weighted algorithm for balanced recommendations
- **Timezone Handling**: Automatic UTC to local timezone conversion
- **Status Management**: Complete project lifecycle tracking
- **Experience Cloud Ready**: Works in both internal and community portals

## Architecture

### Custom Objects

```
┌──────────────────────────────────────────────────────────────┐
│                     Swift Source Data Model                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Account (Client)                                            │
│      │                                                       │
│      └── Project__c                                          │
│          ├── Name                                            │
│          ├── Budget__c                                       │
│          ├── Bid_Deadline__c                                 │
│          ├── Best_Price_Bid__c (Lookup → Bid)                │
│          ├── Fastest_Delivery_Bid__c (Lookup → Bid)          │
│          ├── Best_Overall_Bid__c (Lookup → Bid)              │
│          │                                                   │
│          └── Bid__c (Multiple bids per project)              │
│              ├── Vendor__c (Lookup → Vendor)                 │
│              ├── Quote_Price__c                              │
│              ├── Estimated_Day__c                            │
│              ├── Score__c                                    │
│              ├── Status__c                                   │
│              └── Is_Winner__c                                │
│                                                              │
│  Vendor__c                                                   │
│      ├── Name / Email__c                                     │
│      ├── Verification_Status__c                              │
│      └── Project_Assignment__c                               │
│          ├── Project__c (Master-Detail)                      │
│          ├── Vendor__c (Lookup)                              │
│          ├── Winning_Bid__c (Lookup → Bid)                   │
│          └── Status__c                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Platform**: Salesforce Experience Cloud
- **Language**: Apex (Backend), JavaScript (Frontend)
- **Framework**: Lightning Web Components (LWC)
- **UI**: Salesforce Lightning Design System (SLDS)
- **Automation**: Schedulable Apex for auto-bid selection

## Installation

### Prerequisites

- Salesforce org with Experience Cloud enabled
- Admin access to create custom objects and Apex classes
- SFDX CLI (optional, for deployment)

### Quick Start

#### Option 1: SFDX Deployment (Recommended)

```bash
# Clone repository
git clone https://github.com/Kauvsik/Swift-Source
cd Swift-Source

# Authenticate to your org
sfdx auth:web:login -a myorg

# Create custom objects (if not using metadata)
# See docs/OBJECTS.md for field definitions

# Deploy to org
sfdx force:source:deploy -p force-app -u myorg

# Assign permission sets
sfdx force:user:permset:assign -n Swift_Source_Admin -u admin@yourorg.com
```

#### Option 2: Manual Deployment

1. **Create Custom Objects** (See [Object Schema](#object-schema))
2. **Deploy Apex Classes**
   - Copy contents of `force-app/main/default/classes/`
   - Paste into Setup → Apex Classes → New
3. **Deploy LWC Components**
   - Use Change Sets or SFDX
4. **Configure Permissions** (See [Configuration](#configuration))

### Object Schema

<details>
<summary>Click to expand object definitions</summary>

#### Project__c
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | Text(80) | ✓ | Project title |
| Budget__c | Currency(16,2) | ✓ | Project budget |
| Category__c | Picklist | ✓ | Project category |
| Due_Date__c | Date | ✓ | Project completion date |
| Bid_Deadline__c | DateTime | - | Deadline for bid submissions |
| Status__c | Picklist | ✓ | Draft/Bidding/Pending/Assigned |
| Best_Price_Bid__c | Lookup(Bid) | - | Lowest price bid |
| Fastest_Delivery_Bid__c | Lookup(Bid) | - | Fastest delivery bid |
| Best_Overall_Bid__c | Lookup(Bid) | - | Best balanced bid |

#### Vendor__c
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | Auto Number | ✓ | Vendor ID |
| Email__c | Email | ✓ | Vendor email |
| Verification_Status__c | Picklist | ✓ | Pending/Verified/Rejected |

#### Bid__c
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Project__c | Master-Detail(Project) | ✓ | Related project |
| Vendor__c | Lookup(Vendor) | ✓ | Bidding vendor |
| Quote_Price__c | Currency(16,2) | ✓ | Bid price |
| Estimated_Day__c | Number(3,0) | ✓ | Delivery timeline |
| Proposal_Message__c | Long Text Area | - | Vendor proposal |
| Status__c | Picklist | ✓ | Submitted/Accepted/Rejected |
| Score__c | Number(16,2) | - | Calculated score |
| Is_Winner__c | Checkbox | - | Winner flag |

#### Project_Assignment__c
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Project__c | Master-Detail(Project) | ✓ | Assigned project |
| Vendor__c | Lookup(Vendor) | ✓ | Assigned vendor |
| Winning_Bid__c | Lookup(Bid) | ✓ | Winning bid |
| Status__c | Picklist | ✓ | Assigned/In Progress/Completed |
| Start_Date__c | Date | - | Project start |
| Expected_End_Date__c | Date | - | Expected completion |

</details>

## Configuration

### 1. Schedule Automated Bid Selection

```apex
// Execute in Developer Console > Execute Anonymous Apex
BidAutoScheduler scheduler = new BidAutoScheduler();
String cronExp = '0 0 * * * ?'; // Run every hour
System.schedule('Swift-Source Auto Bid Selector', cronExp, scheduler);
```

### 2. Configure Profiles & Permissions

**Client Profile Permissions:**
```
Objects:
  - Project__c: Read, Create, Edit
  - Bid__c: Read
  - Project_Assignment__c: Read

Apex Classes:
  - clientProject
  - bidSelection
```

**Vendor Profile Permissions:**
```
Objects:
  - Project__c: Read
  - Bid__c: Read, Create, Edit
  - Project_Assignment__c: Read
  
Apex Classes:
  - vendorProject
  - vendorBidController
  - vendorAssignedController
```

### 3. Experience Cloud Configuration

**Create Two Sites:**
1. **Client Portal** - For project posting and vendor selection
2. **Vendor Portal** - For browsing projects and submitting bids

**Add Components:**
- Client Portal: `c-client-project`
- Vendor Portal: `c-vendor-project`, `c-vendor-assigned-project`

## Usage

### For Clients

#### 1. Create a Project
```
Projects → New Project
├── Fill Details (Name, Budget, Category, Due Date)
├── Set Bid Deadline (optional)
└── Submit
```

#### 2. Review and Select Vendor
```
When deadline passes:
├── System auto-generates 3 recommendations
├── Click "View Bids" on project
├── Review options:
│   ├── Lowest Price
│   ├── Fastest Delivery
│   └── Best Overall
└── Click "Select This Bid"
```

### For Vendors

#### 1. Browse Projects
```
Browse Projects → Filter verified projects
└── View details (Budget, Deadline, Requirements)
```

#### 2. Submit Bid
```
Click "Submit Bid"
├── Enter Quote Price
├── Enter Estimated Days
├── Write Proposal Message
└── Submit (before deadline)
```

#### 3. Manage Bids
```
Before deadline:
├── Edit: Update price/timeline
└── Withdraw: Cancel bid

After deadline:
└── View only (cannot edit)
```

## Components

### Apex Classes

| Class | Lines | Purpose |
|-------|-------|---------|
| `bidSelection.cls` | ~200 | Core bid ranking algorithm and approval logic |
| `clientProject.cls` | ~50 | Client project queries and vendor lookups |
| `vendorProject.cls` | ~30 | Vendor project browsing |
| `vendorBidController.cls` | ~150 | CRUD operations for bids |
| `vendorAssignedController.cls` | ~40 | Assigned project queries |
| `BidAutoScheduler.cls` | ~20 | Scheduled job for deadline processing |

### Lightning Web Components

| Component | Files | Description |
|-----------|-------|-------------|
| `clientProject` | 3 | Client dashboard with bid selection modal |
| `vendorProject` | 3 | Vendor project browser with bidding interface |
| `vendorAssignedProject` | 3 | Vendor assigned projects tracker |

## API Reference

### Bid Selection Algorithm

The system uses a weighted scoring algorithm to rank bids:

```javascript
// Score Calculation
priceScore = (maxPrice - bidPrice) / (maxPrice - minPrice)
timeScore = (maxDays - bidDays) / (maxDays - minDays)
overallScore = (0.6 × priceScore) + (0.4 × timeScore)

// Recommendations
Lowest Price    → MIN(Quote_Price__c)
Fastest Delivery → MIN(Estimated_Day__c)
Best Overall    → MAX(overallScore)
```

**Example:**
```
Bids submitted:
- Vendor A: $8,000, 15 days
- Vendor B: $12,000, 7 days
- Vendor C: $10,000, 10 days

Results:
Lowest Price: Vendor A ($8,000)
Fastest Delivery: Vendor B (7 days)
Best Overall: Vendor C (Score: 0.55)
```

### Key Methods

#### bidSelection.assignBestBid(projectId)

**Purpose:** Calculate and assign 3 bid recommendations

**Parameters:**
- `projectId` (Id): Project Salesforce ID

**Returns:** void

**Side Effects:**
- Updates project with 3 bid field values
- Calculates bid scores
- Sets status to "Pending Client Approval"

**Usage:**
```apex
bidSelection.assignBestBid('a00XX000000XXXX');
```

---

#### bidSelection.approveBestBid(projectId, bidType)

**Purpose:** Approve selected bid and create assignment

**Parameters:**
- `projectId` (Id): Project Salesforce ID
- `bidType` (String): 'price' | 'delivery' | 'overall'

**Returns:** String ('Success' or error message)

**Throws:** AuraHandledException

**Usage:**
```apex
String result = bidSelection.approveBestBid(
    'a00XX000000XXXX', 
    'overall'
);
```

---

#### clientProject.getVendorNames(vendorIds)

**Purpose:** Fetch vendor display names

**Parameters:**
- `vendorIds` (Set<Id>): Set of vendor IDs

**Returns:** Map<Id, String> (vendorId → vendorName)

**Cacheable:** Yes

**Usage:**
```apex
Set<Id> ids = new Set<Id>{'a01XX...', 'a01YY...'};
Map<Id, String> names = clientProject.getVendorNames(ids);
```

## Testing

### Run Tests

```bash
# All tests
sfdx force:apex:test:run -u myorg -r human

# Specific class
sfdx force:apex:test:run -n bidSelectionTest -u myorg -r human

# With coverage
sfdx force:apex:test:run -u myorg -c -r human
```

### Test Scenarios

**Scenario 1: Single Bid**
```
Given: 1 vendor submits bid
When: Deadline passes
Then: All 3 recommendations point to same bid
```

**Scenario 2: Multiple Bids**
```
Given: 3 vendors with different price/time
When: Deadline passes
Then: 3 different recommendations generated
```

**Scenario 3: Tie Scenarios**
```
Given: 2 vendors with same price
When: System calculates
Then: First submitted bid wins
```

### Coverage Requirements
- Apex Classes: 85%+
- LWC Components: 80%+

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### Code Standards

- Follow [Salesforce Apex Best Practices](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_dev_guide.htm)
- Write descriptive commit messages
- Add comments for complex logic
- Maintain test coverage above 85%
- Use meaningful variable names

### Development Setup

```bash
# Install Salesforce CLI
npm install -g sfdx-cli

# Authenticate
sfdx auth:web:login -a DevOrg

# Create scratch org (optional)
sfdx force:org:create -f config/project-scratch-def.json -a ScratchOrg

# Push source
sfdx force:source:push -u ScratchOrg

# Run tests
sfdx force:apex:test:run -u ScratchOrg
```

## Documentation

- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) - Detailed setup instructions
- [API Documentation](docs/API.md) - Complete API reference
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Change Log](CHANGELOG.md) - Version history

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Swift Source Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

### FAQs

<details>
<summary>How do I change the scoring weights?</summary>

Edit `bidSelection.cls` line 65:
```apex
// Current: 60% price, 40% time
Decimal finalScore = (0.6 * priceScore) + (0.4 * timeScore);

// Example: 70% price, 30% time
Decimal finalScore = (0.7 * priceScore) + (0.3 * timeScore);
```
</details>

<details>
<summary>Can vendors see competitor bids?</summary>

No. Vendors only see their own bids. Clients see all bids but not vendor identities until selection.
</details>

<details>
<summary>What happens if no bids are submitted?</summary>

Project remains in "Bidding In-Progress" status. No recommendations generated.
</details>

## Roadmap

### Version 2.0
- [ ] Multi-currency support
- [ ] Email notifications
- [ ] Advanced filtering
- [ ] Bulk operations

### Version 3.0
- [ ] Mobile app for vendors
- [ ] Analytics dashboard
- [ ] AI-powered recommendations
- [ ] Payment gateway integration

### Future Considerations
- [ ] Multi-language support
- [ ] Custom scoring algorithms
- [ ] Vendor rating system
- [ ] Contract management

- **Total Classes**: 6
- **Total Components**: 3
- **Custom Objects**: 4
- **Lines of Code**: ~1,500
- **Code Coverage**: 85%+

## Acknowledgments

- **Salesforce Trailblazer Community** - For best practices and guidance
- **Lightning Design System** - For beautiful UI components
- **All Contributors** - Thank you for your contributions!

## Contact

**Project Maintainer**: Kauvsik Chandrasekar
- GitHub: https://github.com/Kauvsik
- LinkedIn: www.linkedin.com/in/kauvsik
- Email: kauvsikc@gmail.com

---

<div align="center">


</div>
