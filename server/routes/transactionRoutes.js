import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUserId,
  getTransactionsByReference,
} from '../controller/transactionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin']), createTransaction);
router.get('/', authMiddleware, roleMiddleware(['admin', 'it']), getAllTransactions);
router.get('/user/:userId', authMiddleware, roleMiddleware(['member', 'admin', 'agent', 'company', 'it']), getTransactionsByUserId);
router.get('/reference', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'agent', 'company']), getTransactionsByReference);
router.get('/:id', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'agent', 'company']), getTransactionById);

export { router as transactionRouter };