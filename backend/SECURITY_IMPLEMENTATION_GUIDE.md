# Security Implementation Guide

## Overview
This guide provides instructions for completing the security implementation across all routes in the Renta property management application.

---

## 1. Applying Validation to Routes

### Implementation Pattern

All routes should follow this pattern:

```typescript
import { validateRequest } from '../middleware/validation.middleware';
import { createResourceValidation, updateResourceValidation } from '../middleware/validators';
import { verifyResourceOwnership } from '../middleware/ownership.middleware';

// CREATE - POST
router.post('/',
  validateRequest(createResourceValidation),
  async (req: AuthRequest, res: Response) => {
    // Validation already done - use req.body directly
    const resource = await Resource.create(req.body);
    return sendCreated(res, resource);
  }
);

// UPDATE - PUT/PATCH
router.put('/:id',
  verifyResourceOwnership,  // Check ownership first
  validateRequest(updateResourceValidation),
  async (req: AuthRequest, res: Response) => {
    // req.resource is populated by ownership middleware
    await req.resource.update(req.body);
    return sendSuccess(res, req.resource);
  }
);

// DELETE
router.delete('/:id',
  verifyResourceOwnership,
  async (req: AuthRequest, res: Response) => {
    await req.resource.destroy();
    return sendDeleted(res, 'Resource deleted successfully');
  }
);
```

---

## 2. Routes to Update

### Tenant Routes (`/routes/tenant.routes.ts`)

**Apply:**
- `POST /tenants` → `createTenantValidation`
- `PUT /tenants/:id` → `verifyTenantOwnership` + `updateTenantValidation`
- `DELETE /tenants/:id` → `verifyTenantOwnership`
- `POST /tenants/:id/assign-unit` → `verifyTenantOwnership` + `assignTenantToUnitValidation`

**Example:**
```typescript
import { createTenantValidation, updateTenantValidation, assignTenantToUnitValidation } from '../middleware/validators';
import { validateRequest } from '../middleware/validation.middleware';
import { verifyTenantOwnership } from '../middleware/ownership.middleware';

router.post('/', validateRequest(createTenantValidation), async (req, res) => {
  // Start transaction for multi-step operation
  const transaction = await db.sequelize.transaction();

  try {
    const { unitId, ...tenantData } = req.body;

    // Create tenant
    const tenant = await Tenant.create({
      ...tenantData,
      userId: req.user!.userId
    }, { transaction });

    // If unit assigned, update unit status
    if (unitId) {
      await Unit.update(
        { status: 'occupied', currentTenantId: tenant.id },
        { where: { id: unitId }, transaction }
      );
    }

    await transaction.commit();
    return sendCreated(res, tenant);
  } catch (error) {
    await transaction.rollback();
    return sendServerError(res, error as Error);
  }
});

router.put('/:id',
  verifyTenantOwnership,
  validateRequest(updateTenantValidation),
  async (req, res) => {
    await req.tenant.update(req.body);
    return sendSuccess(res, req.tenant);
  }
);

router.delete('/:id', verifyTenantOwnership, async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    // If tenant has a unit, free it up
    if (req.tenant.unitId) {
      await Unit.update(
        { status: 'vacant', currentTenantId: null },
        { where: { id: req.tenant.unitId }, transaction }
      );
    }

    await req.tenant.destroy({ transaction });
    await transaction.commit();
    return sendDeleted(res);
  } catch (error) {
    await transaction.rollback();
    return sendServerError(res, error as Error);
  }
});
```

---

### Property Routes (`/routes/property.routes.ts`)

**Apply:**
- `POST /properties` → `createPropertyValidation`
- `PUT /properties/:id` → `verifyPropertyOwnership` + `updatePropertyValidation`
- `DELETE /properties/:id` → `verifyPropertyOwnership`
- `POST /properties/:propertyId/units` → `verifyPropertyOwnership` + `createUnitValidation`
- `PUT /properties/:propertyId/units/:unitId` → `verifyUnitOwnership` + `updateUnitValidation`

