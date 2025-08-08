import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, EyeOff, Save } from "lucide-react";
import { insertBusinessAccountSchema, updateBusinessAccountSchema, type Business, type BusinessAccount, type InsertBusinessAccount, type UpdateBusinessAccount } from "@shared/schema";

interface BusinessAccountManagerProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessAccountManager({ business, isOpen, onClose }: BusinessAccountManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: account, refetch } = useQuery<BusinessAccount | null>({
    queryKey: [`/api/businesses/${business.id}/accounts`],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch account");
      }
      return response.json();
    },
    enabled: isOpen && !!business.id,
  });

  const form = useForm<InsertBusinessAccount>({
    resolver: zodResolver(account ? updateBusinessAccountSchema : insertBusinessAccountSchema),
    defaultValues: {
      businessId: business.id,
      invoiceLookupId: "",
      invoiceLookupPass: "",
      webInvoiceWebsite: "",
      webInvoiceId: "",
      webInvoicePass: "",
      socialInsuranceCode: "",
      socialInsuranceId: "",
      socialInsuranceMainPass: "",
      socialInsuranceSecondaryPass: "",
      socialInsuranceContact: "",
      statisticsId: "",
      statisticsPass: "",
      tokenId: "",
      tokenPass: "",
      tokenProvider: "",
      tokenRegistrationDate: "",
      tokenExpirationDate: "",
      taxAccountId: "",
      taxAccountPass: "",
    },
  });

  useEffect(() => {
    if (account) {
      form.reset(account);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [account, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertBusinessAccount) => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create account: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (account) => {
      toast({
        title: "Thành công",
        description: "Đã tạo tài khoản doanh nghiệp thành công",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/accounts`] });
      refetch();
      setIsEditing(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateBusinessAccount) => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update account");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật tài khoản doanh nghiệp",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/accounts`] });
    },
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) {
      toast({
        title: "Không có dữ liệu",
        description: `${fieldName} trống`,
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: `${fieldName} đã được sao chép vào clipboard`,
    });
  };

  const onSubmit = (data: InsertBusinessAccount) => {
    if (account) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Quản Lý Tài Khoản - {business.name}
            {account && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                Chỉnh sửa
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Lookup Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài Khoản Tra Cứu HĐĐT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID tra cứu HĐĐT</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("invoiceLookupId")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("invoiceLookupId") || "", "ID tra cứu HĐĐT")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu tra cứu HĐĐT</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("invoiceLookupPass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("invoiceLookupPass") || "", "Mật khẩu tra cứu HĐĐT")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web Invoice Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài Khoản Web HĐĐT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Website HĐĐT</Label>
                <Input
                  {...form.register("webInvoiceWebsite")}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID Web HĐĐT</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("webInvoiceId")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("webInvoiceId") || "", "ID Web HĐĐT")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu Web HĐĐT</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("webInvoicePass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("webInvoicePass") || "", "Mật khẩu Web HĐĐT")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Insurance Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài Khoản Bảo Hiểm XH-YT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Mã bảo hiểm</Label>
                  <Input
                    {...form.register("socialInsuranceCode")}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label>ID Bảo hiểm</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("socialInsuranceId")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("socialInsuranceId") || "", "ID Bảo hiểm")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Liên hệ</Label>
                  <Input
                    {...form.register("socialInsuranceContact")}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mật khẩu chính</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("socialInsuranceMainPass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("socialInsuranceMainPass") || "", "Mật khẩu chính BH")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu phụ</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("socialInsuranceSecondaryPass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("socialInsuranceSecondaryPass") || "", "Mật khẩu phụ BH")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài Khoản Thống Kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID thống kê</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("statisticsId")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("statisticsId") || "", "ID thống kê")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu thống kê</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("statisticsPass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("statisticsPass") || "", "Mật khẩu thống kê")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài Khoản TOKEN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID TOKEN</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("tokenId")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("tokenId") || "", "ID TOKEN")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu TOKEN</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("tokenPass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("tokenPass") || "", "Mật khẩu TOKEN")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Đơn vị cung cấp</Label>
                  <Input
                    {...form.register("tokenProvider")}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label>Ngày đăng ký</Label>
                  <Input
                    type="date"
                    {...form.register("tokenRegistrationDate")}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label>Ngày hết hạn</Label>
                  <Input
                    type="date"
                    {...form.register("tokenExpirationDate")}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài Khoản Khai Thuế, Nộp Thuế</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID tài khoản thuế</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("taxAccountId")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("taxAccountId") || "", "ID tài khoản thuế")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu tài khoản thuế</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("taxAccountPass")}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("taxAccountPass") || "", "Mật khẩu tài khoản thuế")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
            {isEditing && (
              <>
                {account && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Hủy chỉnh sửa
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Đang lưu..." : account ? "Cập nhật" : "Tạo mới"}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}