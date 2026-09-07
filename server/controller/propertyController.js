import { prisma } from "../config/db.js";
import { uploadToCloudinary } from "../service/cloudinary.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 16);
const generatePropertyPidSuffix = customAlphabet("0123456789", 8);

export async function ensurePropertySchema() {
  // Schema is maintained via Prisma ORM
  return;
}

export async function generateUniquePropertyPid() {
  let attempts = 0;
  while (attempts < 10) {
    const candidate = `P-${generatePropertyPidSuffix()}`;
    attempts++;
    try {
      const found = await prisma.property.findUnique({
        where: { pid: candidate },
        select: { id: true },
      });
      if (!found) return candidate;
    } catch {
      return candidate;
    }
  }
  return `P-${generatePropertyPidSuffix()}`;
}

export const createProperty = async (req, res) => {
  try {
    const { name, type, size, images = [], memberId, center } = req.body;

    if (!name || !type || !size) {
      return res.status(400).json({
        ok: false,
        message: "Property name, type, and size are required",
      });
    }

    const imageList = Array.isArray(images) ? images : (images ? [images] : []);
    const cleanName = String(name).trim();
    const cleanType = String(type).trim();
    const cleanSize = String(size).trim();

    // Resolve center
    let cleanCenter = center ? String(center).trim() : null;
    if (!cleanCenter && memberId) {
      try {
        const m = await prisma.member.findUnique({
          where: { uid: String(memberId).trim() },
          select: { center: true },
        });
        if (m?.center) cleanCenter = m.center;
      } catch (cErr) {
        console.warn("Member center lookup notice:", cErr.message);
      }
    }
    if (!cleanCenter && req.user) {
      cleanCenter = req.user.center || (req.user.role === "ADMIN" ? req.user.uid : null) || null;
    }

    // Upload any non-Cloudinary images to Cloudinary
    const uploadedImages = [];
    for (const img of imageList) {
      if (!img) continue;
      const strImg = typeof img === "string" ? img.trim() : "";
      if (!strImg) continue;

      if (strImg.includes("res.cloudinary.com")) {
        uploadedImages.push(strImg);
        continue;
      }

      try {
        const uploadRes = await uploadToCloudinary(strImg, { folder: "amac/properties" });
        if (uploadRes?.url) {
          uploadedImages.push(uploadRes.url);
        } else {
          uploadedImages.push(strImg);
        }
      } catch (uploadErr) {
        console.error("Cloudinary upload failed during property creation:", uploadErr.message || uploadErr);
        uploadedImages.push(strImg);
      }
    }

    // Check if property with same name already exists (case-insensitive)
    let existingProperty = await prisma.property.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } },
    });

    if (existingProperty) {
      let needsUpdate = false;
      const dataToUpdate = {};

      // Backfill pid if missing
      if (!existingProperty.pid) {
        dataToUpdate.pid = await generateUniquePropertyPid();
        needsUpdate = true;
      }

      // Update center if existingProperty has no center and cleanCenter is provided
      if (!existingProperty.center && cleanCenter) {
        dataToUpdate.center = cleanCenter;
        needsUpdate = true;
      }

      // If existing property has no images and new uploaded images were provided, update them
      if (uploadedImages.length > 0 && (!existingProperty.images || existingProperty.images.length === 0)) {
        dataToUpdate.images = uploadedImages;
        needsUpdate = true;
      }

      if (needsUpdate) {
        existingProperty = await prisma.property.update({
          where: { id: existingProperty.id },
          data: dataToUpdate,
        });
      }

      return res.status(200).json({
        ok: true,
        message: "Property already registered",
        property: existingProperty,
      });
    }

    const id = `prop_${nanoid()}`;
    const pid = await generateUniquePropertyPid();
    const targetMemberId = memberId ? String(memberId).trim() : null;

    const property = await prisma.property.create({
      data: {
        id,
        pid,
        name: cleanName,
        type: cleanType,
        size: cleanSize,
        images: uploadedImages,
        center: cleanCenter,
        memberId: targetMemberId,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Property registered successfully",
      property,
    });
  } catch (err) {
    console.error("createProperty error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to create property",
    });
  }
};

