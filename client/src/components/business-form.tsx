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
import { Plus, X, Trash2 } from "lucide-react";

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
      account: business?.account || "",
      password: business?.password || "",
      bankAccount: business?.bankAccount || "",
      bankName: business?.bankName || "",
      customFields: business?.customFields || {},
      notes: business?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBusiness) => {
      const response = await apiRequest("POST", "/api/businesses", data);
      return response.json();
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



  const onSubmit = (data: InsertBusiness) => {
    // Chuyển customFields từ array về object format
    const customFieldsObject: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.name.trim()) {
        customFieldsObject[field.name.trim()] = field.value;
      }
    });

    const submitData = { ...data, customFields: customFieldsObject };
    if (business) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          {...form.register("website")}
          placeholder="Nhập website (ví dụ: https://example.com)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industry">Ngành Nghề</Label>
          <Input
            id="industry"
            {...form.register("industry")}
            placeholder="Nhập ngành nghề"
          />
        </div>
        
        <div>
          <Label htmlFor="contactPerson">Người Đại Diện</Label>
          <Input
            id="contactPerson"
            {...form.register("contactPerson")}
            placeholder="Nhập tên người đại diện"
          />
        </div>
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
          <Input
            id="password"
            type="text"
            {...form.register("password")}
            placeholder="Nhập mật khẩu"
          />
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

      <div>
        <Label htmlFor="notes">Ghi Chú</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Nhập ghi chú"
          rows={3}
        />
      </div>

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
