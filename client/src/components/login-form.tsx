import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";

interface LoginFormProps {
  onLogin: (credentials: LoginRequest) => void;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginRequest) => {
    onLogin(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng Nhập Admin</CardTitle>
          <CardDescription>
            Phần Mềm Quản Lý Doanh Nghiệp Long Quân
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                {...form.register("username")}
                disabled={isLoading}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                "Đang đăng nhập..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Đăng Nhập
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Người ngoài có thể:</p>
            <p>• Tìm kiếm doanh nghiệp</p>
            <p>• Thêm doanh nghiệp mới</p>
            <p className="mt-2 font-medium">Admin có thể:</p>
            <p>• Chỉnh sửa và xóa doanh nghiệp</p>
            <p>• Quản lý giao nhận hồ sơ</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}