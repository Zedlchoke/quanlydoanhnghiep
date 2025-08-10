import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Search, LogIn, LogOut, Settings, Key } from "lucide-react";
import logoImage from "@assets/Picture1_1754621344471.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BusinessForm from "@/components/business-form";
import SearchForm from "@/components/search-form";
import BusinessList from "@/components/business-list";
import BusinessViewModal from "@/components/business-view-modal";
import { DocumentTransactionForm } from "@/components/document-transaction-form";
import { MultiDocumentTransactionForm } from "@/components/multi-document-transaction-form";
import { EnhancedDocumentList } from "@/components/enhanced-document-list";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-new-auth";

import type { Business } from "@shared/schema";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<Business | null>(null);
  const [searchResults, setSearchResults] = useState<Business[] | null>(null);
  const [documentBusiness, setDocumentBusiness] = useState<Business | null>(null);


  const { data: businessData, isLoading, refetch } = useQuery({
    queryKey: ["/api/businesses", { page, limit: 10, sortBy, sortOrder }],
    queryFn: async () => {
      const response = await fetch(`/api/businesses?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      if (!response.ok) throw new Error("Failed to fetch businesses");
      return response.json();
    },
  });

  const businesses = searchResults || businessData?.businesses || [];
  const total = businessData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const handleBusinessSaved = () => {
    setIsAddModalOpen(false);
    setEditingBusiness(null);
    setSearchResults(null);
    refetch();
  };

  const handleBusinessDeleted = () => {
    setSearchResults(null);
    refetch();
  };

  const handleSearchResults = (results: Business[]) => {
    setSearchResults(results);
    setIsSearchModalOpen(false);
  };

  const clearSearch = () => {
    setSearchResults(null);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1); // Reset to first page when sorting changes
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm p-1">
                <img 
                  src={logoImage} 
                  alt="Royal Việt Nam Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Phần Mềm Quản Lý Doanh Nghiệp Royal Việt Nam</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {user?.userType === "admin" ? `Admin: ${user?.identifier}` : 
                     user?.userType === "employee" ? `Nhân viên: ${user?.identifier}` : "User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Key className="mr-2 h-4 w-4" />
                    Đổi Mật Khẩu
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng Xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Bảng Điều Khiển</h2>
              <p className="text-slate-600 mt-1">Quản lý thông tin doanh nghiệp và tìm kiếm dữ liệu</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsSearchModalOpen(true)}
                className="inline-flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Tìm Kiếm
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm Doanh Nghiệp
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Tổng Doanh Nghiệp</p>
                  <p className="text-2xl font-bold text-slate-900">{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Kết Quả Tìm Kiếm</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {searchResults ? searchResults.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Trang Hiện Tại</p>
                  <p className="text-2xl font-bold text-slate-900">{page} / {totalPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business List */}
        <BusinessList 
          businesses={businesses}
          isLoading={isLoading}
          onEdit={setEditingBusiness}
          onBusinessDeleted={handleBusinessDeleted}
          onViewDocuments={setDocumentBusiness}

          onViewAccounts={setViewingBusiness}
          searchResults={searchResults}
          onClearSearch={clearSearch}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isAdmin={user?.userType === "admin"}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Add/Edit Business Modal */}
        <Dialog open={isAddModalOpen || !!editingBusiness} onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingBusiness(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBusiness ? "Chỉnh Sửa Doanh Nghiệp" : "Thêm Doanh Nghiệp Mới"}
              </DialogTitle>
            </DialogHeader>
            <BusinessForm 
              business={editingBusiness}
              onSaved={handleBusinessSaved}
              onCancel={() => {
                setIsAddModalOpen(false);
                setEditingBusiness(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Search Modal */}
        <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tìm Kiếm Doanh Nghiệp</DialogTitle>
            </DialogHeader>
            <SearchForm 
              onResults={handleSearchResults}
              onCancel={() => setIsSearchModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Document Transaction List luôn hiển thị ở bottom */}
        <div className="mt-8">
          <EnhancedDocumentList 
            selectedBusinessId={documentBusiness?.id}
            selectedBusinessName={documentBusiness?.name}
            isVisible={true}
          />
        </div>

        {/* Business View Modal */}
        <BusinessViewModal
          business={viewingBusiness}
          isOpen={!!viewingBusiness}
          onClose={() => setViewingBusiness(null)}
        />

        {/* Document Transaction Modal (ẩn, không dùng nữa) */}
        {false && documentBusiness && (
          <DocumentTransactionForm
            business={documentBusiness}
          />
        )}



      </div>
    </div>
  );
}
