import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Business, BusinessAccount, InsertBusinessAccount } from "@shared/schema";

interface BusinessAccountManagerProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessAccountManager({ business, isOpen, onClose }: BusinessAccountManagerProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("invoice-lookup");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch business account data
  const { data: account } = useQuery({
    queryKey: [`/api/businesses/${business.id}/accounts`],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`);
      if (!response.ok) throw new Error("Failed to fetch business accounts");
      return response.json() as BusinessAccount;
    },
    enabled: isOpen,
  });

  const [formData, setFormData] = useState<Partial<InsertBusinessAccount>>({});

  // Update form data when account data loads
  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  // Save account data
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertBusinessAccount>) => {
      return apiRequest(`/api/businesses/${business.id}/accounts`, {
        method: account?.id ? "PUT" : "POST",
        body: JSON.stringify({ ...data, businessId: business.id }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã lưu thông tin tài khoản",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/accounts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu thông tin tài khoản",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const PasswordInput = ({ field, label, value }: { field: string; label: string; value?: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showPasswords[field] ? "text" : "password"}
          value={value || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => togglePasswordVisibility(field)}
        >
          {showPasswords[field] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">{business.name}</Badge>
            Quản Lý Tài Khoản Doanh Nghiệp
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="invoice-lookup">Tra Cứu HĐĐT</TabsTrigger>
            <TabsTrigger value="web-invoice">Web HĐĐT</TabsTrigger>
            <TabsTrigger value="social-insurance">Bảo Hiểm XH-YT</TabsTrigger>
            <TabsTrigger value="statistics">Thống Kê</TabsTrigger>
            <TabsTrigger value="token">TOKEN</TabsTrigger>
          </TabsList>

          {/* Tài khoản tra cứu HĐĐT */}
          <TabsContent value="invoice-lookup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tài Khoản Tra Cứu Hóa Đơn Điện Tử</CardTitle>
                <CardDescription>
                  Thông tin đăng nhập để tra cứu hóa đơn điện tử
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>ID Tài Khoản</Label>
                  <Input
                    value={formData.invoiceLookupId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceLookupId: e.target.value }))}
                    placeholder="Nhập ID tài khoản tra cứu"
                  />
                </div>
                <PasswordInput 
                  field="invoiceLookupPass" 
                  label="Mật khẩu" 
                  value={formData.invoiceLookupPass}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tài khoản Web HĐĐT */}
          <TabsContent value="web-invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tài Khoản Web Hóa Đơn Điện Tử</CardTitle>
                <CardDescription>
                  Thông tin đăng nhập web portal hóa đơn điện tử
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.webInvoiceWebsite || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, webInvoiceWebsite: e.target.value }))}
                    placeholder="https://website.com"
                  />
                </div>
                <div>
                  <Label>ID Tài Khoản</Label>
                  <Input
                    value={formData.webInvoiceId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, webInvoiceId: e.target.value }))}
                    placeholder="Nhập ID tài khoản web"
                  />
                </div>
                <PasswordInput 
                  field="webInvoicePass" 
                  label="Mật khẩu" 
                  value={formData.webInvoicePass}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tài khoản Bảo hiểm XH-YT */}
          <TabsContent value="social-insurance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tài Khoản Bảo Hiểm Xã Hội - Y Tế</CardTitle>
                <CardDescription>
                  Thông tin tài khoản bảo hiểm xã hội và y tế
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mã Bảo Hiểm</Label>
                  <Input
                    value={formData.socialInsuranceCode || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialInsuranceCode: e.target.value }))}
                    placeholder="Nhập mã bảo hiểm"
                  />
                </div>
                <div>
                  <Label>ID Tài Khoản</Label>
                  <Input
                    value={formData.socialInsuranceId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialInsuranceId: e.target.value }))}
                    placeholder="Nhập ID tài khoản"
                  />
                </div>
                <PasswordInput 
                  field="socialInsuranceMainPass" 
                  label="Mật khẩu chính" 
                  value={formData.socialInsuranceMainPass}
                />
                <PasswordInput 
                  field="socialInsuranceSecondaryPass" 
                  label="Mật khẩu phụ" 
                  value={formData.socialInsuranceSecondaryPass}
                />
                <div>
                  <Label>Thông tin liên hệ</Label>
                  <Input
                    value={formData.socialInsuranceContact || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialInsuranceContact: e.target.value }))}
                    placeholder="Số điện thoại, email liên hệ"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tài khoản thống kê */}
          <TabsContent value="statistics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tài Khoản Thống Kê</CardTitle>
                <CardDescription>
                  Thông tin đăng nhập hệ thống thống kê
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>ID Tài Khoản</Label>
                  <Input
                    value={formData.statisticsId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, statisticsId: e.target.value }))}
                    placeholder="Nhập ID tài khoản thống kê"
                  />
                </div>
                <PasswordInput 
                  field="statisticsPass" 
                  label="Mật khẩu" 
                  value={formData.statisticsPass}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tài khoản TOKEN */}
          <TabsContent value="token" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tài Khoản TOKEN</CardTitle>
                <CardDescription>
                  Thông tin token và đơn vị cung cấp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>ID Token</Label>
                  <Input
                    value={formData.tokenId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tokenId: e.target.value }))}
                    placeholder="Nhập ID token"
                  />
                </div>
                <PasswordInput 
                  field="tokenPass" 
                  label="Mật khẩu Token" 
                  value={formData.tokenPass}
                />
                <div>
                  <Label>Đơn vị cung cấp</Label>
                  <Input
                    value={formData.tokenProvider || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tokenProvider: e.target.value }))}
                    placeholder="Tên đơn vị cung cấp token"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ngày đăng ký</Label>
                    <Input
                      type="date"
                      value={formData.tokenRegistrationDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenRegistrationDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Ngày hết hạn</Label>
                    <Input
                      type="date"
                      value={formData.tokenExpirationDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenExpirationDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu tài khoản"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}