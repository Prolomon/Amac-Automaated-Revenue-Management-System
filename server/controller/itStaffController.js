import { prisma } from "../config/db.js";
import argon2 from "argon2";
import { customAlphabet } from "nanoid";
import {
  createITStaffSchema,
  updateITStaffSchema,
  changePasswordSchema,
  loginITStaffSchema,
} from "../validator/itStaffValidator.js";
import { generateTokens } from "../service/token.js";
import {
  sendLoginSuccessEmail,
  sendAccountCreationEmail,
  sendResetPasswordEmail,
  sendProfileUpdateEmail,
} from "../core/mail.js";

const generateITStaffUidSuffix = customAlphabet("0123456789", 10);

const iTStaffSafeSelect = {
  id: true,
  uid: true,
  fullname: true,
  email: true,
  phone: true,
  gender: true,
  status: true,
  location: true,
  avatar: true,
  center: true,
  role: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
};

const createITStaff = async (req, res) => {
  try {
    const { error, value } = createITStaffSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const existing = await prisma.iTStaff.findUnique({
      where: { email: value.email },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already exists" });
    }

    let uid;
    let attempts = 0;

    while (!uid && attempts < 5) {
      const candidateUid = `ITS-${generateITStaffUidSuffix()}`;
      const existingWithUid = await prisma.iTStaff.findUnique({
        where: { uid: candidateUid },
        select: { id: true },
      });

      if (!existingWithUid) {
        uid = candidateUid;
      }

      attempts += 1;
    }

    if (!uid) {
      return res.status(500).json({
        ok: false,
        message: "Failed to generate unique IT Staff ID. Please try again.",
      });
    }

    const rawPassword = value.password || customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8)();
    const hashedPassword = await argon2.hash(rawPassword);

    const parsedPermissions =
      typeof value.permissions === "string"
        ? JSON.parse(value.permissions)
        : value.permissions || null;

    const itStaff = await prisma.iTStaff.create({
      data: {
        uid,
        fullname: value.fullname,
        email: value.email,
        phone: value.phone,
        gender: value.gender,
        status: value.status ?? true,
        password: hashedPassword,
        location: value.location ?? null,
        avatar: value.avatar || null,
        center: value.center || "ALL",
        role: value.role || "IT_STAFF",
        permissions: parsedPermissions,
      },
      select: iTStaffSafeSelect,
    });

    sendAccountCreationEmail({
      to: itStaff.email,
      name: itStaff.fullname,
      email: itStaff.email,
      password: rawPassword,
      role: "IT Staff",
    }).catch((emailErr) => {
      console.error("IT Staff welcome email failed:", emailErr?.message || emailErr);
    });

    return res.status(201).json({
      ok: true,
      message: "IT Staff created successfully",
      itStaff,
      temporaryPassword: value.password ? undefined : rawPassword,
    });
  } catch (err) {
    console.error("createITStaff error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

const getITStaffs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : "";

    const where = {};
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { uid: { contains: search, mode: "insensitive" } },
      ];
    }

    if (req.query.status !== undefined) {
      where.status = req.query.status === "true";
    }

    const [itStaffs, total] = await Promise.all([
      prisma.iTStaff.findMany({
        where,
        skip,
        take: limit,
        select: iTStaffSafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.iTStaff.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: itStaffs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getITStaffs error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getITStaff = async (req, res) => {
  try {
    const target = String(req.params.uid);
    const itStaff = await prisma.iTStaff.findFirst({
      where: {
        OR: [{ uid: target }, { id: target }],
      },
      select: iTStaffSafeSelect,
    });

    if (!itStaff) {
      return res.status(404).json({ ok: false, message: "IT Staff not found" });
    }

    return res.status(200).json({
      ok: true,
      message: "IT Staff retrieved successfully",
      itStaff,
    });
  } catch (err) {
    console.error("getITStaff error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateITStaff = async (req, res) => {
  try {
    const target = String(req.params.uid);
    const { error, value } = updateITStaffSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const existing = await prisma.iTStaff.findFirst({
      where: {
        OR: [{ uid: target }, { id: target }],
      },
      select: { id: true, uid: true, email: true, fullname: true },
    });

    if (!existing) {
      return res.status(404).json({ ok: false, message: "IT Staff not found" });
    }

    if (value.email && value.email !== existing.email) {
      const duplicate = await prisma.iTStaff.findUnique({
        where: { email: value.email },
        select: { id: true },
      });
      if (duplicate) {
        return res.status(409).json({ ok: false, message: "Email already in use" });
      }
    }

    const updateData = { ...value };
    if (updateData.password) {
      updateData.password = await argon2.hash(updateData.password);
    }
    if (typeof updateData.permissions === "string") {
      try {
        updateData.permissions = JSON.parse(updateData.permissions);
      } catch (e) {
        // keep as is
      }
    }

    const updated = await prisma.iTStaff.update({
      where: { uid: existing.uid },
      data: updateData,
      select: iTStaffSafeSelect,
    });

    sendProfileUpdateEmail({
      to: updated.email,
      name: updated.fullname,
    }).catch((emailErr) => {
      console.error("IT Staff profile update email failed:", emailErr?.message || emailErr);
    });

    return res.status(200).json({
      ok: true,
      message: "IT Staff updated successfully",
      itStaff: updated,
    });
  } catch (err) {
    console.error("updateITStaff error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteITStaff = async (req, res) => {
  try {
    const target = String(req.params.uid);
    const existing = await prisma.iTStaff.findFirst({
      where: {
        OR: [{ uid: target }, { id: target }],
      },
      select: { uid: true },
    });

    if (!existing) {
      return res.status(404).json({ ok: false, message: "IT Staff not found" });
    }

    await prisma.iTStaff.delete({
      where: { uid: existing.uid },
    });

    return res.status(200).json({
      ok: true,
      message: "IT Staff deleted successfully",
    });
  } catch (err) {
    console.error("deleteITStaff error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const loginITStaff = async (req, res) => {
  try {
    const { error, value } = loginITStaffSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const itStaff = await prisma.iTStaff.findUnique({
      where: { email: value.email },
    });

    if (!itStaff) {
      return res.status(404).json({ ok: false, message: "IT Staff not found" });
    }

    if (!itStaff.status) {
      return res.status(403).json({ ok: false, message: "Account is disabled. Contact your supervisor." });
    }

    const isPasswordValid = await argon2.verify(itStaff.password, value.password);
    if (!isPasswordValid) {
      return res.status(401).json({ ok: false, message: "Invalid password" });
    }

    const tokens = await generateTokens({
      uid: itStaff.uid,
      role: itStaff.role || "IT_STAFF",
      type: "it_staff",
    });

    const { password, ...itStaffWithoutPassword } = itStaff;

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      itStaff: itStaffWithoutPassword,
      role: itStaff.role,
      permissions: itStaff.permissions,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      token: tokens.accessToken,
    });
  } catch (err) {
    console.error("loginITStaff error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const target = String(req.params.uid);
    const itStaff = await prisma.iTStaff.findFirst({
      where: {
        OR: [{ uid: target }, { id: target }],
      },
      select: { uid: true, password: true, email: true, fullname: true },
    });

    if (!itStaff) {
      return res.status(404).json({ ok: false, message: "IT Staff not found" });
    }

    const isPasswordValid = await argon2.verify(itStaff.password, value.currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ ok: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await argon2.hash(value.newPassword);
    await prisma.iTStaff.update({
      where: { uid: itStaff.uid },
      data: { password: hashedPassword },
    });

    sendResetPasswordEmail({
      to: itStaff.email,
      name: itStaff.fullname || "IT Staff",
    }).catch((emailErr) => {
      console.error("IT Staff change password email failed:", emailErr?.message || emailErr);
    });

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export {
  createITStaff,
  getITStaffs,
  getITStaff,
  updateITStaff,
  deleteITStaff,
  loginITStaff,
  changePassword,
};
