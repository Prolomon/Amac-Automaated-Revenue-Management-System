import express from 'express';
import { createPayment, getPaymentsByUserId, getPaymentByReference, getPaymentById, getAllPayments, verifyPayment, updatePaymentSchedule, makePayment, getPaymentsByPartnerId, getPaymentsByCenterId, getPaymentForUser, confirmPayment } from '../controller/paymentController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(["it", 'user', "admin", "staff"]), createPayment);

router.post('/make/:userId/:paymentId', authMiddleware, roleMiddleware(["it", 'member', "admin", "staff"]), makePayment);

router.post('/confirm/:userId/:paymentId', confirmPayment);

router.get('/', authMiddleware, roleMiddleware(["it", 'member', 'admin', "staff"]), getAllPayments);

router.get('/user/:userId', authMiddleware, roleMiddleware(["it", 'member', "admin", 'company', "staff"]), getPaymentsByUserId);

router.get('/reference/:reference', authMiddleware, roleMiddleware(["it", 'member', "admin", 'company', "staff"]), getPaymentByReference);

router.get('/:id', authMiddleware, roleMiddleware(["it", 'member', "member", 'company']), getPaymentById);

router.get('/verify/:id', verifyPayment);

router.get('/pay-now/:id', getPaymentForUser);

router.put('/schedule/:id', authMiddleware, roleMiddleware(["it", 'admin', "staff"]), updatePaymentSchedule);

router.get('/partner/:partnerId', authMiddleware, roleMiddleware(['admin', 'it', 'company', "staff"]), getPaymentsByPartnerId);

router.get('/center/:centerId', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getPaymentsByCenterId);

export {router as paymentRouter};
   