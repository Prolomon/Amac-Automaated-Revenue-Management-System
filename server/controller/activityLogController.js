import { prisma } from "../config/db.js";

export const getActivityLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
    const skip = (page - 1) * limit;

    const role = req.query.role ? String(req.query.role).trim() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    const where = {};
    if (role) {
      where.userRole = role;
    }
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { route: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getActivityLogs error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};
