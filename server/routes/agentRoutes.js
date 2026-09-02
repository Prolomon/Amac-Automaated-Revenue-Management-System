import express from 'express';
import { 
  createAgent, 
  getAllAgents, 
  getAgentList,
  getAgent, 
  getAgentById, 
  updateAgent, 
  deleteAgent, 
  loginAgent,
  forgotPassword,
  getAllAgentsByCenter,
  getAllAgentsByCompany,
} from '../controller/agentController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin', 'it', "company", "staff"]), createAgent);
router.post('/login', loginAgent);
router.put('/:uid/forgot-password', authMiddleware, roleMiddleware(['admin', 'it', 'agent', "staff", "company"]), forgotPassword);
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getAllAgents);
router.get('/center/:id', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getAllAgentsByCenter);
router.get('/company/:company', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getAllAgentsByCompany);
router.get('/list', getAgentList);
router.get('/id/:id', authMiddleware, roleMiddleware(['admin', 'it', "agent", "staff", "company"]), getAgentById);
router.get('/one/:uid', authMiddleware, roleMiddleware(['admin', 'it', "agent", "member", "staff", "company"]), getAgent);
router.put('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "agent", "staff", "company"]), updateAgent);
router.delete('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), deleteAgent);

export {router as agentRouter};
