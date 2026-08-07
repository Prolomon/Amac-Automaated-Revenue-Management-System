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

router.post("/", authMiddleware, roleMiddleware(["admin", "it", "agent"]), createTerminal);
router.post("/assign", authMiddleware, roleMiddleware(["admin", "it"]), assignTerminalAction);
router.post("/unassign", authMiddleware, roleMiddleware(["admin", "it"]), unassignTerminalAction);
router.get("/v1/accounts/:accountId/terminals", authMiddleware, getAccountTerminalsAction);
router.get("/accounts/:accountId/terminals", authMiddleware, getAccountTerminalsAction);
router.get("/", authMiddleware, getAllTerminals);
router.get("/:id", authMiddleware, getTerminal);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "it"]), updateTerminal);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "it"]), deleteTerminal);

export { router as terminalRouter };
