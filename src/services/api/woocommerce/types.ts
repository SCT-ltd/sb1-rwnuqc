export interface WooCommerceProductData {
  name: string;
  type: 'variable';
  status: 'publish';
  description: string;
  short_description: string;
  categories: { id: number }[];
  images: { src: string }[];
  attributes: {
    name: string;
    visible: boolean;
    variation: boolean;
    options: string[];
  }[];
  variations: {
    regular_price: string;
    description: string;
    attributes: { name: string; option: string }[];
    stock_quantity: number;
    manage_stock: boolean;
    sku: string;
  }[];
  meta_data: {
    key: string;
    value: string;
  }[];
  sku: string;
}

export interface RequestOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}