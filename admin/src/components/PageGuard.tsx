"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  DASHBOARD_PATH,
  getDepartmentRoleForUser,
  getPageAccess,
  PageAccess,
} from "@/lib/permissions";

type PageAccessState = PageAccess & {
  loading: boolean;
  departmentRole: string | null;
};

const DEFAULT_STATE: PageAccessState = {
  allowed: true,
  readOnly: false,
  loading: true,
  departmentRole: null,
};

const PageAccessContext = createContext<PageAccessState>(DEFAULT_STATE);

/** Consume the resolved access for the current page. */
export const usePageAccess = () => useContext(PageAccessContext);

/**
 * Global route guard for the /admin area.
 * - Resolves the signed-in user's department role (from departmentId).
 * - Redirects to /admin when the current page is not allowed.
 * - Exposes { allowed, readOnly, departmentRole } via usePageAccess()
 *   so pages can hide create/edit/delete UI for read-only roles.
 */
export default function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || DASHBOARD_PATH;
  const router = useRouter();
  const { user, role } = useAuth();
  // IT users have unrestricted access — same as ADMIN.
  const isAdminRole = role === "ADMIN" || role === "IT";
  const { addToast } = useToast();

  const [departmentRole, setDepartmentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isAdminRole);

  // IT / ADMIN roles are unrestricted — derive their role synchronously
  // during render instead of setting it from an effect. This prevents the
  // redirect effect from seeing a stale `allowed: false` on the very first
  // render (before departmentRole is resolved), which previously bounced IT
  // users out of /it and into /admin.
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
      const { departmentRole: resolved } = await getDepartmentRoleForUser(
        user?.departmentId,
        user?.department
      );
      if (!mounted) return;
      setDepartmentRole(resolved);
      setLoading(false);
    };
    resolve();
    return () => {
      mounted = false;
    };
  }, [isAdminRole, user?.departmentId, user?.department?.role, user?.uid]);

  const access = useMemo(
    () => getPageAccess(effectiveDepartmentRole, pathname),
    [effectiveDepartmentRole, pathname]
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
    }),
    [access.allowed, access.readOnly, loading, effectiveDepartmentRole]
  );

  return (
    <PageAccessContext.Provider value={value}>
      {children}
    </PageAccessContext.Provider>
  );
}
