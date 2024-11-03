import React, { useState, useEffect } from 'react';
import { InventoryList } from '../components/inventory/InventoryList';
import { InventoryFilters } from '../components/inventory/InventoryFilters';
import { InventoryStats } from '../components/inventory/InventoryStats';
import { WooCommerceProductList } from '../components/inventory/WooCommerceProductList';
import { useWooCommerce } from '../hooks/useWooCommerce';
import { addLogEntry } from '../services/logService';

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'updated'>('updated');
  const { products: wooCommerceProducts, isLoading, error, refetch } = useWooCommerce();

  // 在庫管理画面に遷移したときに商品情報を再取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        await addLogEntry({
          type: 'info',
          category: 'sync',
          message: '在庫管理画面: 商品データの同期を開始します',
        });

        await refetch();

        await addLogEntry({
          type: 'success',
          category: 'sync',
          message: '在庫管理画面: 商品データの同期が完了しました',
          details: `取得商品数: ${wooCommerceProducts.length}件`
        });
      } catch (err) {
        await addLogEntry({
          type: 'error',
          category: 'sync',
          message: '在庫管理画面: 商品データの同期に失敗しました',
          details: err instanceof Error ? err.message : '不明なエラー'
        });
      }
    };

    fetchData();
  }, []); // コンポーネントマウント時のみ実行

  // 検索とフィルタリングを適用したWooCommerce商品
  const filteredWooCommerceProducts = wooCommerceProducts.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && product.stock_quantity > 0 && product.stock_quantity <= 5) ||
      (stockFilter === 'out' && product.stock_quantity <= 0);

    return matchesSearch && matchesStock;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'stock':
        return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      case 'updated':
      default:
        return new Date(b.date_modified).getTime() - new Date(a.date_modified).getTime();
    }
  });

  const handleStockUpdate = async (productId: string, variantId: string, newStock: number) => {
    try {
      // 在庫更新のロジックを実装
      await addLogEntry({
        type: 'info',
        category: 'stock',
        message: `在庫数更新: 商品ID ${productId}`,
        details: `新しい在庫数: ${newStock}`
      });
      
      await refetch(); // 更新後に商品リストを再取得
    } catch (error) {
      await addLogEntry({
        type: 'error',
        category: 'stock',
        message: `在庫数更新エラー: 商品ID ${productId}`,
        details: error instanceof Error ? error.message : '不明なエラー'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">在庫管理</h1>
      </div>

      <InventoryStats products={wooCommerceProducts} />
      
      <div className="bg-white rounded-lg shadow-sm">
        <InventoryFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        <WooCommerceProductList
          products={filteredWooCommerceProducts}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}