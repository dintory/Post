import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<any>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE =
  import.meta.env.VITE_API_URL || "https://post-rtc8.onrender.com";

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access_token or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    // Supabase's token refresh endpoint
    const res = await fetch(`${API_BASE}/auth/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Try the Supabase REST API directly
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL ||
        "https://hbqwsanncmfvbnvnwxgm.supabase.co";
      const supabaseRes = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              import.meta.env.VITE_SUPABASE_ANON_KEY ||
              "sb_publishable_uHaV-A4k6-jpvXNeWtOZBA_vwZQt1dz",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );
      if (!supabaseRes.ok) return null;
      const data = await supabaseRes.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token)
          localStorage.setItem("refresh_token", data.refresh_token);
        return data.access_token;
      }
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token)
        localStorage.setItem("refresh_token", data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("access_token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const attemptAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authFetch("/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }

      // Token might be expired — try refreshing
      if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry with new token
          const retryRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
            credentials: "include",
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setUser(data.user);
            return true;
          }
        }
      }

      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    await attemptAuth();
    setIsLoading(false);
  }, [attemptAuth]);

  const logout = useCallback(async () => {
    try {
      await authFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return data;
    },
    [],
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        checkAuth,
        login,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
