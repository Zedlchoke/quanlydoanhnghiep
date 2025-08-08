import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBusinessSchema, type Business, type InsertBusiness } from "@shared/schema";
import { Plus, X, Trash2, Copy, Eye, EyeOff } from "lucide-react";

interface BusinessFormProps {
  business?: Business | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function BusinessForm({ business, onSaved, onCancel }: BusinessFormProps) {
  const { toast } = useToast();

  // Interface cho từng field bổ sung
  interface CustomField {
    id: string;
    name: string;
    value: string;
  }

  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    if (business?.customFields && typeof business.customFields === 'object') {
      return Object.entries(business.customFields).map(([name, value], index) => ({
        id: `field_${index}`,
        name,
        value: value as string
      }));
    }
    return [];
  });

  // Business account fields state
  const [accountData, setAccountData] = useState({
    invoiceLookupId: '',
    invoiceLookupPass: '',
    webInvoiceWebsite: '',
    webInvoiceId: '',
    webInvoicePass: '',
    socialInsuranceCode: '',
    socialInsuranceId: '',
    socialInsuranceMainPass: '',
    socialInsuranceSecondaryPass: '',
    socialInsuranceContact: '',
    statisticsId: '',
    statisticsPass: '',
    tokenId: '',
    tokenPass: '',
    tokenProvider: '',
    tokenRegistrationDate: '',
    tokenExpirationDate: '',
    taxAccountId: '',
    taxAccountPass: '',
  });

  const form = useForm<InsertBusiness>({
    resolver: zodResolver(insertBusinessSchema),
    defaultValues: {
      name: business?.name || "",
      taxId: business?.taxId || "",
      address: business?.address || "",
      phone: business?.phone || "",
      email: business?.email || "",
      website: business?.website || "",
      industry: business?.industry || "",
      contactPerson: business?.contactPerson || "",
      establishmentDate: business?.establishmentDate || "",
      charterCapital: business?.charterCapital || "",
      auditWebsite: business?.auditWebsite || "",
      account: business?.account || "",
      password: business?.password || "",
      bankAccount: business?.bankAccount || "",
      bankName: business?.bankName || "",
      customFields: business?.customFields || {},
      notes: business?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBusiness & { accountData?: any }) => {
      // Separate business data from account data
      const { accountData, ...businessData } = data;
      
      console.log("Creating business with data:", businessData);
      console.log("Account data to be sent:", accountData);
      
      const response = await apiRequest("POST", "/api/businesses", {
        ...businessData,
        ...accountData // Merge account data directly into the business payload
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create business: ${errorText}`);
      }
      
      const newBusiness = await response.json();
      console.log("Business created successfully:", newBusiness);

      return newBusiness;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Doanh nghiệp đã được tạo thành công",
      });
      onSaved();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo doanh nghiệp",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertBusiness) => {
      const response = await apiRequest("PUT", `/api/businesses/${business!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Doanh nghiệp đã được cập nhật thành công",
      });
      onSaved();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật doanh nghiệp",
        variant: "destructive",
      });
    },
  });

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      name: '',
      value: ''
    };
    setCustomFields(prev => [...prev, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  const updateCustomFieldName = (id: string, name: string) => {
    setCustomFields(prev => prev.map(field => 
      field.id === id ? { ...field, name } : field
    ));
  };

  const updateCustomFieldValue = (id: string, value: string) => {
    setCustomFields(prev => prev.map(field => 
      field.id === id ? { ...field, value } : field
    ));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: `${fieldName} đã được sao chép vào clipboard`,
    });
  };

  const onSubmit = (data: InsertBusiness) => {
    // Chuyển customFields từ array về object format
    const customFieldsObject: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.name.trim()) {
        customFieldsObject[field.name.trim()] = field.value;
      }
    });

    const submitData = { 
      ...data, 
      customFields: customFieldsObject,
      accountData: business ? undefined : accountData // Only include account data for new businesses
    };

    if (business) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông Tin Doanh Nghiệp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tên Doanh Nghiệp *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Nhập tên doanh nghiệp"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="taxId">Mã Số Thuế *</Label>
              <Input
                id="taxId"
                {...form.register("taxId")}
                placeholder="Nhập mã số thuế"
              />
              {form.formState.errors.taxId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.taxId.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Địa Chỉ</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Số Điện Thoại</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Nhập email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...form.register("website")}
                placeholder="Nhập website"
              />
            </div>

            <div>
              <Label htmlFor="industry">Ngành Nghề</Label>
              <Input
                id="industry"
                {...form.register("industry")}
                placeholder="Nhập ngành nghề"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contactPerson">Người Đại Diện</Label>
              <Input
                id="contactPerson"
                {...form.register("contactPerson")}
                placeholder="Nhập tên người đại diện"
              />
            </div>

            <div>
              <Label htmlFor="establishmentDate">Ngày Thành Lập</Label>
              <Input
                id="establishmentDate"
                type="date"
                {...form.register("establishmentDate")}
              />
            </div>

            <div>
              <Label htmlFor="charterCapital">Vốn Điều Lệ</Label>
              <Input
                id="charterCapital"
                {...form.register("charterCapital")}
                placeholder="VD: 500,000,000 VND"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="auditWebsite">Website Kiểm Toán</Label>
            <Input
              id="auditWebsite"
              {...form.register("auditWebsite")}
              placeholder="Nhập website kiểm toán"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account">Tài Khoản</Label>
              <Input
                id="account"
                {...form.register("account")}
                placeholder="Nhập tài khoản"
              />
            </div>

            <div>
              <Label htmlFor="password">Mật Khẩu</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  {...form.register("password")}
                  placeholder="Nhập mật khẩu"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(form.watch("password") || "", "Mật khẩu")}
                  disabled={!form.watch("password")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccount">Số Tài Khoản Ngân Hàng</Label>
              <Input
                id="bankAccount"
                {...form.register("bankAccount")}
                placeholder="Nhập số tài khoản ngân hàng"
              />
            </div>

            <div>
              <Label htmlFor="bankName">Tên Ngân Hàng</Label>
              <Input
                id="bankName"
                {...form.register("bankName")}
                placeholder="Nhập tên ngân hàng"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Nhập ghi chú"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Accounts - Only show for new businesses */}
      {!business && (
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
                    value={accountData.invoiceLookupId}
                    onChange={(e) => setAccountData(prev => ({...prev, invoiceLookupId: e.target.value}))}
                    placeholder="Nhập ID tra cứu hóa đơn"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.invoiceLookupId, "ID tra cứu HĐĐT")}
                    disabled={!accountData.invoiceLookupId}
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
                    value={accountData.invoiceLookupPass}
                    onChange={(e) => setAccountData(prev => ({...prev, invoiceLookupPass: e.target.value}))}
                    placeholder="Nhập mật khẩu tra cứu hóa đơn"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.invoiceLookupPass, "Mật khẩu tra cứu HĐĐT")}
                    disabled={!accountData.invoiceLookupPass}
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
                  value={accountData.webInvoiceWebsite}
                  onChange={(e) => setAccountData(prev => ({...prev, webInvoiceWebsite: e.target.value}))}
                  placeholder="Website hóa đơn điện tử"
                />
              </div>
              <div>
                <Label>ID Web HĐĐT</Label>
                <div className="flex gap-2">
                  <Input
                    value={accountData.webInvoiceId}
                    onChange={(e) => setAccountData(prev => ({...prev, webInvoiceId: e.target.value}))}
                    placeholder="ID web hóa đơn"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.webInvoiceId, "ID Web HĐĐT")}
                    disabled={!accountData.webInvoiceId}
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
                    value={accountData.webInvoicePass}
                    onChange={(e) => setAccountData(prev => ({...prev, webInvoicePass: e.target.value}))}
                    placeholder="Mật khẩu web hóa đơn"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.webInvoicePass, "Mật khẩu Web HĐĐT")}
                    disabled={!accountData.webInvoicePass}
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
                  value={accountData.socialInsuranceCode}
                  onChange={(e) => setAccountData(prev => ({...prev, socialInsuranceCode: e.target.value}))}
                  placeholder="Mã bảo hiểm xã hội"
                />
              </div>
              <div>
                <Label>ID Bảo Hiểm XH-YT</Label>
                <div className="flex gap-2">
                  <Input
                    value={accountData.socialInsuranceId}
                    onChange={(e) => setAccountData(prev => ({...prev, socialInsuranceId: e.target.value}))}
                    placeholder="ID bảo hiểm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.socialInsuranceId, "ID Bảo Hiểm")}
                    disabled={!accountData.socialInsuranceId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Liên Hệ Bảo Hiểm</Label>
                <Input
                  value={accountData.socialInsuranceContact}
                  onChange={(e) => setAccountData(prev => ({...prev, socialInsuranceContact: e.target.value}))}
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
                    value={accountData.socialInsuranceMainPass}
                    onChange={(e) => setAccountData(prev => ({...prev, socialInsuranceMainPass: e.target.value}))}
                    placeholder="Mật khẩu chính"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.socialInsuranceMainPass, "Mật khẩu chính BH")}
                    disabled={!accountData.socialInsuranceMainPass}
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
                    value={accountData.socialInsuranceSecondaryPass}
                    onChange={(e) => setAccountData(prev => ({...prev, socialInsuranceSecondaryPass: e.target.value}))}
                    placeholder="Mật khẩu phụ"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.socialInsuranceSecondaryPass, "Mật khẩu phụ BH")}
                    disabled={!accountData.socialInsuranceSecondaryPass}
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
                    value={accountData.statisticsId}
                    onChange={(e) => setAccountData(prev => ({...prev, statisticsId: e.target.value}))}
                    placeholder="ID tài khoản thống kê"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.statisticsId, "ID Thống Kê")}
                    disabled={!accountData.statisticsId}
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
                    value={accountData.statisticsPass}
                    onChange={(e) => setAccountData(prev => ({...prev, statisticsPass: e.target.value}))}
                    placeholder="Mật khẩu thống kê"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.statisticsPass, "Mật khẩu Thống Kê")}
                    disabled={!accountData.statisticsPass}
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
                    value={accountData.tokenId}
                    onChange={(e) => setAccountData(prev => ({...prev, tokenId: e.target.value}))}
                    placeholder="ID token"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.tokenId, "ID TOKEN")}
                    disabled={!accountData.tokenId}
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
                    value={accountData.tokenPass}
                    onChange={(e) => setAccountData(prev => ({...prev, tokenPass: e.target.value}))}
                    placeholder="Mật khẩu token"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.tokenPass, "Mật khẩu TOKEN")}
                    disabled={!accountData.tokenPass}
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
                  value={accountData.tokenProvider}
                  onChange={(e) => setAccountData(prev => ({...prev, tokenProvider: e.target.value}))}
                  placeholder="VD: Viettel, FPT..."
                />
              </div>
              <div>
                <Label>Ngày đăng ký TOKEN</Label>
                <Input
                  type="date"
                  value={accountData.tokenRegistrationDate}
                  onChange={(e) => setAccountData(prev => ({...prev, tokenRegistrationDate: e.target.value}))}
                />
              </div>
              <div>
                <Label>Ngày hết hạn TOKEN</Label>
                <Input
                  type="date"
                  value={accountData.tokenExpirationDate}
                  onChange={(e) => setAccountData(prev => ({...prev, tokenExpirationDate: e.target.value}))}
                />
              </div>
            </div>

            {/* Tax Account */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID Khai thuế, nộp thuế</Label>
                <div className="flex gap-2">
                  <Input
                    value={accountData.taxAccountId}
                    onChange={(e) => setAccountData(prev => ({...prev, taxAccountId: e.target.value}))}
                    placeholder="ID tài khoản thuế"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.taxAccountId, "ID Thuế")}
                    disabled={!accountData.taxAccountId}
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
                    value={accountData.taxAccountPass}
                    onChange={(e) => setAccountData(prev => ({...prev, taxAccountPass: e.target.value}))}
                    placeholder="Mật khẩu thuế"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountData.taxAccountPass, "Mật khẩu Thuế")}
                    disabled={!accountData.taxAccountPass}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Thông Tin Bổ Sung
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomField}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm Mục
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customFields.map((field) => (
            <div key={field.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor={`name-${field.id}`}>Tên Mục</Label>
                <Input
                  id={`name-${field.id}`}
                  value={field.name}
                  onChange={(e) => updateCustomFieldName(field.id, e.target.value)}
                  placeholder="Nhập tên mục (ví dụ: Mã khách hàng)"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`value-${field.id}`}>Nội Dung</Label>
                <Input
                  id={`value-${field.id}`}
                  value={field.value}
                  onChange={(e) => updateCustomFieldValue(field.id, e.target.value)}
                  placeholder="Nhập nội dung"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeCustomField(field.id)}
                className="text-red-600 hover:text-red-700 h-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {customFields.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Chưa có thông tin bổ sung. Nhấn "Thêm Mục" để thêm thông tin tùy chỉnh.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : business ? "Cập Nhật" : "Tạo Mới"}
        </Button>
      </div>
    </form>
  );
}