# Multi-Role System Implementation Plan

## Overview
Implement a comprehensive multi-role system with 5 distinct user types, each with their own dashboard and capabilities.

---

## User Roles & Their Capabilities

### 1. Super Admin
**Purpose**: Platform administrator who manages the entire system
**Dashboard Features**:
- Overview of all platform statistics (total users, properties, revenue across platform)
- User management (create/edit/disable all user types)
- Agency/Property Manager management
- System settings and configuration
- Audit logs / activity monitoring
- Platform-wide reports

**Access**: Full access to everything

---

### 2. Property Manager / Agency
**Purpose**: Manages properties on behalf of multiple landlords
**Dashboard Features**:
- Overview of all managed properties across multiple landlords
- Landlord management (landlords they manage)
- Property & unit management for their clients
- Tenant management across all managed properties
- Payment tracking and reports
- Maintenance coordination
- Commission/fee tracking

**Access**:
- Can manage multiple landlords' properties
- Cannot see other agencies' data
- Reports to Super Admin

---

### 3. Landlord
**Purpose**: Property owner (current role - enhanced)
**Dashboard Features**:
- Properties owned and their performance
- Units and occupancy rates
- Tenant management
- Payment collection and tracking
- Maintenance requests for their properties
- Financial reports (income, expenses)
- Can optionally assign properties to an Agency

**Access**:
- Full control over their own properties
- Can choose to be self-managed or agency-managed

---

### 4. Tenant
**Purpose**: Renter who occupies a unit
**Dashboard Features**:
- Current lease information
- Payment history and upcoming payments
- Submit maintenance requests
- View maintenance request status
- Communication with landlord/agency
- Documents (lease agreement, receipts)

**Access**:
- View-only for lease and payment info
- Can create maintenance requests
- Limited to their own unit data

---

### 5. Maintenance Staff
**Purpose**: Handles maintenance and repairs
**Dashboard Features**:
- Assigned maintenance tickets
- Ticket queue (pending, in-progress)
- Update ticket status
- Add notes/photos to tickets
- View property/unit details for context
- Work history/completed jobs

**Access**:
- Can view and update assigned maintenance tickets
- Cannot see financial data
- Limited property info (just what's needed for the job)

---

## Database Changes

### 1. Update User Model - New Roles
```javascript
role: ENUM('super_admin', 'agency', 'landlord', 'tenant', 'maintenance')
```

### 2. New: Agency Model (optional - can use User with role='agency')
```javascript
// If agency needs extra fields beyond User
Agency {
  id, userId, companyName, licenseNumber, address, commissionRate
}
```

### 3. Update Property Model - Add Agency Relationship
```javascript
Property {
  ...existing fields,
  agencyId: UUID (nullable) // Agency managing this property
}
```

### 4. Link Tenant to User Account
```javascript
Tenant {
  ...existing fields,
  userAccountId: UUID (nullable) // Links to User table for login
}
```

### 5. Update MaintenanceTicket - Add Assignment
```javascript
MaintenanceTicket {
  ...existing fields,
  assignedTo: UUID (nullable) // User with role='maintenance'
  assignedAt: DATE
}
```

---

## Frontend Structure

```
/dashboard                    → Role-based redirect
/dashboard/admin/            → Super Admin dashboard
/dashboard/agency/           → Agency dashboard
/dashboard/landlord/         → Landlord dashboard (current, enhanced)
/dashboard/tenant/           → Tenant dashboard
/dashboard/maintenance/      → Maintenance staff dashboard
```

### Role-Based Layouts
Each role gets its own:
- Sidebar navigation (different menu items)
- Dashboard home page (different stats/widgets)
- Accessible routes

---

## Implementation Phases

### Phase 1: Database & Backend Updates
1. Create migration to update User role ENUM
2. Create migration for Property.agencyId
3. Create migration for Tenant.userAccountId
4. Create migration for MaintenanceTicket.assignedTo
5. Update models with new associations
6. Update auth middleware with role checking

### Phase 2: Backend API Routes
1. Super Admin routes (/api/v1/admin/*)
2. Agency routes (/api/v1/agency/*)
3. Update existing routes with role-based filtering
4. Tenant-specific routes
5. Maintenance staff routes

### Phase 3: Frontend - Layout & Navigation
1. Create role-based dashboard layouts
2. Create role-specific sidebars
3. Implement role-based route protection
4. Dashboard redirect based on role

### Phase 4: Frontend - Dashboards
1. Super Admin dashboard
2. Agency dashboard
3. Enhanced Landlord dashboard (current)
4. Tenant dashboard
5. Maintenance staff dashboard

### Phase 5: Seed Data
Create test users for each role with sample data

---

## Seed Users

| Email | Password | Role |
|-------|----------|------|
| superadmin@renta.rw | password123 | super_admin |
| agency@renta.rw | password123 | agency |
| landlord@renta.rw | password123 | landlord |
| tenant@renta.rw | password123 | tenant |
| maintenance@renta.rw | password123 | maintenance |

---

## Questions to Clarify

1. Should Agency be a separate model or just a User with role='agency'?
2. Can a Landlord switch between self-managed and agency-managed?
3. Should Tenant have a mobile app focus (simpler UI)?
4. Can Maintenance staff be assigned to specific properties/agencies only?
