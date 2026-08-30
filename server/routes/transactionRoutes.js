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

router.post('/', authMiddleware, roleMiddleware(['admin', "staff"]), createTransaction);
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAllTransactions);
router.get('/user/:userId', authMiddleware, roleMiddleware(['member', 'admin', 'agent', 'company', 'it', "staff"]), getTransactionsByUserId);
router.get('/reference', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'agent', 'company', "staff"]), getTransactionsByReference);
router.get('/:id', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'agent', 'company', "staff"]), getTransactionById);

export { router as transactionRouter };