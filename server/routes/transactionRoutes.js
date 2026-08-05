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
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllTransactions);
router.get('/user/:userId', authMiddleware, roleMiddleware(['member', 'admin']), getTransactionsByUserId);
router.get('/reference', authMiddleware, roleMiddleware(['member', 'admin']), getTransactionsByReference);
router.get('/:id', authMiddleware, roleMiddleware(['member', 'admin']), getTransactionById);

export { router as transactionRouter };