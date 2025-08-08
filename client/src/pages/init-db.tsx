import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function InitializeDatabasePage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setResult(null);

    try {
      const response = await fetch("/api/initialize-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.message || "Lỗi không xác định" });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: "Không thể kết nối đến server: " + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const runMigration = async () => {
    setIsMigrating(true);
    setResult(null);

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.message || "Lỗi migration" });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: "Không thể chạy migration: " + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Khởi Tạo Cơ Sở Dữ Liệu</CardTitle>
          <CardDescription>
            Sửa lỗi 500 khi đăng nhập và thêm doanh nghiệp trên production. Chạy Migration trước!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button 
              onClick={runMigration}
              disabled={isMigrating || isInitializing}
              className="w-full"
              variant="default"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang chạy Migration...
                </>
              ) : (
                "🚀 Chạy Migration (Production Fix)"
              )}
            </Button>
            
            <Button 
              onClick={initializeDatabase}
              disabled={isInitializing || isMigrating}
              className="w-full"
              variant="outline"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                "Khởi Tạo Cơ Sở Dữ Liệu (Backup)"
              )}
            </Button>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {result?.success && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Tài khoản admin đã tạo:</strong></p>
              <p>Username: <code>quanadmin</code></p>
              <p>Password: <code>01020811</code></p>
              <p className="mt-4">
                <a href="/" className="text-primary hover:underline">
                  Quay về trang chủ →
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}