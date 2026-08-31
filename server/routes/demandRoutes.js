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
router.post('/send', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), createDemandNotice);

// Send demand notice to a single member by payment ID
router.post('/send-by-payment', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), createDemandNoticeByPayment);

// Send demand notices to multiple members
router.post('/send-multiple', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), createMultipleDemandNotice);

// Get all demands with filtering and pagination
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getDemands);

// Get demand by ID
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'it', 'agent', 'company', 'member', "staff"]), getDemandById);

// Get demand by Center
router.get('/:id/center', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getDemandByCenter);

// Get demand by UserId
router.get('/:id/user', authMiddleware, roleMiddleware(['admin', 'it', 'it', 'agent', 'company', 'member', "staff"]), getDemandByUser);

// Get demand by PaymentId
router.get('/:id/payment', authMiddleware, roleMiddleware(['admin', 'it', 'it', 'agent', 'company', 'member', "staff"]), getDemandByPayment);

// Resend demand notice (rechecks payment price)
router.post('/:id/resend', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), resendDemandNotice);

export { router as demandRouter };