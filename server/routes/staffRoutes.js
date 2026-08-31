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

router.post("/", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), createStaff);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), changePassword);
router.get("/", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getStaffs);
router.get("/center/:center", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getStaffsByCenter);
router.get("/:uid", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), getStaff);
router.put("/:uid", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), updateStaff);
router.delete("/:uid", authMiddleware, roleMiddleware(['admin', 'it', "staff"]), deleteStaff);
router.post("/login", loginStaff);

export { router as staffRouter };