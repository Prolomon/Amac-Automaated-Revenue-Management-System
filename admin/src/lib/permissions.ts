import { API_URL, buildHeaders } from "./api";

/**
 * Department-role -> page access matrix.
 * Source: AMAC_Unified_Revenue_Solution_Roles_and_Permissions.pdf
 * (as amended: Executive Administrator = full read-only, no Field Agent role,
 *  Dashboard always accessible to everyone).
 */
export type PageAccess = {
  allowed: boolean;
  readOnly: boolean;
};

type DepartmentPermission = {
  /** "all" = every /admin page; otherwise an array of allowed paths */
  routes: "all" | string[];
  /** route patterns for detail-style pages (e.g. /admin/demands/[id]) */
  patterns?: RegExp[];
  /** when true, pages must hide all create/edit/delete UI */
  readOnly: boolean;
};

export const DASHBOARD_PATH = "/admin";

export const DEPARTMENT_PERMISSIONS: Record<string, DepartmentPermission> = {
  "Financial Controller / Super Admin": {
    routes: "all",
    readOnly: false,
  },
  "Executive Administrator / Viewer": {
    routes: "all",
    readOnly: true,
  },
  "Department Admin (Infrastructure & Property)": {
    routes: [DASHBOARD_PATH, "/admin/staffs", "/admin/staffs/[id]", "/admin/staffs/add"],
    patterns: [/^\/admin\/staffs\/[^/]+$/],
    readOnly: false,
  },
  "Department Admin (Sanitation)": {
    routes: [DASHBOARD_PATH, "/admin/staffs", "/admin/staffs/[id]", "/admin/staffs/add"],
    patterns: [/^\/admin\/staffs\/[^/]+$/],
    readOnly: false,
  },
  "Department Admin (Health)": {
    routes: [DASHBOARD_PATH, "/admin/staffs", "/admin/staffs/[id]", "/admin/staffs/add"],
    patterns: [/^\/admin\/staffs\/[^/]+$/],
    readOnly: false,
  },
  "Department Admin (Markets & Trade)": {
    routes: [DASHBOARD_PATH, "/admin/staffs", "/admin/staffs/[id]", "/admin/staffs/add"],
    patterns: [/^\/admin\/staffs\/[^/]+$/],
    readOnly: false,
  },
  "Verification & Enforcement Officer": {
    routes: [DASHBOARD_PATH],
    patterns: [
      /^\/admin\/demands\/[^/]+$/,
      /^\/admin\/payments\/[^/]+$/,
      /^\/admin\/entities\/[^/]+$/,
    ],
    readOnly: true,
  },
  "System Auditor": {
    routes: [
      DASHBOARD_PATH,
      "/admin/payments",
      "/admin/payments/[id]",
      "/admin/payment-split",
      "/admin/search",
      "/admin/revenue-assurance",
    ],
    patterns: [/^\/admin\/payments\/[^/]+$/],
    readOnly: true,
  },
  "Data Analyst": {
    routes: [
      DASHBOARD_PATH,
      "/admin/entities",
      "/admin/entities/[id]",
      "/admin/payments",
      "/admin/payments/[id]",
      "/admin/revenue-assurance",
      "/admin/payment-split",
    ],
    patterns: [
      /^\/admin\/entities\/[^/]+$/,
      /^\/admin\/payments\/[^/]+$/,
    ],
    readOnly: true,
  },
};

/**
 * Safe fallback for roles not present in the map (typos, future roles):
 * dashboard only, read-only. Not a listed role — purely defensive.
 */
const FALLBACK_PERMISSION: DepartmentPermission = {
  routes: [DASHBOARD_PATH],
  readOnly: true,
};

export type DepartmentLike = {
  uid?: string;
  name?: string;
  role?: string;
  status?: boolean;
} | null;

/**
 * Resolve the effective department role for a user from their departmentId.
 * Cached in sessionStorage so we only fetch once per browser session.
 */
export async function getDepartmentRoleForUser(
  departmentId?: string | null,
  fallbackDepartment?: DepartmentLike
): Promise<{ departmentRole: string | null; department: DepartmentLike }> {
  if (fallbackDepartment?.role) {
    return { departmentRole: fallbackDepartment.role, department: fallbackDepartment };
  }

  if (!departmentId) {
    return { departmentRole: null, department: null };
  }

  const cacheKey = `amac_department_${departmentId}`;
  try {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { departmentRole: parsed?.role || null, department: parsed };
      }
    }
  } catch (e) {
    // ignore cache read errors
  }

  try {
    const { getDepartment } = await import("./services/department");
    const res = await getDepartment(departmentId);
    const department = res?.department || null;
    try {
      if (typeof window !== "undefined" && department) {
        sessionStorage.setItem(cacheKey, JSON.stringify(department));
      }
    } catch (e) {
      // ignore cache write errors
    }
    return { departmentRole: department?.role || null, department };
  } catch (e) {
    return { departmentRole: null, department: null };
  }
}

/**
 * Evaluate page access for a department role against a pathname.
 */
export function getPageAccess(
  departmentRole: string | null,
  pathname: string
): PageAccess {
  // Everyone can always see the dashboard.
  if (pathname === DASHBOARD_PATH || pathname === `${DASHBOARD_PATH}/`) {
    return { allowed: true, readOnly: false };
  }

  const permission =
    (departmentRole && DEPARTMENT_PERMISSIONS[departmentRole]) ||
    FALLBACK_PERMISSION;

  if (permission.routes === "all") {
    return { allowed: true, readOnly: permission.readOnly };
  }

  const normalized = pathname.replace(/\/+$/, "") || DASHBOARD_PATH;

  const exactAllowed = permission.routes.some(
    (route) => normalized === route.replace(/\/+$/, "")
  );
  const patternAllowed = (permission.patterns || []).some((pattern) =>
    pattern.test(normalized)
  );

  return {
    allowed: exactAllowed || patternAllowed,
    readOnly: permission.readOnly,
  };
}

/**
 * Center resolution: staff users carry their center on `user.center`,
 * admins on `user.uid`. IT users operate across ALL centers, so they
 * resolve to "ADMIN" — the API convention for "no center filter".
 */
export function getCenterId(
  user: Record<string, any> | null | undefined
): string {
  if (!user) return "";
  if (user.role === "ADMIN") return user.uid || "";
  if (user.role === "IT") return "ADMIN";
  return user.center || "";
}

/**
 * Nav items a department role is allowed to see (for the sidebar).
 * The dashboard is always visible.
 */
export function filterNavItems<T extends { href: string }>(
  items: T[],
  departmentRole: string | null
): T[] {
  return items.filter((item) => {
    if (item.href === DASHBOARD_PATH) return true;
    return getPageAccess(departmentRole, item.href).allowed;
  });
}
