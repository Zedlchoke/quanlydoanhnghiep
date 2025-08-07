import { useState } from "react";
import { Building2, Edit, Trash2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import DeleteConfirmation from "./delete-confirmation";
import type { Business } from "@shared/schema";

interface BusinessListProps {
  businesses: Business[];
  isLoading: boolean;
  onEdit: (business: Business) => void;
  onBusinessDeleted: () => void;
  onViewDocuments: (business: Business) => void;
  searchResults: Business[] | null;
  onClearSearch: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isAdmin: boolean;
}

export default function BusinessList({ 
  businesses, 
  isLoading, 
  onEdit, 
  onBusinessDeleted,
  onViewDocuments,
  searchResults,
  onClearSearch,
  currentPage,
  totalPages,
  onPageChange,
  isAdmin
}: BusinessListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Đang tải...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {searchResults ? "Kết Quả Tìm Kiếm" : "Danh Sách Doanh Nghiệp"}
            </CardTitle>
            {searchResults && (
              <Button variant="outline" size="sm" onClick={onClearSearch}>
                <X className="w-4 h-4 mr-2" />
                Xóa Bộ Lọc
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchResults ? "Không tìm thấy doanh nghiệp nào" : "Chưa có doanh nghiệp nào"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Doanh Nghiệp</TableHead>
                    <TableHead>Mã Số Thuế</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Điện Thoại</TableHead>
                    <TableHead>Ngành Nghề</TableHead>
                    <TableHead>Người Liên Hệ</TableHead>
                    <TableHead>Tài Khoản</TableHead>
                    <TableHead>Mật Khẩu</TableHead>
                    <TableHead>Ngày Tạo</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{business.taxId}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {business.website ? (
                          <a 
                            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {business.website}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{business.phone || "-"}</TableCell>
                      <TableCell>{business.industry || "-"}</TableCell>
                      <TableCell>{business.contactPerson || "-"}</TableCell>
                      <TableCell>{business.account || "-"}</TableCell>
                      <TableCell>{business.password || "-"}</TableCell>
                      <TableCell>{formatDate(business.createdAt.toString())}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDocuments(business)}
                            title="Quản lý hồ sơ"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(business)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(business)}
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination - only show if not search results */}
          {!searchResults && totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmation
          business={deleteTarget}
          onConfirm={onBusinessDeleted}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