**Example:**
```typescript
import { createPropertyValidation, updatePropertyValidation, createUnitValidation, updateUnitValidation } from '../middleware/validators';
import { verifyPropertyOwnership, verifyUnitOwnership } from '../middleware/ownership.middleware';

router.post('/', validateRequest(createPropertyValidation), async (req, res) => {
  const property = await Property.create({
    ...req.body,
    userId: req.user!.userId
  });

  // Log audit trail
  await logPropertyCreated(req.user!.userId, property.id, property.name);

  return sendCreated(res, property);
});

router.put('/:id',
  verifyPropertyOwnership,
  validateRequest(updatePropertyValidation),
  async (req, res) => {
    await req.property.update(req.body);
    return sendSuccess(res, req.property);
  }
);

// Unit routes
router.post('/:propertyId/units',
  verifyPropertyOwnership,
  validateRequest(createUnitValidation),
  async (req, res) => {
    const unit = await Unit.create({
      ...req.body,
      propertyId: req.params.propertyId
    });
    return sendCreated(res, unit);
  }
);
```

---

### Payment Routes (`/routes/payment.routes.ts`)

**Apply:**
- `POST /payments` → `createPaymentValidation`
- `PUT /payments/:id` → `verifyPaymentOwnership` + `updatePaymentValidation`
- `DELETE /payments/:id` → `verifyPaymentOwnership`

**Example:**
```typescript
import { createPaymentValidation, updatePaymentValidation } from '../middleware/validators';
import { verifyPaymentOwnership } from '../middleware/ownership.middleware';

router.post('/', validateRequest(createPaymentValidation), async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    // Verify tenant belongs to user
    const tenant = await Tenant.findOne({
      where: { id: req.body.tenantId, userId: req.user!.userId }
    });

    if (!tenant) {
      await transaction.rollback();
      return sendNotFound(res, 'Tenant');
    }

    // Create payment
    const payment = await Payment.create({
      ...req.body,
      userId: req.user!.userId
    }, { transaction });

    // Log audit trail
    await logPaymentRecorded(
      req.user!.userId,
      payment.id,
      payment.amount,
      req.body.tenantId,
      { transaction }
    );

    await transaction.commit();
    return sendCreated(res, payment);
  } catch (error) {
    await transaction.rollback();
    return sendServerError(res, error as Error);
  }
});

router.put('/:id',
  verifyPaymentOwnership,
  validateRequest(updatePaymentValidation),
  async (req, res) => {
    await req.payment.update(req.body);
    return sendSuccess(res, req.payment);
  }
);
```

---

### Maintenance Routes (`/routes/maintenance.routes.ts`)

**Apply:**
- `POST /maintenance` → `createMaintenanceValidation`
- `PUT /maintenance/:id` → `verifyMaintenanceOwnership` + `updateMaintenanceValidation`
- `POST /maintenance/:id/assign` → `verifyMaintenanceOwnership` + `assignMaintenanceValidation`

**Example:**
```typescript
import { createMaintenanceValidation, updateMaintenanceValidation, assignMaintenanceValidation } from '../middleware/validators';
import { verifyMaintenanceOwnership } from '../middleware/ownership.middleware';

router.post('/', validateRequest(createMaintenanceValidation), async (req, res) => {
  const maintenance = await MaintenanceRequest.create({
    ...req.body,
    requestedBy: req.user!.userId,
    status: 'pending'
  });

  return sendCreated(res, maintenance);
});

router.put('/:id',
  verifyMaintenanceOwnership,
  validateRequest(updateMaintenanceValidation),
  async (req, res) => {
    await req.maintenance.update(req.body);
    return sendSuccess(res, req.maintenance);
  }
);

router.post('/:id/assign',
  verifyMaintenanceOwnership,
  validateRequest(assignMaintenanceValidation),
  async (req, res) => {
    await req.maintenance.update({
      assignedTo: req.body.staffId,
      status: 'in_progress'
    });

    // Send notification to staff
    // await notifyStaff(req.body.staffId, req.maintenance);

    return sendSuccess(res, req.maintenance);
  }
);
```

