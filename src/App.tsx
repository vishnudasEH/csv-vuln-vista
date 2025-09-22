import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import ConsolidatedFindings from "@/pages/ConsolidatedFindings";
import HostBasedVulnerabilities from "@/pages/HostBasedVulnerabilities";
import Analytics from "@/pages/Analytics";
import SlaTracker from "@/pages/SlaTracker";
import AssignedToView from "@/pages/AssignedToView";
import SlideReadyView from "@/pages/SlideReadyView";
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
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<ConsolidatedFindings />} />
              <Route path="/host-based" element={<HostBasedVulnerabilities />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/sla-tracker" element={<SlaTracker />} />
              <Route path="/assigned-to" element={<AssignedToView />} />
              <Route path="/slide-ready" element={<SlideReadyView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
