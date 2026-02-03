// API Data Transfer Objects (DTO)
// Контракт между API и UI

export interface MenuItemDTO {
  id: string;
  title: string;
  description: string | null;
  price: number; // Price in cents (32.00 zł = 3200)
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  title: string;
  order: number;
  isActive: boolean;
  items: MenuItemDTO[];
}

// Re-export price utilities
export { formatPrice, toCents, toZl } from "./price";
