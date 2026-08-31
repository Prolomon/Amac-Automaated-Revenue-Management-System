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
router.put('/:uid/forgot-password', authMiddleware, roleMiddleware(['admin', 'it', 'agent', "staff"]), forgotPassword);
router.get('/', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAllAgents);
router.get('/center/:id', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAllAgentsByCenter);
router.get('/company/:company', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getAllAgentsByCompany);
router.get('/list', getAgentList);
router.get('/id/:id', authMiddleware, roleMiddleware(['admin', 'it', "agent", "staff"]), getAgentById);
router.get('/one/:uid', authMiddleware, roleMiddleware(['admin', 'it', "agent", "member", "staff"]), getAgent);
router.put('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "agent", "staff"]), updateAgent);
router.delete('/:uid', authMiddleware, roleMiddleware(['admin', 'it', "staff"]), deleteAgent);

export {router as agentRouter};
