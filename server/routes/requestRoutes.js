import express from 'express';
import {
  createRequest,
  getAllRequests,
  getRequestById,
  getRequestsByMember,
  getRequestsByAdmin,
  getRequestsByPayment,
  getRequestsByCenter,
  updateRequest,
  updateRequestStatus,
  approveRequest,
  deleteRequest,
} from '../controller/requestController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Create request (member, agent, company, admin, staff, it)
router.post('/', authMiddleware, roleMiddleware(['user', 'member', 'admin', 'agent', 'company', 'staff', 'it']), createRequest);

// Get all requests with filters & pagination
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getAllRequests);

// Get request by ID
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getRequestById);

// Get requests by Member ID
router.get('/member/:memberId', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getRequestsByMember);

// Get requests by Admin ID
router.get('/admin/:adminId', authMiddleware, roleMiddleware(['admin', 'it', 'staff']), getRequestsByAdmin);

// Get requests by Payment ID
router.get('/payment/:paymentId', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getRequestsByPayment);

// Get requests by Center ID
router.get('/center/:centerId', authMiddleware, roleMiddleware(['admin', 'it', 'staff']), getRequestsByCenter);

// Update request
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'member', 'staff']), updateRequest);

// Approve / update request status
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'it', 'staff']), updateRequestStatus);
router.put('/:id/approve', authMiddleware, roleMiddleware(['admin', 'it', 'staff']), approveRequest);

// Delete request
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'it']), deleteRequest);

export { router as requestRouter };
