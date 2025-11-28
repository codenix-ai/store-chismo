"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Eye, X } from "lucide-react";
import { cartService, Cart as CartType, CartItem } from "@/lib/cart";
import { useStore } from "@/components/StoreProvider";
import { resolveImageUrl } from "@/lib/image";

// Uses shared resolveImageUrl from src/lib/image.ts

interface CartProps {
  className?: string;
}

export function Cart({ className = "" }: CartProps) {
  const [cart, setCart] = useState<CartType>({
    items: [],
    total: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { store } = useStore();

  useEffect(() => {
    setCart(cartService.getCart());
  }, []);

  const updateQuantity = async (
    productId: string,
    quantity: number,
    variant?: string
  ) => {
    setIsLoading(true);
    const updatedCart = cartService.updateQuantity(
      productId,
      quantity,
      variant
    );
    setCart(updatedCart);
    window.dispatchEvent(new Event("storage"));
    setIsLoading(false);
  };

  const removeItem = async (productId: string, variant?: string) => {
    setIsLoading(true);
    const updatedCart = cartService.removeItem(productId, variant);
    setCart(updatedCart);
    window.dispatchEvent(new Event("storage"));
    setIsLoading(false);
  };

  const clearCart = async () => {
    setIsLoading(true);
    const updatedCart = cartService.clearCart();
    setCart(updatedCart);
    window.dispatchEvent(new Event("storage"));
    setIsLoading(false);
  };

  if (cart.items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-black mb-2">
          Tu carrito está vacío
        </h3>
        <p className="text-gray-500 mb-6">
          Agrega algunos productos para comenzar a comprar
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
          Continuar Comprando
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cart Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">
          Carrito de Compras (
          {cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)
        </h2>
        <button
          onClick={clearCart}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
        >
          Vaciar Carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <CartItemCard
              key={`${item.productId}-${item.variant || "default"}`}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary cart={cart} store={store} />
        </div>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (
    productId: string,
    quantity: number,
    variant?: string
  ) => void;
  onRemove: (productId: string, variant?: string) => void;
  isLoading: boolean;
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  isLoading,
}: CartItemCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Checkout is handled via links in the summary; session checks done on server when needed
  const imageUrl = resolveImageUrl(item.image);
  return (
    <>
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start space-x-4">
          {/* Product Image with Preview */}
          <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 group">
            <Image
              src={imageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />

            {/* Hover Overlay */}
            <div
              className={`absolute inset-0 bg-opacity-0 transition-all duration-200 flex items-center justify-center ${
                isHovered ? "bg-opacity-40" : ""
              }`}
            >
              <div
                className={`opacity-0 transition-opacity duration-200 flex space-x-1 items-center ${
                  isHovered ? "opacity-100" : ""
                }`}
              >
                <button
                  onClick={() => setShowPreview(true)}
                  className="p-1.5 bg-white text-gray-700 rounded-full hover:bg-gray-50 shadow-md"
                  title="Vista previa"
                >
                  <Eye className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemove(item.productId, item.variant)}
                  disabled={isLoading}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md disabled:opacity-50"
                  title="Eliminar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-black mb-1">{item.name}</h3>
            {item.variant && (
              <p className="text-sm text-gray-500 mb-2">
                Variante: {item.variant}
              </p>
            )}
            <p className="text-lg font-semibold text-black">
              ${item.price.toLocaleString("es-CO")}
            </p>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                onUpdateQuantity(
                  item.productId,
                  item.quantity - 1,
                  item.variant
                )
              }
              disabled={isLoading || item.quantity <= 1}
              className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                onUpdateQuantity(
                  item.productId,
                  item.quantity + 1,
                  item.variant
                )
              }
              disabled={isLoading}
              className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Remove Button - Always visible but subtle */}
          <button
            onClick={() => onRemove(item.productId, item.variant)}
            disabled={isLoading}
            className={`p-2 rounded-md disabled:opacity-50 transition-colors ${
              isHovered
                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                : "text-gray-400 hover:text-red-500"
            }`}
            title="Eliminar del carrito"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Item Total */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Subtotal:</span>
          <span className="font-semibold text-black">
            ${(item.price * item.quantity).toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h3>
                {item.variant && (
                  <p className="text-sm text-gray-500">
                    Variante: {item.variant}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="relative w-full h-80 mb-4">
                <Image
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Precio:
                  </span>
                  <span className="text-xl font-bold text-black">
                    ${item.price.toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Cantidad:
                  </span>
                  <span className="text-xl font-bold text-black">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-semibold text-gray-900">
                    Subtotal:
                  </span>
                  <span className="text-2xl font-bold text-black">
                    ${(item.price * item.quantity).toLocaleString("es-CO")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => {
                    onRemove(item.productId, item.variant);
                    setShowPreview(false);
                  }}
                  disabled={isLoading}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  Eliminar del carrito
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface OrderSummaryProps {
  cart: CartType;
  store: any;
}

function OrderSummary({ cart, store }: OrderSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-black">Resumen del Pedido</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">
            ${cart.subtotal.toLocaleString("es-CO")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IVA (19%):</span>
          <span className="font-medium">
            ${cart.tax.toLocaleString("es-CO")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Envío:</span>
          <span className="font-medium">
            {cart.shipping === 0
              ? "Gratis"
              : `$${cart.shipping.toLocaleString("es-CO")}`}
          </span>
        </div>
        {cart.shipping === 0 && cart.subtotal >= 150000 && (
          <p className="text-sm text-green-600">
            ¡Envío gratis por compras superiores a $150.000!
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-black">Total:</span>
          <span className="text-xl font-bold text-black">
            ${cart.total.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/orden"
          className="block text-white w-full text-center py-3 px-4 rounded-md font-medium transition-colors"
          style={{
            backgroundColor: store?.primaryColor || "#3B82F6",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              store?.secondaryColor || store?.primaryColor || "#2563EB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              store?.primaryColor || "#3B82F6";
          }}
        >
          Proceder al Pago
        </Link>
        <Link
          href="/products"
          className="block w-full text-center border border-gray-300 py-3 px-4 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Continuar Comprando
        </Link>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-sm font-medium text-black mb-3">
          Métodos de Pago Aceptados:
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            MercadoPago
          </div>
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            Wompi
          </div>
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            ePayco
          </div>
        </div>
      </div>
    </div>
  );
}
