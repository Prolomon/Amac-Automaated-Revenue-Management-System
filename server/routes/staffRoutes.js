import express from "express";
import {
  createStaff,
  getStaffs,
  getStaffsByCenter,
  getStaff,
  updateStaff,
  deleteStaff,
  resetPassword,
  changePassword,
  loginStaff,
} from "../controller/staffController.js";
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), createStaff);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), changePassword);
router.get("/", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getStaffs);
router.get("/center/:center", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getStaffsByCenter);
router.get("/:uid", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), getStaff);
router.put("/:uid", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), updateStaff);
router.delete("/:uid", authMiddleware, roleMiddleware(['admin', 'it', "staff", "company"]), deleteStaff);
router.post("/login", loginStaff);

export { router as staffRouter };