import { API_URL, buildHeaders } from "./api";

export type PermissionAction = "create" | "read" | "update" | "delete";

export type ResourceCrudPermissions = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export type PermissionsGroup = {
  member: ResourceCrudPermissions;
  payment: ResourceCrudPermissions;
  property: ResourceCrudPermissions;
  demand: ResourceCrudPermissions;
  staff: ResourceCrudPermissions;
  department: ResourceCrudPermissions;
  tier: ResourceCrudPermissions;
  terminal: ResourceCrudPermissions;
  partner: ResourceCrudPermissions;
  discount: ResourceCrudPermissions;
  recruitment: ResourceCrudPermissions;
  enumerator: ResourceCrudPermissions;
  paymentCode: ResourceCrudPermissions;
  paymentSplit: ResourceCrudPermissions;
  revenueAssurance: ResourceCrudPermissions;
  financeTracker: ResourceCrudPermissions;
  activityLog: ResourceCrudPermissions;
  wallet: ResourceCrudPermissions;
  helpCenter: ResourceCrudPermissions;
  dashboard: { read: boolean };
};

export type PermissionKey =
  | `${keyof Omit<PermissionsGroup, "dashboard">}.${PermissionAction}`
  | "dashboard.read";

export type PageAccess = {
  allowed: boolean;
  readOnly: boolean;
};

export const DASHBOARD_PATH = "/admin";

export const PERMISSION_RESOURCES: (keyof Omit<PermissionsGroup, "dashboard">)[] = [
  "member",
  "payment",
  "property",
  "demand",
  "staff",
  "department",
  "tier",
  "terminal",
  "partner",
  "discount",
  "recruitment",
  "enumerator",
  "paymentCode",
  "paymentSplit",
  "revenueAssurance",
  "financeTracker",
  "activityLog",
  "wallet",
  "helpCenter",
];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "create",
  "read",
  "update",
  "delete",
];

export function createFullPermissions(enabled = true): PermissionsGroup {
  const result: any = {};
  for (const r of PERMISSION_RESOURCES) {
    result[r] = {
      create: enabled,
      read: enabled,
      update: enabled,
      delete: enabled,
    };
  }
  result.dashboard = { read: true };
  return result as PermissionsGroup;
}

export function createPermissions(
  overrides?: Partial<{ [K in keyof PermissionsGroup]?: Partial<PermissionsGroup[K]> }>
): PermissionsGroup {
  const result: any = {};
  for (const r of PERMISSION_RESOURCES) {
    result[r] = {
      create: false,
      read: false,
      update: false,
      delete: false,
      ...(overrides?.[r] || {}),
    };
  }
  result.dashboard = {
    read: true,
    ...(overrides?.dashboard || {}),
  };
  return result as PermissionsGroup;
}

export const ALL_PERMISSIONS: PermissionsGroup = createFullPermissions(true);
export const NO_PERMISSIONS: PermissionsGroup = createFullPermissions(false);

/**
 * Standard department roles mapped to their grouped permissions.
 */
export const ROLE_PERMISSIONS: Record<string, PermissionsGroup> = {
  "Financial Controller / Super Admin": ALL_PERMISSIONS,

  "Executive Administrator / Viewer": createPermissions({
    member: { read: true },
    payment: { read: true },
    property: { read: true },
    demand: { read: true },
    staff: { read: true },
    department: { read: true },
    tier: { read: true },
    terminal: { read: true },
    partner: { read: true },
    discount: { read: true },
    recruitment: { read: true },
    enumerator: { read: true },
    paymentCode: { read: true },
    paymentSplit: { read: true },
    revenueAssurance: { read: true },
    financeTracker: { read: true },
    activityLog: { read: true },
    wallet: { read: true },
    helpCenter: { read: true },
    dashboard: { read: true },
  }),

  "Department Admin (Infrastructure & Property)": createPermissions({
    property: { create: true, read: true, update: true, delete: true },
    staff: { create: true, read: true, update: true, delete: true },
    department: { read: true },
    dashboard: { read: true },
  }),

  "Department Admin (Sanitation)": createPermissions({
    staff: { create: true, read: true, update: true, delete: true },
    department: { read: true },
    dashboard: { read: true },
  }),

  "Department Admin (Health)": createPermissions({
    staff: { create: true, read: true, update: true, delete: true },
    department: { read: true },
    dashboard: { read: true },
  }),

  "Department Admin (Markets & Trade)": createPermissions({
    staff: { create: true, read: true, update: true, delete: true },
    department: { read: true },
    dashboard: { read: true },
  }),

  "Verification & Enforcement Officer": createPermissions({
    demand: { read: true },
    payment: { read: true },
    member: { read: true },
    property: { read: true },
    dashboard: { read: true },
  }),

  "System Auditor": createPermissions({
    payment: { read: true },
    paymentCode: { read: true },
    paymentSplit: { read: true },
    revenueAssurance: { read: true },
    financeTracker: { read: true },
    activityLog: { read: true },
    dashboard: { read: true },
  }),

  "Data Analyst": createPermissions({
    member: { read: true },
    property: { read: true },
    payment: { read: true },
    paymentCode: { read: true },
    paymentSplit: { read: true },
    revenueAssurance: { read: true },
    financeTracker: { read: true },
    dashboard: { read: true },
  }),
};

