import { Product } from '../../../types';
import { Settings } from '../../../hooks/useSettings';
import { WooCommerceProductData } from './types';
import { getWooCommerceApiUrl, getAuthHeader, fetchWithRetry, sleep } from './client';
import { fetchProductVariations, createProductVariations } from './variations';
import { addLogEntry } from '../../logService';

const PRODUCT_BATCH_SIZE = 5;
const PRODUCT_RETRY_DELAY = 2000;

export async function fetchWooCommerceProducts(settings: Settings) {
  const apiUrl = getWooCommerceApiUrl(settings);
  const authHeader = getAuthHeader(settings);

  try {
    const response = await fetchWithRetry(
      `${apiUrl}/products?per_page=100`,
      {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      },
      '商品一覧の取得'
    );

    const products = await response.json();
    const productsWithVariations = [];

    for (let i = 0; i < products.length; i += PRODUCT_BATCH_SIZE) {
      const batch = products.slice(i, i + PRODUCT_BATCH_SIZE);
      
      await addLogEntry({
        type: 'info',
        category: 'sync',
        message: '商品データ同期進捗',
        details: `${Math.min(i + PRODUCT_BATCH_SIZE, products.length)}/${products.length}件処理中`
      });

      const batchPromises = batch.map(async (product: any) => {
        let variations = [];
        if (product.variations && product.variations.length > 0) {
          variations = await fetchProductVariations(apiUrl, authHeader, product.id.toString());
        }

        return {
          id: product.id.toString(),
          sku: product.sku || '',
          original_product_id: product.meta_data?.find((meta: any) => meta.key === '_netsea_product_id')?.value || '',
          name: product.name,
          price: parseFloat(product.price || '0'),
          stock_quantity: product.stock_quantity || 0,
          images: product.images || [],
          permalink: product.permalink,
          date_created: product.date_created,
          date_modified: product.date_modified,
          status: product.status,
          categories: product.categories || [],
          variations,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      productsWithVariations.push(...batchResults);

      if (i + PRODUCT_BATCH_SIZE < products.length) {
        await sleep(PRODUCT_RETRY_DELAY);
      }
    }

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: '商品データ同期完了',
      details: `${productsWithVariations.length}件の商品を同期しました`
    });

    return productsWithVariations;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'WooCommerce商品の取得に失敗しました';
    throw new Error(errorMessage);
  }
}

export async function publishToWooCommerce(
  product: Product,
  price: number,
  settings: Settings
): Promise<void> {
  const apiUrl = getWooCommerceApiUrl(settings);
  const authHeader = getAuthHeader(settings);

  if (!settings.woocommerceApiKey || !settings.woocommerceApiSecret) {
    throw new Error('WooCommerce APIキーが設定されていません');
  }

  const hasExcludedWord = settings.excludeWords.some(word => 
    product.product_name.toLowerCase().includes(word.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(word.toLowerCase())
  );

  if (hasExcludedWord) {
    throw new Error('除外ワードが含まれているため、この商品は出品できません');
  }

  let productName = product.product_name;
  let description = product.description || '';

  settings.replaceWords.forEach(({ from, to }) => {
    productName = productName.replace(new RegExp(from, 'gi'), to);
    description = description.replace(new RegExp(from, 'gi'), to);
  });

  if (settings.additionalDescription) {
    description += '\n\n' + settings.additionalDescription;
  }

  const variations = product.set.map(variant => {
    const variantPrice = Math.ceil(variant.price * (price / product.set[0].price));
    return {
      regular_price: variantPrice.toString(),
      description: variant.label,
      attributes: [{ name: '種類', option: variant.label }],
      stock_quantity: variant.sold_out_flag === 'N' ? variant.set_num : 0,
      manage_stock: true,
      sku: `${product.product_id}-${variant.direct_item_id}`
    };
  });

  const productData: WooCommerceProductData = {
    name: productName,
    type: 'variable',
    status: 'publish',
    description,
    short_description: description.slice(0, 300) + (description.length > 300 ? '...' : ''),
    categories: [{ id: 1 }],
    images: [
      { src: product.image_url_1 },
      ...(product.image_url_2 ? [{ src: product.image_url_2 }] : []),
      ...(product.image_url_3 ? [{ src: product.image_url_3 }] : []),
      ...(product.image_url_4 ? [{ src: product.image_url_4 }] : []),
      ...(product.image_url_5 ? [{ src: product.image_url_5 }] : [])
    ].filter(img => img.src),
    attributes: [{
      name: '種類',
      visible: true,
      variation: true,
      options: product.set.map(variant => variant.label)
    }],
    variations,
    sku: product.product_id,
    meta_data: [
      {
        key: '_netsea_product_id',
        value: product.product_id
      }
    ]
  };

  try {
    const response = await fetchWithRetry(
      `${apiUrl}/products`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'Accept': 'application/json'
        },
        body: JSON.stringify(productData)
      },
      '商品の出品'
    );

    const parentProduct = await response.json();
    if (!parentProduct.id) {
      throw new Error('商品の作成に失敗しました');
    }

    await createProductVariations(apiUrl, authHeader, parentProduct.id, variations);

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: '商品出品完了',
      details: `商品「${productName}」を出品しました`
    });

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`WooCommerce APIエラー: ${error.message}`);
    }
    throw new Error('WooCommerce APIエラー: 不明なエラーが発生しました');
  }
}