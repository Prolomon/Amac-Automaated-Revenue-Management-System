const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Resolve the actual authenticated role from the verified JWT payload.
    // Tokens carry `role` (MEMBER/ADMIN/STAFF/AGENT/COMPANY) and sometimes `type`
    // (admin/it/staff/company). Build a normalized set from both.
    const actual = new Set();

    if (req.auth?.type) {
      actual.add(String(req.auth.type).toUpperCase());
    }
    if (req.auth?.role) {
      actual.add(String(req.auth.role).toUpperCase());
    }

    // Fallback to the DB user's role if the token lacked a role claim.
    if (req.user?.role && actual.size === 0) {
      actual.add(String(req.user.role).toUpperCase());
    }

    // Normalize allowed roles (support "user" alias matching MEMBER).
    const allowed = new Set(
      (roles || []).map((r) => {
        const up = String(r).toUpperCase();
        return up === "USER" ? "MEMBER" : up;
      })
    );

    const hasRole = [...actual].some((role) => allowed.has(role));

    if (!hasRole) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have the required role." });
    }

    next();
  };
};

export { roleMiddleware };
