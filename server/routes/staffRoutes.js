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

router.post("/", authMiddleware, roleMiddleware(['admin', "staff"]), createStaff);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password", authMiddleware, roleMiddleware(['admin', "staff"]), changePassword);
router.get("/", authMiddleware, roleMiddleware(['admin', "staff"]), getStaffs);
router.get("/center/:center", authMiddleware, roleMiddleware(['admin', "staff"]), getStaffsByCenter);
router.get("/:uid", authMiddleware, roleMiddleware(['admin', "staff"]), getStaff);
router.put("/:uid", authMiddleware, roleMiddleware(['admin', "staff"]), updateStaff);
router.delete("/:uid", authMiddleware, roleMiddleware(['admin', "staff"]), deleteStaff);
router.post("/login", loginStaff);

export { router as staffRouter };