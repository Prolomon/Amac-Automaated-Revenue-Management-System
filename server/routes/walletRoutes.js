import express from "express";
import {
  createWallet,
  getWalletById,
  getAllWallets,
  initiateTransferController,
  resolveBankAccountController,
  getBanksList,
  verifyTransfer,
  updateWallet,
} from "../controller/walletController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff", "it", "company"]), createWallet);
router.get("/", authMiddleware, roleMiddleware(["admin", "staff", "it"]), getAllWallets);
router.get("/:userId/:role", authMiddleware, roleMiddleware(["member", "admin", "agent", "staff", "it", "company"]), getWalletById);
router.get("/banks", getBanksList);
router.post("/transfer/initiate", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff", "it", "company"]), initiateTransferController);
router.post("/resolve-bank-account", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff", "it", "company"]), resolveBankAccountController);
router.post("/transfer/verify", authMiddleware, roleMiddleware(["admin", "member", "agent", "staff", "it", "company"]), verifyTransfer);
router.put("/:userId/:role", authMiddleware, roleMiddleware(["admin", "agent", "company", "member", "staff", "it", "company"]), updateWallet);

export { router as walletRouter };
  