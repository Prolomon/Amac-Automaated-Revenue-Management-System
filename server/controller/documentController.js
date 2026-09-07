import { prisma } from "../config/db.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 16);

const ALLOWED_TYPES = ["nin", "cac", "passport", "voters card", "drivers lincense", "drivers license"];

export const normalizeDocumentStatus = (status) => {
  if (!status) return "PENDING";
  const s = String(status).trim().toUpperCase();
  if (s === "VERIFIED") return "VERIFIED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "PENDING") return "PENDING";
  return null;
};

export const createDocument = async (req, res) => {
  try {
    const { type, number, data = null, memberId, memberType, status } = req.body;

    if (!type || !number || !memberId) {
      return res.status(400).json({
        ok: false,
        message: "Document type, document number, and memberId are required",
      });
    }

    const normalizedType = String(type).trim().toLowerCase();
    if (!ALLOWED_TYPES.includes(normalizedType)) {
      return res.status(400).json({
        ok: false,
        message: `Invalid document type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    // Business type can only use CAC
    if (memberType === "BUSINESS" && normalizedType !== "cac") {
      return res.status(400).json({
        ok: false,
        message: "Business entities must use CAC registration document",
      });
    }

    // Individual type cannot use CAC
    if (memberType === "INDIVIDUAL" && normalizedType === "cac") {
      return res.status(400).json({
        ok: false,
        message: "Individual entities cannot use CAC registration document. Please use NIN, Passport, Voter's Card, or Driver's License.",
      });
    }

    const normalizedStatus = status ? normalizeDocumentStatus(status) : "PENDING";
    if (status && !normalizedStatus) {
      return res.status(400).json({
        ok: false,
        message: "Invalid document status. Allowed: VERIFIED, REJECTED, PENDING",
      });
    }

    const id = `doc_${nanoid()}`;

    const document = await prisma.document.create({
      data: {
        id,
        type: normalizedType,
        number: String(number).trim(),
        data: data || undefined,
        status: normalizedStatus || "PENDING",
        memberId: String(memberId).trim(),
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Document registered successfully",
      document,
    });
  } catch (err) {
    console.error("createDocument error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to create document",
    });
  }
};

export const getDocumentsByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ ok: false, message: "memberId is required" });
    }

    const documents = await prisma.document.findMany({
      where: { memberId: String(memberId).trim() },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      ok: true,
      data: documents,
    });
  } catch (err) {
    console.error("getDocumentsByMember error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to get documents",
    });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            uid: true,
            fullname: true,
            email: true,
            type: true,
            businessName: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ ok: false, message: "Document not found" });
    }

    return res.status(200).json({ ok: true, document });
  } catch (err) {
    console.error("getDocumentById error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to get document",
    });
  }
};

export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, message: "Document id is required" });
    }

    const normalizedStatus = normalizeDocumentStatus(status);
    if (!normalizedStatus) {
      return res.status(400).json({
        ok: false,
        message: "Invalid status. Allowed values: VERIFIED, REJECTED, PENDING",
      });
    }

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Document not found" });
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status: normalizedStatus },
    });

    return res.status(200).json({
      ok: true,
      message: `Document status updated to ${normalizedStatus}`,
      document,
    });
  } catch (err) {
    console.error("updateDocumentStatus error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to update document status",
    });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, number, data, status } = req.body;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Document not found" });
    }

    const updateData = {};
    if (type) {
      const normalizedType = String(type).trim().toLowerCase();
      if (!ALLOWED_TYPES.includes(normalizedType)) {
        return res.status(400).json({
          ok: false,
          message: `Invalid document type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        });
      }
      updateData.type = normalizedType;
    }
    if (number) {
      updateData.number = String(number).trim();
    }
    if (data !== undefined) {
      updateData.data = data;
    }
    if (status !== undefined) {
      const normalizedStatus = normalizeDocumentStatus(status);
      if (!normalizedStatus) {
        return res.status(400).json({
          ok: false,
          message: "Invalid status. Allowed values: VERIFIED, REJECTED, PENDING",
        });
      }
      updateData.status = normalizedStatus;
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      ok: true,
      message: "Document updated successfully",
      document,
    });
  } catch (err) {
    console.error("updateDocument error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to update document",
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Document not found" });
    }

    await prisma.document.delete({ where: { id } });
    return res.status(200).json({ ok: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("deleteDocument error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to delete document",
    });
  }
};
