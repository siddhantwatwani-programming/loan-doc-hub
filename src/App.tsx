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
import CreateDealPage from "./pages/csr/CreateDealPage";
import DealOverviewPage from "./pages/csr/DealOverviewPage";
import DealDataEntryPage from "./pages/csr/DealDataEntryPage";
import DealDocumentsPage from "./pages/csr/DealDocumentsPage";
import UsersPage from "./pages/csr/UsersPage";
import DocumentsPage from "./pages/csr/DocumentsPage";
import ConfigurationPage from "./pages/admin/ConfigurationPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TemplateManagementPage from "./pages/admin/TemplateManagementPage";
import PacketManagementPage from "./pages/admin/PacketManagementPage";
import FieldDictionaryPage from "./pages/admin/FieldDictionaryPage";
import FieldMapEditorPage from "./pages/admin/FieldMapEditorPage";
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import MagicLinkAccessPage from "./pages/MagicLinkAccessPage";

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
              
              {/* Magic link access - no auth required */}
              <Route path="/access/:token" element={<MagicLinkAccessPage />} />
              
              {/* Protected routes with layout - all authenticated users */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-work/messages" element={<Dashboard />} />
                <Route path="/my-work/queue" element={<Dashboard />} />
                <Route path="/my-work/action-items" element={<Dashboard />} />
                <Route path="/my-work/alerts" element={<Dashboard />} />
              </Route>

              {/* Deal viewing - accessible by CSR, Admin, and external users (via RLS) */}
              <Route element={<AppLayout requiredRoles={['csr', 'admin', 'borrower', 'broker', 'lender']} />}>
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/deals/:id" element={<DealOverviewPage />} />
              </Route>

              {/* Deal data entry - accessible by CSR, Admin, and assigned external users */}
              <Route element={<AppLayout requiredRoles={['csr', 'admin', 'borrower', 'broker', 'lender']} />}>
                <Route path="/deals/:id/data" element={<DealDataEntryPage />} />
              </Route>

              {/* CSR-only routes - creating deals */}
              <Route element={<AppLayout requiredRoles={['csr', 'admin']} blockExternalUsers />}>
                <Route path="/deals/new" element={<CreateDealPage />} />
                <Route path="/deals/:id/edit" element={<DealDataEntryPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
              </Route>

              {/* Deal Documents - accessible by CSR and Admin */}
              <Route element={<AppLayout requiredRoles={['csr', 'admin']} />}>
                <Route path="/deals/:id/documents" element={<DealDocumentsPage />} />
              </Route>

              {/* Admin routes */}
              <Route element={<AppLayout requiredRoles={['admin']} blockExternalUsers />}>
                <Route path="/admin/config" element={<ConfigurationPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/templates" element={<TemplateManagementPage />} />
                <Route path="/admin/packets" element={<PacketManagementPage />} />
                <Route path="/admin/fields" element={<FieldDictionaryPage />} />
                <Route path="/admin/field-maps" element={<FieldMapEditorPage />} />
                <Route path="/admin/settings" element={<SystemSettingsPage />} />
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
