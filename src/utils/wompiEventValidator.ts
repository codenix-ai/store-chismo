import crypto from 'crypto';

export interface WompiEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      payment_method: {
        type: string;
        extra: any;
      };
      status: string;
      status_message?: string;
      created_at: string;
      finalized_at?: string;
      shipping_address?: any;
      redirect_url: string;
      payment_source_id?: string;
      payment_link_id?: string;
      customer_data?: any;
      billing_data?: any;
    };
  };
  environment: 'test' | 'prod';
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at: string;
}

/**
 * Validates a Wompi event signature according to the official documentation
 * https://docs.wompi.co/docs/colombia/eventos/
 */
export class WompiEventValidator {
  private eventsSecret: string;

  constructor(eventsSecret: string) {
    this.eventsSecret = eventsSecret;
  }

  /**
   * Validates the authenticity of a Wompi event
   * @param event - The Wompi event object
   * @returns true if the event is authentic, false otherwise
   */
  validateEvent(event: WompiEvent): boolean {
    try {
      const calculatedChecksum = this.calculateChecksum(event);
      return calculatedChecksum.toUpperCase() === event.signature.checksum.toUpperCase();
    } catch (error) {
      console.error('Error validating Wompi event:', error);
      return false;
    }
  }

  /**
   * Calculates the checksum for a Wompi event according to documentation
   * Step by step process:
   * 1. Concatenate property values from signature.properties
   * 2. Concatenate timestamp
   * 3. Concatenate events secret
   * 4. Generate SHA256 hash
   */
  private calculateChecksum(event: WompiEvent): string {
    // Step 1: Concatenate property values according to signature.properties
    let concatenatedString = '';

    for (const property of event.signature.properties) {
      const value = this.getNestedProperty(event.data, property);
      concatenatedString += String(value);
    }

    // Step 2: Concatenate timestamp
    concatenatedString += String(event.timestamp);

    // Step 3: Concatenate events secret
    concatenatedString += this.eventsSecret;

    // Step 4: Generate SHA256 hash
    const checksum = crypto.createHash('sha256').update(concatenatedString).digest('hex');

    return checksum.toUpperCase();
  }

  /**
   * Gets a nested property value from an object using dot notation
   * Example: 'transaction.id' returns data.transaction.id
   */
  private getNestedProperty(obj: any, propertyPath: string): any {
    return propertyPath.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Validates that the event is not too old (prevents replay attacks)
   * @param event - The Wompi event
   * @param maxAgeMinutes - Maximum age in minutes (default: 60)
   * @returns true if the event is within the acceptable age
   */
  validateEventAge(event: WompiEvent, maxAgeMinutes: number = 60): boolean {
    const eventTime = event.timestamp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    return currentTime - eventTime <= maxAge;
  }

  /**
   * Validates that the event environment matches expected environment
   * @param event - The Wompi event
   * @param expectedEnvironment - Expected environment ('test' or 'prod')
   * @returns true if environment matches
   */
  validateEnvironment(event: WompiEvent, expectedEnvironment: 'test' | 'prod'): boolean {
    return event.environment === expectedEnvironment;
  }
}

/**
 * Maps Wompi transaction status to internal payment status
 */
export const mapWompiTransactionStatus = (wompiStatus: string): 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING' => {
  switch (wompiStatus.toUpperCase()) {
    case 'APPROVED':
      return 'COMPLETED';
    case 'DECLINED':
      return 'FAILED';
    case 'VOIDED':
      return 'CANCELLED';
    case 'ERROR':
      return 'FAILED';
    case 'PENDING':
    default:
      return 'PENDING';
  }
};

/**
 * Utility to safely parse Wompi webhook body
 */
export const parseWompiWebhook = (body: string): WompiEvent | null => {
  try {
    const event = JSON.parse(body) as WompiEvent;

    // Validate required fields
    if (!event.event || !event.data || !event.signature || !event.timestamp) {
      console.error('Invalid Wompi webhook: missing required fields');
      return null;
    }

    return event;
  } catch (error) {
    console.error('Error parsing Wompi webhook body:', error);
    return null;
  }
};

/**
 * Checks if the event type should be processed
 */
export const shouldProcessEvent = (eventType: string): boolean => {
  const processableEvents = ['transaction.updated', 'nequi_token.updated', 'bancolombia_transfer_token.updated'];

  return processableEvents.includes(eventType);
};

/**
 * Extracts transaction info for logging and processing
 */
export const extractTransactionInfo = (event: WompiEvent) => {
  const transaction = event.data.transaction;

  return {
    transactionId: transaction.id,
    reference: transaction.reference,
    status: transaction.status,
    amount: transaction.amount_in_cents,
    currency: transaction.currency,
    paymentMethod: transaction.payment_method_type,
    customerEmail: transaction.customer_email,
    statusMessage: transaction.status_message,
    environment: event.environment,
    eventType: event.event,
    timestamp: new Date(event.timestamp * 1000).toISOString(),
  };
};
