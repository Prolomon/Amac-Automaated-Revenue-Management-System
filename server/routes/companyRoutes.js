import express from "express";
import {
  createCompany,
  getCompanies,
  getCompaniesByCenter,
  getCompany,
  updateCompany,
  deleteCompany,
  resetPassword,
  loginCompany,
  changePassword,
} from "../controller/companyController.js";
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]),createCompany);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password",authMiddleware, roleMiddleware(['company', "admin"]), changePassword);
router.get("/", authMiddleware, roleMiddleware(['company', "admin"]), getCompanies);
router.get("/center/:center", authMiddleware, roleMiddleware(['company', "admin"]), getCompaniesByCenter);
router.get("/:uid", authMiddleware, roleMiddleware(['company', "admin"]), getCompany);
router.post("/login", loginCompany);
router.put("/:uid", authMiddleware, roleMiddleware(['company', "admin"]), updateCompany);
router.delete("/:uid", authMiddleware, roleMiddleware(['company', "admin"]), deleteCompany);

export { router as companyRouter };