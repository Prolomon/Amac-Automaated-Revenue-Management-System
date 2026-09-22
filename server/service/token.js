import { TextEncoder } from "util";

const joseImport = () => import("jose");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

const getJwtRefreshSecret = () => {
  return process.env.JWT_REFRESH_SECRET || getJwtSecret();
};

const getAccessTokenExpiresIn = () => {
  return process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";
};

const getRefreshTokenExpiresIn = () => {
  return process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
};

/**
 * Generate a short-lived access token
 */
export const generateAccessToken = async (payload) => {
  const secret = getJwtSecret();
  const expiresIn = getAccessTokenExpiresIn();
  const { SignJWT } = await joseImport();

  return new SignJWT({
    ...payload,
    tokenType: "access",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
};

/**
 * Generate a long-lived refresh token
 */
export const generateRefreshToken = async (payload) => {
  const secret = getJwtRefreshSecret();
  const expiresIn = getRefreshTokenExpiresIn();
  const { SignJWT } = await joseImport();

  return new SignJWT({
    uid: payload.uid,
    role: payload.role,
    type: payload.type,
    tokenType: "refresh",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = async (payload) => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
    token: accessToken, // Backward-compatibility
  };
};

/**
 * Verify an access token.
 * Ensures the token is valid, not expired, and has tokenType !== "refresh".
 */
export const verifyAccessToken = async (token) => {
  if (!token || typeof token !== "string" || token.split(".").length !== 3) {
    return { valid: false, expired: false, error: "Invalid token format" };
  }

  try {
    const secret = getJwtSecret();
    const { jwtVerify } = await joseImport();
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (payload?.tokenType === "refresh") {
      return {
        valid: false,
        expired: false,
        error: "Refresh token cannot be used as an access token",
      };
    }

    if (!payload?.uid || typeof payload.uid !== "string") {
      return { valid: false, expired: false, error: "Missing uid in token payload" };
    }

    return { valid: true, payload };
  } catch (err) {
    const isExpired =
      err?.code === "ERR_JWT_EXPIRED" ||
      err?.name === "JWTExpired" ||
      String(err?.message || "").toLowerCase().includes("expired");

    return {
      valid: false,
      expired: isExpired,
      error: err?.message || "Token verification failed",
    };
  }
};

/**
 * Verify a refresh token.
 * Ensures the token is valid, not expired, and has tokenType === "refresh".
 */
export const verifyRefreshToken = async (token) => {
  if (!token || typeof token !== "string" || token.split(".").length !== 3) {
    return { valid: false, expired: false, error: "Invalid token format" };
  }

  try {
    const secret = getJwtRefreshSecret();
    const { jwtVerify } = await joseImport();
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (payload?.tokenType !== "refresh") {
      return {
        valid: false,
        expired: false,
        error: "Not a valid refresh token",
      };
    }

    if (!payload?.uid || typeof payload.uid !== "string") {
      return { valid: false, expired: false, error: "Missing uid in token payload" };
    }

    return { valid: true, payload };
  } catch (err) {
    const isExpired =
      err?.code === "ERR_JWT_EXPIRED" ||
      err?.name === "JWTExpired" ||
      String(err?.message || "").toLowerCase().includes("expired");

    return {
      valid: false,
      expired: isExpired,
      error: err?.message || "Refresh token verification failed",
    };
  }
};
