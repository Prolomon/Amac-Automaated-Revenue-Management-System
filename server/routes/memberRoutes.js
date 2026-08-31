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
router.post('/forgot-password/:id', authMiddleware, roleMiddleware(['member', 'admin', "staff", "it"]), forgotPassword);
router.post('/', createMember);
router.get('/all', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), getAllMembers);
router.get('/:id/center', authMiddleware, roleMiddleware(['member', "admin", "staff", "it"]), getMembers);
router.get('/agent/:agentId', authMiddleware, roleMiddleware(['admin', 'it', 'agent', "staff", "it"]), getMembersByAgentId);
router.get('/company/:companyId', authMiddleware, roleMiddleware(['admin', 'it', 'partner', "staff", "it"]), getMembersByCompanyId);
router.put('/change-agent', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), changeMemberAgent);
router.put('/change-company', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), changeMemberCompany);
router.get('/:id', authMiddleware, roleMiddleware(['member', "admin", "agent", 'partner', 'it', "staff", "it"]), getMember);
router.put('/:id', authMiddleware, roleMiddleware(['member', "admin", "staff", "it"]), updateMember);
router.patch('/:id/billing-frequency', authMiddleware, roleMiddleware(['member', "admin", "staff", "it"]), updateBillingFrequency);
router.put('/:id/pricing-action', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), pricingAction);
router.patch('/:id/balance', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), updateBalance);
router.patch('/:id/due-balance', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), updateDueBalance);
router.get('/pricing/:pricingId', authMiddleware, roleMiddleware(['admin', 'it', "staff", "it"]), getMembersByPricingId);
router.delete('/:id', authMiddleware, roleMiddleware(['member', "admin", "staff", "it"]), deleteMember);

export {router as memberRouter};
