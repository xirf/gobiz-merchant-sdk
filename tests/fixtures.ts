import type { GoBizConfig } from '../src/types/common.js';
import type { CreatePaymentTransactionRequest } from '../src/types/payment.js';
import type { FoodCatalog } from '../src/types/food.js';

export const TEST_CONFIG: GoBizConfig = {
  clientId: 'test_client_id_gobiz_123',
  clientSecret: 'test_client_secret_gobiz_xyz',
  outletId: 'G000012345',
  isProductionMode: false,
};

export const sampleTransactionRequest: CreatePaymentTransactionRequest = {
  payment_type: 'qris',
  transaction_details: {
    order_id: 'ORDER-TEST-001',
    gross_amount: 50000,
    currency: 'IDR',
  },
  item_details: [
    {
      id: 'SKU-001',
      name: 'Nasi Goreng Spesial',
      price: 35000,
      quantity: 1,
      brand: 'Warung Enak',
      category: 'Food',
    },
    {
      id: 'SKU-002',
      name: 'Es Teh Manis',
      price: 15000,
      quantity: 1,
      brand: 'Warung Enak',
      category: 'Beverage',
    },
  ],
  customer_details: {
    first_name: 'Budi',
    last_name: 'Santoso',
    email: 'budi.santoso@example.com',
    phone: '+6281234567890',
  },
};

export const sampleFoodCatalog: FoodCatalog = {
  categories: [
    {
      id: 'CAT-001',
      name: 'Main Course',
      items: [
        {
          id: 'ITEM-001',
          name: 'Nasi Goreng Spesial',
          price: 35000,
          description: 'Nasi goreng dengan telur dan ayam suwir',
          in_stock: true,
        },
      ],
    },
  ],
};
