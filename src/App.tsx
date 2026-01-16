import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./components/auth/AuthPage";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import DealsPage from "./pages/csr/DealsPage";
import NewDealPage from "./pages/csr/NewDealPage";
import BorrowersPage from "./pages/csr/BorrowersPage";
import DocumentsPage from "./pages/csr/DocumentsPage";
import ConfigurationPage from "./pages/admin/ConfigurationPage";
import UserManagementPage from "./pages/admin/UserManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected routes with layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* CSR routes */}
              <Route element={<AppLayout requiredRoles={['csr']} />}>
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/deals/new" element={<NewDealPage />} />
                <Route path="/borrowers" element={<BorrowersPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
              </Route>

              {/* Admin routes */}
              <Route element={<AppLayout requiredRoles={['admin']} />}>
                <Route path="/admin/config" element={<ConfigurationPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
