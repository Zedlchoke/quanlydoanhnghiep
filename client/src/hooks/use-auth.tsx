import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LoginRequest, ChangePasswordRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  changePassword: (request: ChangePasswordRequest) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getToken = () => localStorage.getItem("admin-token");
  const setToken = (token: string) => localStorage.setItem("admin-token", token);
  const removeToken = () => localStorage.removeItem("admin-token");

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
          setUser(data.admin);
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

  const login = async (credentials: LoginRequest): Promise<boolean> => {
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
        setToken(data.token);
        setUser(data.admin);
        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng ${data.admin.username}!`,
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Đăng nhập thất bại",
          description: error.message || "Tài khoản hoặc mật khẩu không đúng",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Lỗi đăng nhập",
        description: "Không thể kết nối đến máy chủ",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    const token = getToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    removeToken();
    setUser(null);
    toast({
      title: "Đã đăng xuất",
      description: "Bạn đã đăng xuất thành công",
    });
  };

  const changePassword = async (request: ChangePasswordRequest): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Chưa đăng nhập",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đổi mật khẩu thành công",
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Đổi mật khẩu thất bại",
          description: error.message || "Mật khẩu hiện tại không đúng",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến máy chủ",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
      }}
    >
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