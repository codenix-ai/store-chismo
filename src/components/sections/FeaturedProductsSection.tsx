"use client";

import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { favoritesService } from "@/components/Favorites/Favorites";
import toast from "react-hot-toast";

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

export function FeaturedProductsSection() {
  const { store } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Fetch products from GraphQL
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useQuery(GET_PRODUCTS_BY_STORE, {
    variables: {
      storeId: store?.id || "default-store",
      page: 1,
      pageSize: 8,
    },
    skip: !store?.id,
  });

  const products = productsData?.productsByStore?.items || [];

  // Load favorite IDs from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem("emprendyup_favorites");
        if (stored) {
          const ids = JSON.parse(stored);
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

  const handleToggleFavorite = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const productData = {
        id: product.id,
        name: product.title || product.name,
        price: product.price,
        currency: product.currency || "COP",
        image: product.images?.[0]?.url || "",
        available: product.available,
        inStock: product.inStock,
      };

      const isCurrentlyFavorite = favoriteIds.includes(product.id);
      
      if (isCurrentlyFavorite) {
        const updatedIds = favoriteIds.filter((id) => id !== product.id);
        setFavoriteIds(updatedIds);
        localStorage.setItem("emprendyup_favorites", JSON.stringify(updatedIds));
        toast.success("Producto removido de favoritos");
      } else {
        const updatedIds = [...favoriteIds, product.id];
        setFavoriteIds(updatedIds);
        localStorage.setItem("emprendyup_favorites", JSON.stringify(updatedIds));
        toast.success("Producto añadido a favoritos");
      }
      
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Error al actualizar favoritos");
    }
  };

  const getColorWithOpacity = (color: string, opacity: number) => {
    if (!color) return `rgba(37, 99, 235, ${opacity})`;
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
  };

  // Carousel functionality
  const nextSlide = () => {
    if (products.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }
  };

  const prevSlide = () => {
    if (products.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Helper function to get product image
  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      // Create a copy and sort images by order and get the first one
      const sortedImages = [...product.images].sort(
        (a: any, b: any) => a.order - b.order
      );
      return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${sortedImages[0].url}`;
    }
    return "/placeholder.jpg";
  };

  // Helper function to get product badge
  const getProductBadge = (product: any) => {
    if (!product.inStock || (product.stock && product.stock === 0)) {
      return "Agotado";
    }
    // Check basic stock level
    if (product.stock && product.stock < 5) {
      return "Últimas unidades";
    }
    if (product.categories && product.categories.length > 0) {
      return product.categories[0].category.name;
    }
    if (!product.available) {
      return "No disponible";
    }
    return "Disponible";
  };

  // Helper function to get best price (simplified)
  const getBestPrice = (product: any) => {
    return product.price;
  };

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span
            className="inline-block px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4"
            style={{
              backgroundColor: getColorWithOpacity(
                store?.primaryColor || "#2563eb",
                0.1
              ),
              color: store?.primaryColor || "#2563eb",
            }}
          >
            Lo Más Solicitado
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-montserrat mb-3 sm:mb-4 px-4">
            Dotaciones Destacadas
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Descubre los equipos favoritos de nuestros clientes industriales.
            Calidad premium y protección garantizada.
          </p>
        </div>

        {/* Products Carousel */}
        <div
          className="relative mb-8 sm:mb-12"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {productsLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : productsError ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Error al cargar productos</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay productos disponibles</p>
            </div>
          ) : (
            <>
              {/* Carousel Container */}
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${
                      currentSlide * (100 / Math.min(products.length, 3))
                    }%)`,
                  }}
                >
                  {products.map((product: any) => (
                    <div
                      key={product.id}
                      className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-3"
                    >
                      <Link href={`/products/${product.id}`}>
                        <div className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full cursor-pointer">
                        {/* Badge */}
                        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
                          <span
                            className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: store?.accentColor || "#60a5fa",
                            }}
                          >
                            {getProductBadge(product)}
                          </span>
                        </div>

                        {/* Product Image */}
                        <div className="aspect-square overflow-hidden relative">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name || product.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-3 sm:p-6">
                          <div className="flex items-center mb-1 sm:mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                    i < 4
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                              (4.5)
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-2">
                            {product.name || product.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                            {product.categories && product.categories.length > 0
                              ? product.categories[0].category.name
                              : "Dotación industrial de calidad premium"}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                              <span className="text-sm sm:text-lg font-bold text-gray-900">
                                {product.currency || "$"}
                                {getBestPrice(product)?.toLocaleString()}
                              </span>
                              {/* Show stock info */}
                              {product.stock && product.stock < 10 && (
                                <span className="text-xs text-orange-500">
                                  Solo {product.stock} disponibles
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleToggleFavorite(product, e)}
                              className="p-1.5 sm:p-2 rounded-full transition-colors hover:scale-110 transform"
                              style={{
                                backgroundColor: favoriteIds.includes(product.id)
                                  ? store?.primaryColor || "#2563eb"
                                  : getColorWithOpacity(
                                      store?.primaryColor || "#2563eb",
                                      0.1
                                    ),
                                color: favoriteIds.includes(product.id)
                                  ? "white"
                                  : store?.primaryColor || "#2563eb",
                              }}
                            >
                              <Heart
                                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  favoriteIds.includes(product.id) ? "fill-current" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 flex items-center justify-center z-10 group"
                style={{ color: store?.primaryColor || "#2563eb" }}
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 flex items-center justify-center z-10 group"
                style={{ color: store?.primaryColor || "#2563eb" }}
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
                {products.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                      currentSlide === index ? "scale-125" : "hover:scale-110"
                    }`}
                    style={{
                      backgroundColor:
                        currentSlide === index
                          ? store?.primaryColor || "#2563eb"
                          : "#e5e7eb",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/products"
            className="group inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-sm sm:text-base"
            style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                store?.secondaryColor || "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                store?.primaryColor || "#2563eb";
            }}
          >
            Ver Toda la Colección
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