export const getPropertiesByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ ok: false, message: "memberId is required" });
    }

    const cleanMemberId = String(memberId).trim();

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { memberId: cleanMemberId },
          { id: cleanMemberId },
          { pid: cleanMemberId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      ok: true,
      data: properties,
    });
  } catch (err) {
    console.error("getPropertiesByMember error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to get properties",
    });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const center = req.query.center && req.query.center !== "ADMIN" && req.query.center !== "all"
      ? String(req.query.center).trim()
      : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 300, 1), 500);
    const skip = (page - 1) * limit;

    const andConditions = [];

    if (center) {
      andConditions.push({
        OR: [
          { center },
          { center: null },
        ],
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { pid: { contains: search, mode: "insensitive" } },
          { type: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.property.count({ where }),
    ]);

    // Calculate membersCount for each property
    const propIds = properties.map((p) => p.id).filter(Boolean);
    const propPids = properties.map((p) => p.pid).filter(Boolean);
    const memberIds = properties.map((p) => p.memberId).filter(Boolean);

    const membersCountMap = {};
    if (properties.length > 0) {
      try {
        const linkedMembers = await prisma.member.findMany({
          where: {
            OR: [
              ...(propIds.length > 0 ? [{ propertyId: { in: propIds } }] : []),
              ...(propPids.length > 0 ? [{ propertyId: { in: propPids } }] : []),
              ...(memberIds.length > 0 ? [{ uid: { in: memberIds } }] : []),
            ],
          },
          select: {
            uid: true,
            propertyId: true,
          },
        });

        for (const p of properties) {
          const matchingUids = new Set();
          for (const m of linkedMembers) {
            if (p.memberId && m.uid === p.memberId) {
              matchingUids.add(m.uid);
            }
            if (m.propertyId && (m.propertyId === p.id || (p.pid && m.propertyId === p.pid))) {
              matchingUids.add(m.uid);
            }
          }
          membersCountMap[p.id] = matchingUids.size;
        }
      } catch (countErr) {
        console.warn("membersCount calculation warning:", countErr.message);
      }
    }

    const data = properties.map((p) => ({
      ...p,
      membersCount: membersCountMap[p.id] || 0,
    }));

    return res.status(200).json({
      ok: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getAllProperties error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to get properties",
    });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ ok: false, message: "Property ID is required" });
    }

    const cleanId = String(id).trim();

    // 1. Fetch Property by id or pid
    const property = await prisma.property.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { pid: cleanId },
        ],
      },
    });

    if (!property) {
      return res.status(404).json({
        ok: false,
        message: "Property not found",
      });
    }

    // 2. Fetch all members using this property
    const memberConditions = [
      { propertyId: property.id },
    ];
    if (property.pid) {
      memberConditions.push({ propertyId: property.pid });
    }
    if (property.memberId) {
      memberConditions.push({ uid: property.memberId });
    }

    let members = [];
    try {
      members = await prisma.member.findMany({
        where: {
          OR: memberConditions,
        },
        select: {
          id: true,
          uid: true,
          fullname: true,
          businessName: true,
          center: true,
          email: true,
          phone: true,
          type: true,
          category: true,
          zone: true,
          status: true,
          avatar: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (mErr) {
      console.warn("Fetch property members notice:", mErr.message);
    }

    // Deduplicate members by uid
    const seenUids = new Set();
    const uniqueMembers = [];
    for (const m of members) {
      if (m.uid && !seenUids.has(m.uid)) {
        seenUids.add(m.uid);
        uniqueMembers.push(m);
      }
    }

    const payload = {
      ...property,
      members: uniqueMembers,
      membersCount: uniqueMembers.length,
    };

    return res.status(200).json({
      ok: true,
      data: payload,
      property: payload,
      members: uniqueMembers,
    });
  } catch (err) {
    console.error("getPropertyById error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to get property",
    });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, size, images, center } = req.body;

    const cleanId = String(id).trim();

    const existing = await prisma.property.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { pid: cleanId },
        ],
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ ok: false, message: "Property not found" });
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = String(name).trim();
    if (type) dataToUpdate.type = String(type).trim();
    if (size) dataToUpdate.size = String(size).trim();
    if (center !== undefined) dataToUpdate.center = center ? String(center).trim() : null;
    if (images !== undefined) {
      const incomingList = Array.isArray(images) ? images : (images ? [images] : []);
      const uploadedUpdatedImages = [];
      for (const item of incomingList) {
        if (!item) continue;
        const strItem = typeof item === "string" ? item.trim() : "";
        if (!strItem) continue;

        if (strItem.includes("res.cloudinary.com")) {
          uploadedUpdatedImages.push(strItem);
        } else {
          try {
            const uploadRes = await uploadToCloudinary(strItem, { folder: "amac/properties" });
            if (uploadRes?.url) {
              uploadedUpdatedImages.push(uploadRes.url);
            } else {
              uploadedUpdatedImages.push(strItem);
            }
          } catch (uErr) {
            console.error("Cloudinary upload error in updateProperty:", uErr.message || uErr);
            uploadedUpdatedImages.push(strItem);
          }
        }
      }
      dataToUpdate.images = uploadedUpdatedImages;
    }

    const updated = await prisma.property.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return res.status(200).json({
      ok: true,
      message: "Property updated successfully",
      property: updated,
    });
  } catch (err) {
    console.error("updateProperty error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to update property",
    });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ ok: false, message: "Property ID is required" });
    }
    const cleanId = String(id).trim();

    const existing = await prisma.property.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { pid: cleanId },
        ],
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ ok: false, message: "Property not found" });
    }

    await prisma.property.delete({
      where: { id: existing.id },
    });

    return res.status(200).json({
      ok: true,
      message: "Property deleted successfully",
    });
  } catch (err) {
    console.error("deleteProperty error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to delete property",
    });
  }
};

export const uploadImagesController = async (req, res) => {
  try {
    const { images = [], image } = req.body;
    const items = Array.isArray(images) && images.length > 0 ? images : (image ? [image] : []);

    if (items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No image payload provided",
      });
    }

    const uploadedUrls = [];
    for (const item of items) {
      const result = await uploadToCloudinary(item, { folder: "amac/properties" });
      if (result?.url) {
        uploadedUrls.push(result.url);
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Images uploaded successfully",
      urls: uploadedUrls,
    });
  } catch (err) {
    console.error("uploadImagesController error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Cloudinary upload failed",
    });
  }
};