---

### Document Routes (`/routes/documents.routes.ts`)

**Apply:**
- `POST /documents` → `uploadLimiter` + `uploadDocumentValidation`
- `PATCH /documents/:id/status` → `verifyDocumentOwnership` + `updateDocumentStatusValidation`
- `POST /documents/:id/sign` → `signDocumentValidation`

**Example:**
```typescript
import { uploadLimiter } from '../middleware/rate-limit.middleware';
import { uploadDocumentValidation, updateDocumentStatusValidation, signDocumentValidation } from '../middleware/validators';
import { verifyDocumentOwnership } from '../middleware/ownership.middleware';

router.post('/',
  uploadLimiter,
  upload.single('file'),
  validateRequest(uploadDocumentValidation),
  async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No file uploaded');
    }

    const result = await uploadDocument(req.file, {
      ...req.body,
      userId: req.user!.userId
    });

    if (!result.success) {
      return sendError(res, result.error);
    }

    await logDocumentUploaded(req.user!.userId, result.document!.id);
    return sendCreated(res, result.document);
  }
);

router.patch('/:id/status',
  verifyDocumentOwnership,
  validateRequest(updateDocumentStatusValidation),
  async (req, res) => {
    await req.document.update(req.body);
    return sendSuccess(res, req.document);
  }
);
```

---

## 3. Database Transactions

### When to Use Transactions

Use transactions for any operation that:
1. Modifies multiple tables
2. Has dependent steps that must all succeed
3. Updates related records atomically

### Transaction Pattern

```typescript
import { Transaction } from 'sequelize';
const db = require('../database/models');

// Basic transaction
const transaction = await db.sequelize.transaction();

try {
  // All database operations
  await Model1.create(data1, { transaction });
  await Model2.update(data2, { where: { id }, transaction });

  // Commit if all succeed
  await transaction.commit();
  return sendSuccess(res, result);
} catch (error) {
  // Rollback on any error
  await transaction.rollback();
  return sendServerError(res, error as Error);
}
```

### Critical Operations Requiring Transactions

#### 1. **Tenant Assignment to Unit**
```typescript
const transaction = await db.sequelize.transaction();

try {
  // Create tenant
  const tenant = await Tenant.create(tenantData, { transaction });

  // Update unit status
  await Unit.update(
    { status: 'occupied', currentTenantId: tenant.id },
    { where: { id: unitId }, transaction }
  );

  // Update property occupancy count
  await Property.increment(
    'occupiedUnits',
    { where: { id: propertyId }, transaction }
  );

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

#### 2. **Payment Recording with Balance Update**
```typescript
const transaction = await db.sequelize.transaction();

