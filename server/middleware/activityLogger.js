import { prisma } from "../config/db.js";

export const activityLogger = async (req, res, next) => {
  const originalEnd = res.end;

  res.end = function (...args) {
    originalEnd.apply(res, args);

    // Asynchronously write log without blocking response
    setImmediate(async () => {
      try {
        const userId = req.user?.uid || req.userId || null;
        const userName = req.user?.fullname || req.user?.name || req.user?.adminName || req.user?.email || "Anonymous";
        const userRole = req.user?.role || req.userType || "GUEST";
        const method = req.method;
        const route = req.originalUrl || req.url;
        const status = res.statusCode;

        let action = `${method} ${route.split("?")[0]}`;
        if (req.route?.path) {
          action = `${method} ${req.baseUrl || ""}${req.route.path}`;
        }

        const details = {
          query: req.query || {},
          params: req.params || {},
          ip: req.ip || req.headers["x-forwarded-for"] || null,
        };

        await prisma.activityLog.create({
          data: {
            userId,
            userName,
            userRole,
            action,
            method,
            route,
            status,
            details,
          },
        });
      } catch (err) {
        // Silently log error to avoid interrupting main flow
        console.error("Activity logger error:", err.message);
      }
    });
  };

  next();
};
