import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Business, DocumentTransaction } from '@shared/schema';

interface SyncContextValue {
  businesses: Business[];
  transactions: DocumentTransaction[];
  lastUpdate: number;
  refetchAll: () => Promise<void>;
  updateBusiness: (business: Business) => void;
  addBusiness: (business: Business) => void;
  deleteBusiness: (businessId: number) => void;
  updateTransaction: (transaction: DocumentTransaction) => void;
  addTransaction: (transaction: DocumentTransaction) => void;
  deleteTransaction: (transactionId: number) => void;
  getBusinessTransactions: (businessId: number) => DocumentTransaction[];
  isLoading: boolean;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const queryClient = useQueryClient();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [transactions, setTransactions] = useState<DocumentTransaction[]>([]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all data function
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching all data...');
      
      // Fetch businesses and transactions simultaneously
      const [businessResponse, transactionResponse] = await Promise.all([
        fetch('/api/businesses/all'),
        fetch('/api/documents')
      ]);

      if (!businessResponse.ok) throw new Error('Failed to fetch businesses');
      if (!transactionResponse.ok) throw new Error('Failed to fetch transactions');

      const [businessData, transactionData] = await Promise.all([
        businessResponse.json() as Promise<Business[]>,
        transactionResponse.json() as Promise<DocumentTransaction[]>
      ]);

      console.log('📊 Data fetched:', {
        businesses: businessData.length,
        transactions: transactionData.length,
        businessIds: businessData.map(b => b.id),
        transactionBusinessIds: Array.from(new Set(transactionData.map(t => t.businessId)))
      });

      setBusinesses(businessData);
      setTransactions(transactionData);
      setLastUpdate(Date.now());
      
      // Update query client cache
      queryClient.setQueryData(['/api/businesses/all'], businessData);
      queryClient.setQueryData(['/api/documents'], transactionData);
      
      // Update individual business transaction caches
      businessData.forEach(business => {
        const businessTransactions = transactionData.filter(t => t.businessId === business.id);
        queryClient.setQueryData([`/api/businesses/${business.id}/documents`, business.id], businessTransactions);
      });

    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch all data
  const refetchAll = async () => {
    console.log('🔄 Manual refetch triggered');
    
    // Invalidate all queries first to force fresh fetches
    queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    
    // Then fetch fresh data
    await fetchAllData();
    
    // Force update all business-specific queries
    businesses.forEach(business => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/documents`] });
    });
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 5 seconds for better real-time sync
  useEffect(() => {
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  // CRUD operations with immediate UI updates and cache sync
  const updateBusiness = (updatedBusiness: Business) => {
    console.log('📝 Updating business:', updatedBusiness.id);
    setBusinesses(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
    queryClient.setQueryData(['/api/businesses/all'], (old: Business[] = []) => 
      old.map(b => b.id === updatedBusiness.id ? updatedBusiness : b)
    );
    setLastUpdate(Date.now());
  };

  const addBusiness = (newBusiness: Business) => {
    console.log('➕ Adding business:', newBusiness.id);
    setBusinesses(prev => {
      const exists = prev.find(b => b.id === newBusiness.id);
      if (exists) return prev.map(b => b.id === newBusiness.id ? newBusiness : b);
      return [...prev, newBusiness];
    });
    queryClient.setQueryData(['/api/businesses/all'], (old: Business[] = []) => {
      const exists = old.find(b => b.id === newBusiness.id);
      if (exists) return old.map(b => b.id === newBusiness.id ? newBusiness : b);
      return [...old, newBusiness];
    });
    setLastUpdate(Date.now());
  };

  const deleteBusiness = (businessId: number) => {
    console.log('🗑️ Deleting business:', businessId);
    setBusinesses(prev => prev.filter(b => b.id !== businessId));
    setTransactions(prev => prev.filter(t => t.businessId !== businessId));
    queryClient.setQueryData(['/api/businesses/all'], (old: Business[] = []) => 
      old.filter(b => b.id !== businessId)
    );
    queryClient.setQueryData(['/api/documents'], (old: DocumentTransaction[] = []) => 
      old.filter(t => t.businessId !== businessId)
    );
    queryClient.removeQueries({ queryKey: [`/api/businesses/${businessId}/documents`] });
    setLastUpdate(Date.now());
  };

  const updateTransaction = (updatedTransaction: DocumentTransaction) => {
    console.log('📝 Updating transaction:', updatedTransaction.id);
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    queryClient.setQueryData(['/api/documents'], (old: DocumentTransaction[] = []) => 
      old.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
    // Update business-specific cache
    queryClient.setQueryData([`/api/businesses/${updatedTransaction.businessId}/documents`, updatedTransaction.businessId], 
      (old: DocumentTransaction[] = []) => old.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
    setLastUpdate(Date.now());
  };

  const addTransaction = (newTransaction: DocumentTransaction) => {
    console.log('➕ Adding transaction:', { id: newTransaction.id, businessId: newTransaction.businessId });
    setTransactions(prev => {
      const exists = prev.find(t => t.id === newTransaction.id);
      if (exists) return prev.map(t => t.id === newTransaction.id ? newTransaction : t);
      return [...prev, newTransaction];
    });
    queryClient.setQueryData(['/api/documents'], (old: DocumentTransaction[] = []) => {
      const exists = old.find(t => t.id === newTransaction.id);
      if (exists) return old.map(t => t.id === newTransaction.id ? newTransaction : t);
      return [...old, newTransaction];
    });
    // Update business-specific cache
    queryClient.setQueryData([`/api/businesses/${newTransaction.businessId}/documents`, newTransaction.businessId], 
      (old: DocumentTransaction[] = []) => {
        const exists = old.find(t => t.id === newTransaction.id);
        if (exists) return old.map(t => t.id === newTransaction.id ? newTransaction : t);
        return [...old, newTransaction];
      }
    );
    setLastUpdate(Date.now());
  };

  const deleteTransaction = (transactionId: number) => {
    console.log('🗑️ Deleting transaction:', transactionId);
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    queryClient.setQueryData(['/api/documents'], (old: DocumentTransaction[] = []) => 
      old.filter(t => t.id !== transactionId)
    );
    if (transactionToDelete) {
      queryClient.setQueryData([`/api/businesses/${transactionToDelete.businessId}/documents`, transactionToDelete.businessId], 
        (old: DocumentTransaction[] = []) => old.filter(t => t.id !== transactionId)
      );
    }
    setLastUpdate(Date.now());
  };

  const getBusinessTransactions = (businessId: number): DocumentTransaction[] => {
    const businessTransactions = transactions.filter(t => t.businessId === businessId);
    console.log(`🔍 Getting transactions for business ${businessId}: ${businessTransactions.length} found from total ${transactions.length}`);
    console.log(`📋 Transaction IDs:`, businessTransactions.map(t => t.id));
    return businessTransactions;
  };

  const value: SyncContextValue = {
    businesses,
    transactions,
    lastUpdate,
    refetchAll,
    updateBusiness,
    addBusiness,
    deleteBusiness,
    updateTransaction,
    addTransaction,
    deleteTransaction,
    getBusinessTransactions,
    isLoading
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}