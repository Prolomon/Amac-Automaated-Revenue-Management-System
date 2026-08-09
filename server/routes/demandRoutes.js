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
  createDemandNoticeByPayment
} from '../controller/demandController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

// Send demand notice to a single member
router.post('/send', authMiddleware, roleMiddleware(['admin']), createDemandNotice);

// Send demand notice to a single member by payment ID
router.post('/send-by-payment', authMiddleware, roleMiddleware(['admin']), createDemandNoticeByPayment);

// Send demand notices to multiple members
router.post('/send-multiple', authMiddleware, roleMiddleware(['admin']), createMultipleDemandNotice);

// Get all demands with filtering and pagination
router.get('/', authMiddleware, roleMiddleware(['admin']), getDemands);

// Get demand by ID
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member']), getDemandById);

// Get demand by Center
router.get('/:id/center', authMiddleware, roleMiddleware(['admin']), getDemandByCenter);

// Get demand by UserId
router.get('/:id/user', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member']), getDemandByUser);

// Get demand by PaymentId
router.get('/:id/payment', authMiddleware, roleMiddleware(['admin', 'it', 'agent', 'company', 'member']), getDemandByPayment);

// Resend demand notice (rechecks payment price)
router.post('/:id/resend', authMiddleware, roleMiddleware(['admin']), resendDemandNotice);

export { router as demandRouter };