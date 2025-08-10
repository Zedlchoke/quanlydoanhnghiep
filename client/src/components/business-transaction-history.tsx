import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, X, Filter, FileText } from "lucide-react";
import { useSyncContext } from "@/contexts/sync-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { DocumentTransaction, Business } from "@shared/schema";

interface BusinessTransactionHistoryProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DateFilter {
  year?: string;
  month?: string;
  day?: string;
  fromDate?: string;
  toDate?: string;
  filterType: 'specific' | 'range';
}

export function BusinessTransactionHistory({ business, isOpen, onClose }: BusinessTransactionHistoryProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    filterType: 'range'
  });

  // Reset filter when business changes
  useEffect(() => {
    if (business) {
      setDateFilter({ filterType: 'range' });
    }
  }, [business?.id]);

  const queryClient = useQueryClient();
  const { refetchAll } = useSyncContext();

  // Trực tiếp fetch transactions từ API cho business cụ thể
  const { data: transactions = [], isLoading, refetch } = useQuery<DocumentTransaction[]>({
    queryKey: [`business-documents`, business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const response = await fetch(`/api/businesses/${business.id}/documents`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!business?.id && isOpen,
    staleTime: 0, // Luôn fetch data mới
    gcTime: 0,    // Không cache
  });

  // Lọc transactions theo ngày tháng
  const filteredTransactions = transactions.filter((transaction: DocumentTransaction) => {
    const transactionDate = new Date(transaction.deliveryDate);
    
    if (dateFilter.filterType === 'specific') {
      if (dateFilter.year) {
        const year = transactionDate.getFullYear().toString();
        if (year !== dateFilter.year) return false;
      }
      if (dateFilter.month) {
        const month = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
        if (month !== dateFilter.month) return false;
      }
      if (dateFilter.day) {
        const day = transactionDate.getDate().toString().padStart(2, '0');
        if (day !== dateFilter.day) return false;
      }
    } else if (dateFilter.filterType === 'range') {
      if (dateFilter.fromDate) {
        const fromDate = new Date(dateFilter.fromDate);
        if (transactionDate < fromDate) return false;
      }
      if (dateFilter.toDate) {
        const toDate = new Date(dateFilter.toDate);
        if (transactionDate > toDate) return false;
      }
    }
    
    return true;
  });

  const clearFilter = () => {
    setDateFilter({
      filterType: 'range'
    });
  };

  // Generate years for dropdown (from 2020 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (2020 + i).toString());

  // Generate months for dropdown
  const months = [
    { value: '01', label: 'Tháng 1' },
    { value: '02', label: 'Tháng 2' },
    { value: '03', label: 'Tháng 3' },
    { value: '04', label: 'Tháng 4' },
    { value: '05', label: 'Tháng 5' },
    { value: '06', label: 'Tháng 6' },
    { value: '07', label: 'Tháng 7' },
    { value: '08', label: 'Tháng 8' },
    { value: '09', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
  ];

  // Generate days for dropdown
  const days = Array.from({ length: 31 }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0');
    return { value: day, label: `Ngày ${day}` };
  });

  // Force refresh khi dialog mở để đảm bảo dữ liệu mới nhất
  useEffect(() => {
    if (isOpen && business?.id) {
      console.log(`🔍 Opening transaction history for business ${business.id}: ${business.name}`);
      // Invalidate cả global cache và business-specific cache
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['business-documents', business.id] });
      refetch(); // Refetch ngay lập tức
      refetchAll(); // Sync toàn bộ
    }
  }, [isOpen, business?.id, refetch, refetchAll, queryClient]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Lịch sử giao dịch hồ sơ - {business?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Bộ lọc thời gian */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Bộ lọc thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chọn loại bộ lọc */}
              <div className="space-y-2">
                <Label>Loại bộ lọc</Label>
                <Select
                  value={dateFilter.filterType}
                  onValueChange={(value: 'specific' | 'range') => 
                    setDateFilter({ ...dateFilter, filterType: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="range">Khoảng thời gian</SelectItem>
                    <SelectItem value="specific">Thời gian cụ thể</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bộ lọc theo khoảng thời gian */}
              {dateFilter.filterType === 'range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">Từ ngày</Label>
                    <Input
                      id="fromDate"
                      type="datetime-local"
                      value={dateFilter.fromDate || ''}
                      onChange={(e) => setDateFilter({ ...dateFilter, fromDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">Đến ngày</Label>
                    <Input
                      id="toDate"
                      type="datetime-local"
                      value={dateFilter.toDate || ''}
                      onChange={(e) => setDateFilter({ ...dateFilter, toDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Bộ lọc theo thời gian cụ thể */}
              {dateFilter.filterType === 'specific' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Năm</Label>
                    <Select
                      value={dateFilter.year || ''}
                      onValueChange={(value) => setDateFilter({ ...dateFilter, year: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn năm" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tháng</Label>
                    <Select
                      value={dateFilter.month || ''}
                      onValueChange={(value) => setDateFilter({ ...dateFilter, month: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tháng" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày</Label>
                    <Select
                      value={dateFilter.day || ''}
                      onValueChange={(value) => setDateFilter({ ...dateFilter, day: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngày" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(day => (
                          <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilter}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Xóa lọc
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danh sách giao dịch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Danh sách giao dịch ({filteredTransactions.length})
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
                      <TableHead>Người giao</TableHead>
                      <TableHead>Người nhận</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: DocumentTransaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.documentNumber || "Chưa có"}
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
                        <TableCell>{transaction.deliveryPerson}</TableCell>
                        <TableCell>{transaction.receivingPerson}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không có giao dịch nào trong khoảng thời gian đã chọn
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}