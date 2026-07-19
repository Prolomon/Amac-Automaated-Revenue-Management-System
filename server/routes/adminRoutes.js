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
} from '../controller/adminController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/',  createAdmin);
router.post('/login', loginAdmin);
router.post('/:uid/forgot-password', authMiddleware, roleMiddleware(['admin']), forgotPassword);
router.put('/:uid/change-password', authMiddleware, roleMiddleware(['admin']), changePassword);
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllAdmins);
router.get('/id/:id', authMiddleware, roleMiddleware(['admin']), getAdminById);
router.get('/:uid', authMiddleware, roleMiddleware(['admin']), getAdmin);
router.put('/:uid', authMiddleware, roleMiddleware(['admin']), updateAdmin);
router.put('/:uid/status', authMiddleware, roleMiddleware(['admin']), updateAdminStatus);
router.put('/:uid/payment-config', authMiddleware, roleMiddleware(['admin']), updatePaymentConfig);
router.delete('/:uid', authMiddleware, roleMiddleware(['admin']), deleteAdmin);

export {router as adminRouter};
