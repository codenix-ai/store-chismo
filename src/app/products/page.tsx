"use client";

import { ProductCard } from "@/components/ProductCard/ProductCard";
import { useStore } from "@/components/StoreProvider";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import Layout from "@/components/Layout/Layout";

const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore($storeId: String!, $page: Int, $pageSize: Int) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        title
        description
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

const GET_CATEGORIES_BY_STORE = gql`
  query GetCategoriesByStore($storeId: ID!) {
    categoriesByStore(storeId: $storeId) {
      id
      name
      slug
      description
      isActive
      order
      parentId
      parent {
        id
        name
        slug
      }
      children {
        id
        name
        slug
      }
    }
  }
`;

const sortOptions = [
  { value: "featured", label: "Destacados" },
  { value: "price-low", label: "Precio: Menor a Mayor" },
  { value: "price-high", label: "Precio: Mayor a Menor" },
  { value: "rating", label: "Mejor Calificados" },
  { value: "newest", label: "Más Nuevos" },
];

export default function ProductsPage() {
  const { store } = useStore();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  // Selected filters
  // selectedCategory will store category id ('all' for all categories)
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Category dropdown search state
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [debouncedCategorySearch, setDebouncedCategorySearch] =
    useState<string>("");

  // Query: Productos
  const { loading, error, data } = useQuery(GET_PRODUCTS_BY_STORE, {
    variables: {
      storeId: store?.id || "default-store",
      page: currentPage,
      pageSize: productsPerPage,
    },
    skip: !store?.id,
  });

  // Query: Categorías
  const {
    loading: loadingCategories,
    error: errorCategories,
    data: dataCategories,
  } = useQuery(GET_CATEGORIES_BY_STORE, {
    variables: { storeId: store?.id || "default-store" },
    skip: !store?.id,
  });

  const products = useMemo(
    () => data?.productsByStore.items || [],
    [data?.productsByStore.items]
  );
  const totalProducts = data?.productsByStore.total || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage) || 1;

  // Debounce search term
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Debounce category search
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedCategorySearch(categorySearch.trim()),
      200
    );
    return () => clearTimeout(t);
  }, [categorySearch]);

  // Compute filtered products by category and search
  const filteredProducts = useMemo(() => {
    const byCategory = products.filter((product: any) => {
      if (!selectedCategory || selectedCategory === "all") return true;
      if (!product.categories || product.categories.length === 0) return false;
      return product.categories.some(
        (pc: any) =>
          pc?.category?.id === selectedCategory ||
          pc?.category?.name === selectedCategory
      );
    });

    if (!debouncedSearchTerm) return byCategory;

    const q = debouncedSearchTerm.toLowerCase();
    return byCategory.filter((p: any) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, debouncedSearchTerm]);

  // Build categories dynamically from products and categoriesByStore
  const productCategoriesSet = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    products.forEach((p: any) => {
      if (p.categories && Array.isArray(p.categories)) {
        p.categories.forEach((pc: any) => {
          const cat = pc?.category;
          if (cat && cat.id && cat.name) {
            m.set(cat.id, { id: cat.id, name: cat.name });
          }
        });
      }
    });
    return m;
  }, [products]);

  // Merge with categories fetched by categoriesByStore (if any)
  const mergedCategoriesMap = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    (dataCategories?.categoriesByStore || []).forEach((c: any) => {
      if (c && c.id && c.name) m.set(c.id, { id: c.id, name: c.name });
    });
    productCategoriesSet.forEach((v, k) => m.set(k, v));
    return m;
  }, [dataCategories?.categoriesByStore, productCategoriesSet]);

  const categories = useMemo(
    () => [
      { id: "all", name: "Todas las Categorías" },
      ...Array.from(mergedCategoriesMap.values()),
    ],
    [mergedCategoriesMap]
  );

  // Visible categories in dropdown filtered by debouncedCategorySearch
  const visibleCategories = useMemo(() => {
    if (!debouncedCategorySearch) return categories;
    const q = debouncedCategorySearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, debouncedCategorySearch]);

  // Pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrevious = () => currentPage > 1 && goToPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && goToPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
    return pages;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-montserrat mb-4">
            Todos los Productos
          </h1>
          <p className="text-gray-600">
            Encuentra todo lo que necesitas para hacer crecer tu emprendimiento
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors ${
                isSearchFocused
                  ? "focus:outline-none"
                  : "border border-gray-300"
              }`}
              style={
                isSearchFocused
                  ? {
                      boxShadow: `0 0 0 3px ${
                        (store?.primaryColor || "#2563eb") + "22"
                      }`,
                      borderColor: store?.primaryColor || "#2563eb",
                    }
                  : undefined
              }
            />
          </div>

          {/* Category Filter - Custom Dropdown */}
          <div className="relative w-full sm:w-64">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg transition-all focus:outline-none"
              style={{
                borderColor: isCategoryOpen
                  ? store?.primaryColor || "#2563eb"
                  : "#d1d5dc",
                boxShadow: isCategoryOpen
                  ? `0 0 0 3px ${(store?.primaryColor || "#2563eb") + "22"}`
                  : undefined,
              }}
            >
              <span className="text-gray-700 font-medium">
                {categories.find((c) => c.id === selectedCategory)?.name ||
                  "Todas las Categorías"}
              </span>
              <ChevronDown
                size={20}
                className={`transition-transform ${
                  isCategoryOpen ? "rotate-180" : ""
                }`}
                style={{ color: store?.primaryColor || "#2563eb" }}
              />
            </button>

            {/* Dropdown Menu */}
            {isCategoryOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 rounded-lg shadow-xl z-50"
                style={{ borderColor: store?.primaryColor || "#2563eb" }}
              >
                {/* Header con búsqueda */}
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Buscar categoría..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onFocus={() => {}}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none rounded-md text-sm"
                    style={debouncedCategorySearch ? {} : undefined}
                  />
                </div>

                {/* Lista de categorías */}
                <div className="max-h-64 overflow-y-auto">
                  {loadingCategories ? (
                    <div className="px-4 py-3 text-gray-500">
                      Cargando categorías...
                    </div>
                  ) : errorCategories ? (
                    <div className="px-4 py-3 text-red-500">
                      Error al cargar categorías
                    </div>
                  ) : (
                    // filter categories in dropdown by debouncedCategorySearch
                    visibleCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsCategoryOpen(false);
                          setCategorySearch("");
                          setDebouncedCategorySearch("");
                        }}
                        className="w-full text-left px-4 py-3 transition-colors flex items-center justify-between group hover:bg-gray-50"
                        style={
                          selectedCategory === cat.id
                            ? {
                                backgroundColor:
                                  (store?.primaryColor || "#2563eb") + "15",
                                borderLeft: `4px solid ${
                                  store?.primaryColor || "#2563eb"
                                }`,
                                color: store?.primaryColor || "#2563eb",
                              }
                            : {}
                        }
                      >
                        <span className="font-medium">{cat.name}</span>
                        {selectedCategory === cat.id && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: store?.primaryColor || "#2563eb",
                            }}
                          ></div>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setIsCategoryOpen(false);
                      setCategorySearch("");
                      setDebouncedCategorySearch("");
                    }}
                    className="text-sm font-medium hover:font-semibold transition-colors"
                    style={{ color: store?.primaryColor || "#2563eb" }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {/* Overlay para cerrar al hacer clic afuera */}
            {isCategoryOpen && (
              <div
                className="fixed inset-0"
                onClick={() => setIsCategoryOpen(false)}
              />
            )}
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {sortOptions.map((option) => (
                <option key={option.value}>{option.label}</option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          {loading ? (
            <div className="bg-gray-300 h-4 rounded w-48 animate-pulse"></div>
          ) : (
            <p className="text-gray-600">
              Mostrando {(currentPage - 1) * productsPerPage + 1}-
              {Math.min(currentPage * productsPerPage, filteredProducts.length)}{" "}
              de {filteredProducts.length} productos
              {totalPages > 1 && ` (Página ${currentPage} de ${totalPages})`}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {loading ? (
            Array.from({ length: productsPerPage }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-600 mb-4">Error al cargar los productos</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-white rounded hover:bg-blue-600"
                style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
              >
                Intentar de nuevo
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                No se encontraron productos
              </p>
              <p className="text-gray-500">Intenta ajustar tus filtros</p>
            </div>
          ) : (
            // Apply category filter
            filteredProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>

              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={i} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={i}
                    onClick={() => goToPage(page as number)}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === page
                        ? "text-white"
                        : "text-gray-700 hover:text-black hover:bg-gray-100"
                    }`}
                    style={
                      currentPage === page
                        ? { backgroundColor: store?.primaryColor || "#2563eb" }
                        : {}
                    }
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </div>
    </Layout>
  );
}
