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

router.post("/", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff"]), createWallet);
router.get("/", authMiddleware, roleMiddleware(["admin", "staff"]), getAllWallets);
router.get("/:userId/:role", authMiddleware, roleMiddleware(["member", "admin", "agent", "staff"]), getWalletById);
router.get("/banks", getBanksList);
router.post("/transfer/initiate", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff"]), initiateTransferController);
router.post("/resolve-bank-account", authMiddleware, roleMiddleware(["admin", "agent", "member", "staff"]), resolveBankAccountController);
router.post("/transfer/verify", authMiddleware, roleMiddleware(["admin", "member", "agent", "staff"]), verifyTransfer);
router.put("/:userId/:role", authMiddleware, roleMiddleware(["admin", "agent", "company", "member", "staff"]), updateWallet);

export { router as walletRouter };
  