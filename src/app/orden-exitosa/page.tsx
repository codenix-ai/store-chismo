"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout/Layout";
import PaymentValidation from "@/components/PaymentValidation/PaymentValidation";
import { Loader } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  // Buscar el ID del pago en diferentes parámetros según el proveedor
  const paymentId =
    searchParams.get("payment") || searchParams.get("ref_payco");
  const orderId = searchParams.get("orderId");
  const { store } = useStore();

  if (!paymentId && !orderId) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, ${
            store?.backgroundColor || "#f9fafb"
          } 0%, ${store?.secondaryColor || "#f3f4f6"} 100%)`,
        }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header con gradiente usando colores de la tienda */}
          <div
            className="px-6 py-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${
                store?.primaryColor || "#ef4444"
              } 0%, ${store?.accentColor || "#ec4899"} 100%)`,
            }}
          >
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Pago no encontrado
            </h2>
            <p className="text-white text-opacity-90 text-sm">
              No se pudo localizar la información del pago
            </p>
          </div>

          {/* Contenido */}
          <div className="px-6 py-8 text-center">
            <div className="mb-6">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{
                  backgroundColor: `${store?.primaryColor || "#ef4444"}15`,
                }}
              >
                <span className="text-xl">🔍</span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: store?.textColor || "#4b5563" }}
              >
                El enlace que seguiste no contiene información válida del pago.
                <br />
                Por favor verifica la URL o intenta realizar el pago nuevamente.
              </p>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${
                    store?.primaryColor || "#3b82f6"
                  } 0%, ${store?.accentColor || "#1d4ed8"} 100%)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(110%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(100%)";
                }}
              >
                <span className="mr-2">🏠</span>
                Volver al Inicio
              </Link>

              <Link
                href="/cart"
                className="w-full inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: store?.secondaryColor || "#f3f4f6",
                  color: store?.textColor || "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    store?.hoverBackgroundColor || "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    store?.secondaryColor || "#f3f4f6";
                }}
              >
                <span className="mr-2">🛒</span>
                Ver Carrito
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 text-center"
            style={{ backgroundColor: store?.backgroundColor || "#f9fafb" }}
          >
            <p
              className="text-xs"
              style={{
                color: store?.textColor ? `${store.textColor}80` : "#6b7280",
              }}
            >
              ¿Necesitas ayuda?{" "}
              <Link
                href="/support"
                className="font-medium transition-colors duration-200"
                style={{ color: store?.primaryColor || "#2563eb" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = store?.accentColor || "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    store?.primaryColor || "#2563eb";
                }}
              >
                Contacta soporte
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si viene de ePayco, mostrar página de éxito específica
  if (paymentId && orderId) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, ${
            store?.backgroundColor || "#f9fafb"
          } 0%, ${store?.secondaryColor || "#f3f4f6"} 100%)`,
        }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header de éxito */}
          <div
            className="px-6 py-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${
                store?.primaryColor || "#10b981"
              } 0%, ${store?.accentColor || "#059669"} 100%)`,
            }}
          >
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Pago Procesado!
            </h2>
            <p className="text-white text-opacity-90 text-sm">
              Tu pago ha sido procesado exitosamente
            </p>
          </div>

          {/* Contenido */}
          <div className="px-6 py-8 text-center">
            <div className="mb-6">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{
                  backgroundColor: `${store?.primaryColor || "#10b981"}15`,
                }}
              >
                <span className="text-xl">📧</span>
              </div>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: store?.textColor || "#4b5563" }}
              >
                Hemos procesado tu pago con ePayco.
                <br />
                Recibirás un correo de confirmación con los detalles.
              </p>

              {/* Detalles del pago */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: store?.textColor || "#374151" }}
                  >
                    Orden:
                  </span>
                  <span className="text-sm font-mono text-gray-600">
                    {orderId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-sm font-medium"
                    style={{ color: store?.textColor || "#374151" }}
                  >
                    Referencia ePayco:
                  </span>
                  <span className="text-sm font-mono text-gray-600">
                    {paymentId}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = `/orden?id=${orderId}`)}
                className="w-full inline-flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${
                    store?.primaryColor || "#10b981"
                  } 0%, ${store?.accentColor || "#059669"} 100%)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(110%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(100%)";
                }}
              >
                <span className="mr-2">📋</span>
                Ver Detalles de la Orden
              </button>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: store?.secondaryColor || "#f3f4f6",
                  color: store?.textColor || "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    store?.hoverBackgroundColor || "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    store?.secondaryColor || "#f3f4f6";
                }}
              >
                <span className="mr-2">🏠</span>
                Continuar Comprando
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 text-center"
            style={{ backgroundColor: store?.backgroundColor || "#f9fafb" }}
          >
            <p
              className="text-xs"
              style={{
                color: store?.textColor ? `${store.textColor}80` : "#6b7280",
              }}
            >
              ¿Preguntas sobre tu pedido?{" "}
              <Link
                href="/support"
                className="font-medium transition-colors duration-200"
                style={{ color: store?.primaryColor || "#10b981" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = store?.accentColor || "#059669";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    store?.primaryColor || "#10b981";
                }}
              >
                Contacta soporte
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Para otros casos, usar el PaymentValidation component
  return <PaymentValidation paymentId={paymentId || orderId || ""} />;
}

export default function OrderSuccessPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Cargando información del pago...</p>
            </div>
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </Layout>
  );
}
