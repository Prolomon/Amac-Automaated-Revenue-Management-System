import { customAlphabet } from "nanoid";
import { prisma } from "../config/db.js";
import { processCapturedImage } from "../service/sharp.js";

const generatePid = customAlphabet("0123456789", 8);

export const generateUniquePropertyPid = async () => {
  let pid;
  let exists = true;
  while (exists) {
    pid = `PID-${generatePid()}`;
    const found = await prisma.property.findFirst({ where: { pid } });
    if (!found) exists = false;
  }
  return pid;
};

/**
 * Field Enumerator submits a direct camera capture (saved as a Property)
 * Enforces:
 * - Minimum 3 images, maximum 8 images
 * - sharp image clarification
 * - Status: PENDING
 * - Links to enumerator and supervisor
 */
export const submitCapture = async (req, res) => {
  try {
    const enumeratorUid = req.userId;
    const {
      name,
      type = "Commercial",
      size = "Standard",
      address,
      location,
      images,
      center,
      zone,
    } = req.body;

    if (!images || !Array.isArray(images) || images.length < 3) {
      return res.status(400).json({
        ok: false,
        message: "You must capture and upload a minimum of 3 live photos (maximum 8).",
      });
    }

    if (images.length > 8) {
      return res.status(400).json({
        ok: false,
        message: "A maximum of 8 photos is permitted per capture.",
      });
    }

    if (!address || String(address).trim().length < 3) {
      return res.status(400).json({
        ok: false,
        message: "Physical property address is required.",
      });
    }

    // Process and clarify images via sharp
    const processedImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      try {
        if (typeof img === "string" && img.startsWith("data:image")) {
          const result = await processCapturedImage(img);
          processedImages.push(result.dataUri);
        } else {
          processedImages.push(img);
        }
      } catch (err) {
        console.warn(`Sharp processing notice on image ${i}:`, err.message);
        processedImages.push(img);
      }
    }

    // Lookup enumerator to obtain center, zone, and assigned supervisor
    const enumerator = await prisma.enumerator.findUnique({
      where: { uid: enumeratorUid },
      select: { uid: true, center: true, zone: true, supervisorId: true },
    });

    const propCenter = center || enumerator?.center || null;
    const propZone = zone || enumerator?.zone || null;
    const supervisorId = enumerator?.supervisorId || null;

    const pid = `PID-${generatePid()}`;
    const propName = name ? String(name).trim() : `Premises - ${address.slice(0, 30)}`;

    const property = await prisma.property.create({
      data: {
        pid,
        name: propName,
        type: String(type).trim(),
        size: String(size).trim(),
        address: String(address).trim(),
        location: location || null,
        images: processedImages,
        center: propCenter,
        zone: propZone,
        status: "PENDING",
        reward: 50.0,
        enumeratorId: enumeratorUid,
        supervisorId,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Property captured and submitted for review successfully.",
      data: property,
    });
  } catch (error) {
    console.error("submitCapture error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Failed to submit property capture",
    });
  }
};

/**
 * List captures / properties with filtering
 */
