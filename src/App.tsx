import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminGuard from "@/components/admin/AdminGuard";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import Booking from "./pages/Booking";
import Restaurant from "./pages/Restaurant";
import Spa from "./pages/Spa";
import Events from "./pages/Events";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Invoice from "./pages/Invoice";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FrontDesk from "./pages/admin/FrontDesk";
import Housekeeping from "./pages/admin/Housekeeping";
import RestaurantAdmin from "./pages/admin/RestaurantAdmin";
import SpaAdmin from "./pages/admin/SpaAdmin";
import Staff from "./pages/admin/Staff";
import Scheduling from "./pages/admin/Scheduling";
import CMS from "./pages/admin/CMS";
import Marketing from "./pages/admin/Marketing";
import Concierge from "./pages/admin/Concierge";
import Notifications from "./pages/admin/Notifications";
import ClaimOwnership from "./pages/admin/ClaimOwnership";
import FloatingConcierge from "@/components/FloatingConcierge";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/restaurant" element={<Restaurant />} />
              <Route path="/spa" element={<Spa />} />
              <Route path="/events" element={<Events />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/invoice/:id" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />

              <Route path="/admin/claim" element={<ClaimOwnership />} />
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/front-desk" element={<AdminGuard roles={["owner", "gm", "front_desk"]}><FrontDesk /></AdminGuard>} />
              <Route path="/admin/housekeeping" element={<AdminGuard roles={["owner", "gm", "housekeeping", "front_desk"]}><Housekeeping /></AdminGuard>} />
              <Route path="/admin/restaurant" element={<AdminGuard roles={["owner", "gm", "restaurant", "front_desk"]}><RestaurantAdmin /></AdminGuard>} />
              <Route path="/admin/spa" element={<AdminGuard roles={["owner", "gm", "spa", "front_desk"]}><SpaAdmin /></AdminGuard>} />
              <Route path="/admin/staff" element={<AdminGuard roles={["owner", "gm"]}><Staff /></AdminGuard>} />
              <Route path="/admin/scheduling" element={<AdminGuard roles={["owner", "gm"]}><Scheduling /></AdminGuard>} />
              <Route path="/admin/cms" element={<AdminGuard roles={["owner", "gm", "marketing"]}><CMS /></AdminGuard>} />
              <Route path="/admin/marketing" element={<AdminGuard roles={["owner", "gm", "marketing"]}><Marketing /></AdminGuard>} />
              <Route path="/admin/concierge" element={<AdminGuard><Concierge /></AdminGuard>} />
              <Route path="/admin/notifications" element={<AdminGuard><Notifications /></AdminGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <FloatingConcierge />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
