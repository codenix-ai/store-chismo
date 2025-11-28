'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StoreConfig, storeConfigService } from '@/lib/store-config';

interface StoreContextType {
  store: StoreConfig | null;
  isLoading: boolean;
  updateStore: (updates: Partial<StoreConfig>) => Promise<void>;
  refreshStore: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  calculateTax: (amount: number) => number;
  calculateShipping: (subtotal: number) => number;
  getAvailablePaymentMethods: () => string[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
  initialStore?: StoreConfig;
}

export function StoreProvider({ children, initialStore }: StoreProviderProps) {
  const [store, setStore] = useState<StoreConfig | null>(initialStore || null);
  const [isLoading, setIsLoading] = useState(!initialStore);

  useEffect(() => {
    if (!initialStore) {
      initializeStore();
    }
  }, [initialStore]);

  useEffect(() => {
    if (store) {
      // Apply theme whenever store changes
      storeConfigService.applyStoreTheme(store);
    }
  }, [store]);

  const initializeStore = async () => {
    try {
      setIsLoading(true);
      const storeConfig = await storeConfigService.initializeStore();
      setStore(storeConfig);
    } catch (error) {
      console.error('Failed to initialize store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStore = async (updates: Partial<StoreConfig>) => {
    if (!store) return;

    try {
      const updatedStore = await storeConfigService.updateStore(store.storeId, updates);
      if (updatedStore) {
        setStore(updatedStore);
      }
    } catch (error) {
      console.error('Failed to update store:', error);
    }
  };

  const refreshStore = async () => {
    if (!store) return;

    try {
      setIsLoading(true);
      const refreshedStore = await storeConfigService.getStoreConfig(store.storeId);
      if (refreshedStore) {
        setStore(refreshedStore);
        storeConfigService.setCurrentStore(refreshedStore);
      }
    } catch (error) {
      console.error('Failed to refresh store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return storeConfigService.formatCurrency(amount, store || undefined);
  };

  const calculateTax = (amount: number): number => {
    return storeConfigService.calculateTax(amount, store || undefined);
  };

  const calculateShipping = (subtotal: number): number => {
    return storeConfigService.calculateShipping(subtotal, store || undefined);
  };

  const getAvailablePaymentMethods = (): string[] => {
    return storeConfigService.getAvailablePaymentMethods(store || undefined);
  };

  const value: StoreContextType = {
    store,
    isLoading,
    updateStore,
    refreshStore,
    formatCurrency,
    calculateTax,
    calculateShipping,
    getAvailablePaymentMethods,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Hook for getting store-specific styles
export function useStoreTheme() {
  const { store } = useStore();

  if (!store) {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937',
      accentColor: '#10B981',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
    };
  }

  return {
    primaryColor: store.primaryColor,
    secondaryColor: store.secondaryColor,
    accentColor: store.accentColor,
    backgroundColor: store.backgroundColor,
    textColor: store.textColor,
  };
}