export const getCaptures = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
    const skip = (page - 1) * limit;

    const { status, enumeratorId, supervisorId, center, search } = req.query;

    const where = {};

    // If caller is basic enumerator, lock to their own submissions
    if (req.userType === "enumerator" && req.user?.level === "BASIC") {
      where.enumeratorId = req.userId;
    } else if (req.userType === "enumerator" && req.user?.level === "SUPER") {
      // Supervisor defaults to their team's submissions unless specified
      if (enumeratorId) {
        where.enumeratorId = enumeratorId;
      } else {
        where.OR = [
          { supervisorId: req.userId },
          { enumeratorId: req.userId },
        ];
      }
    } else {
      if (enumeratorId) where.enumeratorId = enumeratorId;
      if (supervisorId) where.supervisorId = supervisorId;
    }

    if (status && ["PENDING", "APPROVED", "DENIED"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    if (center && center !== "all") {
      where.center = center;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { pid: { contains: q, mode: "insensitive" } },
            { type: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          enumerator: {
            select: { uid: true, name: true, phone: true, email: true, center: true },
          },
          member: {
            select: { uid: true, fullname: true, businessName: true, phone: true },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getCaptures error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Get single property / capture detail
 */
export const getCaptureById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { pid: id }],
      },
      include: {
        enumerator: {
          select: { uid: true, name: true, phone: true, email: true, center: true, avatar: true },
        },
        member: {
          select: { uid: true, fullname: true, businessName: true, phone: true, email: true },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ ok: false, message: "Property not found" });
    }

    return res.status(200).json({
      ok: true,
      data: property,
    });
  } catch (error) {
    console.error("getCaptureById error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Supervisor reviews a Property capture:
 * - APPROVE: updates status to APPROVED, credits ₦50 to enumerator wallet
 * - DENY: updates status to DENIED with rejectionReason (never deletes record)
 */
export const reviewProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!["APPROVE", "DENY"].includes(action?.toUpperCase())) {
      return res.status(400).json({
        ok: false,
        message: "Action must be either APPROVE or DENY",
      });
    }

    const isApprove = action.toUpperCase() === "APPROVE";

    if (!isApprove && (!rejectionReason || String(rejectionReason).trim().length < 2)) {
      return res.status(400).json({
        ok: false,
        message: "A rejection reason is required when denying a capture.",
      });
    }

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { pid: id }],
      },
    });

    if (!property) {
      return res.status(404).json({ ok: false, message: "Property record not found" });
    }

    const updatedProperty = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id: property.id },
        data: {
          status: isApprove ? "APPROVED" : "DENIED",
          rejectionReason: isApprove ? null : String(rejectionReason).trim(),
          approvedAt: isApprove ? new Date() : null,
        },
      });

      // Credit ₦50 reward if approved and not previously approved
      if (isApprove && property.status !== "APPROVED" && property.enumeratorId) {
        await tx.wallet.updateMany({
          where: { userId: property.enumeratorId },
          data: {
            balance: {
              increment: property.reward || 50.0,
            },
          },
        });
      }

      return updated;
    });

    return res.status(200).json({
      ok: true,
      message: isApprove
        ? "Property approved successfully and ₦50 reward credited to enumerator."
        : "Property capture has been denied with feedback preserved.",
      data: updatedProperty,
    });
  } catch (error) {
    console.error("reviewProperty error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Supervisor reviews a Member/Entity registered by an enumerator:
 * - APPROVE: sets enumerationStatus = APPROVED, credits ₦50 to enumerator wallet
 * - DENY: sets enumerationStatus = DENIED with reason (never deletes)
 */
export const reviewMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!["APPROVE", "DENY"].includes(action?.toUpperCase())) {
      return res.status(400).json({
        ok: false,
        message: "Action must be either APPROVE or DENY",
      });
    }

    const isApprove = action.toUpperCase() === "APPROVE";

    if (!isApprove && (!rejectionReason || String(rejectionReason).trim().length < 2)) {
      return res.status(400).json({
        ok: false,
        message: "A rejection reason is required when denying a registration.",
      });
    }

    const member = await prisma.member.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member record not found" });
    }

    const updatedMember = await prisma.$transaction(async (tx) => {
      const updated = await tx.member.update({
        where: { id: member.id },
        data: {
          enumerationStatus: isApprove ? "APPROVED" : "DENIED",
          rejectionReason: isApprove ? null : String(rejectionReason).trim(),
          status: isApprove ? true : false,
        },
      });

      // Credit ₦50 reward if approved and not previously approved
      if (isApprove && member.enumerationStatus !== "APPROVED" && member.enumeratorId) {
        await tx.wallet.updateMany({
          where: { userId: member.enumeratorId },
          data: {
            balance: {
              increment: member.reward || 50.0,
            },
          },
        });
      }

      return updated;
    });

    return res.status(200).json({
      ok: true,
      message: isApprove
        ? "Entity registration approved successfully and ₦50 reward credited to enumerator."
        : "Entity registration has been denied with feedback preserved.",
      data: updatedMember,
    });
  } catch (error) {
    console.error("reviewMember error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};
