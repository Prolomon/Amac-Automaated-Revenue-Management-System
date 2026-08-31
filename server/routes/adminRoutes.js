import express from 'express';
import { 
  createAdmin, 
  getAllAdmins, 
  getAdmin, 
  getAdminById,
  updateAdmin, 
  deleteAdmin, 
  loginAdmin,
  forgotPassword,
  changePassword,
  updatePaymentConfig,
  updateAdminStatus,
  dashboardStats
} from '../controller/adminController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/',  createAdmin);
router.post('/login', loginAdmin);
router.post('/:uid/forgot-password', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), forgotPassword);
router.put('/:uid/change-password', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), changePassword);
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAllAdmins);
router.get('/id/:id', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAdminById);
router.get('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAdmin);
router.put('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), updateAdmin);
router.put('/:uid/status', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), updateAdminStatus);
router.put('/:uid/payment-config', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), updatePaymentConfig);
router.delete('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), deleteAdmin);
router.get('/dashboard/:center/stats', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), dashboardStats);

export {router as adminRouter};
