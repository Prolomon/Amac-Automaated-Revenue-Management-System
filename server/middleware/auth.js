import { prisma } from "../config/db.js";
import { verifyAccessToken } from "../service/token.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ ok: false, message: "Unauthorized: Bearer token is required.", code: "TOKEN_REQUIRED" });
    }

    const token = authHeader.slice(7).trim(); // Remove 'Bearer ' prefix

    let userUid;
    let jwtPayload = null;

    if (token.split(".").length === 3) {
      const verification = await verifyAccessToken(token);
      if (!verification.valid) {
        if (verification.expired) {
          return res.status(401).json({
            ok: false,
            message: "Token expired",
            code: "TOKEN_EXPIRED",
          });
        }
        return res.status(401).json({
          ok: false,
          message: verification.error || "Unauthorized: Invalid token.",
          code: "INVALID_TOKEN",
        });
      }
      jwtPayload = verification.payload;
      userUid = verification.payload.uid || verification.payload.userId || verification.payload.id;
    } else {
      userUid = token;
    }

    if (!userUid) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized: Token missing user identifier.",
        code: "INVALID_TOKEN",
      });
    }

    // Try to find member by uid or id
    let user = await prisma.member.findFirst({
      where: {
        OR: [{ uid: userUid }, { id: userUid }],
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
        billingFrequency: true,
        location: true,
        avatar: true,
        status: true,
        role: true,
        agent: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    let userType = "member";

    // If not found as member, try to find as agent
    if (!user) {
      user = await prisma.agent.findFirst({
        where: {
          OR: [{ uid: userUid }, { id: userUid }],
        },
        select: {
          id: true,
          uid: true,
          fullname: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (user) userType = "agent";
    }

    // If not found as agent, try to find as admin
    if (!user) {
      user = await prisma.admin.findFirst({
        where: {
          OR: [{ uid: userUid }, { id: userUid }],
        },
        select: {
          id: true,
          uid: true,
          center: true,
          email: true,
          password: true,
          avatar: true,
          role: true,
          paymentConfig: true,
          createdAt: true,
          location: true,
          state: true,
          address: true,
          lga: true,
          country: true,
          status: true,
        },
      });
      if (user) userType = "admin";
    }

    if (!user) {
      user = await prisma.staff.findFirst({
        where: {
          OR: [{ uid: userUid }, { id: userUid }],
        },
        select: {
          id: true,
          uid: true,
          fullname: true,
          email: true,
          phone: true,
          gender: true,
          center: true,
          role: true,
          departmentId: true,
          avatar: true,
          location: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (user) userType = "staff";
    }

    if (!user) {
      user = await prisma.company.findFirst({
        where: {
          OR: [{ uid: userUid }, { id: userUid }],
        },
        select: {
          id: true,
          uid: true,
          name: true,
          phone: true,
          email: true,
          avatar: true,
          status: true,
          center: true,
          role: true,
          location: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (user) userType = "company";
    }

    if (!user) {
      user = await prisma.enumerator.findFirst({
        where: {
          OR: [{ uid: userUid }, { id: userUid }],
        },
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          phone: true,
          altPhone: true,
          avatar: true,
          status: true,
          center: true,
          zone: true,
          level: true,
          supervisorId: true,
          role: true,
          guarantor1: true,
          guarantor2: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (user) {
        userType = "enumerator";
      }
    }

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized: User account not found.",
        code: "USER_NOT_FOUND",
      });
    }

    req.userId = user.uid || user.id;
    req.auth = jwtPayload || null;
    req.userType = userType;
    req.user = user;
    req.role = user.role || (userType === "enumerator" ? user.level : userType.toUpperCase());

    // For backward compatibility
    if (userType === "member") {
      req.member = user;
    } else if (userType === "agent") {
      req.agent = user;
    } else if (userType === "enumerator") {
      req.enumerator = user;
    } else {
      req.admin = user;
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Server error during authentication." });
  }
};

export { authMiddleware };
