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

router.post("/", authMiddleware, roleMiddleware(["it", "admin", "staff", "company"]),createCompany);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password",authMiddleware, roleMiddleware(["it", 'company', "admin", "staff", "company"]), changePassword);
router.get("/", authMiddleware, roleMiddleware(["it", 'company', "admin", "staff", "company"]), getCompanies);
router.get("/center/:center", authMiddleware, roleMiddleware(["it", 'company', "admin", "staff", "company"]), getCompaniesByCenter);
router.get("/:uid", authMiddleware, roleMiddleware(["it", 'company', "admin", "staff", "company"]), getCompany);
router.post("/login", loginCompany);
router.put("/:uid", authMiddleware, roleMiddleware(["it", 'company', "admin", "staff", "company"]), updateCompany);
router.delete("/:uid", authMiddleware, roleMiddleware(["it", 'company', "admin", "staff", "company"]), deleteCompany);

export { router as companyRouter };