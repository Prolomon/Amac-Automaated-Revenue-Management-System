import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  getPropertiesByMember,
  updateProperty,
  deleteProperty,
  uploadImagesController,
} from "../controller/propertyController.js";

const router = express.Router();

router.get("/", getAllProperties);
router.post("/", createProperty);
router.get("/member/:memberId", getPropertiesByMember);
router.post("/upload", uploadImagesController);
router.get("/:id", getPropertyById);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);

export { router as propertyRouter };

