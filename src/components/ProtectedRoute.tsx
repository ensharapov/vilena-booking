import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, master, isLoading, isMasterLoading } = useAuth();

  // Ждём и начальный isLoading, и загрузку мастера после авторизации
  if (isLoading || isMasterLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Только после завершения загрузки мастера редиректим на онбординг
  if (!master) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
