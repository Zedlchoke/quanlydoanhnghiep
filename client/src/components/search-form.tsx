import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { searchBusinessSchema, type SearchBusiness, type Business } from "@shared/schema";

interface SearchFormProps {
  onResults: (results: Business[]) => void;
  onCancel: () => void;
}

const searchFieldOptions = [
  { value: "name", label: "Tên Doanh Nghiệp (chính xác)" },
  { value: "namePartial", label: "Tên Doanh Nghiệp (chứa từ khóa)" },
  { value: "taxId", label: "Mã Số Thuế (chính xác)" },
  { value: "industry", label: "Ngành Nghề (chính xác)" },
  { value: "contactPerson", label: "Người Liên Hệ (chính xác)" },
  { value: "phone", label: "Số Điện Thoại (chính xác)" },
  { value: "email", label: "Email (chính xác)" },
  { value: "website", label: "Website (chính xác)" },
  { value: "account", label: "Tài Khoản (chính xác)" },
  { value: "bankAccount", label: "Số Tài Khoản Ngân Hàng (chính xác)" },
  { value: "bankName", label: "Tên Ngân Hàng (chính xác)" },
  { value: "address", label: "Địa Chỉ (chính xác)" },
  { value: "addressPartial", label: "Địa Chỉ (chứa từ khóa)" },
];

export default function SearchForm({ onResults, onCancel }: SearchFormProps) {
  const { toast } = useToast();
  
  const form = useForm<SearchBusiness>({
    resolver: zodResolver(searchBusinessSchema),
    defaultValues: {
      field: "taxId",
      value: "",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: SearchBusiness) => {
      const response = await apiRequest("POST", "/api/businesses/search", data);
      return response.json();
    },
    onSuccess: (results: Business[]) => {
      if (results.length === 0) {
        toast({
          title: "Không tìm thấy",
          description: "Không có doanh nghiệp nào phù hợp với tiêu chí tìm kiếm",
        });
      } else {
        toast({
          title: "Tìm kiếm thành công",
          description: `Tìm thấy ${results.length} doanh nghiệp`,
        });
      }
      onResults(results);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tìm kiếm",
        description: error.message || "Có lỗi xảy ra khi tìm kiếm",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SearchBusiness) => {
    searchMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="field">Loại Tìm Kiếm</Label>
        <Select 
          value={form.watch("field")} 
          onValueChange={(value) => form.setValue("field", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn loại tìm kiếm" />
          </SelectTrigger>
          <SelectContent>
            {searchFieldOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.field && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.field.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="value">Từ Khóa Tìm Kiếm</Label>
        <Input
          id="value"
          {...form.register("value")}
          placeholder="Nhập từ khóa tìm kiếm"
        />
        {form.formState.errors.value && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.value.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={searchMutation.isPending}>
          {searchMutation.isPending ? "Đang tìm..." : "Tìm Kiếm"}
        </Button>
      </div>
    </form>
  );
}
