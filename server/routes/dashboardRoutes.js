import { Router } from 'express';
import { auditLogs, exportReservations, notifications, reservationReport, revenueReport, settings, stats, updateSettings } from '../controllers/dashboardController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';

export const dashboardRoutes = Router();
dashboardRoutes.get('/dashboard/stats', requireAuth, allowRoles('admin', 'receptionist'), stats);
dashboardRoutes.get('/reports/reservations', requireAuth, allowRoles('admin', 'receptionist'), reservationReport);
dashboardRoutes.get('/reports/revenue', requireAuth, allowRoles('admin'), revenueReport);
dashboardRoutes.get('/reports/reservations/export', requireAuth, allowRoles('admin', 'receptionist'), exportReservations);
dashboardRoutes.get('/settings', settings);
dashboardRoutes.put('/settings', requireAuth, allowRoles('admin'), updateSettings);
dashboardRoutes.get('/notifications', requireAuth, notifications);
dashboardRoutes.get('/audit-logs', requireAuth, allowRoles('admin'), auditLogs);

