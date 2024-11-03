import { createContext, useContext, useState, useEffect } from 'react';
import { Category, fetchNetseaCategories } from '../services/netseaApi';
import { WooCommerceCategory, fetchWooCommerceCategories, createWooCommerceCategory } from '../services/woocommerceApi';
import { addLogEntry } from '../services/logService';
import { useSettings } from './useSettings';

interface CategoryMapping {
  netseaId: number;
  wooCommerceId: number;
}

interface CategoriesContextType {
  netseaCategories: Category[];
  wooCommerceCategories: WooCommerceCategory[];
  categoryMappings: CategoryMapping[];
  isLoading: boolean;
  error: string | null;
  syncCategories: (onProgress?: (progress: number, total: number, message: string, detail?: string) => void) => Promise<void>;
  getCategoryNameById: (id: string) => string;
  getWooCommerceCategoryById: (id: number) => WooCommerceCategory | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [netseaCategories, setNetseaCategories] = useState<Category[]>([]);
  const [wooCommerceCategories, setWooCommerceCategories] = useState<WooCommerceCategory[]>([]);
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [netseaCats, wooCats] = await Promise.all([
        fetchNetseaCategories(settings),
        fetchWooCommerceCategories(settings)
      ]);

      setNetseaCategories(netseaCats);
      setWooCommerceCategories(wooCats);

      // Load saved mappings from localStorage
      const savedMappings = localStorage.getItem('category_mappings');
      if (savedMappings) {
        setCategoryMappings(JSON.parse(savedMappings));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (settings.woocommerceApiKey && settings.woocommerceApiSecret) {
      loadCategories();
    }
  }, [settings.woocommerceApiKey, settings.woocommerceApiSecret]);

  const syncCategories = async (
    onProgress?: (progress: number, total: number, message: string, detail?: string) => void
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!settings.woocommerceApiKey || !settings.woocommerceApiSecret) {
        throw new Error('WooCommerce設定が不完全です');
      }

      // NETSEAカテゴリの取得
      onProgress?.(0, 100, 'NETSEAからカテゴリを取得中...');
      const netseaCats = await fetchNetseaCategories(settings);
      setNetseaCategories(netseaCats);

      // WooCommerceカテゴリの取得
      onProgress?.(20, 100, 'WooCommerceのカテゴリを取得中...');
      const wooCats = await fetchWooCommerceCategories(settings);
      setWooCommerceCategories(wooCats);

      const newMappings: CategoryMapping[] = [];
      let progress = 30;

      for (const [index, category] of netseaCats.entries()) {
        try {
          onProgress?.(
            progress + Math.floor((index / netseaCats.length) * 70),
            100,
            'カテゴリを同期中...',
            `${category.name} (${index + 1}/${netseaCats.length})`
          );

          // Check if mapping already exists
          const existingMapping = categoryMappings.find(m => m.netseaId === category.id);
          if (existingMapping) {
            newMappings.push(existingMapping);
            continue;
          }

          // Create new category in WooCommerce
          const wooCategory = await createWooCommerceCategory(
            category.name,
            undefined,
            settings
          );
          
          newMappings.push({
            netseaId: category.id,
            wooCommerceId: wooCategory.id
          });

          await addLogEntry({
            type: 'success',
            category: 'sync',
            message: `カテゴリを同期しました: ${category.name}`,
            details: `NETSEA ID: ${category.id}, WooCommerce ID: ${wooCategory.id}`
          });

          // 連続リクエストを避けるために少し待機
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
          await addLogEntry({
            type: 'error',
            category: 'sync',
            message: `カテゴリの同期に失敗: ${category.name}`,
            details: err instanceof Error ? err.message : '不明なエラー'
          });
        }
      }

      onProgress?.(100, 100, 'カテゴリの同期が完了しました');

      setCategoryMappings(newMappings);
      localStorage.setItem('category_mappings', JSON.stringify(newMappings));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryNameById = (id: string): string => {
    const category = netseaCategories.find(cat => cat.id.toString() === id);
    return category?.name || 'Unknown Category';
  };

  const getWooCommerceCategoryById = (id: number): WooCommerceCategory | undefined => {
    return wooCommerceCategories.find(cat => cat.id === id);
  };

  return (
    <CategoriesContext.Provider value={{
      netseaCategories,
      wooCommerceCategories,
      categoryMappings,
      isLoading,
      error,
      syncCategories,
      getCategoryNameById,
      getWooCommerceCategoryById
    }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}