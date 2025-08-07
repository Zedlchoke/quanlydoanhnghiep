import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDocumentTransactionSchema, type DocumentTransaction, type InsertDocumentTransaction } from "@shared/schema";
import { Plus, FileText, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface DocumentTransactionFormProps {
  businessId: number;
  businessName: string;
  onClose: () => void;
}

export function DocumentTransactionForm({ businessId, businessName, onClose }: DocumentTransactionFormProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  const form = useForm<InsertDocumentTransaction>({
    resolver: zodResolver(insertDocumentTransactionSchema),
    defaultValues: {
      businessId,
      documentType: "",
      transactionType: "giao",
      handledBy: "",
      transactionDate: "",
      notes: "",
    },
  });

  // Fetch document transactions for this business
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/businesses", businessId, "documents"],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/documents`);
      if (!response.ok) throw new Error("Failed to fetch document transactions");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDocumentTransaction) => {
      const response = await apiRequest("POST", `/api/businesses/${businessId}/documents`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm thông tin giao nhận hồ sơ",
      });
      form.reset({
        businessId,
        documentType: "",
        transactionType: "giao",
        handledBy: "",
        transactionDate: "",
        notes: "",
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi thêm giao dịch hồ sơ",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const token = localStorage.getItem("admin-token");
      const response = await fetch(`/api/documents/${transactionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to delete document transaction");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch hồ sơ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa giao dịch hồ sơ",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDocumentTransaction) => {
    createMutation.mutate(data);
  };

  const handleDelete = (transactionId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch hồ sơ này?")) {
      deleteMutation.mutate(transactionId);
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quản Lý Giao Nhận Hồ Sơ - {businessName}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm Giao Dịch
              </Button>
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Transaction Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thêm Giao Dịch Hồ Sơ Mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="documentType">Loại Hồ Sơ *</Label>
                      <Input
                        id="documentType"
                        {...form.register("documentType")}
                        placeholder="Ví dụ: Giấy phép kinh doanh, Hợp đồng..."
                      />
                      {form.formState.errors.documentType && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.documentType.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="transactionType">Loại Giao Dịch *</Label>
                      <Select
                        value={form.watch("transactionType")}
                        onValueChange={(value) => form.setValue("transactionType", value as "giao" | "nhận")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại giao dịch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="giao">Giao Hồ Sơ</SelectItem>
                          <SelectItem value="nhận">Nhận Hồ Sơ</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.transactionType && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.transactionType.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="handledBy">Người Xử Lý *</Label>
                      <Input
                        id="handledBy"
                        {...form.register("handledBy")}
                        placeholder="Tên người giao/nhận hồ sơ"
                      />
                      {form.formState.errors.handledBy && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.handledBy.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="transactionDate">
                        Ngày Giao Dịch (để trống = hiện tại)
                      </Label>
                      <Input
                        id="transactionDate"
                        type="datetime-local"
                        {...form.register("transactionDate")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi Chú</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      placeholder="Thêm ghi chú về giao dịch này..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Đang thêm..." : "Thêm Giao Dịch"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lịch Sử Giao Nhận Hồ Sơ</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center py-4">Đang tải lịch sử...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Chưa có giao dịch hồ sơ nào được ghi nhận.
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction: DocumentTransaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.transactionType === "giao" 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {transaction.transactionType === "giao" ? "Giao" : "Nhận"}
                          </span>
                          <h4 className="font-medium">{transaction.documentType}</h4>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Người xử lý: {transaction.handledBy}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(transaction.transactionDate), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                          {transaction.notes && (
                            <p className="mt-1 italic">Ghi chú: {transaction.notes}</p>
                          )}
                        </div>
                      </div>
                      {isAuthenticated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}