// Legacy compatibility dictionary for any code referencing DEPARTMENT_PERMISSIONS directly
export const DEPARTMENT_PERMISSIONS: Record<string, { routes: "all" | string[]; patterns?: RegExp[]; readOnly: boolean }> = {
  "Financial Controller / Super Admin": { routes: "all", readOnly: false },
  "Executive Administrator / Viewer": { routes: "all", readOnly: true },
  "Department Admin (Infrastructure & Property)": {
    routes: [DASHBOARD_PATH, "/admin/staffs", "/admin/staffs/[id]", "/admin/staffs/add", "/admin/properties", "/admin/properties/[id]", "/admin/properties/add", "/admin/property", "/admin/property/[id]"],
    patterns: [/^\/admin\/staffs\/[^/]+$/, /^\/admin\/properties\/[^/]+$/, /^\/admin\/property\/[^/]+$/],
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
    patterns: [/^\/admin\/demands\/[^/]+$/, /^\/admin\/payments\/[^/]+$/, /^\/admin\/entities\/[^/]+$/, /^\/admin\/properties\/[^/]+$/, /^\/admin\/property\/[^/]+$/],
    readOnly: true,
  },
  "System Auditor": {
    routes: [DASHBOARD_PATH, "/admin/payments", "/admin/payments/[id]", "/admin/payment-code", "/admin/payment-split", "/admin/search", "/admin/revenue-assurance"],
    patterns: [/^\/admin\/payments\/[^/]+$/],
    readOnly: true,
  },
  "Data Analyst": {
    routes: [DASHBOARD_PATH, "/admin/entities", "/admin/entities/[id]", "/admin/properties", "/admin/properties/[id]", "/admin/property", "/admin/property/[id]", "/admin/payments", "/admin/payments/[id]", "/admin/payment-code", "/admin/revenue-assurance", "/admin/payment-split"],
    patterns: [/^\/admin\/entities\/[^/]+$/, /^\/admin\/properties\/[^/]+$/, /^\/admin\/property\/[^/]+$/, /^\/admin\/payments\/[^/]+$/],
    readOnly: true,
  },
};

/**
 * Route-to-Permission mapping table.
 * If `<resource>.<action>` is permitted, access is granted.
 */
export const ROUTE_PERMISSION_MAP: Record<
  string,
  { resource: keyof PermissionsGroup; action: PermissionAction }
