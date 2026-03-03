/**
 * Глобальный store для информации о доставке.
 * Заполняется в checkout-form, читается в OrderSummary.
 */
import { create } from "zustand";
import type { DeliveryCalculation } from "@/lib/delivery-calculator";

interface DeliveryStore {
  deliveryInfo: DeliveryCalculation | null;
  setDeliveryInfo: (info: DeliveryCalculation | null) => void;
}

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  deliveryInfo: null,
  setDeliveryInfo: (info) => set({ deliveryInfo: info }),
}));
