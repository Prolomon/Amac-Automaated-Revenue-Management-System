import express from "express";
import {
  createITStaff,
  getITStaffs,
  getITStaff,
  updateITStaff,
  deleteITStaff,
  loginITStaff,
  changePassword,
} from "../controller/itStaffController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["it", "admin"]), createITStaff);
router.get("/", authMiddleware, roleMiddleware(["it", "admin", "it_staff"]), getITStaffs);
router.get("/:uid", authMiddleware, roleMiddleware(["it", "admin", "it_staff"]), getITStaff);
router.put("/:uid", authMiddleware, roleMiddleware(["it", "admin"]), updateITStaff);
router.delete("/:uid", authMiddleware, roleMiddleware(["it", "admin"]), deleteITStaff);
router.post("/:uid/change-password", authMiddleware, roleMiddleware(["it", "admin", "it_staff"]), changePassword);
router.post("/login", loginITStaff);

export { router as itStaffRouter };