> = {
  "/admin": { resource: "dashboard", action: "read" },
  "/admin/entities": { resource: "member", action: "read" },
  "/admin/entities/add": { resource: "member", action: "create" },
  "/admin/properties": { resource: "property", action: "read" },
  "/admin/properties/add": { resource: "property", action: "create" },
  "/admin/property": { resource: "property", action: "read" },
  "/admin/enumerators": { resource: "enumerator", action: "read" },
  "/admin/enumerators/add": { resource: "enumerator", action: "create" },
  "/admin/enumerators/analytics": { resource: "enumerator", action: "read" },
  "/admin/tiers": { resource: "tier", action: "read" },
  "/admin/tiers/add": { resource: "tier", action: "create" },
  "/admin/terminal": { resource: "terminal", action: "read" },
  "/admin/terminal/assign": { resource: "terminal", action: "update" },
  "/admin/department": { resource: "department", action: "read" },
  "/admin/staffs": { resource: "staff", action: "read" },
  "/admin/staffs/add": { resource: "staff", action: "create" },
  "/admin/demands": { resource: "demand", action: "read" },
  "/admin/discounts": { resource: "discount", action: "read" },
  "/admin/partners": { resource: "partner", action: "read" },
  "/admin/partners/add": { resource: "partner", action: "create" },
  "/admin/payments": { resource: "payment", action: "read" },
  "/admin/payment-code": { resource: "paymentCode", action: "read" },
  "/admin/payment-split": { resource: "paymentSplit", action: "read" },
  "/admin/revenue-assurance": { resource: "revenueAssurance", action: "read" },
  "/admin/search": { resource: "financeTracker", action: "read" },
  "/admin/wallet": { resource: "wallet", action: "read" },
  "/admin/recruitment": { resource: "recruitment", action: "read" },
  "/admin/help-center": { resource: "helpCenter", action: "read" },
  "/admin/activity-logs": { resource: "activityLog", action: "read" },
  // IT routes
  "/it": { resource: "dashboard", action: "read" },
  "/it/entities": { resource: "member", action: "read" },
  "/it/properties": { resource: "property", action: "read" },
  "/it/admins": { resource: "staff", action: "read" },
  "/it/payments": { resource: "payment", action: "read" },
  "/it/payment-code": { resource: "paymentCode", action: "read" },
  "/it/demands": { resource: "demand", action: "read" },
  "/it/tiers": { resource: "tier", action: "read" },
  "/it/terminal": { resource: "terminal", action: "read" },
  "/it/staffs": { resource: "staff", action: "read" },
  "/it/staffs/add": { resource: "staff", action: "create" },
  "/it/it-staffs": { resource: "staff", action: "read" },
  "/it/it-staffs/add": { resource: "staff", action: "create" },
  "/it/department": { resource: "department", action: "read" },
  "/it/discounts": { resource: "discount", action: "read" },
  "/it/partners": { resource: "partner", action: "read" },
  "/it/search": { resource: "financeTracker", action: "read" },
  "/it/wallet": { resource: "wallet", action: "read" },
  "/it/recruitment": { resource: "recruitment", action: "read" },
  "/it/help-center": { resource: "helpCenter", action: "read" },
};

/**
 * Route pattern mapping for detail pages.
 */
export const PATTERN_PERMISSION_MAP: Array<{
  pattern: RegExp;
  resource: keyof PermissionsGroup;
  action: PermissionAction;
}> = [
  { pattern: /^\/admin\/entities\/add$/, resource: "member", action: "create" },
  { pattern: /^\/admin\/entities\/[^/]+\/demand$/, resource: "demand", action: "read" },
  { pattern: /^\/admin\/entities\/[^/]+$/, resource: "member", action: "read" },
  { pattern: /^\/admin\/properties\/add$/, resource: "property", action: "create" },
  { pattern: /^\/admin\/properties\/[^/]+$/, resource: "property", action: "read" },
  { pattern: /^\/admin\/property\/[^/]+$/, resource: "property", action: "read" },
  { pattern: /^\/admin\/enumerators\/add$/, resource: "enumerator", action: "create" },
  { pattern: /^\/admin\/enumerators\/analytics$/, resource: "enumerator", action: "read" },
  { pattern: /^\/admin\/enumerators\/[^/]+$/, resource: "enumerator", action: "read" },
  { pattern: /^\/admin\/tiers\/add$/, resource: "tier", action: "create" },
  { pattern: /^\/admin\/tiers\/[^/]+$/, resource: "tier", action: "read" },
  { pattern: /^\/admin\/terminal\/assign$/, resource: "terminal", action: "update" },
  { pattern: /^\/admin\/terminal\/[^/]+$/, resource: "terminal", action: "read" },
  { pattern: /^\/admin\/staffs\/add$/, resource: "staff", action: "create" },
  { pattern: /^\/admin\/staffs\/[^/]+$/, resource: "staff", action: "read" },
  { pattern: /^\/it\/it-staffs\/add$/, resource: "staff", action: "create" },
  { pattern: /^\/it\/it-staffs\/[^/]+$/, resource: "staff", action: "read" },
  { pattern: /^\/it\/staffs\/[^/]+$/, resource: "staff", action: "read" },
  { pattern: /^\/it\/entities\/[^/]+$/, resource: "member", action: "read" },
  { pattern: /^\/it\/payments\/[^/]+$/, resource: "payment", action: "read" },
  { pattern: /^\/it\/properties\/[^/]+$/, resource: "property", action: "read" },
  { pattern: /^\/admin\/demands\/[^/]+$/, resource: "demand", action: "read" },
  { pattern: /^\/admin\/discounts\/[^/]+$/, resource: "discount", action: "read" },
  { pattern: /^\/admin\/partners\/add$/, resource: "partner", action: "create" },
  { pattern: /^\/admin\/partners\/[^/]+(?:\/.*)?$/, resource: "partner", action: "read" },
  { pattern: /^\/admin\/payments\/[^/]+$/, resource: "payment", action: "read" },
  { pattern: /^\/admin\/users\/[^/]+(?:\/.*)?$/, resource: "member", action: "read" },
  { pattern: /^\/admin\/wallet\/transaction\/[^/]+$/, resource: "wallet", action: "read" },
  { pattern: /^\/admin\/wallet\/statement$/, resource: "wallet", action: "read" },
  { pattern: /^\/admin\/recruitment\/[^/]+$/, resource: "recruitment", action: "read" },
];

