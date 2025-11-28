/**
 * Utility functions for Wompi integration
 */

/**
 * Converts snake_case string to camelCase
 * @param str - The snake_case string to convert
 * @returns The camelCase string
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

/**
 * Converts camelCase string to snake_case
 * @param str - The camelCase string to convert
 * @returns The snake_case string
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Recursively converts an object's keys from snake_case to camelCase
 * @param obj - The object to convert
 * @returns A new object with camelCase keys
 */
export const convertSnakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertSnakeToCamel);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    converted[camelKey] = convertSnakeToCamel(value);
  }

  return converted;
};

/**
 * Recursively converts an object's keys from camelCase to snake_case
 * @param obj - The object to convert
 * @returns A new object with snake_case keys
 */
export const convertCamelToSnake = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertCamelToSnake);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    converted[snakeKey] = convertCamelToSnake(value);
  }

  return converted;
};

/**
 * Transforms Wompi data from any format to proper data-* attributes for the widget script
 * Handles both snake_case and camelCase input formats
 * @param data - The Wompi data object
 * @param paymentId - The payment ID for redirect URL
 * @returns Object with data-* attribute keys and string values
 */
export const transformToWompiScriptAttributes = (data: any, paymentId: string): { [key: string]: string } => {
  const transformed: { [key: string]: string } = {};

  // Helper function to get value from either format
  const getValue = (snakeKey: string, camelKey: string, defaultValue: string = ''): string => {
    return data[snakeKey]?.toString() || data[camelKey]?.toString() || defaultValue;
  };

  // Core payment data
  transformed['data-public-key'] = getValue('public-key', 'publicKey');
  transformed['data-currency'] = getValue('currency', 'currency');
  transformed['data-amount-in-cents'] = getValue('amount-in-cents', 'amountInCents');
  transformed['data-reference'] = getValue('reference', 'reference');
  transformed['data-signature:integrity'] = getValue('signature:integrity', 'integritySignature');
  transformed['data-expiration-time'] = getValue('expiration-time', 'expirationTime');

  // Always set redirect URL with payment ID
  transformed['data-redirect-url'] = `${window.location.origin}/orden-exitosa?payment=${paymentId}`;

  // Customer data
  transformed['data-customer-data:email'] = getValue('customer-data:email', 'customerEmail');
  transformed['data-customer-data:full-name'] = getValue('customer-data:full-name', 'customerFullName');
  transformed['data-customer-data:phone-number'] = getValue('customer-data:phone', 'customerPhoneNumber');
  transformed['data-customer-data:legal-id'] = getValue('customer-data:legal-id', 'customerLegalId');
  transformed['data-customer-data:legal-id-type'] = getValue(
    'customer-data:legal-id-type',
    'customerLegalIdType',
    'CC'
  );

  // Shipping address
  transformed['data-shipping-address:address-line-1'] = getValue(
    'shipping-address:address-line-1',
    'shippingAddressLine1'
  );
  transformed['data-shipping-address:country'] = getValue('shipping-address:country', 'shippingCountry', 'CO');
  transformed['data-shipping-address:phone-number'] = getValue('shipping-address:phone-number', 'shippingPhoneNumber');
  transformed['data-shipping-address:city'] = getValue('shipping-address:city', 'shippingCity');
  transformed['data-shipping-address:region'] = getValue('shipping-address:region', 'shippingRegion');
  transformed['data-shipping-address:name'] =
    getValue('shipping-address:name', 'shippingName') || getValue('customer-data:full-name', 'customerFullName');

  // Tax information
  transformed['data-tax-in-cents:vat'] = getValue('tax-in-cents:vat', 'taxVatInCents', '0');
  transformed['data-tax-in-cents:consumption'] = getValue('tax-in-cents:consumption', 'taxConsumptionInCents', '0');

  // Payment methods
  if (data['payment-methods'] || data.paymentMethods) {
    transformed['data-payment-methods'] = getValue('payment-methods', 'paymentMethods');
  }

  // Filter out undefined/empty values
  const filtered: { [key: string]: string } = {};
  Object.entries(transformed).forEach(([key, value]) => {
    if (value && value !== 'undefined' && value !== 'null') {
      filtered[key] = value;
    }
  });

  return filtered;
};

/**
 * Creates and configures a Wompi widget script element with the provided data
 * @param data - The Wompi data object
 * @param paymentId - The payment ID for redirect URL
 * @returns Configured script element ready to be appended to DOM
 */
export const createWompiWidgetScript = (data: any, paymentId: string): HTMLScriptElement => {
  const script = document.createElement('script');
  script.src = 'https://checkout.wompi.co/widget.js';
  script.setAttribute('data-render', 'button');

  // Transform and set all attributes
  const attributes = transformToWompiScriptAttributes(data, paymentId);
  Object.entries(attributes).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });
  return script;
};

/**
 * Initializes the Wompi widget in the specified container
 * @param containerId - ID of the container element
 * @param data - The Wompi data object
 * @param paymentId - The payment ID for redirect URL
 * @returns Whether the widget was successfully initialized
 */
export const initializeWompiWidget = (containerId: string, data: any, paymentId: string): boolean => {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found`);
    return false;
  }

  // Create the script
  const script = createWompiWidgetScript(data, paymentId);

  // Create form wrapper
  const form = document.createElement('form');
  form.appendChild(script);

  // Clear container and add form
  container.innerHTML = '';
  container.appendChild(form);

  return true;
};
