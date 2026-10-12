import type { ReactNode } from "react";
import { useAuth } from "../context/useAuth";
import ForbiddenPage from "../pages/errors/ForbiddenPage";

interface RequirePermissionProps {
  anyOf: string[];
  children: ReactNode;
}

export function RequirePermission({ anyOf, children }: RequirePermissionProps) {
  const { hasAnyPermission } = useAuth();

  if (!hasAnyPermission(anyOf)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
