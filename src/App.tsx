import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import More from "./pages/More";
import MasterSettings from "./pages/MasterSettings";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import Booking from "./pages/Booking";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "always", // не блокировать запросы из-за navigator.onLine
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootRedirect() {
  const { session, isLoading, isMasterLoading } = useAuth();

  if (isLoading || isMasterLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Navigate to={session ? "/today" : "/auth"} replace />;
}

function OnboardingRoute() {
  const { session, master, isLoading, isMasterLoading } = useAuth();

  if (isLoading || isMasterLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (master) return <Navigate to="/today" replace />;

  return <Onboarding />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background flex justify-center">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/onboarding" element={<OnboardingRoute />} />

              {/* Protected routes with bottom nav */}
              <Route
                path="/today"
                element={
                  <ProtectedRoute>
                    <AppLayout><Today /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <AppLayout><Calendar /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <AppLayout><Clients /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/more"
                element={
                  <ProtectedRoute>
                    <AppLayout><More /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout><MasterSettings /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <AppLayout><Services /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Public booking page — must be last to catch /:slug */}
              <Route path="/:slug" element={<Booking />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
