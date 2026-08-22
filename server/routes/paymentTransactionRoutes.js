import express from 'express';
import {
  createPaymentTransaction,
  getPaymentTransactionsByUserId,
  getPaymentTransactionsByPaymentId,
  getPaymentTransactionByReference,
  getAllPaymentTransactions,
  updatePaymentTransaction,
} from '../controller/paymentTransactionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Create a new payment transaction
router.post('/', authMiddleware, roleMiddleware(['member', 'admin', 'company', 'it', 'staff']), createPaymentTransaction);

// Get all payment transactions (admin, it, staff)
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'company', 'member']), getAllPaymentTransactions);

// Get payment transactions by user ID
router.get('/user/:type/:userId', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'company']), getPaymentTransactionsByUserId);

// Get payment transactions by payment ID
router.get('/payment/:paymentId', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'company']), getPaymentTransactionsByPaymentId);

// Get a single payment transaction by reference
router.get('/reference/:reference', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'company']), getPaymentTransactionByReference);

// Update a payment transaction
router.put('/:reference', authMiddleware, roleMiddleware(['admin', 'it']), updatePaymentTransaction);

export default router;
