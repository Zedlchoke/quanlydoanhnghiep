
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, X, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertBusinessAccountSchema, updateBusinessAccountSchema, type InsertBusinessAccount, type UpdateBusinessAccount, type Business, type BusinessAccount } from "@shared/schema";

interface BusinessAccountManagerProps {
  business: Business;
}

export function BusinessAccountManager({ business }: BusinessAccountManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

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
    enabled: open && !!business.id,
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

  // Update form when account data is loaded
  useEffect(() => {
    if (account) {
      form.reset({
        businessId: business.id,
        invoiceLookupId: account.invoiceLookupId || "",
        invoiceLookupPass: account.invoiceLookupPass || "",
        webInvoiceWebsite: account.webInvoiceWebsite || "",
        webInvoiceId: account.webInvoiceId || "",
        webInvoicePass: account.webInvoicePass || "",
        socialInsuranceCode: account.socialInsuranceCode || "",
        socialInsuranceId: account.socialInsuranceId || "",
        socialInsuranceMainPass: account.socialInsuranceMainPass || "",
        socialInsuranceSecondaryPass: account.socialInsuranceSecondaryPass || "",
        socialInsuranceContact: account.socialInsuranceContact || "",
        statisticsId: account.statisticsId || "",
        statisticsPass: account.statisticsPass || "",
        tokenId: account.tokenId || "",
        tokenPass: account.tokenPass || "",
        tokenProvider: account.tokenProvider || "",
        tokenRegistrationDate: account.tokenRegistrationDate || "",
        tokenExpirationDate: account.tokenExpirationDate || "",
        taxAccountId: account.taxAccountId || "",
        taxAccountPass: account.taxAccountPass || "",
      });
    }
  }, [account, business.id, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertBusinessAccount) => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create account");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo tài khoản doanh nghiệp",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/accounts`] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo tài khoản doanh nghiệp",
        variant: "destructive",
      });
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
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tài khoản doanh nghiệp",
        variant: "destructive",
      });
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Xem thông tin tài khoản">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-blue-700">
            THÔNG TIN TÀI KHOẢN DOANH NGHIỆP - {business.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Tài Khoản Doanh Nghiệp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invoice Lookup Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tài khoản tra cứu HĐĐT - ID</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("invoiceLookupId")}
                      placeholder="Nhập ID tra cứu hóa đơn"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("invoiceLookupId") || "", "ID tra cứu HĐĐT")}
                      disabled={!form.watch("invoiceLookupId")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Tài khoản tra cứu HĐĐT - Mật khẩu</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("invoiceLookupPass")}
                      placeholder="Nhập mật khẩu tra cứu hóa đơn"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("invoiceLookupPass") || "", "Mật khẩu tra cứu HĐĐT")}
                      disabled={!form.watch("invoiceLookupPass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Web Invoice Account */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Website HĐĐT</Label>
                  <Input
                    {...form.register("webInvoiceWebsite")}
                    placeholder="Website hóa đơn điện tử"
                  />
                </div>
                <div>
                  <Label>ID Web HĐĐT</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("webInvoiceId")}
                      placeholder="ID web hóa đơn"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("webInvoiceId") || "", "ID Web HĐĐT")}
                      disabled={!form.watch("webInvoiceId")}
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
                      placeholder="Mật khẩu web hóa đơn"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("webInvoicePass") || "", "Mật khẩu Web HĐĐT")}
                      disabled={!form.watch("webInvoicePass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Social Insurance Account */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Mã Bảo Hiểm XH-YT</Label>
                  <Input
                    {...form.register("socialInsuranceCode")}
                    placeholder="Mã bảo hiểm xã hội"
                  />
                </div>
                <div>
                  <Label>ID Bảo Hiểm XH-YT</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("socialInsuranceId")}
                      placeholder="ID bảo hiểm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("socialInsuranceId") || "", "ID Bảo Hiểm")}
                      disabled={!form.watch("socialInsuranceId")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Liên Hệ Bảo Hiểm</Label>
                  <Input
                    {...form.register("socialInsuranceContact")}
                    placeholder="Thông tin liên hệ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mật khẩu chính Bảo Hiểm</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("socialInsuranceMainPass")}
                      placeholder="Mật khẩu chính"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("socialInsuranceMainPass") || "", "Mật khẩu chính BH")}
                      disabled={!form.watch("socialInsuranceMainPass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu phụ Bảo Hiểm</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("socialInsuranceSecondaryPass")}
                      placeholder="Mật khẩu phụ"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("socialInsuranceSecondaryPass") || "", "Mật khẩu phụ BH")}
                      disabled={!form.watch("socialInsuranceSecondaryPass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Statistics Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID Thống Kê</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("statisticsId")}
                      placeholder="ID tài khoản thống kê"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("statisticsId") || "", "ID Thống Kê")}
                      disabled={!form.watch("statisticsId")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu Thống Kê</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("statisticsPass")}
                      placeholder="Mật khẩu thống kê"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("statisticsPass") || "", "Mật khẩu Thống Kê")}
                      disabled={!form.watch("statisticsPass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Token Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID TOKEN</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("tokenId")}
                      placeholder="ID token"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("tokenId") || "", "ID TOKEN")}
                      disabled={!form.watch("tokenId")}
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
                      placeholder="Mật khẩu token"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("tokenPass") || "", "Mật khẩu TOKEN")}
                      disabled={!form.watch("tokenPass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Đơn vị cung cấp TOKEN</Label>
                  <Input
                    {...form.register("tokenProvider")}
                    placeholder="VD: Viettel, FPT..."
                  />
                </div>
                <div>
                  <Label>Ngày đăng ký TOKEN</Label>
                  <Input
                    type="date"
                    {...form.register("tokenRegistrationDate")}
                  />
                </div>
                <div>
                  <Label>Ngày hết hạn TOKEN</Label>
                  <Input
                    type="date"
                    {...form.register("tokenExpirationDate")}
                  />
                </div>
              </div>

              {/* Tax Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID Khai thuế, nộp thuế</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("taxAccountId")}
                      placeholder="ID tài khoản thuế"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("taxAccountId") || "", "ID Thuế")}
                      disabled={!form.watch("taxAccountId")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu Khai thuế, nộp thuế</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...form.register("taxAccountPass")}
                      placeholder="Mật khẩu thuế"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(form.watch("taxAccountPass") || "", "Mật khẩu Thuế")}
                      disabled={!form.watch("taxAccountPass")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Đang lưu..." : account ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
