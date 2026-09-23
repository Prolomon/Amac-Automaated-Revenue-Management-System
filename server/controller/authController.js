import { prisma } from "../config/db.js";
import { verifyRefreshToken, generateTokens } from "../service/token.js";

/**
 * Handle refreshing access tokens using a valid refresh token.
 */
export const refreshTokenHandler = async (req, res) => {
  try {
    let refreshToken = req.body?.refreshToken;

    // Fallback: check Authorization header if body is empty
    if (!refreshToken && req.headers.authorization?.startsWith("Bearer ")) {
      refreshToken = req.headers.authorization.slice(7).trim();
    }

    if (!refreshToken) {
      return res.status(400).json({
        ok: false,
        message: "Refresh token is required",
        code: "REFRESH_TOKEN_REQUIRED",
      });
    }

    const verification = await verifyRefreshToken(refreshToken);

    if (!verification.valid) {
      return res.status(401).json({
        ok: false,
        message: verification.expired
          ? "Refresh token expired. Please log in again."
          : "Invalid refresh token",
        code: verification.expired
          ? "REFRESH_TOKEN_EXPIRED"
          : "REFRESH_TOKEN_INVALID",
      });
    }

    const { uid } = verification.payload;

    // Locate user in database
    let user = await prisma.member.findFirst({
      where: { OR: [{ uid }, { id: uid }] },
      select: { uid: true, email: true, role: true, status: true },
    });
    let userType = "member";

    if (!user) {
      user = await prisma.agent.findFirst({
        where: { OR: [{ uid }, { id: uid }] },
        select: { uid: true, email: true, role: true, status: true },
      });
      if (user) userType = "agent";
    }

    if (!user) {
      user = await prisma.admin.findFirst({
        where: { OR: [{ uid }, { id: uid }] },
        select: { uid: true, email: true, role: true, status: true },
      });
      if (user) userType = user?.role === "ADMIN" ? "admin" : "it";
    }

    if (!user) {
      user = await prisma.staff.findFirst({
        where: { OR: [{ uid }, { id: uid }] },
        select: { uid: true, email: true, role: true, status: true },
      });
      if (user) userType = "staff";
    }

    if (!user) {
      user = await prisma.company.findFirst({
        where: { OR: [{ uid }, { id: uid }] },
        select: { uid: true, email: true, role: true, status: true },
      });
      if (user) userType = "company";
    }

    if (!user) {
      user = await prisma.enumerator.findFirst({
        where: { OR: [{ uid }, { id: uid }] },
        select: { uid: true, email: true, role: true, status: true },
      });
      if (user) userType = "enumerator";
    }

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "User associated with refresh token not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.status === false) {
      return res.status(403).json({
        ok: false,
        message: "Account is inactive. Please contact support.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Generate fresh tokens
    const tokens = await generateTokens({
      uid: user.uid,
      email: user.email,
      role: user.role,
      type: userType,
    });

    return res.status(200).json({
      ok: true,
      message: "Tokens refreshed successfully",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      token: tokens.accessToken,
    });
  } catch (err) {
    console.error("Error in refreshTokenHandler:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error during token refresh",
    });
  }
};
