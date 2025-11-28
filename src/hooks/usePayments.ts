"use client";
import { useState } from "react";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { ApolloError } from "@apollo/client";
import {
  CREATE_PAYMENT,
  UPDATE_PAYMENT,
  REFUND_PAYMENT,
  PROCESS_PAYMENT,
  GET_PAYMENTS,
  GET_PAYMENT,
  GET_PAYMENT_LOGS,
  GET_PAYMENT_SUMMARY,
  GET_PAYMENT_BY_REFERENCE,
  GET_ORDER_PAYMENT_STATUS,
  UPSERT_PAYMENT_FROM_EPAYCO,
} from "@/lib/graphql/queries";
import {
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
  RefundPaymentInput,
  PaymentFilter,
  PaymentPagination,
  PaymentSummary,
} from "@/types/payment";

// Error handling utility
export const getPaymentErrorMessage = (error: ApolloError): string => {
  if (error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];

    switch (graphQLError.message) {
      case "Payment not found":
        return "The payment you are looking for does not exist.";
      case "Store not found":
        return "Store configuration is missing.";
      case "Only completed payments can be refunded":
        return "This payment cannot be refunded in its current state.";
      case "Insufficient permissions":
        return "You do not have permission to perform this action.";
      case "Payment provider configuration missing":
        return "Payment provider is not properly configured.";
      default:
        return graphQLError.message;
    }
  }

  if (error.networkError) {
    return "Network error. Please check your connection.";
  }

  return "An unexpected error occurred.";
};

// Custom hook for managing payments list
export const usePayments = () => {
  const [filters, setFilters] = useState<PaymentFilter>({});
  const [pagination, setPagination] = useState<PaymentPagination>({
    skip: 0,
    take: 20,
    orderBy: "createdAt_desc",
  });

  const { data, loading, error, refetch } = useQuery(GET_PAYMENTS, {
    variables: { filter: filters, pagination },
    errorPolicy: "all",
  });

  // Lazy queries and mutation for reference/status lookups and webhook upsert
  const [fetchPaymentByReferenceQuery, { data: paymentByReferenceData }] =
    useLazyQuery(GET_PAYMENT_BY_REFERENCE, {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    });

  const [fetchOrderPaymentStatusQuery, { data: orderPaymentStatusData }] =
    useLazyQuery(GET_ORDER_PAYMENT_STATUS, {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    });

  const [upsertPaymentFromEpaycoMutation] = useMutation(
    UPSERT_PAYMENT_FROM_EPAYCO,
    {
      errorPolicy: "all",
    }
  );

  const [createPayment, { loading: creating, error: createError }] =
    useMutation(CREATE_PAYMENT, {
      refetchQueries: [
        { query: GET_PAYMENTS, variables: { filter: filters, pagination } },
      ],
      errorPolicy: "all",
    });

  const [updatePayment, { loading: updating, error: updateError }] =
    useMutation(UPDATE_PAYMENT, {
      errorPolicy: "all",
    });

  const [refundPayment, { loading: refunding, error: refundError }] =
    useMutation(REFUND_PAYMENT, {
      refetchQueries: [
        { query: GET_PAYMENTS, variables: { filter: filters, pagination } },
      ],
      errorPolicy: "all",
    });

  const [processPayment, { loading: processing, error: processError }] =
    useMutation(PROCESS_PAYMENT, {
      refetchQueries: [
        { query: GET_PAYMENTS, variables: { filter: filters, pagination } },
      ],
      errorPolicy: "all",
    });

  const handleCreatePayment = async (input: CreatePaymentInput) => {
    try {
      const { data } = await createPayment({ variables: { input } });
      return data?.createPayment;
    } catch (err) {
      throw new Error(getPaymentErrorMessage(err as ApolloError));
    }
  };

  const fetchPaymentByReference = async (
    reference: string,
    userId?: string
  ) => {
    try {
      const { data } = await fetchPaymentByReferenceQuery({
        variables: { reference, userId },
      });
      return data?.paymentByReference;
    } catch (err) {
      throw new Error("Error fetching payment by reference");
    }
  };

  const fetchOrderPaymentStatus = async (orderId: string) => {
    try {
      const { data } = await fetchOrderPaymentStatusQuery({
        variables: { orderId },
      });
      return data?.orderPaymentStatus;
    } catch (err) {
      throw new Error("Error fetching order payment status");
    }
  };

  const upsertPaymentFromEpayco = async (payload: string) => {
    try {
      const { data } = await upsertPaymentFromEpaycoMutation({
        variables: { payload },
      });
      return data?.upsertPaymentFromEpayco;
    } catch (err) {
      throw new Error("Error upserting payment from ePayco");
    }
  };

  const handleUpdatePayment = async (id: string, input: UpdatePaymentInput) => {
    try {
      const { data } = await updatePayment({ variables: { id, input } });
      return data?.updatePayment;
    } catch (err) {
      throw new Error(getPaymentErrorMessage(err as ApolloError));
    }
  };

  const handleRefundPayment = async (input: RefundPaymentInput) => {
    try {
      const { data } = await refundPayment({ variables: { input } });
      return data?.refundPayment;
    } catch (err) {
      throw new Error(getPaymentErrorMessage(err as ApolloError));
    }
  };

  const handleProcessPayment = async (id: string) => {
    try {
      const { data } = await processPayment({ variables: { id } });
      return data?.processPayment;
    } catch (err) {
      throw new Error(getPaymentErrorMessage(err as ApolloError));
    }
  };

  return {
    // Data
    payments: data?.payments || [],
    loading: loading || creating || updating || refunding || processing,
    error: error || createError || updateError || refundError || processError,

    // State
    filters,
    setFilters,
    pagination,
    setPagination,

    // Actions
    createPayment: handleCreatePayment,
    updatePayment: handleUpdatePayment,
    refundPayment: handleRefundPayment,
    processPayment: handleProcessPayment,
    fetchPaymentByReference,
    fetchOrderPaymentStatus,
    upsertPaymentFromEpayco,
    refetch,
  };
};

