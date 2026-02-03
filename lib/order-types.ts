export type OrderItem = {
  id: string;
  name: string;
  price: number; // Price in cents
  quantity: number;
  image?: string; // URL фото блюда (опционально)
};

export type Order = {
  id?: number;
  customer: {
    name: string;
    phone: string;
    address: string;
    comment?: string;
  };
  items: OrderItem[];
  total: number; // Total in cents
  deliveryFee?: number; // Delivery fee in cents
  city: string;
  payment: "cash";
  source: "web";
  createdAt?: string;
};
