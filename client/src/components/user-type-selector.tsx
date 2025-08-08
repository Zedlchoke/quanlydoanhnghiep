import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Building } from "lucide-react";
import logoImage from "@assets/Picture1_1754621344471.png";

interface UserTypeSelectorProps {
  onSelectUserType: (userType: "admin" | "employee") => void;
}

export function UserTypeSelector({ onSelectUserType }: UserTypeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Logo và Header */}
        <div className="text-center space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-lg p-2">
            <img 
              src={logoImage} 
              alt="Royal Việt Nam Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Phần mềm quản lý doanh nghiệp
            </h1>
            <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              Royal Việt Nam
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Công ty TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam
            </p>
          </div>
        </div>

        {/* Banner quảng cáo */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-center text-white shadow-lg">
          <h3 className="text-xl font-semibold mb-2">
            🌟 Dịch vụ tư vấn doanh nghiệp chuyên nghiệp 🌟
          </h3>
          <p className="text-sm opacity-90">
            Hỗ trợ thành lập, quản lý và phát triển doanh nghiệp một cách hiệu quả
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-500"
            onClick={() => onSelectUserType("admin")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto flex items-center justify-center mb-2">
                <Crown className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-600 dark:text-red-400">
                Admin
              </CardTitle>
              <CardDescription>
                Toàn quyền quản lý hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="destructive" className="mb-3">
                Quyền cao nhất
              </Badge>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Quản lý tất cả doanh nghiệp</li>
                <li>• Xem, thêm, sửa, xóa</li>
                <li>• Thiết lập mã truy cập</li>
                <li>• Quản lý hồ sơ</li>
              </ul>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700">
                Đăng nhập Admin
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-500"
            onClick={() => onSelectUserType("employee")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-green-600 dark:text-green-400">
                Nhân viên
              </CardTitle>
              <CardDescription>
                Hỗ trợ quản lý doanh nghiệp
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-3 bg-green-100 text-green-800">
                Quyền hạn chế
              </Badge>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Thêm doanh nghiệp mới</li>
                <li>• Tìm kiếm thông tin</li>
                <li>• Không thể xóa/sửa</li>
                <li>• Liên hệ admin để lấy mật khẩu</li>
              </ul>
              <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                Đăng nhập Nhân viên
              </Button>
            </CardContent>
          </Card>


        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          © 2024 Công ty TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam
        </div>
      </div>
    </div>
  );
}