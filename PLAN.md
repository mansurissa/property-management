# Renta MVP Implementation Plan

## Rwanda Property Management System

### Color Palette
- **Primary Dark**: #37353E (dark charcoal) - Headers, primary buttons
- **Secondary Dark**: #44444E (gray) - Secondary elements, borders
- **Accent**: #715A5A (muted brown/mauve) - Highlights, links
- **Light**: #D3DAD9 (light gray/silver) - Backgrounds, cards

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui      │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  - /login, /signup                                               │
│  - /dashboard                                                    │
│  - /properties (list, add, edit)                                │
│  - /properties/[id]/units (unit management)                     │
│  - /tenants (list, add, edit, assign)                           │
│  - /payments (record, history)                                  │
│  - /maintenance (tickets)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  Express 5 + TypeScript + Sequelize + PostgreSQL                │
├─────────────────────────────────────────────────────────────────┤
│  API Routes:                                                     │
│  - /api/v1/auth/* (login, register, me)                         │
│  - /api/v1/properties/* (CRUD)                                  │
│  - /api/v1/units/* (CRUD)                                       │
│  - /api/v1/tenants/* (CRUD + assign)                            │
│  - /api/v1/payments/* (CRUD + history)                          │
│  - /api/v1/maintenance/* (CRUD)                                 │
│  - /api/v1/dashboard/* (stats)                                  │
│  - /api/v1/reminders/* (trigger)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│                       PostgreSQL                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### Tables & Relationships

```
Users (existing - enhanced)
├── id (UUID, PK)
├── email (unique)
├── password (hashed)
├── firstName
├── lastName
├── phone
├── role (ENUM: 'admin', 'landlord')
├── isActive
├── createdAt
└── updatedAt

Properties
├── id (UUID, PK)
├── userId (FK → Users) - owner/landlord
├── name
├── type (ENUM: 'apartment', 'house', 'commercial', 'other')
├── address
├── city (default: Rwanda cities)
├── description
├── createdAt
└── updatedAt

Units
├── id (UUID, PK)
├── propertyId (FK → Properties)
├── unitNumber (e.g., "A1", "101")
├── floor
├── bedrooms
├── bathrooms
├── monthlyRent (DECIMAL)
├── paymentDueDay (INTEGER 1-28, day of month rent is due)
├── status (ENUM: 'vacant', 'occupied', 'maintenance')
├── createdAt
└── updatedAt

Tenants
├── id (UUID, PK)
├── unitId (FK → Units, nullable) - current unit
├── userId (FK → Users) - property owner who added tenant
├── firstName
├── lastName
├── email
├── phone
├── nationalId (Rwanda ID)
├── emergencyContact
├── emergencyPhone
├── status (ENUM: 'active', 'late', 'exited')
├── leaseStartDate
├── leaseEndDate
├── createdAt
└── updatedAt

Payments
├── id (UUID, PK)
├── tenantId (FK → Tenants)
├── unitId (FK → Units)
├── amount (DECIMAL)
├── paymentMethod (ENUM: 'cash', 'momo', 'bank')
├── paymentDate
├── periodMonth (INTEGER 1-12)
├── periodYear (INTEGER)
├── notes
├── receivedBy (FK → Users)
├── createdAt
└── updatedAt

MaintenanceTickets
├── id (UUID, PK)
├── unitId (FK → Units)
├── tenantId (FK → Tenants, nullable)
├── category (ENUM: 'plumbing', 'electrical', 'structural', 'appliance', 'other')
├── description
├── priority (ENUM: 'low', 'medium', 'high', 'urgent')
├── status (ENUM: 'pending', 'in_progress', 'completed', 'cancelled')
├── completedAt
├── createdAt
└── updatedAt

ReminderLogs (for tracking sent reminders)
├── id (UUID, PK)
├── tenantId (FK → Tenants)
├── type (ENUM: 'sms', 'email')
├── triggerType (ENUM: 'before_due', 'on_due', 'after_due')
├── status (ENUM: 'sent', 'failed')
├── message
├── sentAt
└── createdAt
```

### Relationships
- User has many Properties (one landlord, many properties)
- Property has many Units
- Unit has one Tenant (current)
- Tenant has many Payments
- Unit has many MaintenanceTickets
- Tenant has many ReminderLogs

---

## 3. Implementation Phases

### Phase 1: Backend Foundation (Database & Models)
1. Create migrations for all tables
2. Create Sequelize models with associations
3. Update User model with 'landlord' role

### Phase 2: Backend API - Properties & Units
1. Property CRUD routes & controllers
2. Unit CRUD routes & controllers
3. Validation middleware

### Phase 3: Backend API - Tenants
1. Tenant CRUD routes & controllers
2. Assign/unassign tenant to unit
3. Tenant status management

### Phase 4: Backend API - Payments & Arrears
1. Payment CRUD routes
2. Payment history endpoint
3. Arrears calculation logic
4. Late payment detection service

### Phase 5: Backend API - Maintenance & Dashboard
1. Maintenance ticket CRUD
2. Dashboard statistics endpoint
3. Reminder service (pluggable SMS/Email)

### Phase 6: Frontend - Theme & Layout
1. Update globals.css with new color palette
2. Create dashboard layout with sidebar
3. Add required shadcn components

### Phase 7: Frontend - Auth & Properties
1. Update login/signup pages
2. Properties list & CRUD pages
3. Units management within properties

### Phase 8: Frontend - Tenants & Payments
1. Tenants list & CRUD
2. Tenant assignment modal
3. Payment recording form
4. Payment history view

### Phase 9: Frontend - Maintenance & Dashboard
1. Maintenance tickets page
2. Dashboard with stats cards
3. Recent activity feed

---

## 4. API Endpoints

### Auth
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me

### Properties
- GET /api/v1/properties (list user's properties)
- GET /api/v1/properties/:id
- POST /api/v1/properties
- PUT /api/v1/properties/:id
- DELETE /api/v1/properties/:id

### Units
- GET /api/v1/properties/:propertyId/units
- GET /api/v1/units/:id
- POST /api/v1/properties/:propertyId/units
- PUT /api/v1/units/:id
- DELETE /api/v1/units/:id

### Tenants
- GET /api/v1/tenants
- GET /api/v1/tenants/:id
- POST /api/v1/tenants
- PUT /api/v1/tenants/:id
- DELETE /api/v1/tenants/:id
- POST /api/v1/tenants/:id/assign (assign to unit)
- POST /api/v1/tenants/:id/unassign

### Payments
- GET /api/v1/payments (with filters)
- GET /api/v1/payments/:id
- POST /api/v1/payments
- GET /api/v1/tenants/:id/payments (tenant's payment history)
- GET /api/v1/tenants/:id/balance (current balance/arrears)

### Maintenance
- GET /api/v1/maintenance
- GET /api/v1/maintenance/:id
- POST /api/v1/maintenance
- PUT /api/v1/maintenance/:id
- DELETE /api/v1/maintenance/:id

### Dashboard
- GET /api/v1/dashboard/stats

### Reminders (Admin trigger)
- POST /api/v1/reminders/send-due-reminders

---

## 5. Frontend Pages Structure

```
/app
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/
│   ├── layout.tsx (sidebar + header)
│   ├── page.tsx (dashboard home)
│   ├── properties/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx (details)
│   │       ├── edit/page.tsx
│   │       └── units/page.tsx
│   ├── tenants/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx (details + payments)
│   │       └── edit/page.tsx
│   ├── payments/
│   │   ├── page.tsx (list/history)
│   │   └── new/page.tsx
│   └── maintenance/
│       ├── page.tsx (list)
│       └── new/page.tsx
```

---

## 6. Key Business Logic

### Arrears Calculation
```typescript
// For each tenant:
// 1. Get all months from lease start to current month
// 2. Calculate expected rent for each month
// 3. Sum all payments made
// 4. Arrears = Expected - Paid
```

### Late Payment Detection
```typescript
// Tenant is "late" if:
// 1. Current date > payment due day of current month
// 2. No payment recorded for current month
// 3. Auto-update tenant status to 'late'
```

### Reminder Triggers
```typescript
// Cron job or manual trigger:
// 1. 3 days before due: Send reminder
// 2. On due date: Send reminder
// 3. 3 days after due: Send late notice
```

---

## 7. shadcn Components Needed

Additional components to install:
- table (for data lists)
- dialog (for modals)
- select (for dropdowns)
- tabs (for tenant details)
- badge (for status indicators)
- dropdown-menu (for actions)
- separator
- skeleton (loading states)
- toast (notifications)
- alert (warnings)
- textarea

---

## 8. Files to Create/Modify

### Backend (17 files)
**Migrations (6):**
- 20251126000001-update-users-add-phone.js
- 20251126000002-create-properties.js
- 20251126000003-create-units.js
- 20251126000004-create-tenants.js
- 20251126000005-create-payments.js
- 20251126000006-create-maintenance-tickets.js

**Models (6):**
- property.model.js
- unit.model.js
- tenant.model.js
- payment.model.js
- maintenanceTicket.model.js
- Update: index.js (add new models)

**Routes (5):**
- property.routes.ts
- unit.routes.ts
- tenant.routes.ts
- payment.routes.ts
- maintenance.routes.ts
- dashboard.routes.ts
- Update: index.ts

**Services (3):**
- property.service.ts
- tenant.service.ts
- payment.service.ts
- reminder.service.ts

### Frontend (25+ files)
**Theme:**
- globals.css (update colors)

**Components:**
- DashboardLayout.tsx
- Sidebar.tsx
- StatsCard.tsx
- DataTable.tsx
- PropertyCard.tsx
- TenantCard.tsx
- PaymentForm.tsx
- MaintenanceForm.tsx

**Pages:**
- Multiple page files as per structure above

**API Services:**
- properties.ts
- units.ts
- tenants.ts
- payments.ts
- maintenance.ts
- dashboard.ts

---

## 9. Execution Order

1. **Backend Database** - All migrations first
2. **Backend Models** - All models with associations
3. **Backend Routes** - API endpoints
4. **Frontend Theme** - Color palette update
5. **Frontend Layout** - Dashboard layout
6. **Frontend shadcn** - Install additional components
7. **Frontend Pages** - Build all pages
8. **Frontend API** - Connect to backend
9. **Testing** - Verify all flows work

---

## Next Steps After MVP

1. Implement actual SMS integration (Africa's Talking, Twilio)
2. Email service integration (SendGrid, Nodemailer)
3. Automated cron jobs for reminders
4. Lease document upload
5. Financial reports & exports
6. Mobile responsive optimization
7. Multi-language support (English, Kinyarwanda, French)
