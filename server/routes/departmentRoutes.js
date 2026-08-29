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

router.post("/", authMiddleware, roleMiddleware(["admin"]), createDepartment);
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getDepartments
);
router.get(
  "/center/:center",
  authMiddleware,
  roleMiddleware(["admin"]),
  getDepartmentsByCenter
);
router.get(
  "/:uid",
  authMiddleware,
  roleMiddleware(["admin"]),
  getDepartment
);
router.put(
  "/:uid",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateDepartment
);
router.delete(
  "/:uid",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteDepartment
);

export { router as departmentRouter };
