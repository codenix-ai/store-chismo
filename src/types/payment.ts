// Payment Types
export enum PaymentProvider {
  WOMPI = 'WOMPI',
  MERCADO_PAGO = 'MERCADO_PAGO',
  EPAYCO = 'EPAYCO',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  OTHER = 'OTHER',
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
  OTHER = 'OTHER',
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
  CHARGEBACK = 'CHARGEBACK',
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
  customerDocument?: string;
  customerDocumentType?: string;
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
  order?: {
    id: string;
    total: number;
    status: string;
  };
  store?: {
    id: string;
    name: string;
  };
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

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  providerTransactionId?: string;
  referenceNumber?: string;
  errorCode?: string;
  errorMessage?: string;
  notes?: string;
}

export interface RefundPaymentInput {
  paymentId: string;
  amount?: number;
  reason: string;
  notes?: string;
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

export interface PaymentLog {
  id: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  changeReason: string;
  changedBy: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentSummary {
  totalPayments: number;
  completedPayments: number;
  totalAmount: number;
  completedAmount: number;
  refundedAmount: number;
  successRate: number;
  byProvider: Array<{
    provider: string;
    count: number;
    amount: number;
  }>;
  byMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

// Configuration Types
export interface PaymentConfiguration {
  id: string;
  storeId: string;
  wompiEnabled: boolean;
  wompiPublicKey?: string;
  wompiTestMode: boolean;
  mercadoPagoEnabled: boolean;
  mercadoPagoPublicKey?: string;
  mercadoPagoTestMode: boolean;
  epaycoEnabled: boolean;
  epaycoPublicKey?: string;
  epaycoTestMode: boolean;
  defaultCurrency: string;
  autoCapture: boolean;
  webhookUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  fraudCheckEnabled: boolean;
  maxDailyAmount?: number;
  maxTransactionAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentConfigurationInput {
  wompiEnabled?: boolean;
  wompiApiKey?: string;
  wompiPublicKey?: string;
  wompiTestMode?: boolean;
  mercadoPagoEnabled?: boolean;
  mercadoPagoApiKey?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoTestMode?: boolean;
  epaycoEnabled?: boolean;
  epaycoApiKey?: string;
  epaycoPublicKey?: string;
  epaycoTestMode?: boolean;
  defaultCurrency?: string;
  autoCapture?: boolean;
  webhookUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  fraudCheckEnabled?: boolean;
  maxDailyAmount?: number;
  maxTransactionAmount?: number;
}

export interface UpdatePaymentConfigurationInput {
  wompiEnabled?: boolean;
  wompiApiKey?: string;
  wompiPublicKey?: string;
  wompiTestMode?: boolean;
  mercadoPagoEnabled?: boolean;
  mercadoPagoApiKey?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoTestMode?: boolean;
  epaycoEnabled?: boolean;
  epaycoApiKey?: string;
  epaycoPublicKey?: string;
  epaycoTestMode?: boolean;
  defaultCurrency?: string;
  autoCapture?: boolean;
  webhookUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  fraudCheckEnabled?: boolean;
  maxDailyAmount?: number;
  maxTransactionAmount?: number;
}
