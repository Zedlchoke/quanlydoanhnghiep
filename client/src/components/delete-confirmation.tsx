import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Business } from "@shared/schema";

interface DeleteConfirmationProps {
  business: Business;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmation({ business, onConfirm, onCancel }: DeleteConfirmationProps) {
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/businesses/${business.id}`, { password });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Doanh nghiệp đã được xóa thành công",
      });
      onConfirm();
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa doanh nghiệp",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu",
        variant: "destructive",
      });
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác Nhận Xóa Doanh Nghiệp</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc chắn muốn xóa doanh nghiệp <strong>{business.name}</strong> 
            (MST: <strong>{business.taxId}</strong>) không?
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nhập mật khẩu để xác nhận (4 số: 0102):</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu 4 số"
                autoFocus
                maxLength={4}
              />
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit}
            disabled={deleteMutation.isPending || !password.trim()}
          >
            {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}