try {
  // Create payment record
  const payment = await Payment.create(paymentData, { transaction });

  // Update tenant balance
  await Tenant.decrement(
    'outstandingBalance',
    { by: payment.amount, where: { id: tenantId }, transaction }
  );

  // Log audit trail
  await AuditLog.create({
    action: 'payment.recorded',
    userId: req.user!.userId,
    entityId: payment.id,
    amount: payment.amount
  }, { transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

#### 3. **Tenant Removal with Unit Cleanup**
```typescript
const transaction = await db.sequelize.transaction();

try {
  // Free up the unit
  if (tenant.unitId) {
    await Unit.update(
      { status: 'vacant', currentTenantId: null },
      { where: { id: tenant.unitId }, transaction }
    );

    // Decrement property occupancy
    await Property.decrement(
      'occupiedUnits',
      { where: { id: tenant.unit.propertyId }, transaction }
    );
  }

  // Soft delete or hard delete tenant
  await tenant.destroy({ transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

#### 4. **Property Deletion with Cascade Cleanup**
```typescript
const transaction = await db.sequelize.transaction();

try {
  // Soft delete all units
  await Unit.update(
    { deletedAt: new Date() },
    { where: { propertyId: property.id }, transaction }
  );

  // Update tenants to mark them as inactive
  await Tenant.update(
    { status: 'inactive', unitId: null },
    {
      where: {
        unitId: { [Op.in]: unitIds }
      },
      transaction
    }
  );

  // Soft delete property
  await property.update({ deletedAt: new Date() }, { transaction });

  // Log audit trail
  await logPropertyDeleted(req.user!.userId, property.id, { transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

---

## 4. Validation Error Handling

### Standard Response Format

```typescript
// Validation errors return:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### Frontend Handling

```typescript
// In frontend API client
try {
  await api.post('/tenants', data);
} catch (error: any) {
  if (error.response?.data?.errors) {
    // Display field-specific errors
    error.response.data.errors.forEach(err => {
      showFieldError(err.field, err.message);
    });
  } else {
    // Display general error
    toast.error(error.response?.data?.message || 'An error occurred');
  }
}
```

---

## 5. Audit Logging

### Add to All Critical Operations

```typescript
import { logAction } from '../services/audit.service';

// After successful operation
await logAction({
  userId: req.user!.userId,
  action: 'resource.created', // or updated, deleted
  entityType: 'tenant',
  entityId: tenant.id,
  description: `Created tenant ${tenant.firstName} ${tenant.lastName}`,
  metadata: {
    unitId: tenant.unitId,
    rentAmount: tenant.rentAmount
  },
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

### Critical Actions to Log

- ✅ User registration/login
- ✅ Property creation/deletion
- ✅ Tenant creation/deletion/assignment
- ✅ Payment recording/deletion
- ✅ Document upload/deletion
- ✅ Maintenance request status changes
- ✅ User permission changes

---

## 6. Testing Checklist

### For Each Route:

- [ ] Try valid data → should succeed
- [ ] Try missing required fields → should return 400 with validation errors
- [ ] Try invalid email format → should return 400
- [ ] Try invalid phone format → should return 400
- [ ] Try negative numbers → should return 400
- [ ] Try accessing another user's resource → should return 403
- [ ] Try non-existent resource → should return 404
- [ ] Test rate limiting → should return 429 after limit

### Transaction Testing:

- [ ] Simulate database error mid-transaction → should rollback
- [ ] Check database consistency after rollback
- [ ] Verify no partial updates committed

---

## 7. Performance Considerations

### Indexing

Ensure indexes exist on:
- Foreign keys (userId, propertyId, unitId, tenantId)
- Frequently queried fields (status, email, phone)
- Date fields used in WHERE clauses
- Composite indexes for common query patterns

```sql
CREATE INDEX idx_tenants_status ON "Tenants"(status);
CREATE INDEX idx_payments_period ON "Payments"(periodYear, periodMonth);
CREATE INDEX idx_maintenance_status ON "MaintenanceRequests"(status);
```

### Query Optimization

- Use pagination for all list endpoints
- Limit included associations
- Use `attributes` to select only needed fields
- Add database query logging in development

---

## 8. Security Checklist

### Before Production:

- [ ] All POST routes have validation
- [ ] All PUT/PATCH routes have validation + ownership check
- [ ] All DELETE routes have ownership check
- [ ] Rate limiting applied to auth endpoints (5/15min)
- [ ] Rate limiting applied to upload endpoints (20/hour)
- [ ] CORS restricted to allowed origins
- [ ] JWT_SECRET is strong random string (32+ chars)
- [ ] Database passwords are strong
- [ ] All sensitive environment variables set
- [ ] Transactions used for multi-step operations
- [ ] Audit logging on all critical actions
- [ ] File uploads validated by MIME type
- [ ] Error messages don't leak sensitive info

---

## Next Steps

1. **Week 1**: Apply validation to all routes
2. **Week 2**: Add transactions to critical operations
3. **Week 3**: Set up database backups
4. **Week 4**: Testing and security audit
5. **Week 5**: Staging deployment
6. **Week 6**: Production launch

---

## Support

For questions or issues during implementation:
1. Review this guide
2. Check existing validated routes (auth.routes.ts)
3. Refer to validator files in `/middleware/validators/`
4. Test with Postman/curl before frontend integration
