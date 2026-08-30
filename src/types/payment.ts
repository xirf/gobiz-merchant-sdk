import type { PaymentTransactionStatusType } from '../constants/index.js';

export interface TransactionDetails {
  order_id: string;
  gross_amount: number;
  currency?: 'IDR' | string;
}

export interface ItemDetail {
  id?: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string | null;
}

export interface CustomerDetails {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface CreatePaymentTransactionRequest {
  payment_type: 'qris';
  transaction_details: TransactionDetails;
  item_details?: ItemDetail[];
  customer_details?: CustomerDetails;
  metadata?: Record<string, any>;
}

export interface ActionDetail {
  name: string;
  method: string;
  url: string;
}

export interface OutletReference {
  id: string;
  pop_id?: string;
}

export interface PaymentTransactionData {
  id: string;
  payment_type: 'qris' | string;
  status: PaymentTransactionStatusType | string;
  qris_string: string;
  order_id: string;
  gross_amount: number;
  currency: string;
  created_at?: string;
  settlement_at?: string | null;
}

export interface CreatePaymentTransactionResponse {
  outlet: OutletReference;
  transaction: PaymentTransactionData;
  actions: ActionDetail[];
}

export interface GetPaymentTransactionResponse {
  outlet: OutletReference;
  transaction: PaymentTransactionData;
  actions: ActionDetail[];
}
