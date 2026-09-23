import argon2 from "argon2";
import { customAlphabet } from "nanoid";
import { prisma } from "../config/db.js";
import { generateAccessToken, generateRefreshToken } from "../service/token.js";
import { sendEmail } from "../service/mail.js";

const generateUid = customAlphabet("0123456789", 8);
const generateAccountNo = customAlphabet("0123456789", 10);

const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Admin creates an Enumerator (BASIC or SUPER)
 */
export const createEnumerator = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      altPhone,
      dob,
      address,
      center,
      zone,
      guarantor1,
      guarantor2,
      level = "BASIC",
      supervisorId,
      password,
    } = req.body;

    if (!name || !email || !phone || !center) {
      return res.status(400).json({
        ok: false,
        message: "Name, email, phone, and center are required fields",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.enumerator.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: phone.trim() }],
      },
    });

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "An enumerator with this email or phone already exists",
      });
    }

    const plainPassword = password ? String(password).trim() : phone.trim();
    const hashedPassword = await argon2.hash(plainPassword);
    const uid = `ENUM-${generateUid()}`;

    const enumerator = await prisma.enumerator.create({
      data: {
        uid,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        altPhone: altPhone ? altPhone.trim() : null,
        avatar: req.body.avatar || null,
        dob: dob ? new Date(dob) : null,
        address: address ? address.trim() : null,
        center: center.trim(),
        zone: zone ? zone.trim() : null,
        guarantor1: guarantor1 || null,
        guarantor2: guarantor2 || null,
        level: level.toUpperCase() === "SUPER" ? "SUPER" : "BASIC",
        supervisorId: supervisorId ? supervisorId.trim() : null,
        password: hashedPassword,
        role: "ENUMERATOR",
        status: true,
      },
    });

    // Auto-provision wallet for enumerator
    let wallet = null;
    try {
      wallet = await prisma.wallet.create({
        data: {
          userId: enumerator.uid,
          role: "ENUMERATOR",
          balance: 0.0,
          accountNo: `99${generateAccountNo()}`,
          accountName: enumerator.name,
          currency: "NGN",
          bank: { name: "AMAC Enumerator Ledger", code: "ENUM" },
          status: true,
          verify: true,
        },
      });
    } catch (wErr) {
      console.warn("Auto wallet creation warning for enumerator:", wErr.message);
    }

    return res.status(201).json({
      ok: true,
      message: "Enumerator created successfully",
      data: {
        ...enumerator,
        wallet,
      },
    });
  } catch (error) {
    console.error("createEnumerator error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Failed to create enumerator",
    });
  }
};

/**
 * Enumerator / Supervisor login
 */
export const loginEnumerator = async (req, res) => {
  try {
    const { identifier, password, expectedLevel } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email or phone and password are required",
      });
    }

    const cleanIdentifier = String(identifier).trim();
    const enumerator = await prisma.enumerator.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { phone: cleanIdentifier },
          { altPhone: cleanIdentifier },
          { uid: cleanIdentifier },
        ],
      },
    });

    if (!enumerator) {
      return res.status(404).json({
        ok: false,
        message: "Enumerator account not found",
      });
    }

    if (!enumerator.status) {
      return res.status(403).json({
        ok: false,
        message: "Your account is currently disabled. Please contact your supervisor or administrator.",
      });
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await argon2.verify(enumerator.password, password);
    } catch (e) {
      isPasswordValid = enumerator.password === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        message: "Invalid credentials",
      });
    }

    // Role check if logging in specifically as Supervisor
    if (expectedLevel && expectedLevel.toUpperCase() === "SUPER" && enumerator.level !== "SUPER") {
      return res.status(403).json({
        ok: false,
        message: "Access denied. You do not have Supervisor permissions.",
      });
    }

    const tokenPayload = {
      uid: enumerator.uid,
      id: enumerator.id,
      role: "ENUMERATOR",
      type: "enumerator",
      level: enumerator.level,
      center: enumerator.center,
      name: enumerator.name,
      email: enumerator.email,
    };

    const accessToken = await generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(tokenPayload);

    const wallet = await prisma.wallet.findFirst({
      where: { userId: enumerator.uid },
    });

    let supervisor = null;
    if (enumerator.supervisorId) {
      supervisor = await prisma.enumerator.findUnique({
        where: { uid: enumerator.supervisorId },
        select: { uid: true, name: true, phone: true, email: true },
      });
    }

    const { password: _, ...enumeratorSafe } = enumerator;

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        ...enumeratorSafe,
        supervisor,
      },
      wallet,
    });
  } catch (error) {
    console.error("loginEnumerator error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Login failed",
    });
  }
};
 
