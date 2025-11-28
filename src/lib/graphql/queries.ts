import { gql } from '@apollo/client';

// Payment Mutations
export const CREATE_PAYMENT = gql`
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
      providerTransactionId
      referenceNumber
      createdAt
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

export const PROCESS_PAYMENT = gql`
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

export const UPDATE_PAYMENT = gql`
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

export const REFUND_PAYMENT = gql`
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

// Payment Queries
export const GET_PAYMENTS = gql`
  query GetPayments($filter: PaymentFilterInput, $pagination: PaymentPaginationInput) {
    payments(filter: $filter, pagination: $pagination) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      paymentType
      customerEmail
      customerPhone
      description
      externalReference
      providerTransactionId
      referenceNumber
      errorCode
      errorMessage
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

export const GET_PAYMENT = gql`
  query GetPayment($storeId: ID) {
    payment(storeId: $storeId) {
      id
      amount
      storeId
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
      refundAmount
      refundReason
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

// Additional queries requested for ePayco integration
export const GET_PAYMENT_BY_REFERENCE = gql`
  query GetPaymentByReference($reference: String!, $userId: String) {
    paymentByReference(reference: $reference, userId: $userId) {
      id
      status
      amount
      currency
      referenceNumber
      providerTransactionId
      completedAt
      failedAt
      errorCode
      errorMessage
      customerEmail
      paymentMethod
      createdAt
      updatedAt
      orderId
      user {
        id
      }
    }
  }
`;

export const GET_ORDER_PAYMENT_STATUS = gql`
  query GetOrderPaymentStatus($orderId: ID!) {
    orderPaymentStatus(orderId: $orderId)
  }
`;

export const GET_ORDER_PAYMENTS = gql`
  query GetOrderPayments($orderId: ID!) {
    payments(filter: { orderId: $orderId }, pagination: { take: 10, orderBy: "createdAt_desc" }) {
      id
      status
      amount
      currency
      referenceNumber
      providerTransactionId
      paymentMethod
      completedAt
      failedAt
      errorCode
      errorMessage
      createdAt
      providerMetadata
    }
  }
`;

export const GET_PAYMENT_BY_ID = gql`
  query GetPayment($id: ID!) {
    payment(id: $id) {
      id
      status
      amount
      currency
      referenceNumber
      providerTransactionId
      paymentMethod
      completedAt
      failedAt
      expiredAt
      errorCode
      errorMessage
      customerEmail
      customerPhone
      providerMetadata
      createdAt
      updatedAt
      orderId
      order {
        id
        status
        total
      }
    }
  }
`;

export const GET_PAYMENT_LOGS = gql`
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

export const UPSERT_PAYMENT_FROM_EPAYCO = gql`
  mutation ProcessEpaycoWebhook($payload: String!) {
    upsertPaymentFromEpayco(payload: $payload) {
      id
      status
      referenceNumber
      providerTransactionId
      amount
      completedAt
      providerMetadata
    }
  }
`;

export const GET_PAYMENT_SUMMARY = gql`
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

// Configuration Queries and Mutations
export const GET_PAYMENT_CONFIGURATIONS = gql`
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

export const CREATE_PAYMENT_CONFIGURATION = gql`
  mutation CreatePaymentConfiguration($input: CreatePaymentConfigurationInput!) {
    createPaymentConfiguration(input: $input) {
      id
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
      createdAt
    }
  }
`;

export const UPDATE_PAYMENT_CONFIGURATION = gql`
  mutation UpdatePaymentConfiguration($id: ID!, $input: UpdatePaymentConfigurationInput!) {
    updatePaymentConfiguration(id: $id, input: $input) {
      id
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
      updatedAt
    }
  }
`;

export const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: ID!, $input: UpdateOrderStatusInput!) {
    updateOrder(id: $id, input: $input) {
      id
      status
      updatedAt
      shipping
      tax
    }
  }
`;

export const ORDERS_BY_USER = gql`
  query OrdersByUser($userId: String!) {
    ordersByUser(userId: $userId) {
      id
      status
      createdAt
      updatedAt
      subtotal
      shipping
      tax
      total
      store {
        id
        name
        storeId
      }
      items {
        productId
        productName
        quantity
        unitPrice
      }
    }
  }
`;

// Categories Queries
export const GET_CATEGORIES_BY_STORE = gql`
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

// Product Reviews/Comments Queries
export const GET_PRODUCT_COMMENTS = gql`
  query GetProductComments($productId: String!) {
    productComments(productId: $productId) {
      id
      rating
      comment
      createdAt
    }
  }
`;

export const ADD_PRODUCT_COMMENT = gql`
  mutation AddProductComment($input: CreateProductCommentDto!) {
    addProductComment(input: $input) {
      id
      rating
      comment
      createdAt
    }
  }
`;
