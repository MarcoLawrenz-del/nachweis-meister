# SubFix - Compliance Management System

A comprehensive compliance management platform for subcontractors built with React, TypeScript, and Supabase.

## 🎯 STEP Completion Status

### ✅ STEP 8 - Live-Demo finalisiert
- **Comprehensive E2E Testing**: Playwright test suite covering all critical workflows
- **Telemetry & Analytics**: Real-time event tracking for user behavior and system health  
- **Real-time KPI Dashboard**: Live updating dashboard with WebSocket connections
- **Data Accuracy**: 1:1 correspondence between dashboard numbers, lists, and individual records

## 📝 MSG-0 - Global Messaging & Wording

### ✅ Completed Implementation
- **Global Wording System**: Created `src/content/wording.ts` with consistent terminology
- **Pitch Integration**: Exact pitch and subline now displayed on landing page and dashboard
- **"Nur Pflichten" Messaging**: Prominently featured across hero, dashboard hints, and info sections
- **Build Guards**: ESLint rule prevents usage of "Bausicht" - build fails on violations
- **Terminology Consistency**: Replaced "Subs" abbreviation with full "Nachunternehmer (Subunternehmer)"
- **Email Templates**: Updated to use WORDING.email constants for consistency
- **UI/UX Updates**: All user-facing strings now use WORDING constants

### Key Features
- `WORDING.pitchOneLiner`: "Nachunterlagen automatisch einsammeln – nur das, was wirklich Pflicht ist."
- `WORDING.pitchSubline`: Full explanation emphasizing "Pflichtnachweise"
- `WORDING.valuePillars`: ["Einfachheit", "Zeitersparnis", "Rechtssicherheit", "Nur Pflichten"]
- `WORDING.info.onlyRequiredWarn`: Build-in messaging about "Nur Pflichtnachweise"

## 🧪 E2E Test Coverage

Our Playwright test suite ensures **"Keine Regressionen, KPIs = Wahrheit"** with comprehensive scenarios:

### 1. Compliance Flag Workflows
- ✅ Flag changes automatically create/remove requirements
- ✅ Real-time computation of compliance obligations  
- ✅ `compute-requirements` RPC integration

### 2. Document Lifecycle Testing  
- ✅ Missing → Upload → Review → Valid workflow
- ✅ Status transitions with proper validation
- ✅ Review permissions (only submitted/in_review items)

### 3. Date-based Status Management
- ✅ Expiring/Expired document detection based on dates
- ✅ 30-day warning system automation
- ✅ Automatic status updates via scheduled jobs

### 4. Subcontractor Activation
- ✅ Active/Inactive status toggles with telemetry
- ✅ Dashboard KPI updates in real-time via WebSockets
- ✅ Workflow adjustments based on status changes

### 5. Data Integrity Verification
- ✅ Dashboard KPIs ↔ List views ↔ Individual records (1:1)
- ✅ Real-time updates via Supabase channels
- ✅ Accurate aggregation via database RPC functions

## 📊 Telemetry Events

The system tracks critical events for analytics and regression prevention:

- `RequirementStatusChanged` - Document status transitions with old/new values
- `ReminderSent` - Automated reminder notifications with type and target
- `SubActivated/Deactivated` - Subcontractor status changes with context
- `KPIClicked` - Dashboard interaction tracking for UX insights
- `PageView` - User navigation patterns and session tracking
- `UserActive` - Session activity monitoring with duration
- `ComplianceFlagsChanged` - Flag modifications with delta tracking
- `DocumentUploaded/ReviewCompleted` - Document workflow events

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Real-time, Edge Functions, RLS)
- **Testing**: Playwright E2E tests with fixture data
- **Analytics**: Custom telemetry service with event batching
- **Real-time**: Supabase WebSocket channels for live dashboard updates

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Run E2E tests (requires running dev server)
npx playwright test

# Run E2E tests with visual UI
npx playwright test --ui

# Run specific E2E test file
npx playwright test tests/compliance-workflow.spec.ts

# Generate test report
npx playwright show-report
```

## ⚡ Real-time Features

- **Live Dashboard Updates**: KPIs update automatically when data changes via WebSocket
- **Multi-table Subscriptions**: Listens to subcontractors, requirements, documents, project_subs
- **Event Streaming**: Continuous telemetry with intelligent batching (10 events or 5s delay)
- **Data Synchronization**: Multi-user environments stay perfectly in sync
- **Performance Optimized**: Debounced updates prevent excessive re-renders

## 🔒 Security & Compliance

- **Row Level Security (RLS)**: Multi-tenant data isolation at database level
- **Automated Compliance Engine**: Rule-based requirement computation
- **Audit Logging**: All critical operations tracked with telemetry
- **Encrypted Analytics**: Event data stored securely with tenant isolation
- **Migration Safety**: All database changes via controlled migrations

## 📈 KPI Accuracy Guarantee

The system maintains **"KPIs = Wahrheit"** through:

1. **Database-level Aggregation**: RPC functions ensure consistent calculations
2. **Real-time Synchronization**: WebSocket updates eliminate stale data
3. **E2E Verification**: Tests validate dashboard ↔ list ↔ record correspondence  
4. **Telemetry Validation**: Event tracking confirms user interactions match data changes
5. **Automated Testing**: CI/CD pipeline prevents regression deployment

**Result**: Dashboard numbers, list counts, and individual record statuses are guaranteed to match 1:1 at all times.
