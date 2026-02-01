export type OrderItem = {
  id: string;
  name: string;
  price: number;
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
  total: number;
  city: string;
  payment: "cash";
  source: "web";
  createdAt?: string;
};
