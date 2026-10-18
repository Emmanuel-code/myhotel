import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles, AppRole } from "@/hooks/useRoles";

export default function AdminGuard({ children, roles }: { children: JSX.Element; roles?: AppRole[] }) {
  const { user, loading: authLoading } = useAuth();
  const { isStaff, hasAny, loading } = useRoles();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-display text-2xl text-muted-foreground animate-pulse">Your Hotel  </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?redirect=/admin" replace />;
  if (!isStaff) return <Navigate to="/admin/claim" replace />;
  if (roles && !hasAny(...roles)) return <Navigate to="/admin" replace />;
  return children;
}
