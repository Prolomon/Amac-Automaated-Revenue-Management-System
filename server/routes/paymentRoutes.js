import express from 'express';
import { createPayment, getPaymentsByUserId, getPaymentByReference, getPaymentById, getAllPayments, verifyPayment, updatePaymentSchedule, makePayment, getPaymentsByPartnerId, getPaymentsByCenterId, getPaymentForUser, confirmPayment } from '../controller/paymentController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['user', "admin"]), createPayment);

router.post('/make/:userId/:paymentId', authMiddleware, roleMiddleware(['member', "admin"]), makePayment);

router.post('/confirm/:userId/:paymentId', confirmPayment);

router.get('/', authMiddleware, roleMiddleware(['member', 'admin']), getAllPayments);

router.get('/user/:userId', authMiddleware, roleMiddleware(['member', "admin", 'company']), getPaymentsByUserId);

router.get('/reference/:reference', authMiddleware, roleMiddleware(['member', "admin", 'company']), getPaymentByReference);

router.get('/:id', authMiddleware, roleMiddleware(['member', "member", 'company']), getPaymentById);

router.get('/verify/:id', verifyPayment);

router.get('/pay-now/:id', getPaymentForUser);

router.put('/schedule/:id', authMiddleware, roleMiddleware(['admin']), updatePaymentSchedule);

router.get('/partner/:partnerId', authMiddleware, roleMiddleware(['admin', 'company']), getPaymentsByPartnerId);

router.get('/center/:centerId', authMiddleware, roleMiddleware(['admin']), getPaymentsByCenterId);

export {router as paymentRouter};
   