"use client";

import { useState, useCallback } from "react";

export interface CustomerData {
  isReturning: boolean;
  name?: string;
  address?: string;
  lastOrderDate?: string;
  totalOrders?: number;
  completedOrders?: number;
  totalSpent?: number; // в центах
  message?: string;
}

export function useCustomerLookup() {
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  const lookupCustomer = useCallback(async (phone: string) => {
    if (!phone || phone.length < 9) {
      setCustomerData(null);
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/customers?phone=${encodeURIComponent(phone)}`
      );

      if (!response.ok) {
        throw new Error("Failed to lookup customer");
      }

      const data: CustomerData = await response.json();
      setCustomerData(data);
      return data;
    } catch (error) {
      console.error("Customer lookup failed:", error);
      setCustomerData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetCustomer = useCallback(() => {
    setCustomerData(null);
  }, []);

  return {
    lookupCustomer,
    resetCustomer,
    loading,
    customerData,
    isReturning: customerData?.isReturning || false,
  };
}
