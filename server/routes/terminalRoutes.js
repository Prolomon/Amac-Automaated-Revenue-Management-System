import express from "express";
import {
  createTerminal,
  getAllTerminals,
  getTerminal,
  updateTerminal,
  deleteTerminal,
  assignTerminalAction,
  unassignTerminalAction,
  getAccountTerminalsAction,
} from "../controller/terminalController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin", "it", "agent", "staff", "company"]), createTerminal);
router.post("/assign", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), assignTerminalAction);
router.post("/unassign", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), unassignTerminalAction);
router.get("/v1/accounts/:accountId/terminals", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), getAccountTerminalsAction);
router.get("/accounts/:accountId/terminals", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), getAccountTerminalsAction);
router.get("/", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), getAllTerminals);
router.get("/:id", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), getTerminal);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), updateTerminal);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "it", "staff", "company"]), deleteTerminal);

export { router as terminalRouter };