/**
 * Check if a permission flag is granted.
 * Example: `hasPermission(perms, "payment.read")`
 */
export function hasPermission(
  permissions: PermissionsGroup | null | undefined,
  permissionKey: string
): boolean {
  if (!permissions) return false;
  const parts = permissionKey.split(".");
  if (parts.length === 2) {
    const [resource, action] = parts;
    const resObj = (permissions as any)?.[resource];
    if (resObj && typeof resObj[action] === "boolean") {
      return resObj[action];
    }
    // Fallback: if checking paymentCode or paymentSplit read, and not found, fall back to payment.read
    if ((resource === "paymentCode" || resource === "paymentSplit") && action === "read") {
      return Boolean(permissions.payment?.read);
    }
  }
  return false;
}

/**
 * Check if an action on a resource is allowed.
 * Example: `can(perms, "payment", "create")`
 */
export function can(
  permissions: PermissionsGroup | null | undefined,
  resource: keyof PermissionsGroup,
  action: PermissionAction
): boolean {
  if (!permissions) return false;
  return Boolean((permissions as any)?.[resource]?.[action]);
}

/**
 * Merge custom permissions overrides (array of strings or object).
 */
export function mergeCustomPermissions(
  base: PermissionsGroup,
  custom: any
): PermissionsGroup {
  if (!custom) return base;
  const clone: any = JSON.parse(JSON.stringify(base));

  if (Array.isArray(custom)) {
    for (const key of custom) {
      if (typeof key === "string") {
        const [res, act] = key.split(".");
        if (clone[res] && act) {
          clone[res][act] = true;
        }
      }
    }
    return clone;
  }

  if (typeof custom === "object") {
    for (const [res, acts] of Object.entries(custom)) {
      if (clone[res] && typeof acts === "object" && acts !== null) {
        for (const [act, val] of Object.entries(acts as any)) {
          if (typeof val === "boolean") {
            clone[res][act] = val;
          }
        }
      }
    }
    return clone;
  }

  return base;
}

export type DepartmentLike = {
  uid?: string;
  name?: string;
  role?: string;
  status?: boolean;
  permissions?: any;
} | null;

/**
 * Resolve the effective department role and grouped permissions for a user.
 */
export async function getDepartmentRoleForUser(
  departmentId?: string | null,
  fallbackDepartment?: DepartmentLike,
  customPermissions?: any
): Promise<{
  departmentRole: string | null;
  department: DepartmentLike;
  permissions: PermissionsGroup;
}> {
  if (fallbackDepartment?.role) {
    const role = fallbackDepartment.role;
    const base = ROLE_PERMISSIONS[role] || NO_PERMISSIONS;
    const permissions = mergeCustomPermissions(
      base,
      customPermissions || fallbackDepartment.permissions
    );
    return { departmentRole: role, department: fallbackDepartment, permissions };
  }

  if (!departmentId) {
    const permissions = mergeCustomPermissions(NO_PERMISSIONS, customPermissions);
    return { departmentRole: null, department: null, permissions };
  }

  const cacheKey = `amac_department_${departmentId}`;
  try {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const role = parsed?.role || null;
        const base = (role && ROLE_PERMISSIONS[role]) || NO_PERMISSIONS;
        const permissions = mergeCustomPermissions(
          base,
          customPermissions || parsed?.permissions
        );
        return { departmentRole: role, department: parsed, permissions };
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
    const role = department?.role || null;
    const base = (role && ROLE_PERMISSIONS[role]) || NO_PERMISSIONS;
    const permissions = mergeCustomPermissions(
      base,
      customPermissions || (department as any)?.permissions
    );
    return { departmentRole: role, department, permissions };
  } catch (e) {
    const permissions = mergeCustomPermissions(NO_PERMISSIONS, customPermissions);
    return { departmentRole: null, department: null, permissions };
  }
}

