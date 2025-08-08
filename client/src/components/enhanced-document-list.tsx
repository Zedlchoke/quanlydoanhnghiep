
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Download, Upload, Edit2, Trash2, Eye, Calendar, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MultiDocumentTransactionForm } from "./multi-document-transaction-form";
import { DocumentExport } from "./document-export";
import DeleteConfirmation from "./delete-confirmation";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentTransaction, Business } from "@shared/schema";

interface EnhancedDocumentListProps {
  selectedBusinessId?: number | null;
  selectedBusinessName?: string | null;
  isVisible: boolean;
}

interface PDFUploadDialogProps {
  transaction: DocumentTransaction;
  onClose: () => void;
  onSuccess: () => void;
}

function PDFUploadDialog({ transaction, onClose, onSuccess }: PDFUploadDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file PDF",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file PDF",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await uploadResponse.json();

      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      const fileUploadResponse = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      });

      if (!fileUploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadResult = await fileUploadResponse.json();
      const pdfPath = uploadResult.path;

      // Update document transaction with PDF path
      const updateResponse = await apiRequest("PUT", `/api/documents/${transaction.id}/upload-pdf`, {
        pdfPath: pdfPath
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update document with PDF");
      }

      toast({
        title: "Thành công",
        description: "Tải lên PDF thành công",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lên PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tải lên PDF cho giao dịch #{transaction.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pdf-file">Chọn file PDF</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
          {file && (
            <p className="text-sm text-gray-600">
              File đã chọn: {file.name}
            </p>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !file}>
              {isUploading ? "Đang tải lên..." : "Tải lên"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EnhancedDocumentList({
  selectedBusinessId,
  selectedBusinessName,
  isVisible,
}: EnhancedDocumentListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<DocumentTransaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [uploadingTransaction, setUploadingTransaction] = useState<DocumentTransaction | null>(null);

  const { data: allTransactions = [], isLoading, refetch } = useQuery<DocumentTransaction[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/documents");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/businesses/all"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/businesses/all");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const response = await apiRequest("DELETE", `/api/documents/${id}`, { password });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch hồ sơ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa giao dịch hồ sơ",
        variant: "destructive",
      });
    },
  });

  const handlePDFDownload = async (transaction: DocumentTransaction) => {
    if (!transaction.signedFilePath) {
      toast({
        title: "Không có file",
        description: "Giao dịch này chưa có file PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(transaction.signedFilePath);
      if (!response.ok) {
        throw new Error("File not found");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${transaction.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Thành công",
        description: "Đã tải về file PDF",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải về file PDF",
        variant: "destructive",
      });
    }
  };

  if (!isVisible) return null;

  const filteredTransactions = allTransactions.filter(transaction => {
    const companyFilter = !filterCompany || filterCompany === "all" ||
      transaction.deliveryCompany.toLowerCase().includes(filterCompany.toLowerCase()) ||
      transaction.receivingCompany.toLowerCase().includes(filterCompany.toLowerCase());
    
    return companyFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Chờ xử lý", variant: "secondary" as const },
      in_progress: { label: "Đang xử lý", variant: "default" as const },
      completed: { label: "Hoàn thành", variant: "default" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getBusinessName = (businessId: number) => {
    const business = businesses.find(b => b.id === businessId);
    return business?.name || `Business #${businessId}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Đang tải danh sách giao dịch hồ sơ...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Danh Sách Giao Dịch Hồ Sơ
              {selectedBusinessName && (
                <span className="text-sm font-normal text-gray-600">
                  - {selectedBusinessName}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Lọc theo công ty..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả công ty</SelectItem>
                  {Array.from(new Set(
                    allTransactions.flatMap(t => [t.deliveryCompany, t.receivingCompany])
                  )).map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm Giao Dịch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có giao dịch hồ sơ nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số HĐ</TableHead>
                    <TableHead>Loại Hồ Sơ</TableHead>
                    <TableHead>Doanh Nghiệp</TableHead>
                    <TableHead>Công Ty Giao</TableHead>
                    <TableHead>Công Ty Nhận</TableHead>
                    <TableHead>Người Giao</TableHead>
                    <TableHead>Người Nhận</TableHead>
                    <TableHead>Ngày Giao</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>File PDF</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.documentNumber || `#${transaction.id}`}
                      </TableCell>
                      <TableCell>{transaction.documentType}</TableCell>
                      <TableCell>{getBusinessName(transaction.businessId)}</TableCell>
                      <TableCell>{transaction.deliveryCompany}</TableCell>
                      <TableCell>{transaction.receivingCompany}</TableCell>
                      <TableCell>{transaction.deliveryPerson}</TableCell>
                      <TableCell>{transaction.receivingPerson}</TableCell>
                      <TableCell>{formatDate(transaction.deliveryDate)}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.signedFilePath ? (
                          <Badge variant="default">Đã có file</Badge>
                        ) : (
                          <Badge variant="secondary">Chưa có file</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {transaction.signedFilePath ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePDFDownload(transaction)}
                              title="Tải về PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadingTransaction(transaction)}
                              title="Tải lên PDF"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <DocumentExport transactions={[transaction]} />
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(transaction)}
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Form */}
      {showForm && (
        <MultiDocumentTransactionForm
          selectedBusinessId={selectedBusinessId}
          selectedBusinessName={selectedBusinessName}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {/* PDF Upload Dialog */}
      {uploadingTransaction && (
        <PDFUploadDialog
          transaction={uploadingTransaction}
          onClose={() => setUploadingTransaction(null)}
          onSuccess={() => {
            refetch();
            setUploadingTransaction(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmation
          documentTransaction={deleteTarget}
          onConfirm={(password) => deleteMutation.mutate({ id: deleteTarget.id, password })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
