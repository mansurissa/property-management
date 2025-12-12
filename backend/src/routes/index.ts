import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import profileRoutes from './profile.routes';
import propertyRoutes from './property.routes';
import unitRoutes from './unit.routes';
import tenantRoutes from './tenant.routes';
import paymentRoutes from './payment.routes';
import maintenanceRoutes from './maintenance.routes';
import dashboardRoutes from './dashboard.routes';
import reportsRoutes from './reports.routes';
import notificationsRoutes from './notifications.routes';
import inAppNotificationsRoutes from './in-app-notifications.routes';
import bulkMessagingRoutes from './bulk-messaging.routes';
import documentsRoutes from './documents.routes';
import auditRoutes from './audit.routes';
// Role-specific routes
import adminRoutes from './admin.routes';
import agencyRoutes from './agency.routes';
import tenantPortalRoutes from './tenant-portal.routes';
import maintenanceStaffRoutes from './maintenance-staff.routes';
import managerRoutes from './manager.routes';
import managerPortalRoutes from './manager-portal.routes';
// Agent routes
import agentApplicationRoutes from './agent-application.routes';
import agentPortalRoutes from './agent-portal.routes';
import adminAgentsRoutes from './admin-agents.routes';
import adminCommissionsRoutes from './admin-commissions.routes';
import demoRequestRoutes from './demo-request.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/properties', propertyRoutes);
router.use('/units', unitRoutes);
router.use('/tenants', tenantRoutes);
router.use('/payments', paymentRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/in-app-notifications', inAppNotificationsRoutes);
router.use('/bulk-messaging', bulkMessagingRoutes);
router.use('/documents', documentsRoutes);
router.use('/audit', auditRoutes);

// Role-specific routes
router.use('/admin', adminRoutes);
router.use('/agency', agencyRoutes);
router.use('/tenant-portal', tenantPortalRoutes);
router.use('/maintenance-staff', maintenanceStaffRoutes);
router.use('/managers', managerRoutes);
router.use('/manager-portal', managerPortalRoutes);

// Agent routes
router.use('/agent-applications', agentApplicationRoutes);
router.use('/agent-portal', agentPortalRoutes);
router.use('/admin/agents', adminAgentsRoutes);
router.use('/admin/commissions', adminCommissionsRoutes);

// Public routes
router.use('/demo-requests', demoRequestRoutes);

export default router;
