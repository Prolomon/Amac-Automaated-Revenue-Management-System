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
  adminApproveRequest,
  approveRequest,
  rejectRequest,
  deleteRequest,
} from '../controller/requestController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Create request (member, agent, company, admin, staff, it)
router.post('/', createRequest);

// Get all requests with filters & pagination
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getAllRequests);

// Get request by ID
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getRequestById);

// Get requests by Member ID
router.get('/member/:memberId', authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getRequestsByMember);

// Get requests by Admin ID
router.get('/admin/:adminId', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), getRequestsByAdmin);

// Get requests by Payment ID
router.get('/payment/:paymentId', getRequestsByPayment);

// Get requests by Center ID
router.get('/center/:centerId', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), getRequestsByCenter);

// Update request
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'member', 'staff', "company"]), updateRequest);

// Approve / update request status
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), updateRequestStatus);
// First-level admin approval (records adminId, keeps PENDING for executive)
router.put('/:id/admin-approve', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), adminApproveRequest);
// Executive Administrator / Viewer final approval (uses approverId, applies discount to payment)
router.put('/:id/approve', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), approveRequest);
// Reject request
router.put('/:id/reject', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), rejectRequest);

// Delete request
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'it', 'staff', "company"]), deleteRequest);

export { router as requestRouter };
