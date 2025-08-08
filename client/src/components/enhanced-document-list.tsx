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

// Schema cho nhiều hồ sơ với mã số thuế
const multiDocumentSchema = z.object({
  businessId: z.number(),
  documentNumber: z.string().optional(),
  documents: z.array(z.object({
    type: z.string().min(1, "Loại hồ sơ không được để trống"),
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
      documents: [{ type: "" }],
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
  
  // Lọc transactions theo chế độ
  const transactions = (() => {
    if (!isVisible) return [];
    
    if (filterMode === 'business' && selectedBusinessId) {
      return allTransactions.filter(t => t.businessId === selectedBusinessId);
    }
    
    if (filterMode === 'company' && selectedBusinessId) {
      const selectedBusiness = allBusinesses.find(b => b.id === selectedBusinessId);
      if (selectedBusiness?.taxId) {
        return allTransactions.filter(t => 
          t.deliveryCompany?.includes(selectedBusiness.name) || t.receivingCompany?.includes(selectedBusiness.name)
        );
      }
    }
    
    if (filterMode === 'taxid' && searchTaxIdValue) {
      const searchBusiness = allBusinesses.find(b => b.taxId === searchTaxIdValue);
      if (searchBusiness) {
        return allTransactions.filter(t => 
          t.deliveryCompany?.includes(searchBusiness.name) || t.receivingCompany?.includes(searchBusiness.name)
        );
      }
    }
    
    return allTransactions;
  })();

  // Lọc transactions theo ngày tháng
  const filteredTransactions = transactions.filter(transaction => {
    if (dateFilter.fromDate || dateFilter.toDate) {
      const transactionDate = new Date(transaction.deliveryDate);
      const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
      const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;
      
      if (fromDate && transactionDate < fromDate) return false;
      if (toDate && transactionDate > toDate) return false;
    }
    return true;
  });

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
    console.log(`🚀 Creating ${data.documents.length} transactions for business ID: ${data.businessId}`);
    
    try {
      // Tạo từng transaction một cách tuần tự để đảm bảo consistency
      for (let index = 0; index < data.documents.length; index++) {
        const doc = data.documents[index];
        const transactionData = {
          documentNumber: data.documentNumber || undefined,
          documentType: `${doc.type} (${index + 1}/${data.documents.length})`,
          deliveryCompany: data.deliveryCompany,
          receivingCompany: data.receivingCompany,
          deliveryPerson: data.deliveryPerson,
          receivingPerson: data.receivingPerson,
          deliveryDate: data.deliveryDate,
          receivingDate: data.receivingDate || undefined,
          handledBy: data.handledBy,
          notes: `${data.notes ? data.notes + '\n' : ''}Hồ sơ ${index + 1}/${data.documents.length}`,
          status: 'pending' as const
        };
        
        await createTransaction.mutateAsync({
          businessId: data.businessId,
          transactionData
        });
      }
      
      // Reset form và đóng dialog khi tất cả thành công
      form.reset({
        businessId: selectedBusinessId || 0,
        documents: [{ type: "" }],
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
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch hồ sơ",
      });
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
      refetchAll();
    },
  });



  const generateInvoiceForm = (transaction: DocumentTransaction) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Biên Bản Bàn Giao Tài Liệu</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
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
                    <th>Góc/photo</th>
                    <th>Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>${transaction.documentType}</td>
                    <td>Tờ</td>
                    <td>1</td>
                    <td>Góc</td>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số văn bản</TableHead>
                  <TableHead>Công ty giao</TableHead>
                  <TableHead>Công ty nhận</TableHead>
                  <TableHead>Ngày giao</TableHead>
                  <TableHead>File PDF</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
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
                        <a 
                          href={transaction.signedFilePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          📁 Xem PDF
                        </a>
                      ) : (
                        <ObjectUploader
                          onGetUploadParameters={async () => {
                            const response = await fetch('/api/objects/upload', { method: 'POST' });
                            const data = await response.json();
                            return { method: 'PUT' as const, url: data.uploadURL };
                          }}
                          onComplete={(result) => {
                            const uploadedFile = result.successful?.[0];
                            if (uploadedFile?.uploadURL) {
                              uploadPdf.mutate({ 
                                id: transaction.id, 
                                pdfPath: uploadedFile.uploadURL 
                              });
                            }
                          }}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Tải PDF
                        </ObjectUploader>
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
                          onClick={() => deleteTransaction.mutate(transaction.id)}
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

      {/* Dialog form thêm giao dịch với nhiều hồ sơ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Giao Dịch Hồ Sơ (Nhiều Hồ Sơ)</DialogTitle>
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
                    onClick={() => append({ type: "" })}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Thêm hồ sơ
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-3 border rounded-lg">
                    <span className="font-medium text-sm w-8">#{index + 1}</span>
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
                                {DOCUMENT_TYPES.map((type) => (
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
                ))}
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
    </div>
  );
}