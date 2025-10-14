import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import PrivateRoute from "@/components/auth/PrivateRoute";
import ConsolidatedFindings from "@/pages/ConsolidatedFindings";
import HostBasedVulnerabilities from "@/pages/HostBasedVulnerabilities";
import Analytics from "@/pages/Analytics";
import AssignedToView from "@/pages/AssignedToView";
import VulnerabilityBasedView from "@/pages/VulnerabilityBasedView";
import BusinessOwnersDashboard from "@/pages/BusinessOwnersDashboard";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

/**
 * Authentication Flow Overview:
 * 
 * 1. User lands on any route
 * 2. If route is protected (wrapped in PrivateRoute):
 *    - PrivateRoute checks for 'authToken' in localStorage
 *    - If token exists: User can access the route
 *    - If token missing: User is redirected to /login
 * 3. On /login page:
 *    - User enters credentials
 *    - On success: JWT token is saved to localStorage
 *    - User is redirected to home page
 * 4. On logout:
 *    - Token is removed from localStorage
 *    - User is redirected to /login
 *    - All protected routes become inaccessible
 */

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="w-full">
            <Routes>
              {/* Public route - accessible without authentication */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes - require authentication token */}
              <Route path="/" element={
                <PrivateRoute>
                  <ConsolidatedFindings />
                </PrivateRoute>
              } />
              <Route path="/host-based" element={
                <PrivateRoute>
                  <HostBasedVulnerabilities />
                </PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              } />
              <Route path="/assigned-to" element={
                <PrivateRoute>
                  <AssignedToView />
                </PrivateRoute>
              } />
              <Route path="/vulnerability-based" element={
                <PrivateRoute>
                  <VulnerabilityBasedView />
                </PrivateRoute>
              } />
              <Route path="/business-owners" element={
                <PrivateRoute>
                  <BusinessOwnersDashboard />
                </PrivateRoute>
              } />
              
              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
