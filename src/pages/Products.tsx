import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Upload } from 'lucide-react';
import { Product, Supplier } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useWooCommerce } from '../hooks/useWooCommerce';
import { useCategories } from '../hooks/useCategories';
import { publishToWooCommerce } from '../services/woocommerceApi';
import { calculatePrice } from '../utils/priceCalculator';
import { SupplierList } from '../components/SupplierList';
import { ProductList } from '../components/ProductList';
import { ProductDetail } from '../components/ProductDetail';
import { PublishProgress } from '../components/PublishProgress';
import { fetchSuppliers, fetchSupplierProducts } from '../services/netseaApi';

interface PublishProgress {
  currentProduct: string;
  currentStep: string;
  progress: number;
  total: number;
}

export function Products() {
  const { settings } = useSettings();
  const { products: wooCommerceProducts } = useWooCommerce();
  const { categoryMappings } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [hasStock, setHasStock] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextDirectItemId, setNextDirectItemId] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [publishedProductsSet, setPublishedProductsSet] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['woocommerce']));
  const [priceAdjustments, setPriceAdjustments] = useState<Record<string, number>>({});
  const [publishProgress, setPublishProgress] = useState<PublishProgress>({
    currentProduct: '',
    currentStep: '',
    progress: 0,
    total: 0
  });
  const [showProgress, setShowProgress] = useState(false);
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [settings]); // settings を依存配列に追加

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await fetchSuppliers(settings);
      setSuppliers(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierClick = async (supplierId: number) => {
    try {
      setIsLoading(true);
      setSelectedSupplierId(supplierId);
      setSelectedProduct(null);
      setProducts([]);
      setNextDirectItemId(undefined);
      
      const response = await fetchSupplierProducts(settings, supplierId);
      setProducts(response.data);
      setNextDirectItemId(response.next_direct_item_id);
      setHasMore(!!response.next_direct_item_id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!selectedSupplierId || !nextDirectItemId || isLoading) return;

    try {
      setIsLoading(true);
      const response = await fetchSupplierProducts(settings, selectedSupplierId, nextDirectItemId);
      setProducts(prev => [...prev, ...response.data]);
      setNextDirectItemId(response.next_direct_item_id);
      setHasMore(!!response.next_direct_item_id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllSupplierProducts = async (supplierId: number): Promise<Product[]> => {
    let allProducts: Product[] = [];
    let nextId: string | undefined = undefined;
    
    do {
      const response = await fetchSupplierProducts(settings, supplierId, nextId);
      allProducts = [...allProducts, ...response.data];
      nextId = response.next_direct_item_id;
    } while (nextId);

    return allProducts;
  };

  const isPublishedToWooCommerce = (productId: string) => {
    return wooCommerceProducts.some(p => 
      p.sku === productId || 
      p.original_product_id === productId || 
      p.variations?.some(v => v.sku?.startsWith(productId))
    );
  };

  const handlePublishAllSupplierProducts = async () => {
    if (!selectedSupplierId) {
      setError('サプライヤーを選択してください');
      return;
    }

    try {
      setIsPublishingAll(true);
      setShowProgress(true);
      setError(null);

      setPublishProgress({
        currentProduct: '',
        currentStep: '商品情報を取得中...',
        progress: 0,
        total: 100
      });

      const allProducts = await fetchAllSupplierProducts(selectedSupplierId);
      const unpublishedProducts = allProducts.filter(
        product => !isPublishedToWooCommerce(product.product_id)
      );

      if (unpublishedProducts.length === 0) {
        setError('未出品の商品がありません');
        return;
      }

      const errors: string[] = [];
      let progress = 0;

      for (const product of unpublishedProducts) {
        try {
          setPublishProgress({
            currentProduct: product.product_name,
            currentStep: 'WooCommerceへ出品中...',
            progress,
            total: unpublishedProducts.length
          });

          const originalPrice = product.set[0]?.price || 0;
          const calculatedPrice = calculatePrice(originalPrice, settings);

          // カテゴリIDの取得
          const categoryId = categoryMappings.find(
            mapping => mapping.netseaId.toString() === product.category_id
          )?.wooCommerceId;

          await publishToWooCommerce(product, calculatedPrice, settings, categoryId);

          progress++;
          setPublishProgress(prev => ({ ...prev, progress }));
        } catch (err) {
          errors.push(`${product.product_name}: ${err instanceof Error ? err.message : '出品に失敗しました'}`);
        }
      }

      if (errors.length > 0) {
        setError(`一部の商品で出品に失敗しました:\n${errors.join('\n')}`);
      } else {
        setError(`${progress}件の商品を出品しました`);
      }

      const response = await fetchSupplierProducts(settings, selectedSupplierId);
      setProducts(response.data);
      setNextDirectItemId(response.next_direct_item_id);
      setHasMore(!!response.next_direct_item_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : '出品に失敗しました');
    } finally {
      setIsPublishingAll(false);
      setShowProgress(false);
      setPublishProgress({
        currentProduct: '',
        currentStep: '',
        progress: 0,
        total: 0
      });
    }
  };

  const handlePublish = async () => {
    if (publishedProductsSet.size === 0) {
      setError('出品する商品を選択してください');
      return;
    }

    if (selectedPlatforms.size === 0) {
      setError('出品先を選択してください');
      return;
    }

    setIsLoading(true);
    setShowProgress(true);
    const errors: string[] = [];
    const total = publishedProductsSet.size;
    let progress = 0;

    try {
      for (const productId of publishedProductsSet) {
        const product = products.find(p => p.product_id === productId);
        if (!product) continue;

        if (isPublishedToWooCommerce(product.product_id)) {
          progress++;
          continue;
        }

        setPublishProgress({
          currentProduct: product.product_name,
          currentStep: '商品情報の準備中...',
          progress,
          total
        });

        if (selectedPlatforms.has('woocommerce')) {
          try {
            setPublishProgress({
              currentProduct: product.product_name,
              currentStep: 'WooCommerceへ出品中...',
              progress,
              total
            });

            const originalPrice = product.set[0]?.price || 0;
            const calculatedPrice = calculatePrice(originalPrice, settings);

            // カテゴリIDの取得
            const categoryId = categoryMappings.find(
              mapping => mapping.netseaId.toString() === product.category_id
            )?.wooCommerceId;

            await publishToWooCommerce(product, calculatedPrice, settings, categoryId);

            setPublishProgress({
              currentProduct: product.product_name,
              currentStep: 'バリエーション情報を登録中...',
              progress,
              total
            });
          } catch (err) {
            errors.push(`${product.product_name}: ${err instanceof Error ? err.message : '出品に失敗しました'}`);
          }
        }

        progress++;
        setPublishProgress(prev => ({ ...prev, progress }));
      }

      if (errors.length > 0) {
        setError(`一部の商品で出品に失敗しました:\n${errors.join('\n')}`);
      } else {
        setError('選択した商品を出品しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '出品に失敗しました');
    } finally {
      setIsLoading(false);
      setShowProgress(false);
      setPublishProgress({
        currentProduct: '',
        currentStep: '',
        progress: 0,
        total: 0
      });
    }
  };

  const handleTogglePublish = (product: Product) => {
    setPublishedProductsSet(prev => {
      const next = new Set(prev);
      if (next.has(product.product_id)) {
        next.delete(product.product_id);
      } else {
        next.add(product.product_id);
      }
      return next;
    });
  };

  const handlePriceAdjustment = (productId: string, newPrice: number) => {
    setPriceAdjustments(prev => ({
      ...prev,
      [productId]: newPrice
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">商品管理</h1>
        <div className="flex items-center gap-4">
          {selectedSupplierId && (
            <button
              onClick={handlePublishAllSupplierProducts}
              disabled={isPublishingAll || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              サプライヤー全出品
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={publishedProductsSet.size === 0 || isLoading || isPublishingAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <ShoppingBag className="h-5 w-5" />
            出品する ({publishedProductsSet.size}件)
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="商品名、商品ID、カテゴリで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <SupplierList
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          onSupplierClick={handleSupplierClick}
        />
        
        <ProductList
          products={products}
          isLoading={isLoading}
          hasMore={hasMore}
          searchTerm={searchTerm}
          hasStock={hasStock}
          selectedProduct={selectedProduct}
          publishedProducts={publishedProductsSet}
          onSearchChange={setSearchTerm}
          onStockFilterChange={setHasStock}
          onProductClick={setSelectedProduct}
          onLoadMore={loadMoreProducts}
          onTogglePublish={handleTogglePublish}
          onPriceAdjustment={handlePriceAdjustment}
          priceAdjustments={priceAdjustments}
          isPublishedToWooCommerce={isPublishedToWooCommerce}
        />

        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            currentImageIndex={currentImageIndex}
            onImageIndexChange={setCurrentImageIndex}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
          />
        )}
      </div>

      <PublishProgress
        isOpen={showProgress}
        progress={publishProgress}
      />

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  );
}