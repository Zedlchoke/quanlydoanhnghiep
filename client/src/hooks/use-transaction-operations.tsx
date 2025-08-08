import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSyncContext } from "@/contexts/sync-context";
import { apiRequest } from "@/lib/queryClient";
import type { InsertDocumentTransaction, DocumentTransaction } from "@shared/schema";

export function useTransactionOperations() {
  const { toast } = useToast();
  const { addTransaction, addBusiness, refetchAll } = useSyncContext();

  const createTransaction = useMutation({
    mutationFn: async (data: { businessId: number; transactionData: Omit<InsertDocumentTransaction, 'businessId'> }) => {
      const { businessId, transactionData } = data;
      console.log(`🚀 Creating transaction for business ${businessId}:`, transactionData);
      
      const response = await fetch(`/api/businesses/${businessId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ ...transactionData, businessId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create transaction: ${error}`);
      }

      const createdTransaction = await response.json() as DocumentTransaction;
      console.log(`✅ Transaction created with ID: ${createdTransaction.id}`);
      return createdTransaction;
    },
    onSuccess: (transaction) => {
      console.log(`📝 Adding transaction to sync context:`, { id: transaction.id, businessId: transaction.businessId });
      addTransaction(transaction);
      toast({
        title: "Thành công",
        description: `Đã tạo giao dịch hồ sơ thành công`,
      });
      // Force refresh after a short delay to ensure consistency
      setTimeout(() => {
        refetchAll();
      }, 500);
    },
    onError: (error) => {
      console.error("❌ Error creating transaction:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể tạo giao dịch: ${error.message}`,
      });
    },
  });

  const createBusiness = useMutation({
    mutationFn: async (businessData: any) => {
      console.log(`🏢 Creating business:`, businessData);
      
      const response = await fetch('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(businessData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create business: ${error}`);
      }

      const createdBusiness = await response.json();
      console.log(`✅ Business created with ID: ${createdBusiness.id}`);
      return createdBusiness;
    },
    onSuccess: (business) => {
      console.log(`📝 Adding business to sync context:`, { id: business.id, name: business.name });
      addBusiness(business);
      toast({
        title: "Thành công",
        description: `Đã tạo doanh nghiệp ${business.name} thành công`,
      });
      // Force refresh after a short delay to ensure consistency
      setTimeout(() => {
        refetchAll();
      }, 500);
    },
    onError: (error) => {
      console.error("❌ Error creating business:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể tạo doanh nghiệp: ${error.message}`,
      });
    },
  });

  return {
    createTransaction,
    createBusiness,
    isCreatingTransaction: createTransaction.isPending,
    isCreatingBusiness: createBusiness.isPending,
  };
}