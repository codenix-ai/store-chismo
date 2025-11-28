export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductSize {
  id: string;
  name: string;
  value: string;
}

// NEW: Product Variant types
export interface ProductVariant {
  id: string;
  productId: string;
  typeVariant: string; // "color", "size", "material", etc.
  nameVariant: string; // "Red", "Large", "Cotton", etc.
  jsonData?: any; // Flexible metadata: { color: "red", hex: "#FF0000", size: "L" }
  createdAt?: string;
  updatedAt?: string;
}

// NEW: Product Stock types (updated to match actual backend schema)
export interface ProductStock {
  id: string;
  price: number;
  stock: number; // Required field for stock quantity
  // TODO: Add other fields based on actual backend schema
  // productId?: string;
  // variantId?: string;
  // reservedQuantity?: number;
  // salePrice?: number;
  // promotionPrice?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductComment {
  id: string;
  content: string;
  rating: number;
  author: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  available: boolean;
  inStock: boolean;
  stock: number;
  images: ProductImage[];
  colors: ProductColor[];
  sizes: ProductSize[]; // BACKWARD COMPATIBILITY: Still supported
  variants: ProductVariant[]; // NEW: Flexible variants system
  stocks: ProductStock[]; // NEW: Inventory management
  categories: ProductCategory[];
  comments: ProductComment[];
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  available: boolean;
  inStock: boolean;
  stock: number;
  images: Omit<ProductImage, "id">[];
  // Keep old fields for backward compatibility with form components
  colors: Omit<ProductColor, "id">[];
  sizes: Omit<ProductSize, "id">[];
  // New variant system fields
  variants: Omit<
    ProductVariant,
    "id" | "productId" | "createdAt" | "updatedAt"
  >[];
  stocks: Omit<ProductStock, "id" | "productId">[];
  categoryIds: string[];
  storeId: string;
}