/**
 * Forgot Password / First-Time Login OTP Request
 */
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        ok: false,
        message: "Email or phone number is required",
      });
    }

    const cleanIdentifier = String(identifier).trim();
    const enumerator = await prisma.enumerator.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { phone: cleanIdentifier },
          { altPhone: cleanIdentifier },
        ],
      },
    });

    if (!enumerator) {
      return res.status(404).json({
        ok: false,
        message: "No enumerator account found with that identifier",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.enumerator.update({
      where: { id: enumerator.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    // Try sending email if possible
    try {
      if (enumerator.email && enumerator.email.includes("@")) {
        await sendEmail({
          to: enumerator.email,
          subject: "Your AMAC Enumerator Security OTP",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #0B3B26;">AMAC Enumeration Portal</h2>
              <p>Hello <strong>${enumerator.name}</strong>,</p>
              <p>Your one-time security verification code for logging in or resetting your password is:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1B9E5A; padding: 12px; background: #E4F5EB; display: inline-block; border-radius: 8px;">
                ${otpCode}
              </div>
              <p style="margin-top: 15px; font-size: 13px; color: #666;">This code is valid for 15 minutes. If you did not request this, please contact support.</p>
            </div>
          `,
        });
      }
    } catch (eErr) {
      console.warn("Could not dispatch OTP email:", eErr.message);
    }

    return res.status(200).json({
      ok: true,
      message: "A 6-digit verification code has been sent to your registered email/phone.",
      otpCode, // Available for development/testing convenience
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Failed to process request",
    });
  }
};

/**
 * Reset password using OTP
 */
export const resetPassword = async (req, res) => {
  try {
    const { identifier, otpCode, newPassword } = req.body;

    if (!identifier || !otpCode || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Identifier, OTP code, and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        ok: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const cleanIdentifier = String(identifier).trim();
    const cleanOtp = String(otpCode).trim();

    const enumerator = await prisma.enumerator.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { phone: cleanIdentifier },
          { altPhone: cleanIdentifier },
        ],
      },
    });

    if (!enumerator) {
      return res.status(404).json({
        ok: false,
        message: "Account not found",
      });
    }

    if (!enumerator.otpCode || enumerator.otpCode !== cleanOtp) {
      return res.status(400).json({
        ok: false,
        message: "Invalid OTP code",
      });
    }

    if (enumerator.otpExpiresAt && new Date() > new Date(enumerator.otpExpiresAt)) {
      return res.status(400).json({
        ok: false,
        message: "OTP code has expired. Please request a new one.",
      });
    }

    const hashedPassword = await argon2.hash(String(newPassword).trim());

    await prisma.enumerator.update({
      where: { id: enumerator.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Failed to reset password",
    });
  }
};

/**
 * Authenticated password change
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Current password and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        ok: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const enumerator = await prisma.enumerator.findUnique({
      where: { uid },
    });

    if (!enumerator) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    let isMatch = false;
    try {
      isMatch = await argon2.verify(enumerator.password, currentPassword);
    } catch {
      isMatch = enumerator.password === currentPassword;
    }

    if (!isMatch) {
      return res.status(400).json({ ok: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await argon2.hash(String(newPassword).trim());
    await prisma.enumerator.update({
      where: { uid },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Failed to change password",
    });
  }
};

/**
 * Get logged-in enumerator profile & wallet
 */
export const getProfile = async (req, res) => {
  try {
    const uid = req.userId;
    const enumerator = await prisma.enumerator.findUnique({
      where: { uid },
      include: {
        wallets: true,
      },
    });

    if (!enumerator) {
      return res.status(404).json({ ok: false, message: "Enumerator not found" });
    }

    let supervisor = null;
    if (enumerator.supervisorId) {
      supervisor = await prisma.enumerator.findUnique({
        where: { uid: enumerator.supervisorId },
        select: { uid: true, name: true, phone: true, email: true },
      });
    }

    const { password: _, ...safeData } = enumerator;
    return res.status(200).json({
      ok: true,
      data: {
        ...safeData,
        wallet: enumerator.wallets[0] || null,
        supervisor,
      },
    });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Daily Task Monitor:
 * Target: 50 Captures & 50 Registrations per day.
 * Reward: ₦50 per capture, ₦50 per registration.
 */
export const getDailyTaskProgress = async (req, res) => {
  try {
    const targetUid = req.params.id || req.userId;
    const { start, end } = getDayBounds();

    const [todayCaptures, todayRegistrations, approvedCapturesToday, approvedRegistrationsToday] =
      await Promise.all([
        prisma.property.count({
          where: {
            enumeratorId: targetUid,
            createdAt: { gte: start, lte: end },
          },
        }),
        prisma.member.count({
          where: {
            enumeratorId: targetUid,
            createdAt: { gte: start, lte: end },
          },
        }),
        prisma.property.count({
          where: {
            enumeratorId: targetUid,
            status: "APPROVED",
            approvedAt: { gte: start, lte: end },
          },
        }),
        prisma.member.count({
          where: {
            enumeratorId: targetUid,
            enumerationStatus: "APPROVED",
            updatedAt: { gte: start, lte: end },
          },
        }),
      ]);

    const captureTarget = 50;
    const registrationTarget = 50;

    const captureRate = 50; // ₦50 each
    const registrationRate = 50; // ₦50 each

    const todayEarnings =
      approvedCapturesToday * captureRate + approvedRegistrationsToday * registrationRate;

    const wallet = await prisma.wallet.findFirst({
      where: { userId: targetUid },
    });

    return res.status(200).json({
      ok: true,
      data: {
        date: start.toISOString().split("T")[0],
        captures: {
          submitted: todayCaptures,
          approved: approvedCapturesToday,
          target: captureTarget,
          rate: captureRate,
          earned: approvedCapturesToday * captureRate,
          percent: Math.min(Math.round((todayCaptures / captureTarget) * 100), 100),
        },
        registrations: {
          submitted: todayRegistrations,
          approved: approvedRegistrationsToday,
          target: registrationTarget,
          rate: registrationRate,
          earned: approvedRegistrationsToday * registrationRate,
          percent: Math.min(Math.round((todayRegistrations / registrationTarget) * 100), 100),
        },
        earnings: {
          today: todayEarnings,
          balance: wallet?.balance || 0,
        },
      },
    });
  } catch (error) {
    console.error("getDailyTaskProgress error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Admin list all enumerators with filters
 */
export const getAllEnumerators = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
    const skip = (page - 1) * limit;

    const { level, center, status, supervisorId, search } = req.query;

    const where = {};
    if (level && ["BASIC", "SUPER"].includes(level.toUpperCase())) {
      where.level = level.toUpperCase();
    }
    if (center && center !== "all") {
      where.center = center;
    }
    if (status !== undefined && status !== "") {
      where.status = status === "true" || status === true;
    }
    if (supervisorId) {
      where.supervisorId = supervisorId;
    }
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { uid: { contains: q } },
      ];
    }

    const [enumerators, total] = await Promise.all([
      prisma.enumerator.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          phone: true,
          altPhone: true,
          avatar: true,
          level: true,
          center: true,
          zone: true,
          status: true,
          supervisorId: true,
          createdAt: true,
          updatedAt: true,
          wallets: {
            select: { balance: true, accountNo: true },
          },
          _count: {
            select: {
              properties: true,
              members: true,
            },
          },
        },
      }),
      prisma.enumerator.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: enumerators,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getAllEnumerators error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Get Single Enumerator with full performance & activity data
 */
export const getEnumeratorById = async (req, res) => {
  try {
    const { id } = req.params;
    const enumerator = await prisma.enumerator.findFirst({
      where: {
        OR: [{ uid: id }, { id }],
      },
      include: {
        wallets: true,
        _count: {
          select: {
            properties: true,
            members: true,
          },
        },
      },
    });

    if (!enumerator) {
      return res.status(404).json({ ok: false, message: "Enumerator not found" });
    }

    let supervisor = null;
    if (enumerator.supervisorId) {
      supervisor = await prisma.enumerator.findUnique({
        where: { uid: enumerator.supervisorId },
        select: { uid: true, name: true, phone: true, email: true },
      });
    }

    // Team members if supervisor
    let teamMembers = [];
    if (enumerator.level === "SUPER") {
      teamMembers = await prisma.enumerator.findMany({
        where: { supervisorId: enumerator.uid },
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          center: true,
          _count: { select: { properties: true, members: true } },
        },
      });
    }

    const { password: _, ...safeData } = enumerator;

    return res.status(200).json({
      ok: true,
      data: {
        ...safeData,
        wallet: enumerator.wallets[0] || null,
        supervisor,
        teamMembers,
      },
    });
  } catch (error) {
    console.error("getEnumeratorById error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Get Supervisor's Assigned Team with live task metrics
 */
export const getSupervisorTeam = async (req, res) => {
  try {
    const supervisorUid = req.userId;
    const { start, end } = getDayBounds();

    const team = await prisma.enumerator.findMany({
      where: { supervisorId: supervisorUid },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        altPhone: true,
        avatar: true,
        center: true,
        zone: true,
        status: true,
        createdAt: true,
        wallets: { select: { balance: true } },
      },
    });

    // Augment with today's metrics for each team member
    const teamWithMetrics = await Promise.all(
      team.map(async (member) => {
        const [capturesToday, registrationsToday, pendingCaptures, pendingRegistrations] =
          await Promise.all([
            prisma.property.count({
              where: {
                enumeratorId: member.uid,
                createdAt: { gte: start, lte: end },
              },
            }),
            prisma.member.count({
              where: {
                enumeratorId: member.uid,
                createdAt: { gte: start, lte: end },
              },
            }),
            prisma.property.count({
              where: {
                enumeratorId: member.uid,
                status: "PENDING",
              },
            }),
            prisma.member.count({
              where: {
                enumeratorId: member.uid,
                enumerationStatus: "PENDING",
              },
            }),
          ]);

        return {
          ...member,
          today: {
            captures: capturesToday,
            registrations: registrationsToday,
          },
          pending: {
            captures: pendingCaptures,
            registrations: pendingRegistrations,
            total: pendingCaptures + pendingRegistrations,
          },
        };
      })
    );

    return res.status(200).json({
      ok: true,
      data: teamWithMetrics,
    });
  } catch (error) {
    console.error("getSupervisorTeam error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};

/**
 * Admin High-Level Analytics for Enumeration Ecosystem
 */
export const getAnalytics = async (req, res) => {
  try {
    const { start, end } = getDayBounds();

    const [
      totalEnumerators,
      totalSupervisors,
      totalProperties,
      pendingProperties,
      approvedProperties,
      deniedProperties,
      totalMembersByEnumerators,
      pendingMembersByEnumerators,
      approvedMembersByEnumerators,
      todayProperties,
      todayMembers,
    ] = await Promise.all([
      prisma.enumerator.count({ where: { level: "BASIC" } }),
      prisma.enumerator.count({ where: { level: "SUPER" } }),
      prisma.property.count(),
      prisma.property.count({ where: { status: "PENDING" } }),
      prisma.property.count({ where: { status: "APPROVED" } }),
      prisma.property.count({ where: { status: "DENIED" } }),
      prisma.member.count({ where: { enumeratorId: { not: null } } }),
      prisma.member.count({ where: { enumeratorId: { not: null }, enumerationStatus: "PENDING" } }),
      prisma.member.count({ where: { enumeratorId: { not: null }, enumerationStatus: "APPROVED" } }),
      prisma.property.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.member.count({
        where: { enumeratorId: { not: null }, createdAt: { gte: start, lte: end } },
      }),
    ]);

    const totalRewardsPaid = (approvedProperties + approvedMembersByEnumerators) * 50;

    return res.status(200).json({
      ok: true,
      data: {
        overview: {
          totalEnumerators,
          totalSupervisors,
          totalPersonnel: totalEnumerators + totalSupervisors,
          totalCaptures: totalProperties,
          totalRegistrations: totalMembersByEnumerators,
          totalRewardsPaid,
        },
        today: {
          captures: todayProperties,
          registrations: todayMembers,
        },
        capturesBreakdown: {
          total: totalProperties,
          pending: pendingProperties,
          approved: approvedProperties,
          denied: deniedProperties,
        },
        registrationsBreakdown: {
          total: totalMembersByEnumerators,
          pending: pendingMembersByEnumerators,
          approved: approvedMembersByEnumerators,
        },
      },
    });
  } catch (error) {
    console.error("getAnalytics error:", error);
    return res.status(500).json({ ok: false, message: error?.message || "Server error" });
  }
};
