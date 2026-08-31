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

router.post("/", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff", "it"]), createWallet);
router.get("/", authMiddleware, roleMiddleware(["admin", "staff", "it"]), getAllWallets);
router.get("/:userId/:role", authMiddleware, roleMiddleware(["member", "admin", "agent", "staff", "it"]), getWalletById);
router.get("/banks", getBanksList);
router.post("/transfer/initiate", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff", "it"]), initiateTransferController);
router.post("/resolve-bank-account", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff", "it"]), resolveBankAccountController);
router.post("/transfer/verify", authMiddleware, roleMiddleware(["admin", "member", "agent", "staff", "it"]), verifyTransfer);
router.put("/:userId/:role", authMiddleware, roleMiddleware(["admin", "agent", "company", "member", "staff", "it"]), updateWallet);

export { router as walletRouter };
  