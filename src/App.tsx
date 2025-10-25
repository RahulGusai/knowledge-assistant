import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "./contexts/AppContext";
import { PipelineProvider } from "./contexts/PipelineContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Files from "./pages/Files";
import Integrations from "./pages/Integrations";
import Branding from "./pages/Branding";
import Pipeline from "./pages/Pipeline";
import Assistant from "./pages/Assistant";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import WorkspaceLoader from "./components/WorkspaceLoader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <AppProvider>
          <PipelineProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <WorkspaceLoader>
                      <DashboardLayout>
                        <Routes>
                          <Route path="/home" element={<Dashboard />} />
                          <Route path="/files" element={<Files />} />
                          <Route path="/integrations" element={<Integrations />} />
                          <Route path="/branding" element={<Branding />} />
                          <Route path="/pipeline" element={<Pipeline />} />
                          <Route path="/assistant" element={<Assistant />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </DashboardLayout>
                    </WorkspaceLoader>
                  </ProtectedRoute>
                }
              />
              </Routes>
            </BrowserRouter>
          </PipelineProvider>
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
