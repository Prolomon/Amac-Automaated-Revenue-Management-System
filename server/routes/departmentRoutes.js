import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentsByCenter,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controller/departmentController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["it", "admin", "staff", "company"]), createDepartment);
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["it", "admin", "staff", "company"]),
  getDepartments
);
router.get(
  "/center/:center",
  authMiddleware,
  roleMiddleware(["it", "admin", "staff", "company"]),
  getDepartmentsByCenter
);
router.get(
  "/:uid",
  authMiddleware,
  roleMiddleware(["it", "admin", "staff", "company"]),
  getDepartment
);
router.put(
  "/:uid",
  authMiddleware,
  roleMiddleware(["it", "admin", "staff", "company"]),
  updateDepartment
);
router.delete(
  "/:uid",
  authMiddleware,
  roleMiddleware(["it", "admin", "staff", "company"]),
  deleteDepartment
);

export { router as departmentRouter };
