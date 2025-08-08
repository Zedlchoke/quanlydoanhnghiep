import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { insertBusinessAccountSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const businessAccountFormSchema = insertBusinessAccountSchema.omit({ businessId: true });
type BusinessAccountFormData = z.infer<typeof businessAccountFormSchema>;

interface BusinessAccountFormProps {
  businessId: number;
  onSuccess?: () => void;
}

export function BusinessAccountForm({ businessId, onSuccess }: BusinessAccountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing business account
  const { data: existingAccount } = useQuery({
    queryKey: [`/api/businesses/${businessId}/accounts`],
    enabled: !!businessId,
  });

  const form = useForm<BusinessAccountFormData>({
    resolver: zodResolver(businessAccountFormSchema),
    defaultValues: {
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
    },
  });

  // Update form when existing data loads
  useEffect(() => {
    if (existingAccount) {
      form.reset({
        invoiceLookupId: existingAccount.invoiceLookupId || "",
        invoiceLookupPass: existingAccount.invoiceLookupPass || "",
        webInvoiceWebsite: existingAccount.webInvoiceWebsite || "",
        webInvoiceId: existingAccount.webInvoiceId || "",
        webInvoicePass: existingAccount.webInvoicePass || "",
        socialInsuranceCode: existingAccount.socialInsuranceCode || "",
        socialInsuranceId: existingAccount.socialInsuranceId || "",
        socialInsuranceMainPass: existingAccount.socialInsuranceMainPass || "",
        socialInsuranceSecondaryPass: existingAccount.socialInsuranceSecondaryPass || "",
        socialInsuranceContact: existingAccount.socialInsuranceContact || "",
        statisticsId: existingAccount.statisticsId || "",
        statisticsPass: existingAccount.statisticsPass || "",
        tokenId: existingAccount.tokenId || "",
        tokenPass: existingAccount.tokenPass || "",
        tokenProvider: existingAccount.tokenProvider || "",
        tokenRegistrationDate: existingAccount.tokenRegistrationDate || "",
        tokenExpirationDate: existingAccount.tokenExpirationDate || "",
      });
    }
  }, [existingAccount, form]);

  const createMutation = useMutation({
    mutationFn: (data: BusinessAccountFormData) =>
      apiRequest(`/api/businesses/${businessId}/accounts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Tạo tài khoản doanh nghiệp thành công" });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/accounts`] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi tạo tài khoản doanh nghiệp",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BusinessAccountFormData) =>
      apiRequest(`/api/businesses/${businessId}/accounts`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Cập nhật tài khoản doanh nghiệp thành công" });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/accounts`] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi cập nhật tài khoản doanh nghiệp",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessAccountFormData) => {
    if (existingAccount) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quản lý tài khoản doanh nghiệp</CardTitle>
        <CardDescription>
          Quản lý các loại tài khoản khác nhau của doanh nghiệp một cách riêng biệt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="invoice" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="invoice">Tra cứu HĐĐT</TabsTrigger>
              <TabsTrigger value="webinvoice">Web HĐĐT</TabsTrigger>
              <TabsTrigger value="social">Bảo hiểm XH-YT</TabsTrigger>
              <TabsTrigger value="statistics">Thống kê</TabsTrigger>
              <TabsTrigger value="token">TOKEN</TabsTrigger>
            </TabsList>

            <TabsContent value="invoice" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceLookupId">ID tra cứu</Label>
                  <Input
                    id="invoiceLookupId"
                    {...form.register("invoiceLookupId")}
                    placeholder="ID tra cứu hóa đơn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceLookupPass">Mật khẩu</Label>
                  <Input
                    id="invoiceLookupPass"
                    type="password"
                    {...form.register("invoiceLookupPass")}
                    placeholder="Mật khẩu tra cứu"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="webinvoice" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webInvoiceWebsite">Website</Label>
                  <Input
                    id="webInvoiceWebsite"
                    {...form.register("webInvoiceWebsite")}
                    placeholder="Website hóa đơn điện tử"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="webInvoiceId">ID</Label>
                    <Input
                      id="webInvoiceId"
                      {...form.register("webInvoiceId")}
                      placeholder="ID đăng nhập"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webInvoicePass">Mật khẩu</Label>
                    <Input
                      id="webInvoicePass"
                      type="password"
                      {...form.register("webInvoicePass")}
                      placeholder="Mật khẩu đăng nhập"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="socialInsuranceCode">Mã bảo hiểm</Label>
                  <Input
                    id="socialInsuranceCode"
                    {...form.register("socialInsuranceCode")}
                    placeholder="Mã số bảo hiểm xã hội"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialInsuranceId">ID</Label>
                  <Input
                    id="socialInsuranceId"
                    {...form.register("socialInsuranceId")}
                    placeholder="ID bảo hiểm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="socialInsuranceMainPass">Mật khẩu chính</Label>
                    <Input
                      id="socialInsuranceMainPass"
                      type="password"
                      {...form.register("socialInsuranceMainPass")}
                      placeholder="Mật khẩu chính"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialInsuranceSecondaryPass">Mật khẩu phụ</Label>
                    <Input
                      id="socialInsuranceSecondaryPass"
                      type="password"
                      {...form.register("socialInsuranceSecondaryPass")}
                      placeholder="Mật khẩu phụ"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialInsuranceContact">Thông tin liên hệ</Label>
                  <Input
                    id="socialInsuranceContact"
                    {...form.register("socialInsuranceContact")}
                    placeholder="Thông tin liên hệ"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statisticsId">ID thống kê</Label>
                  <Input
                    id="statisticsId"
                    {...form.register("statisticsId")}
                    placeholder="ID thống kê"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statisticsPass">Mật khẩu</Label>
                  <Input
                    id="statisticsPass"
                    type="password"
                    {...form.register("statisticsPass")}
                    placeholder="Mật khẩu thống kê"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="token" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenId">ID TOKEN</Label>
                    <Input
                      id="tokenId"
                      {...form.register("tokenId")}
                      placeholder="ID TOKEN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenPass">Mật khẩu</Label>
                    <Input
                      id="tokenPass"
                      type="password"
                      {...form.register("tokenPass")}
                      placeholder="Mật khẩu TOKEN"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenProvider">Đơn vị cung cấp</Label>
                  <Input
                    id="tokenProvider"
                    {...form.register("tokenProvider")}
                    placeholder="Đơn vị cung cấp TOKEN"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenRegistrationDate">Ngày đăng ký</Label>
                    <Input
                      id="tokenRegistrationDate"
                      type="date"
                      {...form.register("tokenRegistrationDate")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenExpirationDate">Ngày hết hạn</Label>
                    <Input
                      id="tokenExpirationDate"
                      type="date"
                      {...form.register("tokenExpirationDate")}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Đang xử lý..." : existingAccount ? "Cập nhật tài khoản" : "Tạo tài khoản"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}