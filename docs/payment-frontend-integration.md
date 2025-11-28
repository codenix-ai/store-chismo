# Payment System Frontend Integration Guide

## Overview

This guide covers how to integrate the payment system API into your React frontend application. The payment system provides comprehensive GraphQL APIs for managing payments, configurations, and analytics with multi-provider support (Wompi, MercadoPago, Epayco).

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [GraphQL Setup](#graphql-setup)
3. [Payment Operations](#payment-operations)
4. [Configuration Management](#configuration-management)
5. [Analytics & Reporting](#analytics--reporting)
6. [Error Handling](#error-handling)
7. [TypeScript Types](#typescript-types)
8. [React Hooks Examples](#react-hooks-examples)
9. [Complete Component Examples](#complete-component-examples)

## Authentication & Authorization

### Required Headers
All requests must include JWT authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
};
```

### User Roles
- **Store Owner**: Can manage payments for their store
- **Admin**: Can access all stores and administrative functions

## GraphQL Setup

### Apollo Client Configuration

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql', // Your backend URL
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
```

## Payment Operations

### 1. Create Payment

```typescript
import { gql, useMutation } from '@apollo/client';

const CREATE_PAYMENT = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      description
      customerEmail
      customerPhone
      externalReference
      createdAt
      order {
        id
        total
      }
    }
  }
`;

// Usage in component
const [createPayment, { loading, error }] = useMutation(CREATE_PAYMENT);

const handleCreatePayment = async (paymentData) => {
  try {
    const { data } = await createPayment({
      variables: {
        input: {
          amount: 50000, // Amount in cents (500.00 COP)
          currency: "COP",
          description: "Order payment",
          provider: "WOMPI",
          paymentMethod: "CREDIT_CARD",
          customerEmail: "customer@example.com",
          customerPhone: "+573001234567",
          orderId: "order-123", // Optional
          externalReference: "ref-456" // Optional
        }
      }
    });
    console.log('Payment created:', data.createPayment);
  } catch (err) {
    console.error('Error creating payment:', err);
  }
};
```

### 2. Get Payments List

```typescript
const GET_PAYMENTS = gql`
  query GetPayments(
    $filter: PaymentFilterInput
    $pagination: PaymentPaginationInput
  ) {
    payments(filter: $filter, pagination: $pagination) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      customerEmail
      description
      createdAt
      updatedAt
      order {
        id
        total
      }
      store {
        id
        name
      }
    }
  }
`;

// Usage with filters
const { data, loading, error, refetch } = useQuery(GET_PAYMENTS, {
  variables: {
    filter: {
      status: "COMPLETED",
      provider: "WOMPI",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31"
    },
    pagination: {
      skip: 0,
      take: 20,
      orderBy: "createdAt_desc"
    }
  }
});
```

### 3. Get Single Payment

```typescript
const GET_PAYMENT = gql`
  query GetPayment($id: ID!) {
    payment(id: $id) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      paymentType
      description
      customerEmail
      customerPhone
      customerDocument
      customerDocumentType
      providerTransactionId
      referenceNumber
      externalReference
      errorCode
      errorMessage
      notes
      createdAt
      updatedAt
      completedAt
      failedAt
      refundedAt
      order {
        id
        total
        status
      }
      store {
        id
        name
      }
    }
  }
`;
```

### 4. Process Payment

```typescript
const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($id: ID!) {
    processPayment(id: $id) {
      id
      status
      providerTransactionId
      errorMessage
      completedAt
      failedAt
    }
  }
`;

const [processPayment] = useMutation(PROCESS_PAYMENT);

const handleProcessPayment = async (paymentId) => {
  try {
    const { data } = await processPayment({
      variables: { id: paymentId }
    });
    console.log('Payment processed:', data.processPayment);
  } catch (err) {
    console.error('Error processing payment:', err);
  }
};
```

### 5. Update Payment

```typescript
const UPDATE_PAYMENT = gql`
  mutation UpdatePayment($id: ID!, $input: UpdatePaymentInput!) {
    updatePayment(id: $id, input: $input) {
      id
      status
      providerTransactionId
      referenceNumber
      errorCode
      errorMessage
      notes
      updatedAt
    }
  }
`;

const [updatePayment] = useMutation(UPDATE_PAYMENT);

const handleUpdatePayment = async (paymentId, updates) => {
  try {
    const { data } = await updatePayment({
      variables: {
        id: paymentId,
        input: updates
      }
    });
    console.log('Payment updated:', data.updatePayment);
  } catch (err) {
    console.error('Error updating payment:', err);
  }
};
```

### 6. Refund Payment

```typescript
const REFUND_PAYMENT = gql`
  mutation RefundPayment($input: RefundPaymentInput!) {
    refundPayment(input: $input) {
      id
      status
      refundAmount
      refundReason
      refundedAt
    }
  }
`;

const [refundPayment] = useMutation(REFUND_PAYMENT);

const handleRefundPayment = async (paymentId, amount, reason) => {
  try {
    const { data } = await refundPayment({
      variables: {
        input: {
          paymentId,
          amount, // Optional - if not provided, full refund
          reason,
          notes: "Customer requested refund"
        }
      }
    });
    console.log('Payment refunded:', data.refundPayment);
  } catch (err) {
    console.error('Error refunding payment:', err);
  }
};
```

### 7. Get Payment Logs

```typescript
const GET_PAYMENT_LOGS = gql`
  query GetPaymentLogs($paymentId: ID!) {
    paymentLogs(paymentId: $paymentId) {
      id
      action
      oldStatus
      newStatus
      changeReason
      changedBy
      notes
      createdAt
    }
  }
`;
```

## Configuration Management

### 1. Get Payment Configurations

```typescript
const GET_PAYMENT_CONFIGURATIONS = gql`
  query GetPaymentConfigurations {
    paymentConfigurations {
      id
      storeId
      wompiEnabled
      wompiPublicKey
      wompiTestMode
      mercadoPagoEnabled
      mercadoPagoPublicKey
      mercadoPagoTestMode
      epaycoEnabled
      epaycoPublicKey
      epaycoTestMode
      defaultCurrency
      autoCapture
      webhookUrl
      successUrl
      cancelUrl
      fraudCheckEnabled
      maxDailyAmount
      maxTransactionAmount
      createdAt
      updatedAt
    }
  }
`;
```

### 2. Create Payment Configuration

```typescript
const CREATE_PAYMENT_CONFIGURATION = gql`
  mutation CreatePaymentConfiguration($input: CreatePaymentConfigurationInput!) {
    createPaymentConfiguration(input: $input) {
      id
      wompiEnabled
      mercadoPagoEnabled
      epaycoEnabled
      defaultCurrency
      autoCapture
    }
  }
`;

const [createConfig] = useMutation(CREATE_PAYMENT_CONFIGURATION);

const handleCreateConfiguration = async (configData) => {
  try {
    const { data } = await createConfig({
      variables: {
        input: {
          wompiEnabled: true,
          wompiApiKey: "prv_test_xxxxx",
          wompiPublicKey: "pub_test_xxxxx",
          wompiTestMode: true,
          defaultCurrency: "COP",
          autoCapture: true,
          webhookUrl: "https://yourdomain.com/webhook/wompi",
          successUrl: "https://yourdomain.com/payment/success",
          cancelUrl: "https://yourdomain.com/payment/cancel"
        }
      }
    });
    console.log('Configuration created:', data.createPaymentConfiguration);
  } catch (err) {
    console.error('Error creating configuration:', err);
  }
};
```

### 3. Update Payment Configuration

```typescript
const UPDATE_PAYMENT_CONFIGURATION = gql`
  mutation UpdatePaymentConfiguration($id: ID!, $input: UpdatePaymentConfigurationInput!) {
    updatePaymentConfiguration(id: $id, input: $input) {
      id
      wompiEnabled
      mercadoPagoEnabled
      epaycoEnabled
      defaultCurrency
      autoCapture
      updatedAt
    }
  }
`;
```

## Analytics & Reporting

### 1. Get Payment Summary

```typescript
const GET_PAYMENT_SUMMARY = gql`
  query GetPaymentSummary($dateFrom: String, $dateTo: String) {
    paymentSummary(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalPayments
      completedPayments
      totalAmount
      completedAmount
      refundedAmount
      successRate
      byProvider {
        provider
        count
        amount
      }
      byMethod {
        method
        count
        amount
      }
      byStatus {
        status
        count
        amount
      }
    }
  }
`;

// Usage in component
const { data: summaryData } = useQuery(GET_PAYMENT_SUMMARY, {
  variables: {
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  }
});
```

## Error Handling

### GraphQL Error Handling

```typescript
import { ApolloError } from '@apollo/client';

const handleGraphQLError = (error: ApolloError) => {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }
  
  if (error.networkError) {
    console.error('Network error:', error.networkError);
  }
};

// In component
const [createPayment, { loading, error }] = useMutation(CREATE_PAYMENT, {
  onError: handleGraphQLError
});
```

### Common Error Scenarios

```typescript
const getErrorMessage = (error: ApolloError): string => {
  if (error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    
    switch (graphQLError.message) {
      case 'Payment not found':
        return 'The payment you are looking for does not exist.';
      case 'Store not found':
        return 'Store configuration is missing.';
      case 'Only completed payments can be refunded':
        return 'This payment cannot be refunded in its current state.';
      default:
        return graphQLError.message;
    }
  }
  
  if (error.networkError) {
    return 'Network error. Please check your connection.';
  }
  
  return 'An unexpected error occurred.';
};
```

## TypeScript Types

### Payment Types

```typescript
export enum PaymentProvider {
  WOMPI = 'WOMPI',
  MERCADO_PAGO = 'MERCADO_PAGO',
  EPAYCO = 'EPAYCO',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  OTHER = 'OTHER'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PSE = 'PSE',
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',
  EFECTY = 'EFECTY',
  BALOTO = 'BALOTO',
  PHYSICAL_PAYMENT = 'PHYSICAL_PAYMENT',
  CASH = 'CASH',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  CHARGEBACK = 'CHARGEBACK'
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  paymentType: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  customerEmail?: string;
  customerPhone?: string;
  externalReference?: string;
  providerTransactionId?: string;
  referenceNumber?: string;
  errorCode?: string;
  errorMessage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  orderId?: string;
  userId?: string;
  storeId: string;
}

export interface CreatePaymentInput {
  amount: number;
  currency?: string;
  description?: string;
  paymentType?: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  externalReference?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocumentType?: string;
  customerDocument?: string;
  orderId?: string;
  userId?: string;
}

export interface PaymentFilter {
  status?: PaymentStatus;
  provider?: PaymentProvider;
  paymentMethod?: PaymentMethod;
  paymentType?: string;
  orderId?: string;
  userId?: string;
  customerEmail?: string;
  referenceNumber?: string;
  providerTransactionId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentPagination {
  skip?: number;
  take?: number;
  orderBy?: string;
}
```

## React Hooks Examples

### Custom Payment Hook

```typescript
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';

export const usePayments = () => {
  const [filters, setFilters] = useState<PaymentFilter>({});
  const [pagination, setPagination] = useState<PaymentPagination>({
    skip: 0,
    take: 20,
    orderBy: 'createdAt_desc'
  });

  const { data, loading, error, refetch } = useQuery(GET_PAYMENTS, {
    variables: { filter: filters, pagination }
  });

  const [createPayment, { loading: creating }] = useMutation(CREATE_PAYMENT, {
    refetchQueries: [{ query: GET_PAYMENTS, variables: { filter: filters, pagination } }]
  });

  const [updatePayment, { loading: updating }] = useMutation(UPDATE_PAYMENT);
  const [refundPayment, { loading: refunding }] = useMutation(REFUND_PAYMENT);

  return {
    payments: data?.payments || [],
    loading: loading || creating || updating || refunding,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    createPayment,
    updatePayment,
    refundPayment,
    refetch
  };
};
```

### Payment Summary Hook

```typescript
export const usePaymentSummary = (dateRange?: { from: string; to: string }) => {
  const { data, loading, error } = useQuery(GET_PAYMENT_SUMMARY, {
    variables: {
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to
    }
  });

  return {
    summary: data?.paymentSummary,
    loading,
    error
  };
};
```

## Complete Component Examples

### Payment List Component

```typescript
import React from 'react';
import { usePayments } from './hooks/usePayments';

export const PaymentList: React.FC = () => {
  const { payments, loading, error, filters, setFilters } = usePayments();

  if (loading) return <div>Loading payments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="payment-list">
      <h2>Payments</h2>
      
      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as PaymentStatus })}
        >
          <option value="">All Statuses</option>
          {Object.values(PaymentStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        
        <select
          value={filters.provider || ''}
          onChange={(e) => setFilters({ ...filters, provider: e.target.value as PaymentProvider })}
        >
          <option value="">All Providers</option>
          {Object.values(PaymentProvider).map(provider => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
      </div>

      {/* Payment Table */}
      <table className="payment-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Provider</th>
            <th>Method</th>
            <th>Customer</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.id.substring(0, 8)}...</td>
              <td>${(payment.amount / 100).toFixed(2)} {payment.currency}</td>
              <td>
                <span className={`status status-${payment.status.toLowerCase()}`}>
                  {payment.status}
                </span>
              </td>
              <td>{payment.provider}</td>
              <td>{payment.paymentMethod}</td>
              <td>{payment.customerEmail}</td>
              <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
              <td>
                <PaymentActions payment={payment} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Payment Creation Form

```typescript
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';

export const CreatePaymentForm: React.FC = () => {
  const [formData, setFormData] = useState<CreatePaymentInput>({
    amount: 0,
    currency: 'COP',
    provider: PaymentProvider.WOMPI,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    description: '',
    customerEmail: '',
    customerPhone: ''
  });

  const [createPayment, { loading, error }] = useMutation(CREATE_PAYMENT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data } = await createPayment({
        variables: { input: formData }
      });
      
      console.log('Payment created:', data.createPayment);
      // Redirect or show success message
    } catch (err) {
      console.error('Error creating payment:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-payment-form">
      <h2>Create Payment</h2>
      
      <div className="form-group">
        <label>Amount (in cents)</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="form-group">
        <label>Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        >
          <option value="COP">COP</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="form-group">
        <label>Provider</label>
        <select
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value as PaymentProvider })}
        >
          {Object.values(PaymentProvider).map(provider => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <select
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
        >
          {Object.values(PaymentMethod).map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Customer Email</label>
        <input
          type="email"
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Customer Phone</label>
        <input
          type="tel"
          value={formData.customerPhone}
          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
        />
      </div>

      {error && <div className="error">{error.message}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Payment'}
      </button>
    </form>
  );
};
```

### Payment Dashboard Component

```typescript
import React from 'react';
import { usePaymentSummary } from './hooks/usePaymentSummary';

export const PaymentDashboard: React.FC = () => {
  const { summary, loading, error } = usePaymentSummary();

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!summary) return <div>No data available</div>;

  return (
    <div className="payment-dashboard">
      <h2>Payment Dashboard</h2>
      
      <div className="summary-cards">
        <div className="card">
          <h3>Total Payments</h3>
          <p className="value">{summary.totalPayments}</p>
        </div>
        
        <div className="card">
          <h3>Completed Payments</h3>
          <p className="value">{summary.completedPayments}</p>
        </div>
        
        <div className="card">
          <h3>Total Amount</h3>
          <p className="value">${(summary.totalAmount / 100).toFixed(2)}</p>
        </div>
        
        <div className="card">
          <h3>Success Rate</h3>
          <p className="value">{summary.successRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-section">
          <h3>By Provider</h3>
          {summary.byProvider.map((item) => (
            <div key={item.provider} className="chart-item">
              <span>{item.provider}</span>
              <span>{item.count} payments</span>
              <span>${(item.amount / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="chart-section">
          <h3>By Status</h3>
          {summary.byStatus.map((item) => (
            <div key={item.status} className="chart-item">
              <span>{item.status}</span>
              <span>{item.count} payments</span>
              <span>${(item.amount / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Best Practices

### 1. Error Handling
- Always handle GraphQL errors appropriately
- Show user-friendly error messages
- Implement retry logic for network errors

### 2. Loading States
- Show loading indicators during operations
- Disable buttons during async operations
- Use skeleton loaders for better UX

### 3. Data Management
- Use Apollo Client cache effectively
- Implement proper refetch strategies
- Consider using subscriptions for real-time updates

### 4. Security
- Never expose API keys in frontend code
- Validate user permissions before showing UI elements
- Sanitize user inputs

### 5. Performance
- Use pagination for large datasets
- Implement proper filtering and sorting
- Cache frequently accessed data

This documentation provides a comprehensive guide for integrating the payment system into your React frontend. The examples show real-world usage patterns and best practices for building a robust payment interface.