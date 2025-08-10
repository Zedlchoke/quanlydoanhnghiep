import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Business } from "@shared/schema";

interface BusinessViewModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessViewModal({ business, isOpen, onClose }: BusinessViewModalProps) {
  if (!business) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thông Tin Doanh Nghiệp: {business.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông Tin Cơ Bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tên Doanh Nghiệp</Label>
                  <Input value={business.name || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Mã Số Thuế</Label>
                  <Input value={business.taxId || ""} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div>
                <Label>Địa Chỉ</Label>
                <Textarea value={business.address || ""} readOnly className="bg-gray-50" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Điện Thoại</Label>
                  <Input value={business.phone || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={business.email || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={business.website || ""} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngành Nghề</Label>
                  <Input value={business.industry || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Người Đại Diện</Label>
                  <Input value={business.contactPerson || ""} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tài Khoản</Label>
                  <Input value={business.account || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Mật Khẩu</Label>
                  <Input value={business.password || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Ngân Hàng</Label>
                  <Input value={business.bankName || ""} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div>
                <Label>Số Tài Khoản Ngân Hàng</Label>
                <Input value={business.bankAccount || ""} readOnly className="bg-gray-50" />
              </div>

              <div>
                <Label>Ghi Chú</Label>
                <Textarea value={business.notes || ""} readOnly className="bg-gray-50" />
              </div>
            </CardContent>
          </Card>

          {/* Thông tin tài khoản */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông Tin Tài Khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tài khoản khai thuế, nộp thuế */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tài khoản khai thuế, nộp thuế</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.taxAccountId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Mật khẩu</Label>
                    <Input value={business.taxAccountPass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Tài khoản tra cứu HĐĐT */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tài khoản tra cứu HĐĐT</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.invoiceLookupId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Mật khẩu</Label>
                    <Input value={business.invoiceLookupPass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Web HĐĐT */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Web HĐĐT</h4>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <Label>Website</Label>
                    <Input value={business.webInvoiceWebsite || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.webInvoiceId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Mật khẩu</Label>
                    <Input value={business.webInvoicePass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Tài khoản bảo hiểm XH-YT */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tài khoản bảo hiểm XH-YT</h4>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <Label>Mã bảo hiểm</Label>
                    <Input value={business.socialInsuranceCode || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.socialInsuranceId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Pass chính</Label>
                    <Input value={business.socialInsuranceMainPass || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Pass phụ</Label>
                    <Input value={business.socialInsuranceSecondaryPass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Tài khoản TOKEN */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tài khoản TOKEN</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.tokenId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Mật khẩu</Label>
                    <Input value={business.tokenPass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Đơn vị cung cấp</Label>
                    <Input value={business.tokenProvider || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Nơi quản lý</Label>
                    <Input value={business.tokenManagementLocation || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ngày đăng ký</Label>
                    <Input value={business.tokenRegistrationDate || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Ngày hết hạn</Label>
                    <Input value={business.tokenExpirationDate || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Tài khoản thống kê */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tài khoản thống kê</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.statisticsId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Mật khẩu</Label>
                    <Input value={business.statisticsPass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Tài khoản phần mềm kiểm toán */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tài khoản phần mềm kiểm toán</h4>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <Label>Website</Label>
                    <Input value={business.auditSoftwareWebsite || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={business.auditSoftwareId || ""} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Mật khẩu</Label>
                    <Input value={business.auditSoftwarePass || ""} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}