/**
 * Evaluate page access for a department role or permissions group against a pathname.
 */
export function getPageAccess(
  departmentRoleOrPermissions: string | PermissionsGroup | null | undefined,
  pathname: string
): PageAccess & { permissions: PermissionsGroup } {
  // Everyone can always see the dashboard.
  if (pathname === DASHBOARD_PATH || pathname === `${DASHBOARD_PATH}/`) {
    const permissions: PermissionsGroup =
      typeof departmentRoleOrPermissions === "string"
        ? (ROLE_PERMISSIONS[departmentRoleOrPermissions] || ALL_PERMISSIONS)
        : (departmentRoleOrPermissions || ALL_PERMISSIONS);
    return { allowed: true, readOnly: false, permissions };
  }

  const permissions: PermissionsGroup =
    typeof departmentRoleOrPermissions === "string"
      ? (ROLE_PERMISSIONS[departmentRoleOrPermissions] || NO_PERMISSIONS)
      : (departmentRoleOrPermissions || NO_PERMISSIONS);

  const normalized = pathname.replace(/\/+$/, "") || DASHBOARD_PATH;

  // Account / Security are accessible to any signed-in staff
  if (normalized === "/admin/account" || normalized === "/admin/security") {
    return { allowed: true, readOnly: false, permissions };
  }

  // Exact route match
  const mapped = ROUTE_PERMISSION_MAP[normalized];
  if (mapped) {
    const allowed = Boolean(
      (permissions as any)?.[mapped.resource]?.[mapped.action] ??
      (mapped.resource === "paymentCode" || mapped.resource === "paymentSplit"
        ? permissions.payment?.[mapped.action]
        : false)
    );
    const res = (permissions as any)?.[mapped.resource];
    const readOnly = res ? (!res.create && !res.update && !res.delete) : true;
    return { allowed, readOnly, permissions };
  }

  // Pattern match for detail pages
  const patternMatched = PATTERN_PERMISSION_MAP.find((entry) =>
    entry.pattern.test(normalized)
  );
  if (patternMatched) {
    const allowed = Boolean(
      (permissions as any)?.[patternMatched.resource]?.[patternMatched.action] ??
      (patternMatched.resource === "paymentCode" || patternMatched.resource === "paymentSplit"
        ? permissions.payment?.[patternMatched.action]
        : false)
    );
    const res = (permissions as any)?.[patternMatched.resource];
    const readOnly = res ? (!res.create && !res.update && !res.delete) : true;
    return { allowed, readOnly, permissions };
  }

  return { allowed: false, readOnly: true, permissions };
}

/**
 * Center resolution helper.
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
 * Filter nav items for the sidebar based on <resource>.read permissions.
 * If `<resource>.read` is true, the corresponding page is shown in the sidebar.
 */
export function filterNavItems<T extends { href: string }>(
  items: T[],
  departmentRoleOrPermissions: string | PermissionsGroup | null | undefined
): T[] {
  const permissions: PermissionsGroup =
    typeof departmentRoleOrPermissions === "string"
      ? (ROLE_PERMISSIONS[departmentRoleOrPermissions] || NO_PERMISSIONS)
      : (departmentRoleOrPermissions || NO_PERMISSIONS);

  return items.filter((item) => {
    if (
      item.href === DASHBOARD_PATH ||
      item.href === `${DASHBOARD_PATH}/` ||
      item.href === "/it" ||
      item.href === "/it/"
    ) {
      return true;
    }

    const normalized = item.href.replace(/\/+$/, "") || DASHBOARD_PATH;

    const mapped = ROUTE_PERMISSION_MAP[normalized];
    if (mapped) {
      if (mapped.resource === "paymentCode" || mapped.resource === "paymentSplit") {
        return Boolean(
          permissions[mapped.resource]?.read || permissions.payment?.read
        );
      }
      return Boolean((permissions as any)?.[mapped.resource]?.[mapped.action]);
    }

    const patternMatched = PATTERN_PERMISSION_MAP.find((entry) =>
      entry.pattern.test(normalized)
    );
    if (patternMatched) {
      return Boolean(
        (permissions as any)?.[patternMatched.resource]?.[patternMatched.action]
      );
    }

    return false;
  });
}
