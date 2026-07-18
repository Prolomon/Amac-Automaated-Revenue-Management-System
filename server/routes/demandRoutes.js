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
  getDemandByPayment
} from '../controller/demandController.js';

// Send demand notice to a single member
router.post('/send', createDemandNotice);

// Send demand notices to multiple members
router.post('/send-multiple', createMultipleDemandNotice);

// Get all demands with filtering and pagination
router.get('/', getDemands);

// Get demand by ID
router.get('/:id', getDemandById);

// Get demand by Center
router.get('/:id/center', getDemandByCenter);

// Get demand by UserId
router.get('/:id/user', getDemandByUser);

// Get demand by PaymentId
router.get('/:id/payment', getDemandByPayment);

// Resend demand notice (rechecks payment price)
router.post('/:id/resend', resendDemandNotice);

export { router as demandRouter };