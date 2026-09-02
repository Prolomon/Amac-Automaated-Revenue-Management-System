import express from 'express';
const router = express.Router();
import {
  createMember,
  getMembers,
  getMember,
  getMembersByAgentId,
  updateMember, 
  deleteMember,
  login,
  forgotPassword,
  updateBillingFrequency,
  updateBalance,
  updateDueBalance,
  pricingAction,
  changeMemberAgent,
  changeMemberCompany,
  getMembersByCompanyId,
  getMembersByPricingId,
  getAllMembers
} from '../controller/memberController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

router.post('/login', loginLimiter, login);
router.post('/forgot-password/:id', authMiddleware, roleMiddleware(['member', 'admin', "staff", "it", "company"]), forgotPassword);
router.post('/', createMember);
router.get('/all', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), getAllMembers);
router.get('/:id/center', authMiddleware, roleMiddleware(['member', "admin", "staff", "it", "company"]), getMembers);
router.get('/agent/:agentId', authMiddleware, roleMiddleware(['admin', 'it', 'agent', "staff", "it", "company"]), getMembersByAgentId);
router.get('/company/:companyId', authMiddleware, roleMiddleware(['admin', 'it', 'partner', "staff", "it", "company"]), getMembersByCompanyId);
router.put('/change-agent', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), changeMemberAgent);
router.put('/change-company', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), changeMemberCompany);
router.get('/:id', authMiddleware, roleMiddleware(['member', "admin", "agent", 'partner', 'it', "staff", "it", "company"]), getMember);
router.put('/:id', authMiddleware, roleMiddleware(['member', "admin", "staff", "it", "company"]), updateMember);
router.patch('/:id/billing-frequency', authMiddleware, roleMiddleware(['member', "admin", "staff", "it", "company"]), updateBillingFrequency);
router.put('/:id/pricing-action', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), pricingAction);
router.patch('/:id/balance', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), updateBalance);
router.patch('/:id/due-balance', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), updateDueBalance);
router.get('/pricing/:pricingId', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it", "company"]), getMembersByPricingId);
router.delete('/:id', authMiddleware, roleMiddleware(['member', "admin", "staff", "it", "company"]), deleteMember);

export {router as memberRouter};
