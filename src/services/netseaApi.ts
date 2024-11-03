import { Settings } from '../hooks/useSettings';
import { addLogEntry } from './logService';

export interface Supplier {
  id: number;
  corp_name: string;
  status: string;
}

export interface ProductVariant {
  direct_item_id: string;
  label: string;
  price: number;
  set_num: number;
  sold_out_flag: 'Y' | 'N';
}

export interface Product {
  product_id: string;
  product_name: string;
  description?: string;
  category_id: string;
  image_url_1: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  image_url_5?: string;
  update_date: string;
  set: ProductVariant[];
}

export interface Category {
  id: number;
  name: string;
}

export interface BaseProduct {
  product_id: string;
  title: string;
  price: number;
  stock: number;
  img_url: string;
  url: string;
  updated_at: string;
}

export async function fetchSuppliers(settings: Settings): Promise<{ data: Supplier[] }> {
  if (!settings.netseaApiKey) {
    throw new Error('NETSEAのAPIキーが設定されていません。設定画面でAPIキーを設定してください。');
  }

  const url = 'https://api.netsea.jp/buyer/v1/suppliers';

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${settings.netseaApiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NETSEA API エラー (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: 'サプライヤー情報を取得しました',
      details: `取得件数: ${data.data.length}件`
    });

    return data;
  } catch (error) {
    await addLogEntry({
      type: 'error',
      category: 'sync',
      message: 'サプライヤー情報の取得に失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    });
    throw error;
  }
}

export async function fetchSupplierProducts(
  settings: Settings,
  supplierId?: number,
  nextDirectItemId?: string
): Promise<{ data: Product[]; next_direct_item_id?: string }> {
  if (!settings.netseaApiKey) {
    throw new Error('NETSEAのAPIキーが設定されていません。設定画面でAPIキーを設定してください。');
  }

  const url = 'https://api.netsea.jp/buyer/v1/items';
  const formData = new URLSearchParams();

  if (supplierId) {
    formData.append('supplier_ids', supplierId.toString());
  }

  if (nextDirectItemId) {
    formData.append('next_direct_item_id', nextDirectItemId);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.netseaApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NETSEA API エラー (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: '商品情報を取得しました',
      details: `取得件数: ${data.data.length}件${nextDirectItemId ? `\n次のページID: ${nextDirectItemId}` : ''}`
    });

    return {
      data: data.data,
      next_direct_item_id: data.next_direct_item_id
    };
  } catch (error) {
    await addLogEntry({
      type: 'error',
      category: 'sync',
      message: '商品情報の取得に失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    });
    throw error;
  }
}

export async function fetchNetseaCategories(settings: Settings): Promise<Category[]> {
  if (!settings.netseaApiKey) {
    throw new Error('NETSEAのAPIキーが設定されていません');
  }

  const url = 'https://api.netsea.jp/buyer/v1/categories';

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${settings.netseaApiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NETSEA API エラー (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: 'カテゴリ情報を取得しました',
      details: `取得件数: ${data.length}件`
    });

    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
    }));

  } catch (error) {
    await addLogEntry({
      type: 'error',
      category: 'sync',
      message: 'カテゴリ情報の取得に失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    });
    throw error;
  }
}

export async function fetchBaseProducts(settings: Settings): Promise<BaseProduct[]> {
  if (!settings.baseApiKey) {
    throw new Error('BASE APIキーが設定されていません。設定画面でAPIキーを設定してください。');
  }

  const url = 'https://api.thebase.in/1/items';
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${settings.baseApiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BASE API エラー (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: 'BASE商品情報を取得しました',
      details: `取得件数: ${data.length}件`
    });

    return data;
  } catch (error) {
    await addLogEntry({
      type: 'error',
      category: 'sync',
      message: 'BASE商品情報の取得に失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    });
    throw error;
  }
}