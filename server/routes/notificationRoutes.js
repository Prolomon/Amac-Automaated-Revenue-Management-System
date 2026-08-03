import express from 'express';
import { createNotification, getNotificationsByUser } from '../controller/notificationController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['user']), createNotification);
router.get('/:userId', authMiddleware, roleMiddleware(['user', 'agent', 'admin', 'company', 'staff', 'member', 'checkout', 'it']), getNotificationsByUser);

export {router as notificationRouter};
