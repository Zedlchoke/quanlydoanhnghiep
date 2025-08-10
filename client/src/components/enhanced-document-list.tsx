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
        <div class="logo-placeholder">
            <p style="font-size: 10px; color: #666; text-align: center; margin: 0;">
                [Logo sẽ được thêm ở đây]
            </p>
        </div>
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