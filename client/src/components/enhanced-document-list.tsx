import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, FileText, X, Download, Edit2, Eye, Upload, Trash2, PlusCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-new-auth";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSyncContext } from "@/contexts/sync-context";
import { useTransactionOperations } from "@/hooks/use-transaction-operations";
import { insertDocumentTransactionSchema, type InsertDocumentTransaction, type DocumentTransaction, type Business } from "@shared/schema";
import { z } from "zod";

interface EnhancedDocumentListProps {
  selectedBusinessId?: number;
  selectedBusinessName?: string;
  isVisible: boolean;
}

// Schema cho nhiều hồ sơ với số lượng và đơn vị
const multiDocumentSchema = z.object({
  businessId: z.number(),
  documentNumber: z.string().optional(),
  documents: z.array(z.object({
    type: z.string().min(1, "Loại hồ sơ không được để trống"),
    quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
    unit: z.string().min(1, "Đơn vị không được để trống"),
  })).min(1, "Phải có ít nhất 1 hồ sơ"),
  deliveryTaxId: z.string().min(1, "Mã số thuế công ty giao không được để trống"),
  receivingTaxId: z.string().min(1, "Mã số thuế công ty nhận không được để trống"),
  deliveryCompany: z.string().min(1, "Công ty giao không được để trống"),
  receivingCompany: z.string().min(1, "Công ty nhận không được để trống"),
  deliveryPerson: z.string().min(1, "Người giao không được để trống"),
  receivingPerson: z.string().min(1, "Người nhận không được để trống"),
  deliveryDate: z.string().min(1, "Ngày giao không được để trống"),
  receivingDate: z.string().optional(),
  handledBy: z.string().min(1, "Người xử lý không được để trống"),
  notes: z.string().optional(),
});

type MultiDocumentFormData = z.infer<typeof multiDocumentSchema>;

const DOCUMENT_TYPES = [
  "Hồ sơ thuế",
  "Hồ sơ kế toán", 
  "Hồ sơ pháp lý",
  "Hồ sơ bảo hiểm",
  "Hồ sơ lao động",
  "Hồ sơ khác",
];

const DOCUMENT_UNITS = [
  "bộ",
  "tài liệu",
  "phần",
  "quyển",
  "tờ",
];

