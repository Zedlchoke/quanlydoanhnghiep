import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, FileText, X, Download, Edit2, Eye, Upload, FileUp, ArrowRight, ArrowLeft, Folder } from "lucide-react";
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
  "Hồ sơ pháp lý",
  "Hồ sơ kế toán", 
  "Hồ sơ bảo hiểm",
  "Hồ sơ khác",
];

const DOCUMENT_UNITS = [
  "Tờ",
  "Bộ", 
  "Quyển",
  "Cuốn",
];

interface DocumentDetail {
  type: string;
  quantity: number;
  unit: string;
  notes: string;
}

export function DocumentTransactionForm({ business }: DocumentTransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refetchAll } = useSyncContext();
  const [showForm, setShowForm] = useState(false);
  const [editingDocumentNumber, setEditingDocumentNumber] = useState<number | null>(null);
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [viewingTransaction, setViewingTransaction] = useState<DocumentTransaction | null>(null);
  const [documentItems, setDocumentItems] = useState<DocumentDetail[]>([
    { type: "", quantity: 1, unit: "Tờ", notes: "" }
  ]);

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
      documentDetails: {},
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
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm thông tin giao nhận hồ sơ",
      });
      form.reset({
        businessId: business.id,
        documentNumber: "",
        documentType: "Hồ sơ khác",
        documentDetails: {},
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
      setDocumentItems([{ type: "", quantity: 1, unit: "Tờ", notes: "" }]); // Reset document items
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
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
    
    // Tạo documentDetails từ documentItems
    const documentDetails: Record<string, {quantity: number, unit: string, notes?: string}> = {};
    documentItems.forEach(item => {
      if (item.type.trim()) {
        documentDetails[item.type] = {
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || ""
        };
      }
    });

    // Tạo documentType summary 
    const documentCount = Object.keys(documentDetails).length;
    const summaryParts = Object.entries(documentDetails).map(([type, details]) => 
      `${details.quantity} ${details.unit} ${type}`);
    const documentSummary = `${documentCount} loại hồ sơ: ${summaryParts.join(", ")}`;
    
    const submissionData = {
      ...data,
      documentType: documentSummary,
      documentDetails: documentDetails,
      deliveryDate: data.deliveryDate || currentDateTime,
      receivingDate: data.receivingDate || currentDateTime,
    };
    
    console.log('🚀 Submitting transaction data:', submissionData);
    console.log('🔍 documentDetails structure:', JSON.stringify(submissionData.documentDetails, null, 2));
    
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
                    <th>STT</th>
                    <th>Tên tài liệu</th>
                    <th>ĐVT</th>
                    <th>Số lượng</th>
                    <th>Góc/photo</th>
                    <th>Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(transaction.documentDetails || {}).map(([docType, details], index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${docType}</td>
                    <td>${details.unit || 'Tờ'}</td>
                    <td>${details.quantity || 1}</td>
                    <td>Góc</td>
                    <td>${details.notes || transaction.notes || '-'}</td>
                </tr>
                `).join('')}
                ${Object.keys(transaction.documentDetails || {}).length === 0 ? `
                <tr>
                    <td>1</td>
                    <td>${transaction.documentType}</td>
                    <td>Tờ</td>
                    <td>1</td>
                    <td>Góc</td>
                    <td>${transaction.notes || '-'}</td>
                </tr>
                ` : ''}
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
                      {transaction.signedFilePath ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-sm">Đã có file</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/objects${transaction.signedFilePath}`, "_blank")}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Download PDF
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Chưa</span>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760}
                            onGetUploadParameters={async () => {
                              const token = localStorage.getItem('authToken');
                              const response = await fetch('/api/objects/upload', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`,
                                }
                              });
                              const data = await response.json();
                              return { method: 'PUT' as const, url: data.uploadURL };
                            }}
                            onComplete={(result) => {
                              // Handle the uploaded file using the upload URL
                              if (result.successful && result.successful.length > 0) {
                                const uploadURL = result.successful[0].uploadURL;
                                fetch(`/api/documents/${transaction.id}/upload-pdf`, {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                  },
                                  body: JSON.stringify({ pdfPath: uploadURL })
                                }).then(() => {
                                  refetch();
                                  refetchAll();
                                });
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              <span className="text-xs">Choose file</span>
                            </div>
                          </ObjectUploader>
                        </div>
                      )}
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
                      <a 
                        href={viewingTransaction.signedFilePath} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        📁 Xem file
                      </a>
                    ) : (
                      "Chưa có file"
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-purple-700 mb-2">
              Thêm Giao Dịch Hồ Sơ
            </DialogTitle>
            <p className="text-center text-gray-600 text-sm">
              Tạo giao dịch mới cho việc bàn giao hồ sơ tài liệu
            </p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data: InsertDocumentTransaction) => {
            // Tạo documentDetails từ documentItems
            const documentDetails: Record<string, {quantity: number, unit: string, notes?: string}> = {};
            const validItems = documentItems.filter(item => item.type && item.quantity > 0);
            
            for (const item of validItems) {
              documentDetails[item.type] = {
                quantity: item.quantity,
                unit: item.unit,
                notes: item.notes || undefined
              };
            }
            
            // Lấy loại hồ sơ chính (loại đầu tiên hoặc loại có số lượng lớn nhất)
            const primaryDocType = validItems.length > 0 
              ? validItems.sort((a, b) => b.quantity - a.quantity)[0].type
              : "Hồ sơ khác";
            
            const finalData = {
              ...data,
              documentType: primaryDocType,
              documentDetails
            };
            
            console.log("✅ Form data:", finalData);
            createTransaction.mutate(finalData);
          })} className="space-y-6">
            
            {/* Form Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Thông tin cơ bản
                  </h3>
                  <div>
                    <Label htmlFor="documentNumber" className="text-sm font-medium text-gray-700">
                      Số văn bản *
                    </Label>
                    <Input
                      id="documentNumber"
                      {...form.register("documentNumber")}
                      placeholder="VD: AG-001/2024"
                      className="mt-1 h-11 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Bên giao */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Bên Giao
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Công ty/Tổ chức *</Label>
                      <Select
                        value={form.watch("deliveryCompany")}
                        onValueChange={(value) => form.setValue("deliveryCompany", value)}
                      >
                        <SelectTrigger className="mt-1 h-11 border-green-300 focus:border-green-500">
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
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Người đại diện</Label>
                      <Input
                        {...form.register("deliveryPerson")}
                        placeholder="Họ và tên người giao"
                        className="mt-1 h-11 border-green-300 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ngày và giờ giao</Label>
                      <Input
                        type="datetime-local"
                        {...form.register("deliveryDate")}
                        className="mt-1 h-11 border-green-300 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Để trống sẽ tự động lấy thời điểm hiện tại
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Danh sách hồ sơ */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                      <Folder className="w-5 h-5 mr-2" />
                      Danh sách hồ sơ
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDocumentItems([...documentItems, { type: "", quantity: 1, unit: "Tờ", notes: "" }]);
                      }}
                      className="text-purple-600 border-purple-300 hover:bg-purple-100 h-9"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Thêm hồ sơ
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {documentItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex-1">
                          <Select
                            value={item.type}
                            onValueChange={(value) => {
                              const newItems = [...documentItems];
                              newItems[index].type = value;
                              setDocumentItems(newItems);
                            }}
                          >
                            <SelectTrigger className="h-10 border-purple-300 focus:border-purple-500">
                              <SelectValue placeholder="Chọn loại hồ sơ" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES
                                .filter(type => !documentItems.some((di, i) => i !== index && di.type === type))
                                .map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="w-20">
                          <Input
                            type="number" 
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...documentItems];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              setDocumentItems(newItems);
                            }}
                            className="h-10 border-purple-300 focus:border-purple-500 text-center"
                            placeholder="SL"
                          />
                        </div>
                        
                        <div className="w-20">
                          <Select
                            value={item.unit}
                            onValueChange={(value) => {
                              const newItems = [...documentItems];
                              newItems[index].unit = value;
                              setDocumentItems(newItems);
                            }}
                          >
                            <SelectTrigger className="h-10 border-purple-300 focus:border-purple-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {documentItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newItems = documentItems.filter((_, i) => i !== index);
                              setDocumentItems(newItems);
                            }}
                            className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bên nhận */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Bên Nhận
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Công ty/Tổ chức *</Label>
                      <Select
                        value={form.watch("receivingCompany")}
                        onValueChange={(value) => form.setValue("receivingCompany", value)}
                      >
                        <SelectTrigger className="mt-1 h-11 border-orange-300 focus:border-orange-500">
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
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Người đại diện</Label>
                      <Input
                        {...form.register("receivingPerson")}
                        placeholder="Họ và tên người nhận"
                        className="mt-1 h-11 border-orange-300 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ngày nhận</Label>
                      <Input
                        type="datetime-local"
                        {...form.register("receivingDate")}
                        className="mt-1 h-11 border-orange-300 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Ghi chú bổ sung
              </h3>
              <Textarea
                {...form.register("notes")}
                placeholder="Nhập ghi chú về giao dịch này (nếu có)..."
                className="min-h-20 border-gray-300 focus:border-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ghi chú sẽ được hiển thị trong biên bản bàn giao tự động
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 h-12"
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={createTransaction.isPending}
                className="px-8 py-3 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                {createTransaction.isPending ? "Đang xử lý..." : "Tạo giao dịch"}
              </Button>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Bạn có xác nhận để xóa giao dịch này không? Vui lòng nhập mật khẩu để xác nhận:
            </p>
            <div>
              <Label htmlFor="deletePassword" className="text-sm font-medium">
                Mật khẩu xóa (4 số: 0102):
              </Label>
              <Input
                id="deletePassword"
                type="password"
                placeholder="Nhập mật khẩu 4 số"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                maxLength={4}
                autoFocus
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deletePassword.trim()) {
                    handleDeleteConfirm();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletePassword("");
                setDeleteTransactionId(null);
              }}
              disabled={deleteTransaction.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!deletePassword.trim() || deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}