import { ProductVariant, ProductStock } from "@/types/product";

/**
 * Utility functions for working with the new flexible product variants system
 */

/**
 * Extract variants of a specific type (e.g., 'color', 'size', 'material')
 */
export function getVariantsByType(
  variants: ProductVariant[],
  type: string
): ProductVariant[] {
  return variants.filter(
    (variant) =>
      variant &&
      typeof variant.typeVariant === "string" &&
      variant.typeVariant.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Get all color variants with their hex values from jsonData
 */
export function getColorVariants(variants: ProductVariant[]) {
  const colorVariants = getVariantsByType(variants, "color");
  return colorVariants.map((variant) => ({
    id: variant.id,
    name: variant.nameVariant,
    hex: variant.jsonData?.hex || variant.jsonData?.color || "#000000",
    ...variant.jsonData,
  }));
}

/**
 * Get all size variants
 */
export function getSizeVariants(variants: ProductVariant[]) {
  const sizeVariants = getVariantsByType(variants, "size");
  return sizeVariants.map((variant) => ({
    id: variant.id,
    name: variant.nameVariant,
    value: variant.jsonData?.value || variant.nameVariant,
    ...variant.jsonData,
  }));
}

/**
 * Get material variants
 */
export function getMaterialVariants(variants: ProductVariant[]) {
  return getVariantsByType(variants, "material").map((variant) => ({
    id: variant.id,
    name: variant.nameVariant,
    ...variant.jsonData,
  }));
}

/**
 * Get available stock for a product
 */
export function getAvailableStock(stocks: ProductStock[]): number {
  if (stocks.length === 0) return 0;

  // Sum up all stock quantities from all stock entries
  return stocks.reduce((total, stock) => total + (stock.stock || 0), 0);
}

/**
 * Get the best price (simplified for current schema)
 */
export function getBestPrice(stocks: ProductStock[]): number {
  if (stocks.length === 0) return 0;

  // Since we only have 'price' field, return the first price
  // TODO: Update when promotion/sale price fields are available
  return stocks[0].price || 0;
}

/**
 * Check if a product has any variant of a specific type
 */
export function hasVariantType(
  variants: ProductVariant[],
  type: string
): boolean {
  return variants.some(
    (variant) => variant.typeVariant.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Create a variant object for GraphQL mutations
 */
export function createVariantInput(
  typeVariant: string,
  nameVariant: string,
  jsonData?: any
) {
  return {
    typeVariant,
    nameVariant,
    jsonData: jsonData || {},
  };
}

/**
 * Create a stock input for GraphQL mutations
 */
export function createStockInput(
  price: number,
  stock: number,
  options?: {
    variantId?: string;
  }
) {
  return {
    price,
    stock,
    ...options,
  };
}

/**
 * Backward compatibility: Convert variants to old colors format
 */
export function variantsToColors(variants: ProductVariant[]) {
  return getColorVariants(variants).map((color, index) => ({
    id: color.id || `color-${index}`,
    name: color.name,
    hex: color.hex,
  }));
}

/**
 * Backward compatibility: Convert variants to old sizes format
 */
export function variantsToSizes(variants: ProductVariant[]) {
  return getSizeVariants(variants).map((size, index) => ({
    id: size.id || `size-${index}`,
    name: size.name,
    value: size.value,
  }));
}