export function EnhancedDocumentList({ selectedBusinessId, selectedBusinessName, isVisible }: EnhancedDocumentListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { createTransaction, createBusiness } = useTransactionOperations();
  const [showForm, setShowForm] = useState(false);
  const [editingDocumentNumber, setEditingDocumentNumber] = useState<number | null>(null);
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [viewingTransaction, setViewingTransaction] = useState<DocumentTransaction | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'business' | 'company' | 'taxid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTransactionId, setDeleteTransactionId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const transactionsPerPage = 10;
  
  // States cho tax ID dropdowns
  const [deliveryTaxIdOpen, setDeliveryTaxIdOpen] = useState(false);
  const [receivingTaxIdOpen, setReceivingTaxIdOpen] = useState(false);
  const [deliveryTaxIdSearch, setDeliveryTaxIdSearch] = useState("");
  const [receivingTaxIdSearch, setReceivingTaxIdSearch] = useState("");
  
  // States cho tìm kiếm và lọc
  const [searchTaxIdOpen, setSearchTaxIdOpen] = useState(false);
  const [searchTaxIdValue, setSearchTaxIdValue] = useState("");
  const [searchTaxIdInput, setSearchTaxIdInput] = useState("");
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
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

  const form = useForm<MultiDocumentFormData>({
    resolver: zodResolver(multiDocumentSchema),
    defaultValues: {
      businessId: selectedBusinessId || 0,
      documents: [{ type: "", quantity: 1, unit: "bộ" }],
      deliveryTaxId: "",
      receivingTaxId: "",
      deliveryCompany: "",
      receivingCompany: "",
      deliveryPerson: "",
      receivingPerson: "",
      deliveryDate: getCurrentDateTime(), // Thời gian mặc định
      receivingDate: "",
      handledBy: user?.userType === "admin" ? "Admin Hoàng Cảnh Anh Quân" : (user?.userType || ""),
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  // Sử dụng SyncContext cho dữ liệu
  const { businesses: allBusinesses, transactions: allTransactions, refetchAll } = useSyncContext();
  
  // Lọc transactions theo chế độ và sắp xếp theo thời gian tạo mới nhất
  const allFilteredTransactions = (() => {
    if (!isVisible) return [];
    
    let filtered = allTransactions;
    
    if (filterMode === 'business' && selectedBusinessId) {
      filtered = allTransactions.filter(t => t.businessId === selectedBusinessId);
    } else if (filterMode === 'company' && selectedBusinessId) {
      const selectedBusiness = allBusinesses.find(b => b.id === selectedBusinessId);
      if (selectedBusiness?.taxId) {
        filtered = allTransactions.filter(t => 
          t.deliveryCompany?.includes(selectedBusiness.name) || t.receivingCompany?.includes(selectedBusiness.name)
        );
      }
    } else if (filterMode === 'taxid' && searchTaxIdValue) {
      const searchBusiness = allBusinesses.find(b => b.taxId === searchTaxIdValue);
      if (searchBusiness) {
        filtered = allTransactions.filter(t =>
          t.deliveryCompany?.includes(searchBusiness.name) || t.receivingCompany?.includes(searchBusiness.name)
        );
      }
    }
    
    // Sắp xếp theo thời gian tạo mới nhất (createdAt desc)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.deliveryDate);
      const dateB = new Date(b.createdAt || b.deliveryDate);
      return dateB.getTime() - dateA.getTime();
    });
  })();

  // Lọc transactions theo ngày tháng
  const filteredTransactions = allFilteredTransactions.filter(transaction => {
    if (dateFilter.fromDate || dateFilter.toDate) {
      const transactionDate = new Date(transaction.deliveryDate);
      const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
      const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;
      
      if (fromDate && transactionDate < fromDate) return false;
      if (toDate && transactionDate > toDate) return false;
    }
    return true;
  });

  // Áp dụng phân trang
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Helper function để lọc businesses theo tìm kiếm
  const getFilteredBusinesses = (searchTerm: string) => {
    if (!searchTerm) return allBusinesses.slice(0, 10); // Hiển thị 10 businesses đầu nếu không có search
    
    return allBusinesses.filter(business => 
      business.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Giới hạn 10 kết quả
  };

  // Tìm business theo mã số thuế
  const findBusinessByTaxId = (taxId: string) => {
    return allBusinesses.find(business => business.taxId === taxId);
  };

  // Xử lý tạo hoặc tìm business Royal Việt Nam
  const handleRoyalVietnamBusiness = async (taxId: string, name: string) => {
    try {
      // Kiểm tra xem đã có business này chưa
      let business = allBusinesses.find(b => b.taxId === taxId);
      
      if (!business) {
        // Tạo business mới
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/businesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name,
            taxId: taxId,
            address: "Việt Nam",
            phone: "",
            email: "",
            website: "",
            industry: "Tư vấn doanh nghiệp",
            contactPerson: "",
            account: "",
            password: "",
            notes: "Công ty mặc định hệ thống"
          }),
        });

        if (response.ok) {
          business = await response.json();
          // Refresh danh sách businesses
          queryClient.invalidateQueries({ queryKey: ['/api/businesses/all'] });
        }
      }
      
      if (business) {
        form.setValue("businessId", business.id);
      }
    } catch (error) {
      console.error("Error handling Royal Vietnam business:", error);
    }
  };

  // Cập nhật tên công ty và business ID khi chọn mã số thuế
  useEffect(() => {
    const deliveryTaxId = form.watch("deliveryTaxId");
    if (deliveryTaxId) {
      const business = findBusinessByTaxId(deliveryTaxId);
      if (business) {
        form.setValue("deliveryCompany", business.name);
        form.setValue("businessId", business.id);
      } else if (deliveryTaxId === "0305794251") {
        // Xử lý đặc biệt cho Royal Việt Nam
        form.setValue("deliveryCompany", "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam");
        // Tìm hoặc tạo business Royal Việt Nam
        handleRoyalVietnamBusiness("0305794251", "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam");
      }
    }
  }, [form.watch("deliveryTaxId")]);

  useEffect(() => {
    const receivingTaxId = form.watch("receivingTaxId");
    if (receivingTaxId) {
      const business = findBusinessByTaxId(receivingTaxId);
      if (business) {
        form.setValue("receivingCompany", business.name);
        form.setValue("businessId", business.id);
      } else if (receivingTaxId === "0305794251") {
        // Xử lý đặc biệt cho Royal Việt Nam
        form.setValue("receivingCompany", "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam");
        handleRoyalVietnamBusiness("0305794251", "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam");
      }
    }
  }, [form.watch("receivingTaxId")]);

  // Hàm submit form tạo giao dịch  
  const onSubmit = async (data: MultiDocumentFormData) => {
    console.log(`🚀 Creating single transaction with ${data.documents.length} document types for business ID: ${data.businessId}`);
    
    try {
      // Tạo documentDetails object từ array documents
      const documentDetails: Record<string, { quantity: number; unit: string; notes?: string }> = {};
      data.documents.forEach((doc) => {
        documentDetails[doc.type] = {
          quantity: doc.quantity,
          unit: doc.unit,
          notes: data.notes || undefined
        };
      });

      // Tạo summary cho documentType field
      const documentCount = data.documents.length;
      const totalItems = data.documents.reduce((sum, doc) => sum + doc.quantity, 0);
      const summaryParts = data.documents.map(doc => `${doc.quantity} ${doc.unit} ${doc.type}`);
      const documentTypeSummary = `${documentCount} loại hồ sơ: ${summaryParts.join(", ")}`;

      const transactionData = {
        documentNumber: data.documentNumber || undefined,
        documentType: documentTypeSummary,
        documentDetails: documentDetails,
        deliveryCompany: data.deliveryCompany,
        receivingCompany: data.receivingCompany,
        deliveryPerson: data.deliveryPerson,
        receivingPerson: data.receivingPerson,
        deliveryDate: data.deliveryDate,
        receivingDate: data.receivingDate || undefined,
        handledBy: data.handledBy,
        notes: data.notes || undefined,
        status: 'pending' as const
      };
      
      await createTransaction.mutateAsync({
        businessId: data.businessId,
        transactionData
      });
      
      // Reset form và đóng dialog khi thành công
      form.reset({
        businessId: selectedBusinessId || 0,
        documents: [{ type: "", quantity: 1, unit: "bộ" }],
        deliveryTaxId: "",
        receivingTaxId: "",
        deliveryCompany: "",
        receivingCompany: "",
        deliveryPerson: "",
        receivingPerson: "",
        deliveryDate: getCurrentDateTime(),
        receivingDate: "",
        handledBy: user?.userType === "admin" ? "Admin Hoàng Cảnh Anh Quân" : (user?.userType || ""),
        notes: "",
      });
      setShowForm(false);
      
    } catch (error) {
      console.error("❌ Error in onSubmit:", error);
    }
  };

  const deleteTransaction = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch hồ sơ",
      });
      setShowDeleteConfirm(false);
      setDeleteTransactionId(null);
      setDeletePassword("");
      refetchAll();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa giao dịch hồ sơ",
        variant: "destructive",
      });
    }
  });

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
      refetchAll();
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteTransactionId && deletePassword) {
      deleteTransaction.mutate({ id: deleteTransactionId, password: deletePassword });
    }
  };

  const uploadPdf = useMutation({
    mutationFn: async ({ id, pdfUrl, fileName }: { id: number; pdfUrl: string; fileName: string }) => {
      const response = await fetch(`/api/documents/${id}/pdf`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl, fileName }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload PDF");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tải lên file PDF",
      });
      refetchAll();
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete PDF from transaction
  const deletePdf = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/documents/${id}/pdf`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Xóa file thất bại');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchAll();
      toast({
        title: "Thành công",
        description: "Xóa file PDF thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // Function to generate document table rows from documentDetails
  const generateDocumentRows = (transaction: DocumentTransaction): string => {
    if (transaction.documentDetails && typeof transaction.documentDetails === 'object') {
      let index = 1;
      return Object.entries(transaction.documentDetails).map(([documentType, details]) => {
        if (details && typeof details === 'object' && 'quantity' in details && 'unit' in details) {
          const capitalizedUnit = details.unit.charAt(0).toUpperCase() + details.unit.slice(1);
          const row = `
                <tr>
                    <td>${index}</td>
                    <td>${documentType}</td>
                    <td>${capitalizedUnit}</td>
                    <td>${details.quantity}</td>
                    <td>Gốc</td>
                    <td>-</td>
                </tr>`;
          index++;
          return row;
        }
        return '';
      }).filter(row => row.trim()).join('');
    }
    
    // Fallback for legacy transactions
    return `
                <tr>
                    <td>1</td>
                    <td>${transaction.documentType || 'Tài liệu'}</td>
                    <td>Tờ</td>
                    <td>1</td>
                    <td>Gốc</td>
                    <td>-</td>
                </tr>`;
  };

  const generateInvoiceForm = (transaction: DocumentTransaction) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Biên Bản Bàn Giao Tài Liệu</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; }
        .header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .logo-placeholder { 
            width: 80px; 
            height: 80px; 
            margin-right: 20px;
            border: 1px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .company-info { 
            flex: 1; 
            display: flex; 
            justify-content: space-between; 
        }
        .company-left h2 { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 0 0 10px 0; 
            color: #000;
        }
        .company-left p { 
            margin: 2px 0; 
            font-size: 12px; 
        }
        .company-right { 
            text-align: right; 
        }
        .company-right p { 
            margin: 2px 0; 
            font-size: 12px; 
        }
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
        <img src="data:image/png;base64,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" 
             class="logo" alt="Royal Việt Nam Logo">
        <div class="company-info">
            <div class="company-left">
                <h2>ROYAL VIỆT NAM</h2>
                <p>54/6 Nguyễn Xí, P.26, Q.Bình Thạnh, Tp.HCM</p>
                <p>tuvanktetoanthue.vn</p>
            </div>
            <div class="company-right">
                <p>083.5111720-721; Fax : 083.5117919</p>
                <p>royal@tuvanktetoanthue.vn</p>
            </div>
        </div>
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
                    <th>Gốc/photo</th>
                    <th>Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                ${generateDocumentRows(transaction)}
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

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header với controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Danh Sách Giao Dịch Hồ Sơ</h3>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Giao Dịch
        </Button>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Tra cứu theo:</span>
          </div>
          
          <Select value={filterMode} onValueChange={(value: 'all' | 'business' | 'company' | 'taxid') => setFilterMode(value)}>
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giao dịch</SelectItem>
              {selectedBusinessId && (
                <SelectItem value="business">Hồ sơ của doanh nghiệp này</SelectItem>
              )}
              {selectedBusinessName && (
                <SelectItem value="company">Hồ sơ liên quan công ty này</SelectItem>
              )}
              <SelectItem value="taxid">Theo mã số thuế</SelectItem>
            </SelectContent>
          </Select>

          {filterMode === 'taxid' && (
            <Popover open={searchTaxIdOpen} onOpenChange={setSearchTaxIdOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={`w-80 justify-between ${!searchTaxIdValue && "text-muted-foreground"}`}
                >
                  {searchTaxIdValue ? 
                    allBusinesses.find(b => b.taxId === searchTaxIdValue)?.name || searchTaxIdValue :
                    "Chọn mã số thuế để tra cứu..."
                  }
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Command>
                  <CommandInput 
                    placeholder="Tìm mã số thuế..." 
                    value={searchTaxIdInput}
                    onValueChange={setSearchTaxIdInput}
                  />
                  <CommandEmpty>Không tìm thấy mã số thuế phù hợp.</CommandEmpty>
                  <CommandGroup>
                    {/* Gợi ý mặc định Royal Việt Nam */}
                    <CommandItem
                      value="royal-search"
                      onSelect={() => {
                        setSearchTaxIdValue("0305794251");
                        setSearchTaxIdOpen(false);
                      }}
                      className="border-b"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">0305794251 (Royal Việt Nam)</span>
                        <span className="text-sm text-gray-500">TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam</span>
                      </div>
                    </CommandItem>
                    {getFilteredBusinesses(searchTaxIdInput).map((business) => (
                      <CommandItem
                        key={business.id}
                        value={business.taxId || ""}
                        onSelect={() => {
                          setSearchTaxIdValue(business.taxId || "");
                          setSearchTaxIdOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{business.taxId}</span>
                          <span className="text-sm text-gray-500">{business.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Bộ lọc ngày tháng */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Lọc theo thời gian:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm">Từ ngày:</Label>
            <Input
              id="fromDate"
              type="date"
              value={dateFilter.fromDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, fromDate: e.target.value }))}
              className="w-40"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm">Đến ngày:</Label>
            <Input
              id="toDate"
              type="date"
              value={dateFilter.toDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, toDate: e.target.value }))}
              className="w-40"
            />
          </div>
          
          {(dateFilter.fromDate || dateFilter.toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateFilter({ fromDate: "", toDate: "" })}
            >
              <X className="h-4 w-4 mr-1" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Danh sách luôn hiển thị */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filterMode === 'business' ? `Hồ sơ của doanh nghiệp (${filteredTransactions.length})` :
             filterMode === 'company' ? `Hồ sơ liên quan "${selectedBusinessName}" (${filteredTransactions.length})` :
             filterMode === 'taxid' && searchTaxIdValue ? `Hồ sơ mã số thuế "${searchTaxIdValue}" (${filteredTransactions.length})` :
             `Tất cả giao dịch hồ sơ (${filteredTransactions.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số văn bản</TableHead>
                    <TableHead>Chi tiết hồ sơ</TableHead>
                    <TableHead>Công ty giao</TableHead>
                    <TableHead>Công ty nhận</TableHead>
                    <TableHead>Ngày giao</TableHead>
                    <TableHead>File PDF</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
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
                    <TableCell className="max-w-[200px]">
                      {/* Hiển thị chi tiết hồ sơ từ documentDetails */}
                      {transaction.documentDetails && Object.keys(transaction.documentDetails).length > 0 ? (
                        <div className="text-sm">
                          {Object.entries(transaction.documentDetails)
                            .slice(0, 4)
                            .map(([type, details], index) => (
                              <div key={index} className="flex justify-between items-center mb-1">
                                <span className="truncate mr-2">{type}:</span>
                                <Badge variant="secondary" className="text-xs">
                                  {details.quantity} {details.unit}
                                </Badge>
                              </div>
                            ))}
                          {Object.keys(transaction.documentDetails).length > 4 && (
                            <p className="text-xs text-gray-500 italic">và còn nữa...</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">{transaction.documentType}</span>
                      )}
                    </TableCell>
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
                      {transaction.pdfFilePath ? (
                        <div className="flex items-center gap-2">
                          <a 
                            href={`/api/documents/${transaction.id}/pdf/download`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm max-w-[120px] truncate"
                            title={transaction.pdfFileName || 'PDF'}
                          >
                            {transaction.pdfFileName || 'PDF'}
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Bạn có xác nhận để xóa file PDF của giao dịch này không?')) {
                                deletePdf.mutate(transaction.id);
                              }
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Xóa file PDF"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Chưa có file</span>
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf"
                              disabled={uploadPdf.isPending}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                try {
                                  // Get upload URL
                                  const response = await fetch('/api/objects/upload', { method: 'POST' });
                                  const data = await response.json();
                                  
                                  // Upload file directly
                                  const uploadResponse = await fetch(data.uploadURL, {
                                    method: 'PUT',
                                    body: file,
                                    headers: {
                                      'Content-Type': 'application/pdf'
                                    }
                                  });
                                  
                                  if (uploadResponse.ok) {
                                    // Update database
                                    await uploadPdf.mutateAsync({ 
                                      id: transaction.id, 
                                      pdfUrl: data.uploadURL,
                                      fileName: file.name
                                    });
                                    
                                    toast({
                                      title: "Tải lên thành công",
                                      description: `File ${file.name} đã được tải lên`,
                                    });
                                  } else {
                                    throw new Error('Upload failed');
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error);
                                  toast({
                                    title: "Tải lên thất bại",
                                    description: "Không thể tải lên file PDF",
                                    variant: "destructive",
                                  });
                                }
                                
                                // Reset input
                                e.target.value = '';
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              id={`pdf-upload-${transaction.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={uploadPdf.isPending}
                              className="h-7 px-2 text-xs"
                              asChild
                            >
                              <label htmlFor={`pdf-upload-${transaction.id}`} className="cursor-pointer">
                                <FileText className="w-3 h-3 mr-1" />
                                Choose file
                              </label>
                            </Button>
                          </div>
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
                          onClick={() => generateInvoiceForm(transaction)}
                          title="Tải biểu mẫu"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTransactionId(transaction.id);
                            setShowDeleteConfirm(true);
                          }}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, totalTransactions)} của {totalTransactions} giao dịch
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500">
                {filterMode === 'business' ? "Chưa có giao dịch hồ sơ nào cho doanh nghiệp này" :
                 filterMode === 'company' ? "Chưa có giao dịch hồ sơ nào liên quan đến công ty này" :
                 "Chưa có giao dịch hồ sơ nào"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog xem chi tiết */}
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
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Chi tiết hồ sơ</Label>
                  {viewingTransaction.documentDetails && Object.keys(viewingTransaction.documentDetails).length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {Object.entries(viewingTransaction.documentDetails).map(([type, details], index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">{type}</span>
                            <Badge variant="outline" className="text-xs">
                              {details.quantity} {details.unit}
                            </Badge>
                          </div>
                          {details.notes && (
                            <p className="text-xs text-gray-600 mt-1">{details.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">{viewingTransaction.documentType}</p>
                  )}
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

      {/* Dialog form thêm giao dịch với nhiều hồ sơ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Giao Dịch Hồ Sơ</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số văn bản</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập số văn bản (tùy chọn)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handledBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Người xử lý</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Danh sách hồ sơ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Danh sách hồ sơ</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ type: "", quantity: 1, unit: "bộ" })}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Thêm hồ sơ
                  </Button>
                </div>
                
                {fields.map((field, index) => {
                  const selectedTypes = form.watch("documents").map(doc => doc.type).filter(Boolean);
                  const availableTypes = DOCUMENT_TYPES.filter(type => 
                    !selectedTypes.includes(type) || form.watch(`documents.${index}.type`) === type
                  );
                  
                  return (
                    <div key={field.id} className="flex items-center gap-2 p-3 border rounded-lg">
                      <span className="font-medium text-sm w-8">#{index + 1}</span>
                      
                      {/* Dropdown loại hồ sơ */}
                      <FormField
                        control={form.control}
                        name={`documents.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn loại hồ sơ" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Input số lượng */}
                      <FormField
                        control={form.control}
                        name={`documents.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                placeholder="SL"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Dropdown đơn vị */}
                      <FormField
                        control={form.control}
                        name={`documents.${index}.unit`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Đơn vị" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOCUMENT_UNITS.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Nút X xóa */}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mã số thuế và tên công ty */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveryTaxId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Mã số thuế công ty giao *</FormLabel>
                      <Popover open={deliveryTaxIdOpen} onOpenChange={setDeliveryTaxIdOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value || "Chọn mã số thuế..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Tìm mã số thuế..." 
                              value={deliveryTaxIdSearch}
                              onValueChange={setDeliveryTaxIdSearch}
                            />
                            <CommandEmpty>Không tìm thấy mã số thuế phù hợp.</CommandEmpty>
                            <CommandGroup>
                              {/* Gợi ý mặc định Royal Việt Nam */}
                              <CommandItem
                                value="royal-default"
                                onSelect={() => {
                                  form.setValue("deliveryTaxId", "0305794251");
                                  form.setValue("deliveryCompany", "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam");
                                  setDeliveryTaxIdOpen(false);
                                }}
                                className="border-b"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">0305794251 (Mặc định)</span>
                                  <span className="text-sm text-gray-500">TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam</span>
                                </div>
                              </CommandItem>
                              {getFilteredBusinesses(deliveryTaxIdSearch).map((business) => (
                                <CommandItem
                                  key={business.id}
                                  value={business.taxId || ""}
                                  onSelect={() => {
                                    form.setValue("deliveryTaxId", business.taxId || "");
                                    form.setValue("deliveryCompany", business.name);
                                    setDeliveryTaxIdOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{business.taxId}</span>
                                    <span className="text-sm text-gray-500">{business.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivingTaxId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Mã số thuế công ty nhận *</FormLabel>
                      <Popover open={receivingTaxIdOpen} onOpenChange={setReceivingTaxIdOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value || "Chọn mã số thuế..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Tìm mã số thuế..." 
                              value={receivingTaxIdSearch}
                              onValueChange={setReceivingTaxIdSearch}
                            />
                            <CommandEmpty>Không tìm thấy mã số thuế phù hợp.</CommandEmpty>
                            <CommandGroup>
                              {/* Gợi ý mặc định Royal Việt Nam */}
                              <CommandItem
                                value="royal-default"
                                onSelect={() => {
                                  form.setValue("receivingTaxId", "0305794251");
                                  form.setValue("receivingCompany", "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam");
                                  setReceivingTaxIdOpen(false);
                                }}
                                className="border-b"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">0305794251 (Mặc định)</span>
                                  <span className="text-sm text-gray-500">TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam</span>
                                </div>
                              </CommandItem>
                              {getFilteredBusinesses(receivingTaxIdSearch).map((business) => (
                                <CommandItem
                                  key={business.id}
                                  value={business.taxId || ""}
                                  onSelect={() => {
                                    form.setValue("receivingTaxId", business.taxId || "");
                                    form.setValue("receivingCompany", business.name);
                                    setReceivingTaxIdOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{business.taxId}</span>
                                    <span className="text-sm text-gray-500">{business.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tên công ty (chỉ đọc, tự động cập nhật) */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveryCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên công ty giao *</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" placeholder="Tự động cập nhật khi chọn mã số thuế" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivingCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên công ty nhận *</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" placeholder="Tự động cập nhật khi chọn mã số thuế" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Người giao *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên người giao" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivingPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Người nhận *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên người nhận" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày giao *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày nhận</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Nhập ghi chú (tùy chọn)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? "Đang tạo..." : "Tạo giao dịch"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa giao dịch */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Bạn có chắc muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
            </p>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Nhập mật khẩu để xác nhận xóa:</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Mật khẩu xác nhận"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deletePassword) {
                    handleDeleteConfirm();
                  }
                }}
              />
            </div>
            {deleteTransaction.isError && (
              <p className="text-red-500 text-sm">
                Sai mật khẩu hoặc có lỗi xảy ra. Vui lòng thử lại.
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false);
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
              disabled={deleteTransaction.isPending || !deletePassword}
            > 
              {deleteTransaction.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}