import express from 'express';
import { calculatePaymentDistribution, getDistributionWithFilters } from '../controller/paymentDistributionController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

// Calculate payment distribution with percentage breakdown
router.post('/calculate', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), calculatePaymentDistribution);

// Get payment distribution with filters (status, date range)
router.post('/calculate-filtered', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getDistributionWithFilters);

export {router as paymentDistributionRouter};
