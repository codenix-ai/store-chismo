"use client";
import React, { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { useStore } from "@/components/StoreProvider";
import { useSession } from "next-auth/react";
import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  MapPin,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader,
} from "lucide-react";
import { GET_PAYMENT, UPDATE_ORDER } from "@/lib/graphql/queries";
import { PaymentStatus } from "@/types/payment";
import { WompiTransactionData, WompiTransactionResponse } from "@/types/wompi";
import { usePayments } from "@/hooks/usePayments";
import { useMutation, gql } from "@apollo/client";
import Link from "next/link";

interface PaymentValidationProps {
  paymentId: string;
}

export default function PaymentValidation({
  paymentId,
}: PaymentValidationProps) {
  const { store } = useStore();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("id");
  const [polling, setPolling] = useState(true);
  const [wompiTransaction, setWompiTransaction] =
    useState<WompiTransactionData | null>(null);
  const [wompiLoading, setWompiLoading] = useState(false);
  const [wompiError, setWompiError] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // ePayco states
  const [epaycoTransaction, setEpaycoTransaction] = useState<any>(null);
  const [epaycoLoading, setEpaycoLoading] = useState(false);
  const [epaycoError, setEpaycoError] = useState<string | null>(null);

  // Detect payment provider
  const refPayco = searchParams.get("ref_payco");
  const orderId = searchParams.get("orderId");
  const isEpaycoPayment = !!refPayco;

  // Use the payments hook for GraphQL operations
  const {
    updatePayment: handleUpdatePaymentMutation,
    fetchPaymentByReference,
    fetchOrderPaymentStatus,
  } = usePayments();

  const { data: session } = useSession();

  // Order status update mutation
  const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER, {
    errorPolicy: "all",
  });

  const { data, loading, error, refetch } = useQuery(GET_PAYMENT, {
    variables: { id: paymentId },
    pollInterval: polling ? 3000 : 0, // Poll every 3 seconds while pending
    errorPolicy: "all",
  });

  const payment = data?.payment;

  // Function to update payment in database with Wompi data
  const handleUpdatePayment = async (wompiData: WompiTransactionData) => {
    try {
      setUpdatingPayment(true);

      // Map Wompi status to PaymentStatus enum
      const mappedStatus = mapWompiStatus(wompiData.status);

      // Prepare update input for GraphQL mutation
      const updateInput = {
        status: mappedStatus,
        providerTransactionId: wompiData.id,
        referenceNumber: wompiData.reference,
        ...(mappedStatus === PaymentStatus.FAILED &&
          wompiData.status_message && {
            errorMessage: wompiData.status_message,
          }),
        notes: `Updated from Wompi transaction. Original status: ${
          wompiData.status
        }. Finalized at: ${wompiData.finalized_at || "N/A"}`,
        providerMetadata: wompiData,
      };

      // Use GraphQL mutation to update payment
      await handleUpdatePaymentMutation(paymentId, updateInput);

      console.log("Payment updated successfully via GraphQL");

      // Update order status based on payment status
      const resultUpdate = await updateOrderStatus(wompiData, mappedStatus);

      console.log("Order status update result:", resultUpdate);

      // Refetch GraphQL data to get updated payment info
      if (refetch) {
        await refetch();
      }

      return true;
    } catch (error) {
      console.error("Error updating payment via GraphQL:", error);
      return false;
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Function to update order status based on payment result
  const updateOrderStatus = async (
    wompiData: WompiTransactionData,
    paymentStatus: PaymentStatus
  ) => {
    try {
      let orderStatus = "PENDING";

      // Map payment status to order status
      switch (paymentStatus) {
        case PaymentStatus.COMPLETED:
          orderStatus = "CONFIRMED";
          break;
        case PaymentStatus.FAILED:
          orderStatus = "PAYMENT_FAILED";
          break;
        case PaymentStatus.CANCELLED:
          orderStatus = "CANCELLED";
          break;
        default:
          orderStatus = "PENDING";
      }

      // Get order ID from payment or use reference
      const orderId = payment?.order?.id || wompiData.reference;

      if (!orderId) {
        console.warn("No order ID found to update order status");
        return false;
      }

      // Use GraphQL mutation to update order status and financial details
      const { data } = await updateOrderStatusMutation({
        variables: {
          id: orderId,
          input: {
            status: orderStatus,
          },
        },
      });

      if (data?.updateOrderStatus) {
        return true;
      } else {
        console.error("Failed to update order via GraphQL");
        return false;
      }
    } catch (error) {
      console.error("Error updating order via GraphQL:", error);
      return false;
    }
  };

  // Function to update order status from ePayco data
  const updateOrderStatusFromEpayco = async (
    epaycoData: any,
    paymentStatus: PaymentStatus
  ) => {
    try {
      let orderStatus = "PENDING";

      // Map payment status to order status
      switch (paymentStatus) {
        case PaymentStatus.COMPLETED:
          orderStatus = "CONFIRMED";
          break;
        case PaymentStatus.FAILED:
          orderStatus = "PAYMENT_FAILED";
          break;
        case PaymentStatus.CANCELLED:
          orderStatus = "CANCELLED";
          break;
        default:
          orderStatus = "PENDING";
      }

      // Get order ID from payment or use reference from ePayco
      const orderIdFromPayment =
        payment?.order?.id || orderId || epaycoData.x_id_invoice;

      if (!orderIdFromPayment) {
        console.warn("No order ID found to update order status from ePayco");
        return false;
      }

      // Use GraphQL mutation to update order status
      const { data } = await updateOrderStatusMutation({
        variables: {
          id: orderIdFromPayment,
          input: {
            status: orderStatus,
          },
        },
      });

      if (data?.updateOrderStatus) {
        console.log("✅ Orden actualizada exitosamente desde ePayco");
        return true;
      } else {
        console.error("❌ Error actualizando orden desde ePayco");
        return false;
      }
    } catch (error) {
      console.error("❌ Error actualizando orden desde ePayco:", error);
      return false;
    }
  };

  // Function to fetch transaction from Wompi API
  const fetchWompiTransaction = async (txId: string) => {
    try {
      setWompiLoading(true);
      setWompiError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WOMPI_API_URL}/v1/transactions/${txId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              process.env.NEXT_PUBLIC_WOMPI_PRIVATE_KEY || ""
            }`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: WompiTransactionResponse = await response.json();

      if (result.data) {
        setWompiTransaction(result.data);

        // Update payment in database with Wompi data
        await handleUpdatePayment(result.data);

        // Stop polling if transaction is in final state
        const finalStates = ["APPROVED", "DECLINED", "VOIDED", "ERROR"];
        if (finalStates.includes(result.data.status)) {
          setPolling(false);
        }
      }
    } catch (err) {
      console.error("Error fetching Wompi transaction:", err);
      setWompiError(
        err instanceof Error ? err.message : "Error fetching transaction"
      );
    } finally {
      setWompiLoading(false);
    }
  };

  // Function to fetch transaction from ePayco API
  const fetchEpaycoTransaction = async (refPayco: string) => {
    try {
      setEpaycoLoading(true);
      setEpaycoError(null);

      console.log("🔍 Consultando transacción ePayco:", refPayco);

      // ePayco API endpoint para consultar transacciones
      const response = await fetch("/api/epayco/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref_payco: refPayco,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📦 Respuesta ePayco:", result);

      if (result.success && result.data) {
        setEpaycoTransaction(result.data);

        // Map ePayco status to our PaymentStatus enum
        const mappedStatus = mapEpaycoStatus(result.data.x_cod_response);

        // Update payment in database with ePayco data
        await handleUpdateEpaycoPayment(result.data, mappedStatus);

        // Stop polling if transaction is in final state
        const finalStates = [
          "1",
          "3",
          "4",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
        ];
        if (finalStates.includes(result.data.x_cod_response)) {
          setPolling(false);
        }
      }
    } catch (err) {
      console.error("Error fetching ePayco transaction:", err);
      setEpaycoError(
        err instanceof Error ? err.message : "Error fetching transaction"
      );
    } finally {
      setEpaycoLoading(false);
    }
  };

  // Try to load payment by reference from backend first. If not found, fallback to remote ePayco API
  const checkPaymentByReferenceThenFallback = async (ref: string) => {
    try {
      // First try GraphQL lookup
      const payment = await fetchPaymentByReference(ref, session?.user?.id);

      if (payment) {
        console.log("Found payment by reference via GraphQL:", payment);
        // If providerMetadata exists, use it for display; otherwise use payment fields
        setEpaycoTransaction(payment.providerMetadata || payment);

        // Stop polling if payment status is final
        const finalStatuses = [
          PaymentStatus.COMPLETED,
          PaymentStatus.FAILED,
          PaymentStatus.CANCELLED,
          PaymentStatus.EXPIRED,
        ];

        if (finalStatuses.includes(payment.status)) {
          setPolling(false);
        }

        // Ensure local GET_PAYMENT is refreshed
        if (refetch) await refetch();

        return;
      }

      // Fallback: query ePayco directly (server-side route)
      await fetchEpaycoTransaction(ref);
    } catch (err) {
      console.error("Error checking payment by reference:", err);
      // Fallback to remote if GraphQL check fails
      await fetchEpaycoTransaction(ref);
    }
  };

  // Function to map ePayco status codes to PaymentStatus
  const mapEpaycoStatus = (codResponse: string): PaymentStatus => {
    switch (codResponse) {
      case "1": // Aceptada
        return PaymentStatus.COMPLETED;
      case "2": // Rechazada
      case "4": // Transacción fallida
      case "6": // Rechazada por filtro
      case "9": // Error
      case "12": // Transacción abandonada
        return PaymentStatus.FAILED;
      case "10": // Cancelada
        return PaymentStatus.CANCELLED;
      case "11": // Expirada
        return PaymentStatus.EXPIRED;
      case "7": // Pendiente de pago
      case "8": // Transacción incompleta
      case "3": // Pendiente
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  };

  // Function to update payment with ePayco data
  const handleUpdateEpaycoPayment = async (
    epaycoData: any,
    status: PaymentStatus
  ) => {
    try {
      console.log("🔄 Actualizando pago con datos de ePayco:", {
        epaycoData,
        status,
      });

      const updateInput = {
        status: status,
        transactionId: epaycoData.x_transaction_id,
        amount: parseFloat(epaycoData.x_amount),
        currency: epaycoData.x_currency_code || "COP",
        gateway: "EPAYCO",
        paymentMethod: epaycoData.x_franchise || "CREDIT_CARD",
        fees: parseFloat(epaycoData.x_tax || "0"),
        netAmount:
          parseFloat(epaycoData.x_amount) - parseFloat(epaycoData.x_tax || "0"),
        externalId: epaycoData.x_ref_payco,
        notes: `Updated from ePayco transaction. Status code: ${epaycoData.x_cod_response}. Response: ${epaycoData.x_response}`,
        providerMetadata: epaycoData,
      };

      // Use GraphQL mutation to update payment
      await handleUpdatePaymentMutation(paymentId, updateInput);

      console.log("✅ Pago actualizado exitosamente con ePayco");

      // Update order status based on payment status
      const resultUpdate = await updateOrderStatusFromEpayco(
        epaycoData,
        status
      );
      console.log("📦 Resultado actualización orden:", resultUpdate);

      return true;
    } catch (error) {
      console.error("❌ Error actualizando pago con ePayco:", error);
      return false;
    }
  };

  // Effect to poll Wompi transaction
  useEffect(() => {
    if (!transactionId || isEpaycoPayment) return;

    // Initial fetch
    fetchWompiTransaction(transactionId);

    // Set up polling interval
    let interval: NodeJS.Timeout;
    if (polling) {
      interval = setInterval(() => {
        fetchWompiTransaction(transactionId);
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [transactionId, polling, isEpaycoPayment]);

  // Effect to poll ePayco transaction
  useEffect(() => {
    if (!refPayco || !isEpaycoPayment) return;

    console.log("🚀 Iniciando polling para ePayco:", refPayco);

    // Initial fetch
    checkPaymentByReferenceThenFallback(refPayco);

    // Set up polling interval
    let interval: NodeJS.Timeout;
    if (polling) {
      interval = setInterval(() => {
        checkPaymentByReferenceThenFallback(refPayco);
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refPayco, polling, isEpaycoPayment]);

  // Stop polling when payment is in a final state or Wompi transaction is in final state
  useEffect(() => {
    if (
      payment?.status &&
      [
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
      ].includes(payment.status)
    ) {
      setPolling(false);
    }

    // Also stop polling based on Wompi transaction status
    if (wompiTransaction?.status) {
      const finalStates = ["APPROVED", "DECLINED", "VOIDED", "ERROR"];
      if (finalStates.includes(wompiTransaction.status)) {
        setPolling(false);
      }
    }
  }, [payment?.status, wompiTransaction?.status]);

  // Auto-stop polling after 5 minutes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPolling(false);
    }, 5 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Helper function to map Wompi status to display status
  const mapWompiStatus = (status: string) => {
    switch (status) {
      case "APPROVED":
        return PaymentStatus.COMPLETED;
      case "DECLINED":
      case "ERROR":
        return PaymentStatus.FAILED;
      case "VOIDED":
        return PaymentStatus.CANCELLED;
      case "PENDING":
      default:
        return PaymentStatus.PENDING;
    }
  };

  // Helper function to get status icon and color
  const getStatusDisplay = (status: string, isPayment: boolean = false) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    console.log(
      "🚀 ~ getStatusDisplay ~ status:",
      status,
      "isPayment:",
      isPayment
    );
    if (isPayment) {
      switch (status) {
        case PaymentStatus.COMPLETED:
          return {
            icon: <CheckCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-green-100 text-green-800`,
            text: "Completado",
          };
        case PaymentStatus.FAILED:
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-red-100 text-red-800`,
            text: "Fallido",
          };
        case PaymentStatus.PENDING:
          return {
            icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" />,
            className: `${baseClasses} bg-yellow-100 text-yellow-800`,
            text: "Pendiente",
          };
        case PaymentStatus.CANCELLED:
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-100 text-gray-800`,
            text: "Cancelado",
          };
        default:
          return {
            icon: <AlertCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-100 text-gray-800`,
            text: status || "Desconocido",
          };
      }
    } else {
      // Order status
      switch (status?.toLowerCase()) {
        case "confirmed":
          return {
            icon: <Package className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-green-100 text-green-800`,
            text: "Confirmada",
          };
        case "pending":
          return {
            icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" />,
            className: `${baseClasses} bg-yellow-100 text-yellow-800`,
            text: "Pendiente",
          };
        case "payment_failed":
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-red-100 text-red-800`,
            text: "Pago Fallido",
          };
        case "cancelled":
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-100 text-gray-800`,
            text: "Cancelada",
          };
        case "shipped":
          return {
            icon: <Truck className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-blue-100 text-blue-800`,
            text: "Enviada",
          };
        default:
          return {
            icon: <AlertCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-100 text-gray-800`,
            text: status || "Desconocido",
          };
      }
    }
  };

  // Use Wompi transaction data if available, otherwise fallback to GraphQL payment data
  const currentPayment = wompiTransaction
    ? {
        id: wompiTransaction.id,
        status: mapWompiStatus(wompiTransaction.status),
        amount: wompiTransaction.amount_in_cents / 100,
        currency: wompiTransaction.currency,
        provider: "Wompi",
        paymentMethod: wompiTransaction.payment_method?.type || "N/A",
        createdAt: wompiTransaction.created_at,
        providerTransactionId: wompiTransaction.id,
        referenceNumber: wompiTransaction.reference,
        errorMessage:
          wompiTransaction.status === "DECLINED" ||
          wompiTransaction.status === "ERROR"
            ? wompiTransaction.status_message
            : undefined,
        order: payment?.order, // Keep order info from GraphQL if available
      }
    : payment;
  console.log("🚀 ~ PaymentValidation ~ currentPayment:", currentPayment);

  // Monitor order status updates when payment is completed
  useEffect(() => {
    if (
      currentPayment?.status === PaymentStatus.COMPLETED &&
      currentPayment?.order?.status?.toLowerCase() === "pending"
    ) {
      // Check order status every 10 seconds for up to 2 minutes
      const orderStatusInterval = setInterval(async () => {
        try {
          const orderIdToCheck = currentPayment?.order?.id;
          if (!orderIdToCheck) return;

          // Prefer GraphQL query for order payment status
          const orderPaymentStatus = await fetchOrderPaymentStatus(
            orderIdToCheck
          );

          // If backend reports a non-pending status, refresh local data
          if (
            orderPaymentStatus &&
            orderPaymentStatus.toLowerCase() !== "pending"
          ) {
            if (refetch) await refetch();
            clearInterval(orderStatusInterval);
          }
        } catch (err) {
          // Fallback to refetch if query fails
          if (refetch) await refetch();
        }
      }, 10000);

      // Clear interval after 2 minutes
      const orderTimeout = setTimeout(() => {
        clearInterval(orderStatusInterval);
      }, 2 * 60 * 1000);

      return () => {
        clearInterval(orderStatusInterval);
        clearTimeout(orderTimeout);
      };
    }
  }, [currentPayment?.status, currentPayment?.order?.status, refetch]);

  // Show loading state
  const isLoading =
    (loading && !payment) ||
    (wompiLoading && !wompiTransaction && transactionId && !isEpaycoPayment) ||
    (epaycoLoading && !epaycoTransaction && refPayco && isEpaycoPayment);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando tu pago...
          </h2>
          <p className="text-gray-600">
            {updatingPayment
              ? "Actualizando información del pago..."
              : isEpaycoPayment
              ? "Consultando estado en ePayco..."
              : transactionId
              ? "Consultando estado en Wompi..."
              : "Esto puede tomar unos momentos"}
          </p>
          {polling && !updatingPayment && (
            <p className="text-sm text-blue-600 mt-2">
              {isEpaycoPayment && refPayco
                ? `ePayco Ref: ${refPayco}`
                : transactionId
                ? `Transacción: ${transactionId}`
                : "Actualizando automáticamente..."}
            </p>
          )}
          {updatingPayment && (
            <p className="text-sm text-green-600 mt-2">
              Sincronizando con la base de datos...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  const hasError =
    (error && !payment) ||
    (wompiError && !wompiTransaction && transactionId && !isEpaycoPayment) ||
    (epaycoError && !epaycoTransaction && refPayco && isEpaycoPayment);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al verificar el pago
          </h2>
          <p className="text-gray-600 mb-4">
            {epaycoError ||
              wompiError ||
              "No pudimos encontrar la información de tu pago. Por favor, contacta con soporte."}
          </p>
          {isEpaycoPayment && refPayco && (
            <p className="text-sm text-gray-500 mb-4">ePayco Ref: {refPayco}</p>
          )}
          {transactionId && (
            <p className="text-sm text-gray-500 mb-4">
              ID de transacción: {transactionId}
            </p>
          )}
          <button
            onClick={() => {
              if (isEpaycoPayment && refPayco) {
                fetchEpaycoTransaction(refPayco);
              } else if (transactionId) {
                fetchWompiTransaction(transactionId);
              } else {
                refetch();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Reintentar
          </button>
          <Link
            href="/support"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Contactar Soporte
          </Link>
        </div>
      </div>
    );
  }

  // Show something if we have neither payment nor wompi transaction
  if (!currentPayment && !wompiTransaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Información de pago no disponible
          </h2>
          <p className="text-gray-600 mb-4">
            No pudimos encontrar la información de este pago.
          </p>
          <Link
            href="/support"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Contactar Soporte
          </Link>
        </div>
      </div>
    );
  }

  const renderPaymentStatus = () => {
    const paymentToShow = currentPayment || wompiTransaction;

    switch (paymentToShow?.status) {
      case PaymentStatus.COMPLETED:
        return (
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-lg text-gray-600">
              Tu orden ha sido confirmada y está siendo procesada
            </p>
          </div>
        );

      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return (
          <div className="text-center mb-8">
            <div className="relative">
              <RefreshCw className="w-20 h-20 text-blue-500 mx-auto mb-4 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Procesando Pago...
            </h1>
            <p className="text-lg text-gray-600">
              Tu pago está siendo verificado. Por favor espera.
            </p>
            {polling && (
              <p className="text-sm text-blue-600 mt-2">
                Actualizando automáticamente...
              </p>
            )}
            {transactionId && (
              <p className="text-xs text-gray-500 mt-2">ID: {transactionId}</p>
            )}
          </div>
        );

      case PaymentStatus.FAILED:
        return (
          <div className="text-center mb-8">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pago Fallido
            </h1>
            <p className="text-lg text-gray-600">No pudimos procesar tu pago</p>
            {paymentToShow?.errorMessage && (
              <p className="text-sm text-red-600 mt-2">
                Motivo: {paymentToShow.errorMessage}
              </p>
            )}
          </div>
        );

      case PaymentStatus.CANCELLED:
        return (
          <div className="text-center mb-8">
            <Link href="/payment/cancelled">
              <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pago Cancelado
            </h1>
            <p className="text-lg text-gray-600">El pago fue cancelado</p>
          </div>
        );

      default:
        return (
          <div className="text-center mb-8">
            <Link href="/payment/unknown">
              <AlertCircle className="w-20 h-20 text-gray-500 mx-auto mb-4" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Estado Desconocido
            </h1>
            <p className="text-lg text-gray-600">
              No pudimos determinar el estado del pago
            </p>
          </div>
        );
    }
  };

  const renderActionButtons = () => {
    const paymentToShow = currentPayment || wompiTransaction;

    switch (paymentToShow?.status) {
      case PaymentStatus.COMPLETED:
        return (
          <div className="flex gap-4 justify-center">
            <Link
              href="/orders"
              className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            >
              Ver Mis Órdenes
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seguir Comprando
            </Link>
          </div>
        );

      case PaymentStatus.FAILED:
        return (
          <div className="flex gap-4 justify-center">
            <Link
              href={`/checkout/retry/${paymentToShow?.id || paymentId}`}
              className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            >
              Reintentar Pago
            </Link>
            <Link
              href="/cart"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al Carrito
            </Link>
          </div>
        );

      case PaymentStatus.CANCELLED:
        return (
          <div className="flex gap-4 justify-center">
            <Link
              href="/cart"
              className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            >
              Volver al Carrito
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seguir Comprando
            </Link>
          </div>
        );

      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                if (transactionId) {
                  fetchWompiTransaction(transactionId);
                } else {
                  refetch();
                }
              }}
              className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            >
              Actualizar Estado
            </button>
            <Link
              href="/support"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Contactar Soporte
            </Link>
          </div>
        );

      default:
        return (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                if (transactionId) {
                  fetchWompiTransaction(transactionId);
                } else {
                  refetch();
                }
              }}
              className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
            >
              Verificar Estado
            </button>
            <Link
              href="/support"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Contactar Soporte
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderPaymentStatus()}

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles del Pago
            </h2>
            {updatingPayment && (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Actualizando...</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">ID de Pago</p>
              <p className="font-medium">{currentPayment?.id || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <p className="font-medium">
                {(() => {
                  const statusDisplay = getStatusDisplay(
                    currentPayment?.status,
                    true
                  );
                  return (
                    <span className={statusDisplay.className}>
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </span>
                  );
                })()}
              </p>
            </div>
            {wompiTransaction && (
              <div>
                <p className="text-sm text-gray-600">Estado Wompi</p>
                <p className="font-medium text-xs">{wompiTransaction.status}</p>
                {wompiTransaction.status_message && (
                  <p className="text-xs text-gray-500">
                    {wompiTransaction.status_message}
                  </p>
                )}
              </div>
            )}
            {epaycoTransaction && (
              <div>
                <p className="text-sm text-gray-600">Estado ePayco</p>
                <p className="font-medium text-xs">
                  {epaycoTransaction.x_response} (
                  {epaycoTransaction.x_cod_response})
                </p>
                {epaycoTransaction.x_transaction_date && (
                  <p className="text-xs text-gray-500">
                    Fecha:{" "}
                    {new Date(
                      epaycoTransaction.x_transaction_date
                    ).toLocaleString("es-CO")}
                  </p>
                )}
                {epaycoTransaction.x_franchise && (
                  <p className="text-xs text-gray-500">
                    Franquicia: {epaycoTransaction.x_franchise}
                  </p>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Monto</p>
              <p className="font-medium">
                ${currentPayment?.amount?.toLocaleString("es-CO") || "N/A"}{" "}
                {currentPayment?.currency || ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Proveedor</p>
              <p className="font-medium">{currentPayment?.provider || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Método de Pago</p>
              <p className="font-medium">
                {currentPayment?.paymentMethod || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-medium">
                {currentPayment?.createdAt
                  ? new Date(currentPayment.createdAt).toLocaleString("es-CO")
                  : "N/A"}
              </p>
            </div>
            {(currentPayment?.providerTransactionId || transactionId) && (
              <div>
                <p className="text-sm text-gray-600">ID de Transacción</p>
                <p className="font-medium text-xs">
                  {currentPayment?.providerTransactionId || transactionId}
                </p>
              </div>
            )}
            {currentPayment?.referenceNumber && (
              <div>
                <p className="text-sm text-gray-600">Referencia</p>
                <p className="font-medium text-xs">
                  {currentPayment.referenceNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Information */}
        {currentPayment?.order && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información de la Orden
            </h2>

            {/* Payment and Order Status Sync Indicator */}
            {currentPayment?.status === PaymentStatus.COMPLETED && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  {currentPayment.order.status?.toLowerCase() ===
                  "confirmed" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Pago y orden sincronizados correctamente
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-blue-700">
                        Sincronizando estado de la orden...
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Número de Orden</p>
                <p className="font-medium">{currentPayment.order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>$
                {currentPayment?.amount?.toLocaleString("es-CO") || "N/A"}{" "}
                {currentPayment?.currency || ""}
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado de la Orden</p>
                <div className="font-medium">
                  {(() => {
                    const statusDisplay = getStatusDisplay(
                      currentPayment.order.status,
                      false
                    );
                    return (
                      <span className={statusDisplay.className}>
                        {statusDisplay.icon}
                        {statusDisplay.text}
                      </span>
                    );
                  })()}
                </div>
                {currentPayment?.status === PaymentStatus.COMPLETED &&
                  currentPayment.order.status?.toLowerCase() ===
                    "confirmed" && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      La orden ha sido confirmada exitosamente
                    </p>
                  )}
                {currentPayment.order.status?.toLowerCase() === "pending" && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    El estado de la orden se actualizará automáticamente
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Wompi Transaction Information */}
        {wompiTransaction && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información Detallada de la Transacción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Email del Cliente</p>
                <p className="font-medium text-xs">
                  {wompiTransaction.customer_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Pago</p>
                <p className="font-medium">
                  {wompiTransaction.payment_method_type}
                </p>
              </div>
              {wompiTransaction.payment_method?.extra && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Marca de Tarjeta</p>
                    <p className="font-medium">
                      {wompiTransaction.payment_method.extra.brand} -{" "}
                      {wompiTransaction.payment_method.extra.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Últimos 4 Dígitos</p>
                    <p className="font-medium">
                      ****{wompiTransaction.payment_method.extra.last_four}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Tarjeta</p>
                    <p className="font-medium">
                      {wompiTransaction.payment_method.extra.card_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Titular</p>
                    <p className="font-medium">
                      {wompiTransaction.payment_method.extra.card_holder}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">3D Secure</p>
                    <p className="font-medium">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          wompiTransaction.payment_method.extra.is_three_ds
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {wompiTransaction.payment_method.extra.is_three_ds
                          ? "Activado"
                          : "No activado"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cuotas</p>
                    <p className="font-medium">
                      {wompiTransaction.payment_method.installments}
                    </p>
                  </div>
                </>
              )}
              {wompiTransaction.finalized_at && (
                <div>
                  <p className="text-sm text-gray-600">Finalizado</p>
                  <p className="font-medium">
                    {new Date(wompiTransaction.finalized_at).toLocaleString(
                      "es-CO"
                    )}
                  </p>
                </div>
              )}
              {wompiTransaction.customer_data && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium">
                      {wompiTransaction.customer_data.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">
                      {wompiTransaction.customer_data.phone_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documento</p>
                    <p className="font-medium">
                      {wompiTransaction.customer_data.legal_id_type}:{" "}
                      {wompiTransaction.customer_data.legal_id}
                    </p>
                  </div>
                </>
              )}
              {wompiTransaction.taxes && wompiTransaction.taxes.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Impuestos</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {wompiTransaction.taxes.map((tax, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{tax.type}:</span>
                        <span className="font-medium">
                          ${(tax.amount_in_cents / 100).toLocaleString("es-CO")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wompiTransaction.shipping_address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Dirección de Envío
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">
                      {wompiTransaction.shipping_address.name}
                    </p>
                    <p>{wompiTransaction.shipping_address.address_line_1}</p>
                    <p>
                      {wompiTransaction.shipping_address.city},{" "}
                      {wompiTransaction.shipping_address.region}
                    </p>
                    <p>{wompiTransaction.shipping_address.country}</p>
                    <p>Tel: {wompiTransaction.shipping_address.phone_number}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed ePayco Transaction Information */}
        {epaycoTransaction && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información Detallada de ePayco
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium text-xs">
                  {epaycoTransaction.x_customer_name}{" "}
                  {epaycoTransaction.x_customer_lastname}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-xs">
                  {epaycoTransaction.x_customer_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documento</p>
                <p className="font-medium">
                  {epaycoTransaction.x_customer_document}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">
                  {epaycoTransaction.x_customer_phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Franquicia</p>
                <p className="font-medium">
                  {epaycoTransaction.x_franchise || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Banco</p>
                <p className="font-medium">
                  {epaycoTransaction.x_bank_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tarjeta</p>
                <p className="font-medium">
                  ****{epaycoTransaction.x_cardnumber?.slice(-4) || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cuotas</p>
                <p className="font-medium">
                  {epaycoTransaction.x_quotas || "1"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID Transacción ePayco</p>
                <p className="font-medium text-xs">
                  {epaycoTransaction.x_transaction_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Referencia ePayco</p>
                <p className="font-medium text-xs">
                  {epaycoTransaction.x_ref_payco}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Código de Aprobación</p>
                <p className="font-medium">
                  {epaycoTransaction.x_approval_code || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Código de Respuesta</p>
                <p className="font-medium">
                  {epaycoTransaction.x_cod_response} -{" "}
                  {epaycoTransaction.x_response}
                </p>
              </div>
              {epaycoTransaction.x_amount && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-medium">
                      $
                      {parseFloat(epaycoTransaction.x_amount).toLocaleString(
                        "es-CO"
                      )}{" "}
                      {epaycoTransaction.x_currency_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Impuesto</p>
                    <p className="font-medium">
                      $
                      {parseFloat(
                        epaycoTransaction.x_tax || "0"
                      ).toLocaleString("es-CO")}
                    </p>
                  </div>
                </>
              )}
              {epaycoTransaction.x_customer_address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Dirección del Cliente
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">
                      {epaycoTransaction.x_customer_name}{" "}
                      {epaycoTransaction.x_customer_lastname}
                    </p>
                    <p>{epaycoTransaction.x_customer_address}</p>
                    <p>
                      {epaycoTransaction.x_customer_city},{" "}
                      {epaycoTransaction.x_customer_country}
                    </p>
                    {epaycoTransaction.x_customer_mobile && (
                      <p>Móvil: {epaycoTransaction.x_customer_mobile}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">{renderActionButtons()}</div>

        {/* Support Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            ¿Tienes algún problema?{" "}
            <Link href="/support" className="text-blue-600 hover:text-blue-700">
              Contacta nuestro soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
