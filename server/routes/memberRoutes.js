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
  getMembersByPricingId
} from '../controller/memberController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

router.post('/login', loginLimiter, login);
router.post('/forgot-password/:id', authMiddleware, roleMiddleware(['member', 'admin', "staff"]), forgotPassword);
router.post('/', createMember);
router.get('/:id/center', authMiddleware, roleMiddleware(['member', "admin", "staff"]), getMembers);
router.get('/agent/:agentId', authMiddleware, roleMiddleware(['admin', 'agent', "staff"]), getMembersByAgentId);
router.get('/company/:companyId', authMiddleware, roleMiddleware(['admin', 'partner', "staff"]), getMembersByCompanyId);
router.put('/change-agent', authMiddleware, roleMiddleware(['admin', "staff"]), changeMemberAgent);
router.put('/change-company', authMiddleware, roleMiddleware(['admin', "staff"]), changeMemberCompany);
router.get('/:id', authMiddleware, roleMiddleware(['member', "admin", "agent", 'partner', 'it', "staff"]), getMember);
router.put('/:id', authMiddleware, roleMiddleware(['member', "admin", "staff"]), updateMember);
router.patch('/:id/billing-frequency', authMiddleware, roleMiddleware(['member', "admin", "staff"]), updateBillingFrequency);
router.put('/:id/pricing-action', authMiddleware, roleMiddleware(['admin', "staff"]), pricingAction);
router.patch('/:id/balance', authMiddleware, roleMiddleware(['admin', "staff"]), updateBalance);
router.patch('/:id/due-balance', authMiddleware, roleMiddleware(['admin', "staff"]), updateDueBalance);
router.get('/pricing/:pricingId', authMiddleware, roleMiddleware(['admin', "staff"]), getMembersByPricingId);
router.delete('/:id', authMiddleware, roleMiddleware(['member', "admin", "staff"]), deleteMember);

export {router as memberRouter};
