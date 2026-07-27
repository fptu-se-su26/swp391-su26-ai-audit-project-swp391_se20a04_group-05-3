import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardSkeleton } from "./Skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<"customer" | "store" | "admin">;
  onPageRedirect?: (page: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onPageRedirect,
}) => {
  const { user, role, isAuthenticating } = useAuth();
  const isAllowed = allowedRoles.includes(role);

  React.useEffect(() => {
    if (isAuthenticating) return;

    if (!user) {
      onPageRedirect?.("auth");
    } else if (!isAllowed) {
      onPageRedirect?.("home");
    }
  }, [user, role, isAllowed, isAuthenticating, onPageRedirect]);

  // While AppContext initializes: render Skeleton/loading screen
  if (isAuthenticating) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user || !isAllowed) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
