import { isRouteErrorResponse, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Home, Mail } from "lucide-react";

interface ErrorPageProps {
  error?: unknown;
}

export function ErrorPage({ error }: ErrorPageProps = {}) {
  const location = useLocation();

  let errorMessage: string;
  let isNotFound: boolean;

  // Check if error prop was passed (from errorElement) or we have route error context
  const routeError = error;

  if (routeError && isRouteErrorResponse(routeError)) {
    errorMessage = routeError.statusText || "Page not found";
    isNotFound = routeError.status === 404;
  } else if (routeError instanceof Error) {
    errorMessage = routeError.message;
    isNotFound = false;
  } else {
    // Used as catch-all route (* path) - no error object
    errorMessage = `Path "${location.pathname}" not found`;
    isNotFound = true;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#E8E8E8] mb-2">
            {isNotFound ? "Page Not Found" : "Oops!"}
          </h1>
          <p className="text-[#909090] mb-2">
            {isNotFound
              ? "Hey there, the page you're looking for doesn't exist."
              : "Hey there, an error occurred while loading this page."}
          </p>
          {import.meta.env.DEV && (
            <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2 mt-2 font-mono">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1A1A1A] text-[#E8E8E8] hover:bg-[#252525] transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/help"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#E8E8E8] text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact help?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
