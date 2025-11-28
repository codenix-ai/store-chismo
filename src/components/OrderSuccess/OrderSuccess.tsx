"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useStore } from "@/components/StoreProvider";
import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  MapPin,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_PAYMENT_BY_ID } from "@/lib/graphql/queries";
import { resolveImageUrl } from "@/lib/image";

// Interface for Wompi response parameters from URL
interface WompiUrlParams {
  id?: string; // Transaction ID from Wompi
  status?: string; // APPROVED, DECLINED, ERROR, etc.
  reference?: string; // Your payment reference (should match our payment ID)
  payment_method_type?: string; // CARD, PSE, NEQUI, etc.
  amount_in_cents?: number;
  currency?: string;
  customer_email?: string;
  status_message?: string; // Additional failure details
  processor_response_code?: string;
  decline_reason?: string;
}

// Interface for our internal payment data from GraphQL
interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  provider: string;
  paymentMethod: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId?: string;
  providerTransactionId?: string;
  referenceNumber?: string;
  errorMessage?: string;
  errorCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  order?: {
    id: string;
    status: string;
    total: number;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        images: string[];
      };
    }>;
    address: {
      name: string;
      street: string;
      city: string;
      department: string;
      phone: string;
    };
  };
}

export default function OrderSuccess() {
  const { store } = useStore();
  const searchParams = useSearchParams();
  const [wompiParams, setWompiParams] = useState<WompiUrlParams | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<
    "validating" | "valid" | "invalid" | "mismatch"
  >("validating");

  // Extract parameters from URL
  useEffect(() => {
    const extractParams = () => {
      // First, try to get payment ID from URL params
      const paymentParam = searchParams.get("payment");
      if (paymentParam) {
        setPaymentId(paymentParam);
      }

      // Extract Wompi parameters from URL (when redirected from Wompi)
      const params: WompiUrlParams = {};

      const id = searchParams.get("id");
      const status = searchParams.get("status");
      const reference = searchParams.get("reference");
      const paymentMethodType = searchParams.get("payment_method_type");
      const amountInCents = searchParams.get("amount_in_cents");
      const currency = searchParams.get("currency");
      const customerEmail = searchParams.get("customer_email");
      const statusMessage = searchParams.get("status_message");

      if (id) params.id = id;
      if (status) params.status = status;
      if (reference) params.reference = reference;
      if (paymentMethodType) params.payment_method_type = paymentMethodType;
      if (amountInCents) params.amount_in_cents = parseInt(amountInCents);
      if (currency) params.currency = currency;
      if (customerEmail) params.customer_email = customerEmail;
      if (statusMessage) params.status_message = statusMessage;

      // If we have a reference from Wompi, use it as payment ID
      if (params.reference && !paymentParam) {
        setPaymentId(params.reference);
      }

      setWompiParams(Object.keys(params).length > 0 ? params : null);
    };

    extractParams();
  }, [searchParams]);

  // Query payment data from our database
  const {
    data: paymentData,
    loading,
    error,
    refetch,
  } = useQuery(GET_PAYMENT_BY_ID, {
    variables: { id: paymentId },
    skip: !paymentId,
    fetchPolicy: "cache-and-network",
    pollInterval: paymentId && validationState === "validating" ? 3000 : 0, // Poll every 3 seconds while validating
    errorPolicy: "all",
  });

  // Validate Wompi parameters against our payment data
  useEffect(() => {
    if (!paymentData?.payment || !wompiParams) {
      return;
    }

    const payment: PaymentData = paymentData.payment;

    // Validate that Wompi parameters match our payment record
    const isValid = validateWompiResponse(payment, wompiParams);

    if (isValid) {
      setValidationState("valid");

      // If Wompi status indicates completion but our DB doesn't reflect it yet,
      // the webhook might still be processing - keep polling
      if (wompiParams.status === "APPROVED" && payment.status === "PENDING") {
        // Continue polling for a bit longer
        setTimeout(() => {
          if (paymentData?.payment?.status === "PENDING") {
            setValidationState("mismatch");
          }
        }, 30000); // Wait 30 seconds for webhook processing
      }
    } else {
      setValidationState("invalid");
    }
  }, [paymentData, wompiParams]);

  // Validate Wompi response against payment data
  const validateWompiResponse = (
    payment: PaymentData,
    wompiParams: WompiUrlParams
  ): boolean => {
    try {
      // Check if payment reference matches
      if (wompiParams.reference && wompiParams.reference !== payment.id) {
        console.error("Payment reference mismatch:", {
          wompi: wompiParams.reference,
          payment: payment.id,
        });
        return false;
      }

      // Check if amount matches (convert to cents for comparison)
      if (wompiParams.amount_in_cents) {
        const expectedAmountInCents = Math.round(payment.amount * 100);
        if (wompiParams.amount_in_cents !== expectedAmountInCents) {
          console.error("Amount mismatch:", {
            wompi: wompiParams.amount_in_cents,
            expected: expectedAmountInCents,
          });
          return false;
        }
      }

      // Check currency
      if (wompiParams.currency && wompiParams.currency !== payment.currency) {
        console.error("Currency mismatch:", {
          wompi: wompiParams.currency,
          payment: payment.currency,
        });
        return false;
      }

      // Check customer email
      if (
        wompiParams.customer_email &&
        wompiParams.customer_email !== payment.customerEmail
      ) {
        console.error("Customer email mismatch:", {
          wompi: wompiParams.customer_email,
          payment: payment.customerEmail,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating Wompi response:", error);
      return false;
    }
  };

  // Get payment status for display
  const getPaymentStatusInfo = () => {
    if (!paymentData?.payment) {
      return {
        status: "UNKNOWN",
        message: "Pago no encontrado",
        color: "text-gray-500",
      };
    }

    const payment: PaymentData = paymentData.payment;

    // Use our database status as the source of truth
    switch (payment.status) {
      case "COMPLETED":
        return {
          status: "COMPLETED",
          message: "Pago confirmado",
          color: "text-green-600",
          icon: CheckCircle,
        };
      case "FAILED":
        return {
          status: "FAILED",
          message: payment.errorMessage || "Pago rechazado",
          color: "text-red-600",
          icon: XCircle,
        };
      case "CANCELLED":
        return {
          status: "CANCELLED",
          message: "Pago cancelado",
          color: "text-gray-600",
          icon: XCircle,
        };
      case "PENDING":
      default:
        return {
          status: "PENDING",
          message: "Procesando pago...",
          color: "text-yellow-600",
          icon: RefreshCw,
        };
    }
  };

  // Loading state
  if (loading && !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando el estado del pago...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras confirmamos tu transacción.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paymentId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error al verificar el pago
            </h2>
            <p className="text-gray-600 mb-4">
              {!paymentId
                ? "ID de pago no encontrado en la URL."
                : "No se pudo cargar la información del pago."}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-colors"
              style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const payment: PaymentData = paymentData.payment;
  const statusInfo = getPaymentStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Payment Status Header */}
        <div className="bg-white rounded-lg shadow mb-8 p-8 text-center">
          {statusInfo.icon &&
            React.createElement(statusInfo.icon, {
              className: `w-16 h-16 mx-auto mb-4 ${statusInfo.color} ${
                payment.status === "PENDING" ? "animate-spin" : ""
              }`,
            })}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {payment.status === "COMPLETED"
              ? "¡Pago Exitoso!"
              : payment.status === "FAILED"
              ? "Pago Rechazado"
              : payment.status === "CANCELLED"
              ? "Pago Cancelado"
              : "Procesando Pago"}
          </h1>
          <p className={`text-lg ${statusInfo.color} mb-4`}>
            {statusInfo.message}
          </p>

          {/* Wompi Transaction Info */}
          {wompiParams && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Información de la Transacción
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                {wompiParams.id && (
                  <div>
                    <span className="font-medium">ID Transacción Wompi:</span>{" "}
                    {wompiParams.id}
                  </div>
                )}
                <div>
                  <span className="font-medium">Referencia:</span> {payment.id}
                </div>
                {wompiParams.payment_method_type && (
                  <div>
                    <span className="font-medium">Método de Pago:</span>{" "}
                    {wompiParams.payment_method_type}
                  </div>
                )}
                <div>
                  <span className="font-medium">Monto:</span> $
                  {payment.amount.toLocaleString("es-CO")} {payment.currency}
                </div>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {validationState === "invalid" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">
                  Error: Los datos de Wompi no coinciden con nuestro registro
                  del pago.
                </span>
              </div>
            </div>
          )}

          {validationState === "mismatch" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-yellow-700 font-medium">
                  Wompi reporta el pago como aprobado, pero aún estamos
                  procesando la confirmación.
                </span>
              </div>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm text-yellow-700 underline hover:no-underline"
              >
                Verificar estado nuevamente
              </button>
            </div>
          )}
        </div>

        {/* Order Details */}
        {payment.order && (
          <div className="bg-white rounded-lg shadow mb-8 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Detalles de la Orden
            </h2>

            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {payment.order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  {item.product.images?.[0] && (
                    <Image
                      src={resolveImageUrl(item.product.images[0])}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${payment.order.total.toLocaleString("es-CO")} COP</span>
              </div>
            </div>

            {/* Shipping Address */}
            {payment.order.address && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Dirección de Envío
                </h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{payment.order.address.name}</p>
                  <p>{payment.order.address.street}</p>
                  <p>
                    {payment.order.address.city},{" "}
                    {payment.order.address.department}
                  </p>
                  <p>Tel: {payment.order.address.phone}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="text-center">
          {payment.status === "COMPLETED" && (
            <div className="space-x-4">
              <button
                onClick={() => (window.location.href = "/perfil")}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-colors"
                style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
              >
                Ver mis pedidos
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          )}

          {payment.status === "FAILED" && (
            <div className="space-x-4">
              <button
                onClick={() => (window.location.href = "/cart")}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-colors"
                style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
              >
                Reintentar pago
              </button>
              <button
                onClick={() => (window.location.href = "/support")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Contactar soporte
              </button>
            </div>
          )}

          {payment.status === "PENDING" && (
            <div className="space-x-4">
              <button
                onClick={() => refetch()}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-colors"
                style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Actualizar estado
              </button>
            </div>
          )}
        </div>

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 bg-white rounded-lg shadow p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Debug Info (Solo desarrollo)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Wompi URL Params:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(wompiParams, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Payment Data:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(payment, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Validation State:</h4>
                <p className="text-sm">{validationState}</p>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
