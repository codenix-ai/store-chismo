"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Eye, Trash2, Bookmark } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard/ProductCard";
import { useStore } from "../StoreProvider";
import { gql, useQuery } from "@apollo/client";
import { cartService } from "@/lib/cart";
import toast from "react-hot-toast";

// GraphQL query to fetch products by IDs
const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore($storeId: String!, $page: Int, $pageSize: Int) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        title
        price
        currency
        available
        inStock
        stock
        images {
          id
          url
          order
        }
        colors {
          id
          color
          colorHex
        }

        categories {
          category {
            id
            name
            slug
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

interface FavoritesProps {
  className?: string;
}

export function Favorites({ className = "" }: FavoritesProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const { store } = useStore();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 50; // Aumentamos para obtener más productos y filtrar favoritos

  // GraphQL query for products by store
  const { loading, error, data } = useQuery(GET_PRODUCTS_BY_STORE, {
    variables: {
      storeId: store?.id || "default-store",
      page: currentPage,
      pageSize: productsPerPage,
    },
    skip: !store?.id,
  });

  const allProducts = data?.productsByStore.items || [];

  // Filter products that are in favorites
  const favoriteProducts = allProducts.filter((product: any) =>
    favoriteIds.includes(product.id)
  );

  // Load favorite IDs from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem("emprendyup_favorites");
        if (stored) {
          const ids = JSON.parse(stored);
          console.log("Loaded favorite IDs:", ids);
          setFavoriteIds(Array.isArray(ids) ? ids : []);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
        setFavoriteIds([]);
      }
    };

    loadFavorites();

    // Listen for storage changes to update favorites in real-time
    const handleStorageChange = () => {
      loadFavorites();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleRemoveFromFavorites = (productId: string) => {
    try {
      const updatedIds = favoriteIds.filter((id) => id !== productId);
      setFavoriteIds(updatedIds);
      localStorage.setItem("emprendyup_favorites", JSON.stringify(updatedIds));
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const clearAllFavorites = () => {
    setFavoriteIds([]);
    localStorage.removeItem("emprendyup_favorites");
    window.dispatchEvent(new Event("storage"));
  };

  const handleAddToCart = (product: any) => {
    try {
      const cartItem = {
        id: product.id,
        productId: product.id,
        name: product.title || product.name,
        price: Number(product.price),
        quantity: 1,
        productColorId: "",
        productSizeId: "",
        image: product.images?.[0]?.url || product.image,
        currency: product.currency || "COP",
        maxStock: product.stock || 999,
        variant: undefined,
      };

      cartService.addItem(cartItem);
      toast.success(`${product.title || product.name} añadido al carrito`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error al añadir al carrito");
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-80 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (favoriteIds.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-black mb-2">
          No tienes favoritos aún
        </h3>
        <p className="text-gray-500 mb-6">
          Agrega productos a tus favoritos para encontrarlos fácilmente más
          tarde
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors"
          style={{
            backgroundColor: store?.primaryColor || "#1F2937",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              store?.hoverBackgroundColor || "#d3d3d3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              store?.hoverBackgroundColor || "#1F2937";
          }}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Explorar Productos
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Mis Favoritos</h2>
          <p className="text-gray-600 mt-1">
            {favoriteProducts.length}{" "}
            {favoriteProducts.length === 1 ? "producto" : "productos"} en tu
            lista de favoritos
          </p>
        </div>

        {favoriteProducts.length > 0 && (
          <button
            onClick={clearAllFavorites}
            className="text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteProducts.map((product: any) => {
          const imageSrc = `https://emprendyup-images.s3.us-east-1.amazonaws.com/${
            product.images?.[0]?.url || product.image
          }`;

          return (
            <div
              className="group relative duration-500 w-full mx-auto"
              key={product.id}
            >
              <div className="flex flex-col items-center">
                <div
                  className="relative overflow-hidden w-full shadow hover:shadow-lg rounded-md duration-500"
                  style={{ height: "320px" }}
                >
                  <Image
                    src={imageSrc}
                    alt={product.title || product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <ul className="list-none absolute top-[10px] end-4 opacity-0 group-hover:opacity-100 duration-500 space-y-1">
                    <li>
                      <button
                        className="size-10 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                        onClick={() => handleRemoveFromFavorites(product.id)}
                        title="Eliminar de favoritos"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                    <li className="mt-1 ms-0">
                      <Link
                        href={`/products/${product.id}`}
                        className="size-10 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center rounded-full bg-white text-slate-900 hover:bg-slate-900 hover:text-white shadow"
                      >
                        <Eye className="size-4" />
                      </Link>
                    </li>
                    <li className="mt-1 ms-0">
                      <Link
                        href="#"
                        className="size-10 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center rounded-full bg-white text-slate-900 hover:bg-slate-900 hover:text-white shadow"
                      >
                        <Bookmark className="size-4" />
                      </Link>
                    </li>
                  </ul>

                  {/* Badge de favorito */}
                  <div className="absolute top-[10px] start-4">
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Heart className="size-3 fill-current" />
                      Favorito
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4 text-center">
                  <Link
                    href={`/products/${product.id}`}
                    className="text-lg font-medium block hover:transition-colors"
                    style={{ color: "#1f2937" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color =
                        store?.primaryColor || "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#1f2937";
                    }}
                  >
                    {product.title || product.name}
                  </Link>
                  <p className="text-slate-400 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="mt-2 font-semibold">
                    ${Number(product.price).toLocaleString("es-CO")}{" "}
                    {product.currency || "COP"}
                  </p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="py-2 px-4 inline-block font-semibold tracking-wide align-middle duration-500 text-sm text-center text-white rounded-md shadow hover:opacity-90"
                      style={{
                        backgroundColor: store?.primaryColor || "#1f2937",
                      }}
                    >
                      Añadir al carrito
                    </button>
                    <button
                      onClick={() => handleRemoveFromFavorites(product.id)}
                      className="py-2 px-4 inline-block font-semibold tracking-wide align-middle duration-500 text-sm text-center bg-red-100 text-red-600 rounded-md shadow hover:bg-red-500 hover:text-white"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Acciones Rápidas
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="flex text-center border border-gray-300 py-3 px-4 rounded-md font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>

      {/* Share Favorites */}
      <div className=" rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-2">
          Comparte tu Lista
        </h3>
        <p className="text-gray-600 mb-4">
          Comparte tu lista de favoritos con amigos y familiares
        </p>
        <button
          className=" text-white py-2 px-4 rounded-md font-medium transition-colors"
          style={{ backgroundColor: store?.primaryColor || "#1f2937" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              store?.hoverBackgroundColor || "#d3d3d3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              store?.primaryColor || "#1f2937";
          }}
        >
          Generar Enlace para Compartir
        </button>
      </div>
    </div>
  );
}

// Service functions for managing favorites
export class FavoritesService {
  private storageKey = "emprendyup_favorites";

  getFavorites(): Product[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addFavorite(product: Product): Product[] {
    const favorites = this.getFavorites();
    const exists = favorites.find((item) => item.id === product.id);

    if (!exists) {
      favorites.push(product);
      this.saveFavorites(favorites);
    }

    return favorites;
  }

  removeFavorite(productId: string): Product[] {
    const favorites = this.getFavorites();
    const updated = favorites.filter((item) => item.id !== productId);
    this.saveFavorites(updated);
    return updated;
  }

  isFavorite(productId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some((item) => item.id === productId);
  }

  toggleFavorite(product: Product): boolean {
    if (this.isFavorite(product.id)) {
      this.removeFavorite(product.id);
      return false;
    } else {
      this.addFavorite(product);
      return true;
    }
  }

  clearAllFavorites(): void {
    this.saveFavorites([]);
  }

  private saveFavorites(favorites: Product[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
    }
  }
}

export const favoritesService = new FavoritesService();
