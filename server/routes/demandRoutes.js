import express from 'express';
const router = express.Router();
import {
  createDemandNotice,
  createMultipleDemandNotice,
  getDemands,
  getDemandById,
  resendDemandNotice,
  getDemandByCenter,
  getDemandByUser,
  getDemandByPayment,
  createDemandNoticeByPayment,
  downloadDemandNotice,
  downloadMultipleDemandNotices,
} from '../controller/demandController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

// Send demand notice to a single member
router.post('/send', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), createDemandNotice);

// Send demand notice to a single member by payment ID
router.post('/send-by-payment', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), createDemandNoticeByPayment);

// Send demand notices to multiple members
router.post('/send-multiple', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), createMultipleDemandNotice);

// Batch download multiple demand notices merged into one PDF
router.post('/download-many', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member', 'staff']), downloadMultipleDemandNotices);

// Get all demands with filtering and pagination
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getDemands);

// Download a single demand notice PDF
router.get('/:id/download', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member', 'staff']), downloadDemandNotice);

// Get demand by ID
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member', "staff"]), getDemandById);

// Get demand by Center
router.get('/:id/center', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getDemandByCenter);

// Get demand by UserId
router.get('/:id/user', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member', "staff"]), getDemandByUser);

// Get demand by PaymentId
router.get('/:id/payment', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member', "staff"]), getDemandByPayment);

// Resend demand notice (rechecks payment price)
router.post('/:id/resend', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), resendDemandNotice);

export { router as demandRouter };