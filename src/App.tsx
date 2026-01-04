import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import PrivateRoute from "@/components/auth/PrivateRoute";
import AccountSelection from "@/pages/AccountSelection";
import ConsolidatedFindings from "@/pages/ConsolidatedFindings";
import HostBasedVulnerabilities from "@/pages/HostBasedVulnerabilities";
import Analytics from "@/pages/Analytics";
import AssignedToView from "@/pages/AssignedToView";
import VulnerabilityBasedView from "@/pages/VulnerabilityBasedView";
import BusinessOwnersDashboard from "@/pages/BusinessOwnersDashboard";
import CloudflareDashboard from "@/pages/CloudflareDashboard";
import CloudflareTrends from "@/pages/CloudflareTrends";
import CloudflareReports from "@/pages/CloudflareReports";
import CloudflareSettings from "@/pages/CloudflareSettings";
import CloudflareVulnerabilitiesPage from "@/pages/CloudflareVulnerabilitiesPage";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

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
              <Route path="/login" element={<Login />} />
              
              {/* Account Selection */}
              <Route path="/" element={<PrivateRoute><AccountSelection /></PrivateRoute>} />
              
              {/* Internal Server Module - Consolidated Findings is default */}
              <Route path="/internal" element={<PrivateRoute><ConsolidatedFindings /></PrivateRoute>} />
              <Route path="/internal/host-based" element={<PrivateRoute><HostBasedVulnerabilities /></PrivateRoute>} />
              <Route path="/internal/vulnerability-based" element={<PrivateRoute><VulnerabilityBasedView /></PrivateRoute>} />
              <Route path="/internal/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/internal/assigned-to" element={<PrivateRoute><AssignedToView /></PrivateRoute>} />
              <Route path="/internal/business-owners" element={<PrivateRoute><BusinessOwnersDashboard /></PrivateRoute>} />
              
              {/* Cloudflare Module */}
              <Route path="/cloudflare" element={<PrivateRoute><CloudflareDashboard /></PrivateRoute>} />
              <Route path="/cloudflare/vulnerabilities" element={<PrivateRoute><CloudflareVulnerabilitiesPage /></PrivateRoute>} />
              <Route path="/cloudflare/trends" element={<PrivateRoute><CloudflareTrends /></PrivateRoute>} />
              <Route path="/cloudflare/reports" element={<PrivateRoute><CloudflareReports /></PrivateRoute>} />
              <Route path="/cloudflare/settings" element={<PrivateRoute><CloudflareSettings /></PrivateRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
