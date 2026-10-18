import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-display text-2xl text-muted-foreground animate-pulse">Your Hotel  </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}
