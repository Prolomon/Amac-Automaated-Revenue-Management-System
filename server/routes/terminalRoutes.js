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

router.post("/", authMiddleware, roleMiddleware(["admin", "it", "agent", "staff"]), createTerminal);
router.post("/assign", authMiddleware, roleMiddleware(["admin", "it", "staff"]), assignTerminalAction);
router.post("/unassign", authMiddleware, roleMiddleware(["admin", "it", "staff"]), unassignTerminalAction);
router.get("/v1/accounts/:accountId/terminals", authMiddleware, roleMiddleware(["admin", "it", "staff"]), getAccountTerminalsAction);
router.get("/accounts/:accountId/terminals", authMiddleware, roleMiddleware(["admin", "it", "staff"]), getAccountTerminalsAction);
router.get("/", authMiddleware, roleMiddleware(["admin", "it", "staff"]), getAllTerminals);
router.get("/:id", authMiddleware, roleMiddleware(["admin", "it", "staff"]), getTerminal);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "it", "staff"]), updateTerminal);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "it", "staff"]), deleteTerminal);

export { router as terminalRouter };
