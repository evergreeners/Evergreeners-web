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

import { useEffect } from "react";
import { getApiUrl } from "@/lib/api-config";

const queryClient = new QueryClient();

const AppContents = () => {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.session?.token) {
      console.log("Starting GitHub sync... (Try 3 - Cookie Fix)");
      fetch(getApiUrl("/api/user/sync-github"), {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.session.token}`
        }
      }).catch(err => console.error("Background sync failed", err));
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
      <AppContents />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
