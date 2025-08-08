import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, FileText, X, Download, Edit2, Eye, Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-new-auth";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { insertDocumentTransactionSchema, type InsertDocumentTransaction, type DocumentTransaction, type Business } from "@shared/schema";
import { useSyncContext } from "@/contexts/sync-context";

interface DocumentTransactionFormProps {
  business: Business;
}

const COMPANY_OPTIONS = [
  "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam",
];

const DOCUMENT_TYPES = [
  "Hồ sơ thành lập doanh nghiệp",
  "Hồ sơ thay đổi đăng ký kinh doanh",
  "Hồ sơ giải thể doanh nghiệp",
  "Hồ sơ thuế",
  "Hồ sơ BHXH",
  "Hồ sơ lao động",
  "Hồ sơ khác",
];

export function DocumentTransactionForm({ business }: DocumentTransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refetchAll } = useSyncContext();
  const [showForm, setShowForm] = useState(false);
  const [editingDocumentNumber, setEditingDocumentNumber] = useState<number | null>(null);
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [viewingTransaction, setViewingTransaction] = useState<DocumentTransaction | null>(null);
  const [createdTransaction, setCreatedTransaction] = useState<DocumentTransaction | null>(null);


  // Lấy danh sách doanh nghiệp để làm dropdown cho công ty giao/nhận - cập nhật thời gian thực
  const { data: businessesData } = useQuery({
    queryKey: ["/api/businesses/all"],
    queryFn: async () => {
      const response = await fetch("/api/businesses/all");
      if (!response.ok) throw new Error("Failed to fetch businesses");
      return response.json();
    },
    refetchInterval: 5000, // Cập nhật mỗi 5 giây
    refetchOnWindowFocus: true, // Cập nhật khi focus vào window
  });

  const businesses = businessesData || [];
  const allCompanyOptions = [
    ...COMPANY_OPTIONS,
    ...businesses.map((b: Business) => b.name),
  ];

  const { data: transactions = [], refetch } = useQuery<DocumentTransaction[]>({
    queryKey: [`/api/businesses/${business.id}/documents`],
  });

  // Hàm tạo thời gian mặc định (thời gian hiện tại)
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const form = useForm<InsertDocumentTransaction>({
    resolver: zodResolver(insertDocumentTransactionSchema),
    defaultValues: {
      businessId: business.id,
      documentNumber: "",
      documentType: "Hồ sơ khác",
      documentTypes: [],
      documentCounts: {},
      deliveryCompany: "",
      receivingCompany: business.name || "", // Tự động điền tên công ty nhận
      deliveryPerson: "",
      receivingPerson: business.contactPerson || "", // Tự động điền người đại diện
      deliveryDate: getCurrentDateTime(), // Thời gian mặc định
      receivingDate: "",
      handledBy: user?.userType === "admin" ? "Admin Hoàng Cảnh Anh Quân" : user?.identifier || "",
      notes: "",
      status: "pending",
      isHidden: false,
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (data: InsertDocumentTransaction) => {
      const response = await fetch(`/api/businesses/${business.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to create transaction: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (transaction) => {
      console.log(`✅ Transaction created with ID: ${transaction.id}`);
      setCreatedTransaction(transaction);
      refetchAll(); // Đồng bộ lại toàn bộ dữ liệu ngay lập tức
      toast({
        title: "Thành công",
        description: "Đã thêm thông tin giao nhận hồ sơ",
      });
      form.reset({
        businessId: business.id,
        documentNumber: "",
        documentType: "Hồ sơ khác",
        documentTypes: [],
        documentCounts: {},
        deliveryCompany: "",
        receivingCompany: business.name || "",
        deliveryPerson: "",
        receivingPerson: business.contactPerson || "",
        deliveryDate: getCurrentDateTime(),
        receivingDate: "",
        handledBy: user?.userType === "admin" ? "Admin Hoàng Cảnh Anh Quân" : user?.identifier || "",
        notes: "",
        status: "pending",
        isHidden: false,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/documents`] });
      refetchAll(); // Đồng bộ lại toàn bộ dữ liệu ngay lập tức
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm thông tin giao nhận hồ sơ",
        variant: "destructive",
      });
      console.error("Error creating transaction:", error);
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const deleteTransaction = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch hồ sơ",
      });
      setDeleteDialogOpen(false);
      setDeleteTransactionId(null);
      setDeletePassword("");
      refetch();
      refetchAll();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa giao dịch hồ sơ",
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = (id: number) => {
    setDeleteTransactionId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTransactionId && deletePassword) {
      deleteTransaction.mutate({ id: deleteTransactionId, password: deletePassword });
    }
  };

  const updateDocumentNumber = useMutation({
    mutationFn: async ({ id, documentNumber }: { id: number; documentNumber: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/${id}/number`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ documentNumber }),
      });
      if (!response.ok) throw new Error("Failed to update document number");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật số văn bản",
      });
      setEditingDocumentNumber(null);
      setNewDocumentNumber("");
      refetch();
    },
  });

  const uploadPdf = useMutation({
    mutationFn: async ({ id, pdfPath }: { id: number; pdfPath: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/${id}/upload-pdf`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pdfPath }),
      });
      if (!response.ok) throw new Error("Failed to upload PDF");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tải lên file PDF",
      });
      refetch();
    },
  });

  const onSubmit = (data: InsertDocumentTransaction) => {
    // Tự động set thời gian hiện tại nếu để trống
    const currentDateTime = new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

    const submissionData = {
      ...data,
      deliveryDate: data.deliveryDate || currentDateTime,
      receivingDate: data.receivingDate || currentDateTime,
    };

    createTransaction.mutate(submissionData);
  };

  const generateInvoiceForm = (transaction: DocumentTransaction) => {
    // Tạo HTML content cho biểu mẫu hóa đơn theo template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Biên Bản Bàn Giao Tài Liệu</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .content { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid black; padding: 8px; text-align: center; }
        .signature-section { margin-top: 40px; }
        .signature-box { display: inline-block; width: 45%; text-align: center; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h2>ROYAL VIỆT NAM</h2>
        <p>54/6 Nguyễn Xí, P.26, Q.Bình Thạnh, Tp.HCM</p>
        <p>083.5111720-721; Fax : 083.5117919</p>
        <p>tuvanktetoanthue.vn - royal@tuvanktetoanthue.vn</p>
    </div>

    <div class="title">
        <h1>BIÊN BẢN BÀN GIAO TÀI LIỆU</h1>
        <p>NGÀY: ${new Date(transaction.deliveryDate).toLocaleDateString('vi-VN')} - SỐ: ${transaction.documentNumber || 'G04/2020/01'}</p>
    </div>

    <div class="content">
        <p>Hôm nay, ngày ${new Date(transaction.deliveryDate).toLocaleDateString('vi-VN')}, Chúng tôi gồm:</p>
        <p><strong>BÊN GIAO: ${transaction.deliveryCompany}</strong> đại diện là:</p>
        <p>Ông (bà): ${transaction.deliveryPerson}</p>
        <br>
        <p><strong>BÊN NHẬN: ${transaction.receivingCompany}</strong> đại diện là:</p>
        <p>Ông (bà): ${transaction.receivingPerson}</p>

        <p><strong>Thống nhất lập biên bản giao nhận tài liệu với những nội dung cụ thể như sau:</strong></p>

        <table class="table">
            <thead>
                <tr>
                    <th>Stt</th>
                    <th>Tên tài liệu</th>
                    <th>Đvt</th>
                    <th>Số lượng</th>
                    <th>Gốc/Photo</th>
                    <th>Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>${transaction.documentType}</td>
                    <td>Tờ</td>
                    <td>1</td>
                    <td>Gốc</td>
                    <td>${transaction.notes || '-'}</td>
                </tr>
            </tbody>
        </table>

        <p>Biên bản này được lập thành hai bản; bên giao (đơn vị/cá nhân) giữ một bản, bên nhận (lưu trữ hiện hành của cơ quan, tổ chức) giữ một bản./.</p>
    </div>

    <div class="signature-section">
        <h3 style="text-align: center;">PHẦN KÝ XÁC NHẬN GIAO NHẬN CỦA KHÁCH HÀNG</h3>
        <br>
        <div style="display: flex; justify-content: space-between;">
            <div class="signature-box">
                <p><strong>ĐẠI DIỆN BÊN GIAO</strong></p>
                <br><br><br>
                <p>___________________</p>
            </div>
            <div class="signature-box">
                <p><strong>ĐẠI DIỆN BÊN NHẬN</strong></p>
                <br><br><br>
                <p>${transaction.receivingPerson}</p>
            </div>
        </div>

        <br><br>
        <h3 style="text-align: center;">PHẦN KÝ XÁC NHẬN GIAO NHẬN NỘI BỘ ROYAL</h3>
        <br>
        <div style="display: flex; justify-content: space-between;">
            <div class="signature-box">
                <p><strong>NGƯỜI GIAO</strong></p>
                <br><br><br>
                <p>___________________</p>
            </div>
            <div class="signature-box">
                <p><strong>NGƯỜI NHẬN</strong></p>
                <br><br><br>
                <p>___________________</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Tạo và download file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien_ban_giao_nhan_${transaction.documentNumber || transaction.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Thành công",
      description: "Đã tải xuống biểu mẫu hóa đơn",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">Giao Nhận Hồ Sơ</h3>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Giao Dịch
        </Button>
      </div>

      {transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh Sách Giao Dịch Hồ Sơ</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số văn bản</TableHead>
                  <TableHead>Loại hồ sơ</TableHead>
                  <TableHead>Công ty giao</TableHead>
                  <TableHead>Công ty nhận</TableHead>
                  <TableHead>Ngày giao</TableHead>
                  <TableHead>File PDF</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {editingDocumentNumber === transaction.id ? (
                        <div className="flex gap-1">
                          <Input
                            value={newDocumentNumber}
                            onChange={(e) => setNewDocumentNumber(e.target.value)}
                            placeholder="Nhập số văn bản"
                            className="w-32 h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateDocumentNumber.mutate({
                              id: transaction.id,
                              documentNumber: newDocumentNumber
                            })}
                            className="h-8 px-2"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDocumentNumber(null);
                              setNewDocumentNumber("");
                            }}
                            className="h-8 px-2"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{transaction.documentNumber || "Chưa có"}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDocumentNumber(transaction.id);
                              setNewDocumentNumber(transaction.documentNumber || "");
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{transaction.documentType}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {transaction.deliveryCompany}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {transaction.receivingCompany}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.deliveryDate).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {transaction.signedFilePath ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Download the PDF file using proper API endpoint
                                const downloadUrl = `/objects${transaction.signedFilePath}`;
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = `document_${transaction.documentNumber || transaction.id}.pdf`;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              📥 Tải PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // View PDF in new tab
                                const viewUrl = `/objects${transaction.signedFilePath}`;
                                window.open(viewUrl, '_blank');
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              👁️ Xem
                            </Button>
                          </>
                        ) : (
                          <ObjectUploader
                            onGetUploadParameters={async () => {
                              const response = await fetch('/api/objects/upload', { method: 'POST' });
                              const data = await response.json();
                              return { method: 'PUT' as const, url: data.uploadURL };
                            }}
                            onComplete={(result) => {
                              console.log("Upload result:", result);
                              // Assume result is an array of successful uploads or a single result object with successful array
                              const successfulUploads = result.successful || [];

                              if (successfulUploads.length > 0) {
                                const uploadedFile = successfulUploads[0];
                                if (uploadedFile?.uploadURL) {
                                  // Extract proper path from upload URL
                                  let filePath = uploadedFile.uploadURL;

                                  // Convert full URL to relative path for storage
                                  if (filePath.includes('googleapis.com') || filePath.includes('storage')) {
                                    try {
                                      const url = new URL(filePath);
                                      filePath = url.pathname;
                                      // Remove leading slash if present, common for URLs
                                      if (filePath.startsWith('/')) {
                                        filePath = filePath.substring(1);
                                      }
                                    } catch {
                                      // If URL parsing fails, use as-is
                                    }
                                  }

                                  console.log("Saving PDF path to database:", filePath);

                                  // Update ALL transactions with PDF path if this is a multi-document transaction
                                  // For now, assuming a single transaction context
                                  // We need to find the specific transaction this upload is for.
                                  // A more robust solution would pass the transaction ID to onComplete.
                                  // For this fix, we assume the uploader is initiated from a specific transaction row.
                                  // Thus, we need to get the transaction ID from the context or an attribute.
                                  // However, since the ObjectUploader doesn't expose context easily,
                                  // we'll make a simplifying assumption or need to refactor ObjectUploader.

                                  // TEMPORARY FIX: Assuming the `transaction` variable from the map is accessible.
                                  // This is a workaround and might need adjustment based on actual Uppy integration.
                                  // A better approach: Pass `transaction.id` to `onComplete` or use a callback.

                                  // For demonstration, let's assume we have the transaction.id here.
                                  // If this component renders multiple ObjectUploader instances,
                                  // we need a way to know WHICH transaction this upload is for.
                                  // The current structure implies each row's uploader is independent.
                                  // The onComplete callback receives the result, not the transaction context directly.

                                  // Let's re-evaluate the `ObjectUploader` usage.
                                  // It's rendered within a `transactions.map`.
                                  // The `onComplete` should ideally know which `transaction.id` it belongs to.
                                  // The `ObjectUploader` itself needs to be aware of its context.

                                  // A common pattern: pass a unique key or ID to the uploader component
                                  // or wrap it in a way that it knows its context.
                                  // Since `onComplete` doesn't directly receive the transaction context,
                                  // and the `uploadPdf.mutate` call needs `transaction.id`,
                                  // we will adapt the provided `onComplete` handler to manage this.

                                  // The original fix provided in the prompt suggested iterating over `results`,
                                  // implying a batch upload scenario, but the current UI is per-transaction.
                                  // We will stick to updating a single transaction based on the UI context.

                                  // Let's assume `transaction` from the map is available in this scope.
                                  // However, closures can be tricky.
                                  // The `onComplete` is called after the upload.

                                  // To pass `transaction.id` to `onComplete`, `ObjectUploader` would need to accept
                                  // an additional prop that `onComplete` can access.
                                  // Example: `<ObjectUploader transactionId={transaction.id} ... />`
                                  // and then `onComplete={(result, transactionId) => ...}`

                                  // Given the prompt's structure, we'll try to access `transaction.id`
                                  // from the outer scope. This might fail if `ObjectUploader` doesn't provide it
                                  // or if closures are not handled as expected.

                                  // If the ObjectUploader is called within the map, the context should be available.
                                  // Let's assume the `transaction` variable is accessible here.

                                  // The prompt's original fix snippet implies `results` which is an array.
                                  // `const uploadedFile = result.successful?.[0];`
                                  // This suggests `result` might be structured like ` { successful: [...] } `
                                  // Let's proceed with `transaction.id` from the map context.

                                  uploadPdf.mutate({
                                    id: transaction.id, // Assuming 'transaction' is accessible from the map's closure
                                    pdfPath: filePath
                                  });
                                } else {
                                  toast({
                                    title: "Lỗi",
                                    description: "Không thể lấy đường dẫn file PDF",
                                    variant: "destructive",
                                  });
                                }
                              } else {
                                toast({
                                  title: "Lỗi",
                                  description: "Không có file nào được tải lên thành công",
                                  variant: "destructive",
                                });
                              }
                            }}
                            maxNumberOfFiles={1}
                            allowedFileTypes={['.pdf']}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Upload className="w-3 h-3" />
                              Tải PDF
                            </div>
                          </ObjectUploader>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTransaction(transaction)}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            generateInvoiceForm(transaction);
                          }}
                          title="Tải biểu mẫu hóa đơn"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(transaction.id)}
                          title="Xóa"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có giao dịch hồ sơ nào</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog xem chi tiết giao dịch */}
      <Dialog open={!!viewingTransaction} onOpenChange={() => setViewingTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Giao Dịch Hồ Sơ</DialogTitle>
          </DialogHeader>
          {viewingTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Số văn bản</Label>
                  <p className="text-sm">{viewingTransaction.documentNumber || "Chưa có"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Loại hồ sơ</Label>
                  <p className="text-sm">{viewingTransaction.documentType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Công ty giao</Label>
                  <p className="text-sm">{viewingTransaction.deliveryCompany}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Công ty nhận</Label>
                  <p className="text-sm">{viewingTransaction.receivingCompany}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Người giao</Label>
                  <p className="text-sm">{viewingTransaction.deliveryPerson}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Người nhận</Label>
                  <p className="text-sm">{viewingTransaction.receivingPerson}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày giao</Label>
                  <p className="text-sm">
                    {new Date(viewingTransaction.deliveryDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày nhận</Label>
                  <p className="text-sm">
                    {viewingTransaction.receivingDate ?
                      new Date(viewingTransaction.receivingDate).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Chưa có'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Người xử lý</Label>
                  <p className="text-sm">{viewingTransaction.handledBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File PDF</Label>
                  <p className="text-sm">
                    {viewingTransaction.signedFilePath ? (
                      <span className="text-green-600">Đã có file</span>
                    ) : (
                      <span className="text-gray-500">Chưa có file</span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Ghi chú</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {viewingTransaction.notes || "Không có ghi chú"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              BIÊN BẢN GIAO NHẬN HỒ SƠ
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data: InsertDocumentTransaction) => {
            console.log("✅ Form data:", data);
            createTransaction.mutate(data);
          })} className="space-y-6">
            {/* Header thông tin chung */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div>
                <Label htmlFor="documentNumber">Số văn bản</Label>
                <Input
                  id="documentNumber"
                  {...form.register("documentNumber")}
                  placeholder="VD: AG-001/2024"
                />
              </div>
            </div>

            {/* Thông tin loại hồ sơ */}
            <div>
              <Label htmlFor="documentType">Loại hồ sơ *</Label>
              <Select
                value={form.watch("documentType")}
                onValueChange={(value) => form.setValue("documentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hồ sơ" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.documentType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.documentType.message}
                </p>
              )}
            </div>

            {/* Thông tin bên giao */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-blue-700">Bên Giao</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="deliveryCompany">Công ty/Tổ chức *</Label>
                  <Select
                    value={form.watch("deliveryCompany")}
                    onValueChange={(value) => form.setValue("deliveryCompany", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn công ty giao" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCompanyOptions.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.deliveryCompany && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.deliveryCompany.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryPerson">Người đại diện giao</Label>
                    <Input
                      id="deliveryPerson"
                      {...form.register("deliveryPerson")}
                      placeholder="Họ và tên người giao"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryDate">Ngày và giờ giao</Label>
                    <Input
                      id="deliveryDate"
                      type="datetime-local"
                      {...form.register("deliveryDate")}
                      placeholder="Để trống sẽ lấy thời điểm hiện tại"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Để trống sẽ tự động lấy thời điểm hiện tại
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin bên nhận */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-green-700">Bên Nhận</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="receivingCompany">Công ty/Tổ chức *</Label>
                  <Select
                    value={form.watch("receivingCompany")}
                    onValueChange={(value) => form.setValue("receivingCompany", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn công ty nhận" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCompanyOptions.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.receivingCompany && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.receivingCompany.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receivingPerson">Người đại diện nhận</Label>
                    <Input
                      id="receivingPerson"
                      {...form.register("receivingPerson")}
                      placeholder="Họ và tên người nhận"
                    />
                  </div>
                  <div>
                    <Label htmlFor="receivingDate">Ngày và giờ nhận</Label>
                    <Input
                      id="receivingDate"
                      type="datetime-local"
                      {...form.register("receivingDate")}
                      placeholder="Để trống sẽ lấy thời điểm hiện tại"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Để trống sẽ tự động lấy thời điểm hiện tại
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Người xử lý và ghi chú */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="handledBy">Người xử lý *</Label>
                <Input
                  id="handledBy"
                  {...form.register("handledBy")}
                  value={form.watch("handledBy")}
                  readOnly
                  className="bg-gray-50 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tự động điền theo tài khoản đăng nhập
                </p>
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Ghi chú thêm về giao dịch..."
                  rows={3}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createTransaction.isPending ? "Đang lưu..." : "Lưu giao dịch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Để xóa giao dịch này, vui lòng nhập mật khẩu xóa:
            </p>
            <Input
              type="password"
              placeholder="Nhập mật khẩu xóa"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletePassword("");
                  setDeleteTransactionId(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={!deletePassword || deleteTransaction.isPending}
              >
                {deleteTransaction.isPending ? "Đang xóa..." : "Xóa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}