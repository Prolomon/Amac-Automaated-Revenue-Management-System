import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUserId,
  getTransactionsByReference,
  getStatement,
} from '../controller/transactionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), createTransaction);
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getAllTransactions);
router.get('/statement', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company', "company"]), getStatement);
router.get('/user/:userId', authMiddleware, roleMiddleware(['member', 'admin', 'agent', 'company', 'it', "staff", "company"]), getTransactionsByUserId);
router.get('/reference', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'agent', 'company', "staff", "company"]), getTransactionsByReference);
router.get('/:id', authMiddleware, roleMiddleware(['member', 'admin', 'it', 'agent', 'company', "staff", "company"]), getTransactionById);

export { router as transactionRouter };