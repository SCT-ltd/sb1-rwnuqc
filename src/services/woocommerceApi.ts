import { Settings } from '../hooks/useSettings';
import { addLogEntry } from './logService';

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: {
    id: number;
    src: string;
  } | null;
  menu_order: number;
  count: number;
}

function getWooCommerceConfig(settings: Settings) {
  if (!settings.woocommerceApiKey || !settings.woocommerceApiSecret) {
    throw new Error('WooCommerce APIキーとシークレットが必要です');
  }

  const wcSiteUrl = settings.woocommerceSiteUrl.replace(/\/+$/, '');
  const WOO_API_URL = `${wcSiteUrl}/wp-json/wc/v3`;
  const AUTH = btoa(`${settings.woocommerceApiKey}:${settings.woocommerceApiSecret}`);

  return { WOO_API_URL, AUTH };
}

export async function createWooCommerceCategory(
  categoryName: string,
  parentId?: number,
  settings?: Settings
): Promise<WooCommerceCategory> {
  if (!settings) {
    throw new Error('設定が必要です');
  }

  const { WOO_API_URL, AUTH } = getWooCommerceConfig(settings);

  try {
    // カテゴリ名からスラッグを生成
    const slug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const categoryData = {
      name: categoryName,
      slug,
      ...(parentId ? { parent: parentId } : {})
    };

    const response = await fetch(`${WOO_API_URL}/products/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${AUTH}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`カテゴリの作成に失敗しました: ${errorData.message || response.statusText}`);
    }

    const category = await response.json();

    await addLogEntry({
      type: 'success',
      category: 'sync',
      message: `カテゴリを作成しました: ${categoryName}`,
      details: `ID: ${category.id}${parentId ? `, 親カテゴリID: ${parentId}` : ''}`
    });

    return category;
  } catch (error) {
    await addLogEntry({
      type: 'error',
      category: 'sync',
      message: `カテゴリの作成に失敗: ${categoryName}`,
      details: error instanceof Error ? error.message : '不明なエラー'
    });
    throw error;
  }
}

export async function createCategoryHierarchy(
  categoryPath: string,
  settings: Settings
): Promise<number> {
  const categories = categoryPath.split('>').map(c => c.trim());
  let parentId: number | undefined;

  try {
    for (const categoryName of categories) {
      const category = await createWooCommerceCategory(categoryName, parentId, settings);
      parentId = category.id;
    }

    return parentId!;
  } catch (error) {
    console.error('Failed to create category hierarchy:', error);
    throw error;
  }
}

export async function fetchWooCommerceCategories(settings: Settings): Promise<WooCommerceCategory[]> {
  const { WOO_API_URL, AUTH } = getWooCommerceConfig(settings);

  try {
    const response = await fetch(`${WOO_API_URL}/products/categories?per_page=100`, {
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`カテゴリの取得に失敗しました: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    throw new Error(`WooCommerceカテゴリの取得に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

export async function publishToWooCommerce(
  product: any,
  price: number,
  settings: Settings,
  categoryId?: number
): Promise<void> {
  const { WOO_API_URL, AUTH } = getWooCommerceConfig(settings);

  const hasExcludedWord = settings.excludeWords.some(word => 
    product.product_name.toLowerCase().includes(word.toLowerCase())
  );

  if (hasExcludedWord) {
    const matchedWords = settings.excludeWords.filter(word => 
      product.product_name.toLowerCase().includes(word.toLowerCase())
    );
    throw new Error(`除外ワード「${matchedWords.join('、')}」が商品名に含まれているため、この商品は出品できません`);
  }

  let productName = product.product_name;

  settings.replaceWords.forEach(({ from, to }) => {
    const regex = new RegExp(from, 'gi');
    productName = productName.replace(regex, to);
  });

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

  const productData = {
    name: productName,
    type: 'variable',
    status: 'publish',
    description: product.description || '',
    short_description: (product.description || '').slice(0, 300) + ((product.description || '').length > 300 ? '...' : ''),
    categories: categoryId ? [{ id: categoryId }] : [{ id: 1 }],
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
    const response = await fetch(`${WOO_API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${AUTH}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`商品の作成に失敗しました: ${errorData.message || response.statusText}`);
    }

    const createdProduct = await response.json();

    // バリエーションの作成
    for (const variation of variations) {
      await fetch(`${WOO_API_URL}/products/${createdProduct.id}/variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${AUTH}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(variation)
      });

      // APIレート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    throw new Error(`WooCommerce APIエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}