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
router.post('/forgot-password/:id', authMiddleware, roleMiddleware(['member', 'admin']), forgotPassword);
router.post('/', createMember);
router.get('/:id/center', authMiddleware, roleMiddleware(['member', "admin"]), getMembers);
router.get('/agent/:agentId', authMiddleware, roleMiddleware(['admin', 'agent']), getMembersByAgentId);
router.get('/company/:companyId', authMiddleware, roleMiddleware(['admin', 'partner']), getMembersByCompanyId);
router.put('/change-agent', authMiddleware, roleMiddleware(['admin']), changeMemberAgent);
router.put('/change-company', authMiddleware, roleMiddleware(['admin']), changeMemberCompany);
router.get('/:id', authMiddleware, roleMiddleware(['member', "admin", "agent", 'partner', 'it']), getMember);
router.put('/:id', authMiddleware, roleMiddleware(['member', "admin"]), updateMember);
router.patch('/:id/billing-frequency', authMiddleware, roleMiddleware(['member', "admin"]), updateBillingFrequency);
router.put('/:id/pricing-action', authMiddleware, roleMiddleware(['admin']), pricingAction);
router.patch('/:id/balance', authMiddleware, roleMiddleware(['admin']), updateBalance);
router.patch('/:id/due-balance', authMiddleware, roleMiddleware(['admin']), updateDueBalance);
router.get('/pricing/:pricingId', authMiddleware, roleMiddleware(['admin']), getMembersByPricingId);
router.delete('/:id', authMiddleware, roleMiddleware(['member', "admin"]), deleteMember);

export {router as memberRouter};
