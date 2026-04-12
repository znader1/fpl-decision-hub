import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Still resolving the session — render nothing to avoid flash
  if (loading) return null;

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
