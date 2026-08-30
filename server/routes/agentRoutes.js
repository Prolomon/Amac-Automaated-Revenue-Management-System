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

router.post('/', authMiddleware, roleMiddleware(['admin', "company", "staff"]), createAgent);
router.post('/login', loginAgent);
router.put('/:uid/forgot-password', authMiddleware, roleMiddleware(['admin', 'agent', "staff"]), forgotPassword);
router.get('/', authMiddleware, roleMiddleware(['admin', "staff"]), getAllAgents);
router.get('/center/:id', authMiddleware, roleMiddleware(['admin', "staff"]), getAllAgentsByCenter);
router.get('/company/:company', authMiddleware, roleMiddleware(['admin', "staff"]), getAllAgentsByCompany);
router.get('/list', getAgentList);
router.get('/id/:id', authMiddleware, roleMiddleware(['admin', "agent", "staff"]), getAgentById);
router.get('/one/:uid', authMiddleware, roleMiddleware(['admin', "agent", "member", "staff"]), getAgent);
router.put('/:uid', authMiddleware, roleMiddleware(['admin', "agent", "staff"]), updateAgent);
router.delete('/:uid', authMiddleware, roleMiddleware(['admin', "staff"]), deleteAgent);

export {router as agentRouter};
