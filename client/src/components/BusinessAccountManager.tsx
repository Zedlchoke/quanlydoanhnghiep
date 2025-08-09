import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, X, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { insertBusinessAccountSchema, type InsertBusinessAccount, type Business, type BusinessAccount } from "@shared/schema";

interface BusinessAccountManagerProps {
  business: Business;
}

export function BusinessAccountManager({ business }: BusinessAccountManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: account } = useQuery<BusinessAccount>({
    queryKey: [`/api/businesses/${business.id}/accounts`],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`);
      if (!response.ok) throw new Error("Failed to fetch account");
      return response.json();
    },
  });

  const form = useForm<InsertBusinessAccount>({
    resolver: zodResolver(insertBusinessAccountSchema),
    defaultValues: {
      businessId: business.id,
      invoiceLookupId: account?.invoiceLookupId || "",
      invoiceLookupPass: account?.invoiceLookupPass || "",
      webInvoiceWebsite: account?.webInvoiceWebsite || "",
      webInvoiceId: account?.webInvoiceId || "",
      webInvoicePass: account?.webInvoicePass || "",
      socialInsuranceCode: account?.socialInsuranceCode || "",
      socialInsuranceId: account?.socialInsuranceId || "",
      socialInsuranceMainPass: account?.socialInsuranceMainPass || "",
      socialInsuranceSecondaryPass: account?.socialInsuranceSecondaryPass || "",
      socialInsuranceContact: account?.socialInsuranceContact || "",
      statisticsId: account?.statisticsId || "",
      statisticsPass: account?.statisticsPass || "",
      tokenId: account?.tokenId || "",
      tokenPass: account?.tokenPass || "",
      tokenProvider: account?.tokenProvider || "",
      tokenRegistrationDate: account?.tokenRegistrationDate || "",
      tokenExpirationDate: account?.tokenExpirationDate || "",
      taxAccountId: account?.taxAccountId || "",
      taxAccountPass: account?.taxAccountPass || "",
    },
  });

  const saveAccount = useMutation({
    mutationFn: async (data: InsertBusinessAccount) => {
      const response = await fetch(`/api/businesses/${business.id}/accounts`, {
        method: account ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save account");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã lưu thông tin tài khoản",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/accounts`] });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin tài khoản",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBusinessAccount) => {
    saveAccount.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Xem các tài khoản
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-blue-700">
            QUẢN LÝ TÀI KHOẢN - {business.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="invoice" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="invoice">Tra cứu HĐĐT</TabsTrigger>
              <TabsTrigger value="web-invoice">Web HĐĐT</TabsTrigger>
              <TabsTrigger value="social">Bảo hiểm XH-YT</TabsTrigger>
              <TabsTrigger value="statistics">Thống kê</TabsTrigger>
              <TabsTrigger value="token">TOKEN</TabsTrigger>
              <TabsTrigger value="tax">Khai/Nộp thuế</TabsTrigger>
            </TabsList>

            <TabsContent value="invoice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Tài khoản tra cứu HĐĐT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="invoiceLookupId">ID tài khoản</Label>
                    <Input
                      id="invoiceLookupId"
                      {...form.register("invoiceLookupId")}
                      placeholder="Nhập ID tài khoản tra cứu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceLookupPass">Mật khẩu</Label>
                    <Input
                      id="invoiceLookupPass"
                      type="password"
                      {...form.register("invoiceLookupPass")}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="web-invoice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Tài khoản Web HĐĐT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="webInvoiceWebsite">Website</Label>
                    <Input
                      id="webInvoiceWebsite"
                      {...form.register("webInvoiceWebsite")}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webInvoiceId">ID tài khoản</Label>
                    <Input
                      id="webInvoiceId"
                      {...form.register("webInvoiceId")}
                      placeholder="Nhập ID tài khoản"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webInvoicePass">Mật khẩu</Label>
                    <Input
                      id="webInvoicePass"
                      type="password"
                      {...form.register("webInvoicePass")}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Tài khoản Bảo hiểm XH-YT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="socialInsuranceCode">Mã bảo hiểm</Label>
                    <Input
                      id="socialInsuranceCode"
                      {...form.register("socialInsuranceCode")}
                      placeholder="Nhập mã bảo hiểm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialInsuranceId">ID tài khoản</Label>
                    <Input
                      id="socialInsuranceId"
                      {...form.register("socialInsuranceId")}
                      placeholder="Nhập ID tài khoản"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socialInsuranceMainPass">Mật khẩu chính</Label>
                      <Input
                        id="socialInsuranceMainPass"
                        type="password"
                        {...form.register("socialInsuranceMainPass")}
                        placeholder="Mật khẩu chính"
                      />
                    </div>
                    <div>
                      <Label htmlFor="socialInsuranceSecondaryPass">Mật khẩu ly</Label>
                      <Input
                        id="socialInsuranceSecondaryPass"
                        type="password"
                        {...form.register("socialInsuranceSecondaryPass")}
                        placeholder="Mật khẩu ly"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="socialInsuranceContact">Liên hệ</Label>
                    <Input
                      id="socialInsuranceContact"
                      {...form.register("socialInsuranceContact")}
                      placeholder="Thông tin liên hệ"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Tài khoản thống kê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="statisticsId">ID tài khoản</Label>
                    <Input
                      id="statisticsId"
                      {...form.register("statisticsId")}
                      placeholder="Nhập ID tài khoản thống kê"
                    />
                  </div>
                  <div>
                    <Label htmlFor="statisticsPass">Mật khẩu</Label>
                    <Input
                      id="statisticsPass"
                      type="password"
                      {...form.register("statisticsPass")}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="token" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Tài khoản TOKEN</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tokenId">ID tài khoản</Label>
                      <Input
                        id="tokenId"
                        {...form.register("tokenId")}
                        placeholder="Nhập ID tài khoản"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tokenPass">Mật khẩu</Label>
                      <Input
                        id="tokenPass"
                        type="password"
                        {...form.register("tokenPass")}
                        placeholder="Nhập mật khẩu"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tokenProvider">Đơn vị cung cấp</Label>
                    <Input
                      id="tokenProvider"
                      {...form.register("tokenProvider")}
                      placeholder="Tên đơn vị cung cấp"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tokenRegistrationDate">Ngày đăng ký</Label>
                      <Input
                        id="tokenRegistrationDate"
                        type="date"
                        {...form.register("tokenRegistrationDate")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tokenExpirationDate">Ngày hết hạn</Label>
                      <Input
                        id="tokenExpirationDate"
                        type="date"
                        {...form.register("tokenExpirationDate")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tax" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Tài khoản khai thuế, nộp thuế</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="taxAccountId">ID tài khoản</Label>
                    <Input
                      id="taxAccountId"
                      {...form.register("taxAccountId")}
                      placeholder="Nhập ID tài khoản thuế"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxAccountPass">Mật khẩu</Label>
                    <Input
                      id="taxAccountPass"
                      type="password"
                      {...form.register("taxAccountPass")}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" disabled={saveAccount.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveAccount.isPending ? "Đang lưu..." : "Lưu tài khoản"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}