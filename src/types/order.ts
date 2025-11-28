// Order types based on GraphQL schema

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  store: {
    id: string;
    name: string;
    storeId: string;
  };
  items: OrderItem[];
}

export interface OrdersQueryResponse {
  ordersByUser: Order[];
}