// Custom hook for single payment
export const usePayment = (id: string) => {
  const { data, loading, error, refetch } = useQuery(GET_PAYMENT, {
    variables: { id },
    skip: !id,
    errorPolicy: "all",
  });

  const { data: logsData, loading: logsLoading } = useQuery(GET_PAYMENT_LOGS, {
    variables: { paymentId: id },
    skip: !id,
    errorPolicy: "all",
  });

  return {
    payment: data?.payment as Payment | undefined,
    logs: logsData?.paymentLogs || [],
    loading: loading || logsLoading,
    error,
    refetch,
  };
};

// Custom hook for payment summary/dashboard
export const usePaymentSummary = (dateRange?: { from: string; to: string }) => {
  const { data, loading, error, refetch } = useQuery(GET_PAYMENT_SUMMARY, {
    variables: {
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to,
    },
    errorPolicy: "all",
  });

  return {
    summary: data?.paymentSummary as PaymentSummary | undefined,
    loading,
    error,
    refetch,
  };
};

// Hook for creating Wompi payments specifically
export const useWompiPayment = () => {
  const { createPayment, loading, error } = usePayments();

  const createWompiPayment = async (orderData: {
    amount: number;
    customerEmail: string;
    customerPhone?: string;
    orderId?: string;
    description?: string;
  }) => {
    return createPayment({
      amount: orderData.amount,
      currency: "COP",
      provider: "WOMPI" as any,
      paymentMethod: "CREDIT_CARD" as any,
      description: orderData.description || "Order payment",
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      orderId: orderData.orderId,
      externalReference: `order_${orderData.orderId}_${Date.now()}`,
    });
  };

  return {
    createWompiPayment,
    loading,
    error,
  };
};
