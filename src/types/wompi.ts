export interface WompiThreeDSAuth {
  current_step: string;
  current_step_status: string;
}

export interface WompiPaymentMethodExtra {
  bin: string;
  name: string;
  brand: string;
  exp_year: string;
  card_type: string;
  exp_month: string;
  last_four: string;
  card_holder: string;
  is_three_ds: boolean;
  three_ds_auth: WompiThreeDSAuth;
  three_ds_auth_type: string | null;
  external_identifier: string;
  processor_response_code: string;
}

export interface WompiPaymentMethod {
  type: string;
  extra: WompiPaymentMethodExtra;
  installments: number;
  is_click_to_pay: boolean;
}

export interface WompiBillingData {
  legal_id_type: string;
  legal_id: string;
}

export interface WompiShippingAddress {
  name: string;
  address_line_1: string;
  city: string;
  region: string;
  country: string;
  phone_number: string;
  shipping_fee?: number; // Add shipping_fee property
}

export interface WompiBrowserInfo {
  browser_tz: string;
  browser_language: string;
  browser_user_agent: string;
  browser_color_depth: string;
  browser_screen_width: string;
  browser_screen_height: string;
}

export interface WompiCustomerData {
  legal_id: string;
  device_id: string;
  full_name: string;
  browser_info: WompiBrowserInfo;
  phone_number: string;
  legal_id_type: string;
  device_data_token: string;
}

export interface WompiTax {
  type: string;
  amount_in_cents: number;
}

export interface WompiMerchant {
  id: number;
  name: string;
  legal_name: string;
  contact_name: string;
  phone_number: string;
  logo_url: string | null;
  legal_id_type: string;
  email: string;
  legal_id: string;
  public_key: string;
}

export interface WompiTransactionData {
  id: string;
  created_at: string;
  finalized_at: string | null;
  amount_in_cents: number;
  reference: string;
  customer_email: string;
  currency: string;
  payment_method_type: string;
  payment_method: WompiPaymentMethod;
  status: string;
  status_message: string | null;
  billing_data: WompiBillingData;
  shipping_address: WompiShippingAddress;
  redirect_url: string;
  payment_source_id: string | null;
  payment_link_id: string | null;
  customer_data: WompiCustomerData;
  bill_id: string | null;
  taxes: WompiTax[];
  tip_in_cents: number | null;
  merchant: WompiMerchant;
  entries: any[];
  disbursement: any | null;
  refunds: any[];
}

export interface WompiTransactionResponse {
  data: WompiTransactionData;
  meta: Record<string, any>;
}

// Legacy interface for backward compatibility
export interface WompiTransaction {
  id: string;
  status: string;
  status_message: string;
  amount_in_cents: number;
  currency: string;
  payment_method: {
    type: string;
    extra: any;
  };
  reference: string;
  created_at: string;
  finalized_at?: string;
  payment_source_id?: string;
}
