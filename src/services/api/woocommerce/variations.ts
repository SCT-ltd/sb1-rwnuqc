import { getAuthHeader, fetchWithRetry, sleep } from './client';
import { addLogEntry } from '../../logService';
import { APIError } from './types';

const VARIATION_BATCH_SIZE = 1;
const VARIATION_RETRY_DELAY = 3000;
const MAX_RETRIES = 5;

interface VariationResponse {
  id: number;
  sku: string;
  stock_quantity: number;
  attributes?: Array<{
    name: string;
    option: string;
  }>;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  manage_stock?: boolean;
  status?: string;
}

async function handleVariationError(
  error: Error,
  productId: string,
  retryCount: number
): Promise<void> {
  const isRetryable = error instanceof APIError && error.status !== 404;
  const canRetry = retryCount < MAX_RETRIES;

  await addLogEntry({
    type: 'error',
    category: 'sync',
    message: `バリエーション取得エラー (商品ID: ${productId}, 試行: ${retryCount + 1}/${MAX_RETRIES})`,
    details: `エラー: ${error.message}\n再試行${canRetry ? '予定' : '上限到達'}`
  });

  if (!isRetryable || !canRetry) {
    throw error;
  }
}

export async function fetchProductVariations(
  apiUrl: string,
  authHeader: string,
  productId: string,
  retryCount = 0
): Promise<VariationResponse[]> {
  try {
    await sleep(retryCount * VARIATION_RETRY_DELAY);

    const response = await fetchWithRetry(
      `${apiUrl}/products/${productId}/variations?per_page=100`,
      {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        maxRetries: 2,
        retryDelay: 1000,
        timeout: 20000,
        cache: 'no-store'
      },
      `商品ID: ${productId} のバリエーション取得`
    );

    const variations = await response.json();
    
    if (!Array.isArray(variations)) {
      throw new APIError('Invalid variations response format', response.status);
    }

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: `バリエーション取得成功 (商品ID: ${productId})`,
      details: `${variations.length}個のバリエーションを取得しました`
    });

    return variations.map(variation => ({
      id: variation.id,
      sku: variation.sku || '',
      stock_quantity: variation.stock_quantity || 0,
      attributes: variation.attributes,
      price: variation.price,
      regular_price: variation.regular_price,
      sale_price: variation.sale_price,
      manage_stock: variation.manage_stock,
      status: variation.status
    }));
  } catch (error) {
    try {
      await handleVariationError(error instanceof Error ? error : new Error('Unknown error'), productId, retryCount);
      return fetchProductVariations(apiUrl, authHeader, productId, retryCount + 1);
    } catch (finalError) {
      console.error(`Failed to fetch variations for product ${productId}:`, finalError);
      return [];
    }
  }
}

export async function createProductVariations(
  apiUrl: string,
  authHeader: string,
  productId: string,
  variations: any[]
): Promise<void> {
  for (let i = 0; i < variations.length; i += VARIATION_BATCH_SIZE) {
    const batch = variations.slice(i, i + VARIATION_BATCH_SIZE);
    
    for (const variation of batch) {
      try {
        await fetchWithRetry(
          `${apiUrl}/products/${productId}/variations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
              'Accept': 'application/json'
            },
            body: JSON.stringify(variation),
            maxRetries: 3,
            retryDelay: 2000,
            timeout: 15000
          },
          `バリエーションの作成 (商品ID: ${productId})`
        );

        await addLogEntry({
          type: 'success',
          category: 'sync',
          message: `バリエーション作成成功 (商品ID: ${productId})`,
          details: `SKU: ${variation.sku}`
        });

        await sleep(VARIATION_RETRY_DELAY);
      } catch (error) {
        await addLogEntry({
          type: 'error',
          category: 'sync',
          message: `バリエーション作成エラー (商品ID: ${productId})`,
          details: error instanceof Error ? error.message : '不明なエラー'
        });
        throw error;
      }
    }
  }
}