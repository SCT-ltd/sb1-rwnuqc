// ... 既存の型定義は維持

export interface WooCommerceProduct {
  id: string;
  original_product_id: string;
  name: string;
  price: number;
  stock_quantity: number;
  images: { src: string }[];
  permalink: string;
  date_created: string;
  date_modified: string;
  status: 'publish' | 'draft' | 'private';
  categories: { id: number; name: string }[];
  sku: string;
  variations?: {
    id: number;
    sku: string;
    stock_quantity: number;
  }[];
}