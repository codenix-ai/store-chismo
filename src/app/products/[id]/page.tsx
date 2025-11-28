"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { ProductGallery } from "@/components/ProductGallery/ProductGallery";
import { cartService } from "@/lib/cart";
import { useStore } from "@/components/StoreProvider";
import { gql, useQuery, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import Layout from "@/components/Layout/Layout";

// Favorites service
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
const GET_PRODUCT_QUERY = gql`
  query GetProduct($id: String!) {
    product(id: $id) {
      id
      title
      description
      price
      currency
      imageUrl
      available
      externalId
      createdAt
      updatedAt
      stock
      inStock
      colors {
        id
        colorHex
        color
      }
      sizes {
        id
        size
      }
      images {
        url
      }
      comments {
        id
        rating
        comment
        createdAt
      }
    }
  }
`;

const GET_PRODUCT_COMMENTS = gql`
  query GetProductComments($productId: String!) {
    productComments(productId: $productId) {
      id
      rating
      comment
      createdAt
    }
  }
`;

const ADD_PRODUCT_COMMENT = gql`
  mutation AddProductComment($input: CreateProductCommentDto!) {
    addProductComment(input: $input) {
      id
      rating
      comment
      createdAt
    }
  }
`;

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading, error } = useQuery(GET_PRODUCT_QUERY, {
    variables: { id },
    skip: !id, // Skip the query if id is not available
  });

  // Comments query
  const {
    data: commentsData,
    loading: commentsLoading,
    refetch: refetchComments,
  } = useQuery(GET_PRODUCT_COMMENTS, {
    variables: { productId: id },
    skip: !id,
  });

  // Create comment mutation
  const [addComment, { loading: creatingComment }] = useMutation(
    ADD_PRODUCT_COMMENT,
    {
      onCompleted: () => {
        toast.success("Comentario enviado correctamente");
        setCommentForm({
          rating: 0,
          comment: "",
        });
        refetchComments();
      },
      onError: (error) => {
        toast.error("Error al enviar el comentario: " + error.message);
      },
    }
  );

  const [selectedVariant, setSelectedVariant] = useState(
    data?.product?.variants?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  // Comment form state
  const [commentForm, setCommentForm] = useState({
    rating: 0,
    comment: "",
  });

  const { store } = useStore();

  if (!id) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">
              ID de producto no válido
            </h1>
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-700"
            >
              Volver a productos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.product) return <p>Producto no encontrado</p>;

  const product = data.product;
  // Calculate rating from comments if not provided
  const averageRating =
    product.rating ||
    (product.comments?.length > 0
      ? product.comments.reduce(
          (sum: number, comment: any) => sum + comment.rating,
          0
        ) / product.comments.length
      : 0);
  const reviewCount = product.reviews || product.comments?.length || 0;

  // Check if product is in favorites when component mounts

  const currentPrice = selectedVariant?.price || product.price;
  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - currentPrice) / product.originalPrice) * 100
      )
    : 0;

  const handleAddToCart = async () => {
    // Validar que se haya seleccionado talla si el producto tiene tallas
    if (product.sizes && product.sizes.length > 0 && !selectedSizeId) {
      toast.error("Por favor selecciona una talla");
      return;
    }

    // Validar que se haya seleccionado color si el producto tiene colores
    if (product.colors && product.colors.length > 0 && !selectedColorId) {
      toast.error("Por favor selecciona un color");
      return;
    }

    setIsLoading(true);
    try {
      // Obtener los objetos completos de color y tamaño seleccionados
      const selectedColorObj = product.colors?.find(
        (c: any) => c.id === selectedColorId
      );
      const selectedSizeObj = product.sizes?.find(
        (s: any) => s.id === selectedSizeId
      );

      // Crear el nombre de la variante con talla y color seleccionados
      const variantDetails = [];
      if (selectedSizeObj) variantDetails.push(selectedSizeObj.size);
      if (selectedColorObj) variantDetails.push(selectedColorObj.color);
      const variantString =
        variantDetails.length > 0 ? variantDetails.join(" - ") : undefined;

      cartService.addItem({
        id: `${product.id}-${selectedSizeId || "default"}-${
          selectedColorId || "default"
        }-${Date.now()}`,
        productId: product.id,
        name: product.title,
        price: currentPrice,
        image: product.images[0],
        variant: variantString,
        productColorId: selectedColorId || "",
        productSizeId: selectedSizeId || "",
        quantity,
      });

      toast.success("Producto agregado al carrito");

      // Trigger storage event to update cart count
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error al agregar el producto al carrito");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!product?.id) return;

    const isNowFavorite = favoritesService.toggleFavorite(product.id);
    setIsFavorite(isNowFavorite);

    if (isNowFavorite) {
      toast.success("Producto agregado a favoritos");
    } else {
      toast.success("Producto removido de favoritos");
    }
  };

  // Comment functions
  const handleRatingClick = (rating: number) => {
    setCommentForm((prev) => ({ ...prev, rating }));
  };

  const handleCommentInputChange = (field: string, value: string) => {
    setCommentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentForm.rating || !commentForm.comment.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (commentForm.rating < 1 || commentForm.rating > 5) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    try {
      await addComment({
        variables: {
          input: {
            productId: id,
            rating: commentForm.rating,
            comment: commentForm.comment.trim(),
          },
        },
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };
  const imageSrc = `https://emprendyup-images.s3.us-east-1.amazonaws.com/${
    product.images?.[0]?.url || product.image
  }`;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-700">
            Productos
          </Link>
          {/* <span>/</span> */}
          {/* <Link href={`/products?category=${product.category}`} className="hover:text-gray-700">
            {product.category}
          </Link> */}
          <span>/</span>
          <span className="text-black">{product.title}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a productos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <ProductGallery
              images={product.images}
              productName={product.title}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p
                className="text-sm font-medium mb-2"
                style={{ color: store?.primaryColor || "#2563eb" }}
              >
                {product.category}
              </p>
              <h1 className="text-3xl font-bold mb-4 text-black">
                {product.title}
              </h1>

              {/* Rating */}
              {(averageRating > 0 || reviewCount > 0) && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {averageRating.toFixed(1)} ({reviewCount} reseñas)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-black">
                  ${currentPrice.toLocaleString("es-CO")}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ${product.originalPrice.toLocaleString("es-CO")}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                      -{discountPercentage}%
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.inStock ? (
                  <p className="text-green-600 font-medium">
                    ✓ En stock ({product.stock} disponibles)
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">✗ Agotado</p>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-black mb-3">
                  Configuración:
                </h3>
                <div className="space-y-2">
                  {product.variants.map((variant: any) => (
                    <label
                      key={variant.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors`}
                      style={{
                        borderColor:
                          selectedVariant?.id === variant.id
                            ? store?.primaryColor || "#2563eb"
                            : "#d1d5db",
                        backgroundColor:
                          selectedVariant?.id === variant.id
                            ? `${store?.primaryColor || "#2563eb"}20`
                            : undefined,
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="variant"
                          value={variant.id}
                          checked={selectedVariant?.id === variant.id}
                          onChange={() => setSelectedVariant(variant)}
                          className="text-blue-600 focus:ring-blue-500"
                          style={{
                            accentColor: store?.primaryColor || "#2563eb",
                            color: store?.primaryColor || "#2563eb",
                          }}
                        />
                        <span
                          className="ml-3"
                          style={{ color: store?.textColor || "#000000" }}
                        >
                          {variant.value}
                        </span>
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: store?.textColor || "#000000" }}
                      >
                        ${variant.price?.toLocaleString("es-CO")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Cantidad:</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 rounded-l-lg"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 rounded-r-lg"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">
                  Máximo {product.stock} unidades
                </span>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">
                Tamaño:{" "}
                {product.sizes && product.sizes.length > 0 && (
                  <span className="text-red-500">*</span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map((size: any, index: number) => (
                  <button
                    key={size.id || `size-${index}`}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedSizeId === size.id
                        ? "bg-opacity-10"
                        : "border-gray-300 hover:border-opacity-60"
                    }`}
                    style={{
                      borderColor:
                        selectedSizeId === size.id
                          ? store?.primaryColor || "#2563eb"
                          : undefined,
                      backgroundColor:
                        selectedSizeId === size.id
                          ? `${store?.primaryColor || "#2563eb"}20`
                          : undefined,
                      color:
                        selectedSizeId === size.id
                          ? store?.primaryColor || "#2563eb"
                          : "#000000",
                    }}
                    onClick={() => setSelectedSizeId(size.id)}
                  >
                    {size.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-black mb-3">
                  Color: <span className="text-red-500">*</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: any, index: number) => (
                    <button
                      key={color.id || `color-${index}`}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110`}
                      style={{
                        backgroundColor: color.colorHex,
                        borderColor:
                          selectedColorId === color.id
                            ? store?.primaryColor || "#2563eb"
                            : "#d1d5db",
                        boxShadow:
                          selectedColorId === color.id
                            ? `0 0 0 2px ${store?.primaryColor || "#2563eb"}40`
                            : color.colorHex === "#ffffff" ||
                              color.colorHex === "white"
                            ? "inset 0 0 0 1px rgba(0,0,0,0.1)"
                            : "none",
                      }}
                      title={color.color || color.colorHex}
                      onClick={() => setSelectedColorId(color.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isLoading}
                  className="flex-1 py-3 px-6 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white"
                  style={{ background: store?.primaryColor || "#2563eb" }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Agregar al Carrito
                    </>
                  )}
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Shipping & Security */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-green-600" />
                <span className="text-black">
                  Envío gratis en compras superiores a $150.000
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-black">
                  Compra 100% segura y protegida
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="border-t pt-8">
          <div className="flex space-x-8 border-b">
            {[
              { id: "description", label: "Descripción" },
              { id: "features", label: "Características" },
              // { id: "specifications", label: "Especificaciones" },
              { id: "reviews", label: "Reseñas" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
                style={{
                  borderBottomColor:
                    activeTab === tab.id
                      ? store?.primaryColor || "#2563eb"
                      : "transparent",
                  color:
                    activeTab === tab.id
                      ? store?.primaryColor || "#2563eb"
                      : store?.secondaryColor || "#6b7280",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === "features" && (
              <div>
                <h3 className="text-lg font-medium text-black mb-4">
                  Características principales:
                </h3>
                <ul className="space-y-3">
                  {/* Precio */}
                  <li className="flex items-start">
                    <span
                      className="mr-2"
                      style={{ color: store?.primaryColor || "#2563eb" }}
                    >
                      •
                    </span>
                    <span className="text-gray-700">
                      <strong>Precio:</strong> $
                      {product.price?.toLocaleString("es-CO")}{" "}
                      {product.currency || "COP"}
                    </span>
                  </li>

                  {/* Disponibilidad */}
                  <li className="flex items-start">
                    <span
                      className="mr-2"
                      style={{ color: store?.primaryColor || "#2563eb" }}
                    >
                      •
                    </span>
                    <span className="text-gray-700">
                      <strong>Disponibilidad:</strong>{" "}
                      {product.inStock
                        ? `En stock (${product.stock} disponibles)`
                        : "Agotado"}
                    </span>
                  </li>

                  {/* Tallas disponibles */}
                  {product.sizes && product.sizes.length > 0 && (
                    <li className="flex items-start">
                      <span
                        className="mr-2"
                        style={{ color: store?.primaryColor || "#2563eb" }}
                      >
                        •
                      </span>
                      <span className="text-gray-700">
                        <strong>Tallas disponibles:</strong>{" "}
                        {product.sizes.map((size: any) => size.size).join(", ")}
                      </span>
                    </li>
                  )}

                  {/* Colores disponibles */}
                  {product.colors && product.colors.length > 0 && (
                    <li className="flex items-start">
                      <span
                        className="mr-2"
                        style={{ color: store?.primaryColor || "#2563eb" }}
                      >
                        •
                      </span>
                      <span className="text-gray-700">
                        <strong>Colores disponibles:</strong>{" "}
                        {product.colors
                          .map((color: any) => color.color)
                          .join(", ")}
                      </span>
                    </li>
                  )}

                  {/* Características adicionales si existen */}
                  {product.features &&
                    product.features.length > 0 &&
                    product.features.map((feature: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span
                          className="mr-2"
                          style={{ color: store?.primaryColor || "#2563eb" }}
                        >
                          •
                        </span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}

                  {/* Si no hay características adicionales, mostrar mensaje solo si no hay datos básicos */}
                  {(!product.features || product.features.length === 0) &&
                    (!product.sizes || product.sizes.length === 0) &&
                    (!product.colors || product.colors.length === 0) && (
                      <li className="flex items-start">
                        <span
                          className="mr-2"
                          style={{ color: store?.primaryColor || "#2563eb" }}
                        >
                          •
                        </span>
                        <span className="text-gray-700">
                          Información básica del producto disponible arriba
                        </span>
                      </li>
                    )}
                </ul>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                <h3 className="text-lg font-medium text-black mb-4">
                  Especificaciones técnicas:
                </h3>
                {product.specifications &&
                Object.keys(product.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-2 border-b border-gray-200"
                        >
                          <span className="font-medium text-black">{key}:</span>
                          <span className="text-gray-700">
                            {value as string}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No hay especificaciones disponibles para este producto.
                  </p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                {/* Header de comentarios */}
                <div className="flex items-center gap-3">
                  <h5 className="text-lg font-medium text-black mb-4">
                    Reseñas y Comentarios
                  </h5>
                  <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent"></div>
                  <span className="text-sm text-slate-500 px-3 py-1 rounded-full">
                    {commentsLoading
                      ? "..."
                      : commentsData?.productComments?.length || 0}{" "}
                    comentarios
                  </span>
                </div>

                {/* Lista de comentarios */}
                <div className="space-y-6">
                  {commentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-slate-600 mt-2">
                        Cargando comentarios...
                      </p>
                    </div>
                  ) : commentsData?.productComments &&
                    commentsData.productComments.length > 0 ? (
                    commentsData.productComments.map(
                      (comment: {
                        id: string;
                        rating: number;
                        comment: string;
                        createdAt: string;
                      }) => (
                        <div
                          key={comment.id}
                          className="group bg-white p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10  rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                style={{
                                  backgroundColor:
                                    store?.primaryColor || "#2563eb",
                                }}
                              >
                                U
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {Array.from({ length: comment.rating }).map(
                                    (_, idx) => (
                                      <Star
                                        key={idx}
                                        className="w-4 h-4 fill-amber-400 text-amber-400"
                                      />
                                    )
                                  )}
                                  {Array.from({
                                    length: 5 - comment.rating,
                                  }).map((_, idx) => (
                                    <Star
                                      key={`empty-${idx}`}
                                      className="w-4 h-4 fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                                    />
                                  ))}
                                  <span className="text-sm font-medium text-black ml-2">
                                    {comment.rating}/5
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(
                                    comment.createdAt
                                  ).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <blockquote className="text-black leading-relaxed pl-4 border-l-4 border-indigo-200 italic">
                            `&quot;`{comment.comment}`&quot;`
                          </blockquote>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-slate-700" />
                      </div>
                      <p className="text-black font-medium">
                        Aún no hay comentarios
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        ¡Sé el primero en dejar tu reseña!
                      </p>
                    </div>
                  )}
                </div>

                {/* Formulario para agregar comentario */}
                <div className=" p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: store?.secondaryColor || "#2563eb",
                      }}
                    >
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                    <h5 className="text-lg font-bold text-gray-800">
                      Comparte tu experiencia
                    </h5>
                  </div>

                  <form onSubmit={handleSubmitComment} className="space-y-6">
                    {/* Rating selector */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Tu calificación:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingClick(rating)}
                            className="hover:scale-110 transition-transform duration-200"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors duration-200 ${
                                rating <= commentForm.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 hover:text-amber-400 hover:fill-amber-400"
                              }`}
                            />
                          </button>
                        ))}
                        {commentForm.rating > 0 && (
                          <span className="ml-2 text-sm text-slate-600">
                            ({commentForm.rating}/5)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="comments"
                        className="block text-sm font-semibold text-slate-700  mb-2"
                      >
                        Tu comentario
                      </label>
                      <textarea
                        name="comments"
                        id="comments"
                        rows={4}
                        value={commentForm.comment}
                        onChange={(e) =>
                          handleCommentInputChange("comment", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-slate-900 resize-none"
                        placeholder="Comparte tu experiencia con este producto..."
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingComment}
                      className="w-full text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ background: store?.primaryColor || "#2563eb" }}
                    >
                      {creatingComment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Publicar Comentario
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
