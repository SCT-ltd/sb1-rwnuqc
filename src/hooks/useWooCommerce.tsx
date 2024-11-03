import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WooCommerceProduct } from '../types';
import { fetchWooCommerceProducts } from '../services/api/woocommerce';
import { useSettings } from './useSettings';
import { addLogEntry } from '../services/logService';
import { startAutoSync } from '../services/inventorySync';

interface WooCommerceContextType {
  products: WooCommerceProduct[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const WooCommerceContext = createContext<WooCommerceContextType | undefined>(undefined);

export function WooCommerceProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const MIN_FETCH_INTERVAL = 30000; // 30秒

  const fetchProducts = useCallback(async (force = false) => {
    if (!settings.woocommerceApiKey || !settings.woocommerceApiSecret) {
      setError('WooCommerce APIの認証情報が設定されていません。');
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTime < MIN_FETCH_INTERVAL) {
      await addLogEntry({
        type: 'info',
        category: 'sync',
        message: 'APIレート制限により商品データの取得をスキップしました',
        details: `前回の取得から${Math.floor((now - lastFetchTime) / 1000)}秒経過`
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await addLogEntry({
        type: 'info',
        category: 'sync',
        message: 'WooCommerce商品データの同期を開始します',
      });

      const data = await fetchWooCommerceProducts(settings);
      setProducts(data);
      setLastFetchTime(now);

      await addLogEntry({
        type: 'success',
        category: 'sync',
        message: 'WooCommerce商品データの同期が完了しました',
        details: `取得商品数: ${data.length}件`
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'WooCommerce商品の取得に失敗しました';
      setError(errorMessage);
      
      await addLogEntry({
        type: 'error',
        category: 'sync',
        message: 'WooCommerce商品データの同期に失敗しました',
        details: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [settings, lastFetchTime]);

  // 初回マウント時とAPI設定変更時に商品を取得
  useEffect(() => {
    if (settings.woocommerceApiKey && settings.woocommerceApiSecret) {
      fetchProducts(true).then(fetchedProducts => {
        if (fetchedProducts && settings.autoSync) {
          // 自動同期を開始
          startAutoSync(fetchedProducts);
        }
      });
    }
  }, [settings.woocommerceApiKey, settings.woocommerceApiSecret, settings.autoSync]);

  const value = {
    products,
    isLoading,
    error,
    refetch: () => fetchProducts(true)
  };

  return (
    <WooCommerceContext.Provider value={value}>
      {children}
    </WooCommerceContext.Provider>
  );
}

export function useWooCommerce() {
  const context = useContext(WooCommerceContext);
  if (context === undefined) {
    throw new Error('useWooCommerce must be used within a WooCommerceProvider');
  }
  return context;
}