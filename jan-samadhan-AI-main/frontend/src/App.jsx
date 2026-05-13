import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LanguageProvider } from "./hooks/useLanguage";
import { ThemeProvider } from "./hooks/useTheme";
import Navbar from "./components/Shared/Navbar";
import Chatbot from "./components/Shared/Chatbot";
import HomePage from "./pages/HomePage";
import PublicInfoPage from "./pages/PublicInfoPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CitizenDashboard from "./pages/Citizen/CitizenDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import OfficerDashboard from "./pages/Officer/OfficerDashboard";
import TrackComplaint from "./pages/TrackComplaint";
import { LoadingSpinner } from "./components/Shared";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--theme-page)] text-[var(--theme-text)] transition-colors duration-200">
      <Navbar />
      <main>{children}</main>
      <Chatbot />
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>;
  if (!user) return <HomePage />;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "OFFICER") return <Navigate to="/officer/dashboard" replace />;
  return <Navigate to="/citizen/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email/:uidb64/:token" element={<VerifyEmailPage />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/about" element={<PublicInfoPage page="about" />} />
          <Route path="/sitemap" element={<PublicInfoPage page="sitemap" />} />
          <Route path="/redress-process" element={<PublicInfoPage page="redress" />} />
          <Route path="/officers" element={<PublicInfoPage page="officers" />} />
          <Route path="/ai-classification" element={<PublicInfoPage page="ai" />} />
          <Route path="/help" element={<PublicInfoPage page="help" />} />
          <Route path="/contact" element={<PublicInfoPage page="contact" />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/submit-complaint" element={
            <ProtectedRoute allowedRoles={["CITIZEN"]}>
              <Navigate to="/citizen/dashboard?new=1" replace />
            </ProtectedRoute>
          } />

          {/* Citizen */}
          <Route path="/citizen/dashboard" element={
            <ProtectedRoute allowedRoles={["CITIZEN"]}>
              <Layout><CitizenDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Officer */}
          <Route path="/officer/dashboard" element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <Layout><OfficerDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
