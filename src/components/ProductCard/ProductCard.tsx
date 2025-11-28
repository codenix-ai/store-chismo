"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { cartService } from "@/lib/cart";
import { useStore } from "@/components/StoreProvider";
import toast from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Simple favorites service
const favoritesService = {
  getFavorites(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const favorites = localStorage.getItem("emprendyup_favorites");
      return favorites ? JSON.parse(favorites) : [];
    } catch {
      return [];
    }
  },

  isFavorite(productId: string): boolean {
    return this.getFavorites().includes(productId);
  },

  toggleFavorite(productId: string): boolean {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(productId);

    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem("emprendyup_favorites", JSON.stringify(favorites));
      window.dispatchEvent(new Event("storage"));
      return false;
    } else {
      favorites.push(productId);
      localStorage.setItem("emprendyup_favorites", JSON.stringify(favorites));
      window.dispatchEvent(new Event("storage"));
      return true;
    }
  },
};

export interface ProductImage {
  id: string;
  url: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: ProductImage[];
  rating?: number;
  reviews?: number;
  category: string;
  description: string;
  inStock: boolean;
  variants?: ProductVariant[];
  sizes?: Array<{ size: string; id?: string }>;
  colors?: Array<{ colorHex: string; color?: string; id?: string }>;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { store } = useStore();

  // Check if product is favorite on component mount
  useEffect(() => {
    setIsFavorite(favoritesService.isFavorite(product.id));
  }, [product.id]);

  // Check if product has sizes or colors that need to be selected
  const needsVariantSelection = (product: any) => {
    // You might need to add these fields to the Product interface
    return (
      (product.sizes && product.sizes.length > 0) ||
      (product.colors && product.colors.length > 0)
    );
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    // If product needs variant selection, redirect to product detail page
    if (needsVariantSelection(product)) {
      toast("Selecciona talla y color en la página del producto", {
        icon: "ℹ️",
      });
      // The Link component will handle the navigation
      return;
    }

    setIsLoading(true);

    try {
      cartService.addItem({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        productColorId: "",
        productSizeId: "",
        quantity: 1,
        image: product.images?.[0]?.url ?? "/assets/default-product.jpg",
      });

      // Trigger storage event to update cart count
      window.dispatchEvent(new Event("storage"));

      // Show toast notification
      toast.success(`${product.name} ha sido agregado al carrito.`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Hubo un problema al agregar el producto al carrito.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const newFavoriteState = favoritesService.toggleFavorite(product.id);
      setIsFavorite(newFavoriteState);

      // Show toast notification
      if (newFavoriteState) {
        toast.success(`${product.name} agregado a favoritos`, {
          icon: "❤️",
        });
      } else {
        toast.success(`${product.name} eliminado de favoritos`, {
          icon: "💔",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Hubo un problema al gestionar favoritos.");
    }
  };

  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  // Get all product images
  const allImages =
    product.images && product.images.length > 0
      ? product.images.map(
          (img) => `${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}/${img.url}`
        )
      : [`${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}/${product.image}`];

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {/* Image Gallery */}
          {allImages.length > 1 ? (
            <Swiper
              modules={[Pagination, Navigation]}
              spaceBetween={0}
              slidesPerView={1}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation={{
                prevEl: `.product-card-nav-prev-${product.id}`,
                nextEl: `.product-card-nav-next-${product.id}`,
              }}
              className="h-full w-full"
              onSlideChange={(swiper) => {
                // Optional: track which image is being viewed
              }}
            >
              {allImages.map((imageSrc, index) => (
                <SwiperSlide key={index}>
                  <div className="relative h-full w-full">
                    <Image
                      src={imageSrc}
                      alt={`${product.name} - Imagen ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <Image
              src={allImages[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}

          {/* Navigation arrows for multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                className={`product-card-nav-prev-${product.id} absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100`}
                aria-label="Imagen anterior"
                onClick={(e) => e.preventDefault()}
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                className={`product-card-nav-next-${product.id} absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100`}
                aria-label="Imagen siguiente"
                onClick={(e) => e.preventDefault()}
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
              -{discountPercentage}%
            </div>
          )}

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium text-lg">Agotado</span>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        <div className="p-4">
          {/* Category */}
          <p className="text-sm text-gray-700 mb-1">{product.category}</p>

          {/* Product Name */}
          <h3
            className="font-medium text-black mb-2 line-clamp-2 group-hover:transition-colors"
            style={
              {
                "--hover-color": store?.primaryColor || "#2563eb",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.color = store?.primaryColor || "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#111827";
            }}
          >
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating!)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              {product.reviews && (
                <span className="text-sm text-gray-700 ml-1">
                  ({product.reviews})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-black">
                ${Number(product?.price ?? 0).toLocaleString("es-CO")}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-600 line-through">
                  ${product.originalPrice.toLocaleString("es-CO")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="px-4 pb-4">
        {needsVariantSelection(product) ? (
          <Link href={`/products/${product.id}`}>
            <button
              className="w-full text-white py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
              style={{
                backgroundColor: store?.primaryColor || "#2563eb",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = store?.primaryColor
                  ? `${store.primaryColor}CC`
                  : "#1e40af";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  store?.primaryColor || "#2563eb";
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ver opciones
            </button>
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || isLoading}
            className="w-full text-white py-2 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
            style={{
              backgroundColor:
                product.inStock && !isLoading
                  ? store?.primaryColor || "#2563eb"
                  : undefined,
            }}
            onMouseEnter={(e) => {
              if (product.inStock && !isLoading) {
                e.currentTarget.style.backgroundColor = store?.primaryColor
                  ? `${store.primaryColor}CC`
                  : "#1e40af";
              }
            }}
            onMouseLeave={(e) => {
              if (product.inStock && !isLoading) {
                e.currentTarget.style.backgroundColor =
                  store?.primaryColor || "#2563eb";
              }
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                {product.inStock ? "Agregar al Carrito" : "Agotado"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
