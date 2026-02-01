import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/lib/translations";

export type CartItem = {
  id: string;
  name: Record<Language, string>;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      increase: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })),

      decrease: (id) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      count: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
