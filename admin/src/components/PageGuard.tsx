"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ALL_PERMISSIONS,
  can as canHelper,
  DASHBOARD_PATH,
  getDepartmentRoleForUser,
  getPageAccess,
  hasPermission as hasPermissionHelper,
  NO_PERMISSIONS,
  PageAccess,
  PermissionAction,
  PermissionsGroup,
} from "@/lib/permissions";

type PageAccessState = PageAccess & {
  loading: boolean;
  departmentRole: string | null;
  permissions: PermissionsGroup;
  hasPermission: (permissionKey: string) => boolean;
  can: (resource: keyof PermissionsGroup, action: PermissionAction) => boolean;
};

const DEFAULT_STATE: PageAccessState = {
  allowed: true,
  readOnly: false,
  loading: true,
  departmentRole: null,
  permissions: ALL_PERMISSIONS,
  hasPermission: () => true,
  can: () => true,
};

const PageAccessContext = createContext<PageAccessState>(DEFAULT_STATE);

/** Consume the resolved access and granular permissions for the current page. */
export const usePageAccess = () => useContext(PageAccessContext);

/**
 * Global route guard for the /admin area.
 * - Resolves the signed-in user's department role and permissions.
 * - Redirects to /admin when the current page is not allowed.
 * - Exposes { allowed, readOnly, departmentRole, permissions, hasPermission, can } via usePageAccess()
 *   so pages can hide create/edit/delete UI based on granular permissions (e.g. payment.create).
 */
export default function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || DASHBOARD_PATH;
  const router = useRouter();
  const { user, role } = useAuth();
  // IT and ADMIN users have unrestricted access.
  const isAdminRole = role === "ADMIN" || role === "IT";
  const { addToast } = useToast();

  const [departmentRole, setDepartmentRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsGroup>(
    isAdminRole ? ALL_PERMISSIONS : NO_PERMISSIONS
  );
  const [loading, setLoading] = useState(!isAdminRole);

  const effectivePermissions = isAdminRole ? ALL_PERMISSIONS : permissions;
  const effectiveDepartmentRole = isAdminRole
    ? "Financial Controller / Super Admin"
    : departmentRole;

  useEffect(() => {
    // ADMIN / IT login roles have full access regardless of department —
    // skip the async department resolution entirely.
    if (isAdminRole) return;
    let mounted = true;
    const resolve = async () => {
      setLoading(true);
      const { departmentRole: resolvedRole, permissions: resolvedPerms } =
        await getDepartmentRoleForUser(
          user?.departmentId,
          user?.department,
          (user as any)?.permissions
        );
      if (!mounted) return;
      setDepartmentRole(resolvedRole);
      setPermissions(resolvedPerms);
      setLoading(false);
    };
    resolve();
    return () => {
      mounted = false;
    };
  }, [isAdminRole, user?.departmentId, user?.department?.role, user?.uid]);

  const access = useMemo(
    () => getPageAccess(effectivePermissions, pathname),
    [effectivePermissions, pathname]
  );

  useEffect(() => {
    if (loading) return;
    if (!access.allowed) {
      addToast("error", "You don't have permission to access this page");
      router.replace(DASHBOARD_PATH);
    }
  }, [loading, access.allowed, router, addToast]);

  const value: PageAccessState = useMemo(
    () => ({
      allowed: access.allowed,
      readOnly: access.readOnly,
      loading,
      departmentRole: effectiveDepartmentRole,
      permissions: effectivePermissions,
      hasPermission: (key: string) => hasPermissionHelper(effectivePermissions, key),
      can: (resource: keyof PermissionsGroup, action: PermissionAction) =>
        canHelper(effectivePermissions, resource, action),
    }),
    [access.allowed, access.readOnly, loading, effectiveDepartmentRole, effectivePermissions]
  );

  return (
    <PageAccessContext.Provider value={value}>
      {children}
    </PageAccessContext.Provider>
  );
}
