import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, FileText, X, Upload, FileDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-new-auth";
import { ObjectUploader } from "@/components/ObjectUploader";
import { insertDocumentTransactionSchema, type InsertDocumentTransaction, type Business } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import { apiRequest } from "@/lib/queryClient";

interface MultiDocumentTransactionFormProps {
  business: Business;
  onSuccess?: () => void;
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

export function MultiDocumentTransactionForm({ business, onSuccess }: MultiDocumentTransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [uploadedPDFs, setUploadedPDFs] = useState<string[]>([]);

  // Lấy danh sách doanh nghiệp để làm dropdown
  const { data: businessesData } = useQuery({
    queryKey: ["/api/businesses/all"],
  });
  const businesses = businessesData || [];
  const allCompanyOptions = [
    ...COMPANY_OPTIONS,
    ...businesses.map((b: Business) => b.name),
  ];

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const form = useForm<any>({
    defaultValues: {
      businessId: business.id,
      documentNumber: "",
      deliveryCompany: COMPANY_OPTIONS[0],
      receivingCompany: business.name,
      deliveryPerson: user?.userData?.username || "",
      receivingPerson: business.contactPerson || "",
      deliveryDate: getCurrentDateTime(),
      receivingDate: "",
      handledBy: user?.userData?.username || "",
      notes: "",
      status: "pending",
      signedFilePath: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const businessId = business.id;
      const selectedDocuments = selectedDocumentTypes.map(type => ({
        name: type,
        count: documentCounts[type] || 1,
        notes: "", // Placeholder for specific document notes if needed later
      }));

      // Optimize to create single transaction for multiple documents
      console.log(`🚀 Creating 1 combined transaction for business ID: ${businessId} with ${selectedDocuments.length} document types`);

      // Combine all documents into one transaction
      const combinedDocumentType = selectedDocuments.map(doc => doc.name).join(" + ");
      const documentTypes = selectedDocuments.map(doc => doc.name);
      const documentCounts = selectedDocuments.reduce((acc, doc) => {
        acc[doc.name] = doc.count || 1;
        return acc;
      }, {} as Record<string, number>);

      const combinedTransaction = {
        businessId,
        documentNumber: formData.documentNumber || "",
        documentType: combinedDocumentType,
        documentTypes: JSON.stringify(documentTypes),
        documentCounts: JSON.stringify(documentCounts),
        deliveryCompany: formData.deliveryCompany,
        receivingCompany: formData.receivingCompany,
        deliveryPerson: formData.deliveryPerson || "",
        receivingPerson: formData.receivingPerson || "",
        deliveryDate: formData.deliveryDate,
        handledBy: formData.handledBy,
        notes: `Giao dịch tổng hợp: ${selectedDocuments.map(doc => `${doc.name} (${doc.count || 1})`).join(", ")}`,
        status: "pending"
      };

      console.log(`🚀 Creating combined transaction for business ${businessId}:`, combinedTransaction);
      const response = await apiRequest("POST", `/api/businesses/${businessId}/documents`, combinedTransaction);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo giao dịch tổng hợp: ${errorText}`);
      }

      const createdTransaction = await response.json();
      console.log(`✅ Created combined transaction ${createdTransaction.id}`);
      return [createdTransaction];
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Tạo giao dịch hồ sơ thành công" });
      form.reset();
      setSelectedDocumentTypes([]);
      setDocumentCounts({});
      setUploadedPDFs([]);
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/documents`] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi tạo giao dịch hồ sơ",
        variant: "destructive",
      });
    },
  });

  const addDocumentType = (type: string) => {
    if (!selectedDocumentTypes.includes(type)) {
      setSelectedDocumentTypes(prev => [...prev, type]);
      setDocumentCounts(prev => ({ ...prev, [type]: 1 }));
    }
  };

  const removeDocumentType = (type: string) => {
    setSelectedDocumentTypes(prev => prev.filter(t => t !== type));
    setDocumentCounts(prev => {
      const { [type]: removed, ...rest } = prev;
      return rest;
    });
  };

  const updateDocumentCount = (type: string, count: number) => {
    setDocumentCounts(prev => ({ ...prev, [type]: Math.max(1, count) }));
  };

  const handlePDFUpload = async () => {
    try {
      const response = await fetch("/api/documents/pdf-upload", { method: "POST" });
      const data = await response.json();
      return { method: "PUT" as const, url: data.uploadURL };
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo URL upload",
        variant: "destructive",
      });
      throw error;
    }
  };

  const onPDFUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        setUploadedPDFs(prev => [...prev, uploadedFile.uploadURL as string]);
        toast({
          title: "Thành công",
          description: "Upload PDF thành công",
        });
      }
    }
  };

  const onSubmit = form.handleSubmit((data) => {
    if (selectedDocumentTypes.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một loại hồ sơ",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm giao dịch hồ sơ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo giao dịch hồ sơ mới - {business.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Số phiếu giao nhận</Label>
              <Input
                id="documentNumber"
                {...form.register("documentNumber")}
                placeholder="Số phiếu giao nhận"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select onValueChange={(value) => form.setValue("status", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="received">Đã nhận</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Multi-Document Selection */}
          <div className="space-y-4">
            <Label>Loại hồ sơ và số lượng</Label>
            <Select onValueChange={(value) => addDocumentType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại hồ sơ để thêm" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.filter(type => !selectedDocumentTypes.includes(type)).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDocumentTypes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Hồ sơ đã chọn:</h4>
                {selectedDocumentTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`count-${type}`} className="text-sm">Số lượng:</Label>
                      <Input
                        id={`count-${type}`}
                        type="number"
                        min={1}
                        value={documentCounts[type] || 1}
                        onChange={(e) => updateDocumentCount(type, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocumentType(type)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-sm text-gray-600">
                  Tổng số hồ sơ: {Object.values(documentCounts).reduce((sum, count) => sum + count, 0)}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* PDF Upload */}
          <div className="space-y-4">
            <Label>Upload file PDF (tùy chọn)</Label>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={50 * 1024 * 1024} // 50MB
              onGetUploadParameters={handlePDFUpload}
              onComplete={onPDFUploadComplete}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload PDF</span>
              </div>
            </ObjectUploader>

            {uploadedPDFs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-green-600">File đã upload:</Label>
                {uploadedPDFs.map((pdf, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileDown className="h-4 w-4 text-green-600" />
                      <span className="text-sm">PDF file {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedPDFs(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Company Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryCompany">Công ty giao</Label>
              <Select onValueChange={(value) => form.setValue("deliveryCompany", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={COMPANY_OPTIONS[0]} />
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
            <div className="space-y-2">
              <Label htmlFor="receivingCompany">Công ty nhận</Label>
              <Select onValueChange={(value) => form.setValue("receivingCompany", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={business.name} />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryPerson">Người giao</Label>
              <Input
                id="deliveryPerson"
                {...form.register("deliveryPerson")}
                placeholder="Người giao hồ sơ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivingPerson">Người nhận</Label>
              <Input
                id="receivingPerson"
                {...form.register("receivingPerson")}
                placeholder="Người nhận hồ sơ"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Thời gian giao</Label>
              <Input
                id="deliveryDate"
                type="datetime-local"
                {...form.register("deliveryDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivingDate">Thời gian nhận</Label>
              <Input
                id="receivingDate"
                type="datetime-local"
                {...form.register("receivingDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handledBy">Người xử lý</Label>
            <Input
              id="handledBy"
              {...form.register("handledBy")}
              placeholder="Người xử lý hồ sơ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Ghi chú thêm về giao dịch hồ sơ"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Đang tạo..." : "Tạo giao dịch hồ sơ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}