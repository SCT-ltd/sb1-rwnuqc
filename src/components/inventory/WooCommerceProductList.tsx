import React, { useState } from 'react';
import { ExternalLink, AlertCircle, CheckCircle2, RefreshCw, Edit2, Save, X, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { WooCommerceProduct } from '../../types';
import { checkAndUpdateStock } from '../../services/inventorySync';

interface WooCommerceProductListProps {
  products: WooCommerceProduct[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface EditingStock {
  productId: string;
  value: number;
}

interface SyncStatus {
  productId: string;
  status: 'pending' | 'syncing' | 'success' | 'error';
  message?: string;
}

export function WooCommerceProductList({
  products,
  isLoading,
  error,
  onRetry
}: WooCommerceProductListProps) {
  const [editingStock, setEditingStock] = useState<EditingStock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const productsPerPage = 20;

  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handleSyncStock = async (productId: string) => {
    setSyncStatuses(prev => ({
      ...prev,
      [productId]: { productId, status: 'syncing' }
    }));

    try {
      const result = await checkAndUpdateStock(productId);
      setSyncStatuses(prev => ({
        ...prev,
        [productId]: { 
          productId, 
          status: 'success',
          message: `在庫を${result.hasStock ? '在庫あり(1)' : '在庫切れ(0)'}に更新しました`
        }
      }));

      // 3秒後にステータスをクリア
      setTimeout(() => {
        setSyncStatuses(prev => {
          const newStatuses = { ...prev };
          delete newStatuses[productId];
          return newStatuses;
        });
      }, 3000);

    } catch (error) {
      setSyncStatuses(prev => ({
        ...prev,
        [productId]: { 
          productId, 
          status: 'error',
          message: error instanceof Error ? error.message : '在庫同期に失敗しました'
        }
      }));
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    
    for (const product of currentProducts) {
      await handleSyncStock(product.id);
      // 各リクエストの間に少し待機して負荷を分散
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsSyncingAll(false);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 font-medium">商品データを読み込み中...</span>
        </div>
        <p className="text-sm text-gray-500">しばらくお待ちください</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">WooCommerce接続エラー</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">商品一覧</h2>
        <button
          onClick={handleSyncAll}
          disabled={isSyncingAll}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
          {isSyncingAll ? '在庫同期中...' : 'ページ内全商品の在庫を同期'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品情報</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">在庫</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日時</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => {
              const syncStatus = syncStatuses[product.id];
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0">
                        {product.images[0] && (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.images[0].src}
                            alt={product.name}
                          />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        {syncStatus && (
                          <div className={`text-xs mt-1 ${
                            syncStatus.status === 'success' ? 'text-green-600' :
                            syncStatus.status === 'error' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {syncStatus.status === 'syncing' ? '在庫確認中...' : syncStatus.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {product.stock_quantity > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {product.stock_quantity}個
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          在庫切れ
                        </span>
                      )}
                      <button
                        onClick={() => handleSyncStock(product.id)}
                        disabled={syncStatus?.status === 'syncing'}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="NETSEAの在庫を確認"
                      >
                        <RotateCw className={`h-4 w-4 ${syncStatus?.status === 'syncing' ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ¥{product.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(product.date_modified).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={product.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>商品ページ</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              全<span className="font-medium mx-1">{products.length}</span>件中
              <span className="font-medium mx-1">{startIndex + 1}</span>-
              <span className="font-medium mx-1">{Math.min(endIndex, products.length)}</span>件を表示
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}