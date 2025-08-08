import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserLoginRequest } from "@shared/schema";

export type UserType = "admin" | "employee";

interface AuthUser {
  id: number;
  userType: UserType;
  identifier: string; // username cho admin/employee
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLoginRequest) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () => localStorage.getItem("user-token");
  const setToken = (token: string) => localStorage.setItem("user-token", token);
  const removeToken = () => localStorage.removeItem("user-token");

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user);
        } else {
          removeToken();
        }
      } else {
        removeToken();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: UserLoginRequest): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          setUser(data.user);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}