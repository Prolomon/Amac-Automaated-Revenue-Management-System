import express from "express";
import {
  createDocument,
  getDocumentsByMember,
  getDocumentById,
  updateDocumentStatus,
  updateDocument,
  deleteDocument,
} from "../controller/documentController.js";

const router = express.Router();

router.post("/", createDocument);
router.get("/member/:memberId", getDocumentsByMember);
router.get("/:id", getDocumentById);
router.patch("/:id/status", updateDocumentStatus);
router.put("/:id/status", updateDocumentStatus);
router.patch("/:id", updateDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export { router as documentRouter };
