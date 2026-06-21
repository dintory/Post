import {
  Routes,
  Route,
  useLocation,
  useRouteError,
  useNavigate,
  Link,
} from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Accounts } from "./pages/Accounts";
import { Videos } from "./pages/Videos";
import { Video } from "./pages/Video";
import { Analytics } from "./pages/Analytics";
import { VideoEffects } from "./pages/VideoEffects";
import { Automation } from "./pages/Automation";
import { Settings } from "./pages/Settings";
import { Help } from "./pages/Help";
import { ErrorPage } from "./pages/ErrorPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function ErrorBoundaryWrapper() {
  const error = useRouteError();
  return <ErrorPage error={error} />;
}

const validRoutes = [
  "/dashboard",
  "/accounts",
  "/videos",
  "/video",
  "/video/effects",
  "/analytics",
  "/automation",
  "/settings",
  "/help",
];

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const isHome = location.pathname === "/";
  const isLogin = location.pathname === "/login";
  const isErrorPage =
    !isHome && !isLogin && !validRoutes.includes(location.pathname);
  const showSidebar = !isHome && !isLogin && !isErrorPage;

  // Redirect authenticated users away from login/signup
  useEffect(() => {
    if (isAuthenticated && (isLogin || isHome)) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLogin, isHome, navigate]);

  // Three layout modes: sidebar (valid routes), header (home/login), clean (error pages)
  if (isErrorPage) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <ErrorPage />
      </div>
    );
  }

  if (showSidebar) {
    // Auth gate at layout level — sidebar never renders for unauthorized users
    if (isLoading) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center px-4"
          >
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#E8E8E8] mb-2">
              Unauthorized
            </h1>
            <p className="text-[#909090] mb-6">
              You must be logged in to access this page.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#E8E8E8] text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
            >
              Go to Login
            </Link>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-56">
            <main className="p-8">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route
                    path="/dashboard"
                    element={
                      <PageWrapper>
                        <Dashboard />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/accounts"
                    element={
                      <PageWrapper>
                        <Accounts />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/videos"
                    element={
                      <PageWrapper>
                        <Videos />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/video"
                    element={
                      <PageWrapper>
                        <Video />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/video/effects"
                    element={
                      <PageWrapper>
                        <VideoEffects />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/analytics"
                    element={
                      <PageWrapper>
                        <Analytics />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/automation"
                    element={
                      <PageWrapper>
                        <Automation />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/settings"
                    element={
                      <PageWrapper>
                        <Settings />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                  <Route
                    path="/help"
                    element={
                      <PageWrapper>
                        <Help />
                      </PageWrapper>
                    }
                    errorElement={<ErrorBoundaryWrapper />}
                  />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Login with Header, home without Header
  return (
    <div className="min-h-screen bg-zinc-950">
      {!isLogin && !isHome && <Header />}
      <main>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PageWrapper>
                  <Home />
                </PageWrapper>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
