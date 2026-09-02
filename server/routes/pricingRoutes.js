import express from "express";
import { 
  createPricing, 
  getAllPricing, 
  getPricing, 
  updatePricing, 
  deletePricing,
  toggleStatus
} from '../controller/pricingController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), createPricing);
router.get('/:id/all', getAllPricing);
router.get('/:id', getPricing);
router.put('/:id/toggle-status', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), toggleStatus);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), updatePricing);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), deletePricing);

export {router as pricingRouter};
