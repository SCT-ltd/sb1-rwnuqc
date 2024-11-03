import { fetchSupplierProducts } from './netseaApi';
import { addLogEntry } from './logService';
import { Settings } from '../hooks/useSettings';

interface StockCheckResult {
  hasStock: boolean;
  message?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkAndUpdateStock(productId: string): Promise<StockCheckResult> {
  try {
    const settings = JSON.parse(localStorage.getItem('app_settings') || '{}') as Settings;
    const wcSiteUrl = settings.woocommerceSiteUrl?.replace(/\/+$/, '') || 'https://test1211.com/luxe';
    const WOO_API_URL = `${wcSiteUrl}/wp-json/wc/v3`;
    const AUTH = btoa(`${settings.woocommerceApiKey}:${settings.woocommerceApiSecret}`);

    // WooCommerceから商品情報を取得
    const wcResponse = await fetch(`${WOO_API_URL}/products/${productId}`, {
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
      }
    });

    if (!wcResponse.ok) {
      throw new Error('WooCommerce商品の取得に失敗しました');
    }

    const wcProduct = await wcResponse.json();
    const netseaProductId = wcProduct.meta_data?.find((meta: any) => meta.key === '_netsea_product_id')?.value;

    if (!netseaProductId) {
      throw new Error('NETSEA商品IDが見つかりません');
    }

    // NETSEAの在庫状況を確認（商品IDのみで検索）
    const netseaResponse = await fetchSupplierProducts(undefined, netseaProductId);
    const netseaProduct = netseaResponse.data[0];

    if (!netseaProduct) {
      throw new Error('NETSEA商品が見つかりません');
    }

    // 在庫状況を確認
    const hasStock = netseaProduct.set.some(variant => variant.sold_out_flag === 'N');

    // WooCommerceの在庫を更新
    const updateResponse = await fetch(`${WOO_API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stock_quantity: hasStock ? 1 : 0,
        manage_stock: true,
      })
    });

    if (!updateResponse.ok) {
      throw new Error('在庫の更新に失敗しました');
    }

    await addLogEntry({
      type: 'success',
      category: 'stock',
      message: `在庫同期完了: ${wcProduct.name}`,
      details: `NETSEA在庫: ${hasStock ? 'あり' : 'なし'}\nWooCommerce在庫: ${hasStock ? '1' : '0'}`
    });

    return {
      hasStock,
      message: `在庫を${hasStock ? '在庫あり(1)' : '在庫切れ(0)'}に更新しました`
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '在庫同期に失敗しました';
    
    await addLogEntry({
      type: 'error',
      category: 'stock',
      message: '在庫同期エラー',
      details: errorMessage
    });

    throw error;
  }
}

// 他の関数は変更なし
export async function startAutoSync(products: any[], intervalHours = 24): Promise<void> {
  const settings = JSON.parse(localStorage.getItem('app_settings') || '{}') as Settings;
  if (!settings.autoSync) return;

  const intervalMs = intervalHours * 60 * 60 * 1000;
  const batchSize = 10;
  
  while (true) {
    try {
      await addLogEntry({
        type: 'info',
        category: 'sync',
        message: '自動在庫同期を開始します',
        details: `対象商品数: ${products.length}件`
      });

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        for (const product of batch) {
          try {
            await checkAndUpdateStock(product.id);
            await delay(2000);
          } catch (error) {
            await addLogEntry({
              type: 'error',
              category: 'sync',
              message: `商品の在庫同期に失敗: ${product.name}`,
              details: error instanceof Error ? error.message : '不明なエラー'
            });
          }
        }
        
        await delay(5000);
      }

      await addLogEntry({
        type: 'success',
        category: 'sync',
        message: '自動在庫同期が完了しました',
        details: `次回の同期まで${intervalHours}時間待機します`
      });

      await delay(intervalMs);
    } catch (error) {
      await addLogEntry({
        type: 'error',
        category: 'sync',
        message: '自動在庫同期でエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      });
      
      await delay(300000);
    }
  }
}