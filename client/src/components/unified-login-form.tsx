import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Crown, Users, Building, Loader2 } from "lucide-react";
import type { UserLoginRequest } from "@shared/schema";
import logoImage from "@assets/Picture1_1754621344471.png";

interface UnifiedLoginFormProps {
  userType: "admin" | "employee";
  onLogin: (credentials: UserLoginRequest) => Promise<boolean>;
  onBack: () => void;
}

export function UnifiedLoginForm({ userType, onLogin, onBack }: UnifiedLoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await onLogin({
        userType,
        identifier,
        password
      });

      if (!success) {
        setError(getErrorMessage());
      }
    } catch (error) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = () => {
    switch (userType) {
      case "admin":
        return "Tài khoản hoặc mật khẩu admin không đúng";
      case "employee":
        return "Mật khẩu nhân viên không đúng. Liên hệ admin để lấy mật khẩu.";
      default:
        return "Thông tin đăng nhập không đúng";
    }
  };

  const getFormConfig = () => {
    switch (userType) {
      case "admin":
        return {
          title: "Đăng nhập Admin",
          description: "Đăng nhập với quyền quản trị viên",
          icon: <Crown className="w-8 h-8 text-red-600" />,
          identifierLabel: "Tên đăng nhập",
          identifierPlaceholder: "",
          passwordLabel: "Mật khẩu",
          passwordPlaceholder: "Nhập mật khẩu admin",
          color: "red"
        };
      case "employee":
        return {
          title: "Đăng nhập Nhân viên",
          description: "Đăng nhập với quyền nhân viên",
          icon: <Users className="w-8 h-8 text-green-600" />,
          identifierLabel: "Tên nhân viên",
          identifierPlaceholder: "Nhập tên nhân viên",
          passwordLabel: "Mật khẩu",
          passwordPlaceholder: "Liên hệ admin để lấy mật khẩu",
          color: "green"
        };

      default:
        return {
          title: "Đăng nhập",
          description: "Vui lòng đăng nhập",
          icon: <Crown className="w-8 h-8 text-gray-600" />,
          identifierLabel: "Tài khoản",
          identifierPlaceholder: "",
          passwordLabel: "Mật khẩu",
          passwordPlaceholder: "",
          color: "gray"
        };
    }
  };

  const config = getFormConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="self-start p-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center shadow-lg p-2">
              <img 
                src={logoImage} 
                alt="Royal Việt Nam Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-xl">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{config.identifierLabel}</Label>
              <Input
                id="identifier"
                type="text"
                placeholder={config.identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{config.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder={config.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className={`w-full bg-${config.color}-600 hover:bg-${config.color}-700`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}