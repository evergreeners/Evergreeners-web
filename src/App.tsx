import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Analytics from "./pages/Analytics";
import Quests from "./pages/Quests";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

import { useEffect } from "react";
import { getApiUrl } from "@/lib/api-config";
import { usePrefetchAppData } from "@/hooks/usePrefetchAppData";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes  
      gcTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 1,
      // Prefetch on window focus
      refetchOnWindowFocus: true,
    },
  },
});

const AppContents = () => {
  const { data: session } = useSession();

  // Prefetch all app data immediately when user logs in
  usePrefetchAppData(session?.session?.token);


  // Background sync effect - runs silently after login without blocking UI
  useEffect(() => {
    if (session?.session?.token) {
      // Run sync in background - does NOT block UI rendering
      const syncGithub = async () => {
        try {
          const res = await fetch(getApiUrl("/api/user/sync-github"), {
            method: "POST",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${session.session.token}`
            }
          });

          if (res.ok) {
            console.log("Background GitHub sync completed successfully");
          }
        } catch (err) {
          // Silent fail - sync is not critical for page load
          console.debug("Background sync skipped:", err);
        }
      };

      // Fire and forget - don't await, let UI render immediately
      syncGithub();
    }
  }, [session?.session?.token]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Index />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <AppContents />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
