import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Edit2, Save, X, ExternalLink, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';
import { Product, WooCommerceProduct } from '../../types';

interface InventoryListProps {
  products: Product[];
  searchTerm: string;
  stockFilter: 'all' | 'low' | 'out';
  sortBy: 'name' | 'stock' | 'updated';
  wooCommerceProducts: WooCommerceProduct[];
  isWooCommerceLoading: boolean;
  wooCommerceError: string | null;
  onRetryWooCommerce: () => void;
  onStockUpdate: (productId: string, variantId: string, newStock: number) => void;
}

interface EditingStock {
  productId: string;
  variantId: string;
  value: number;
}

export function InventoryList({
  products,
  searchTerm,
  stockFilter,
  sortBy,
  wooCommerceProducts,
  isWooCommerceLoading,
  wooCommerceError,
  onRetryWooCommerce,
  onStockUpdate,
}: InventoryListProps) {
  const [editingStock, setEditingStock] = useState<EditingStock | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // エラーメッセージをパースして詳細情報を取得
  const parseErrorDetails = (error: string) => {
    const lines = error.split('\n');
    return {
      mainMessage: lines[0],
      details: lines.slice(1).join('\n')
    };
  };

  if (isWooCommerceLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (wooCommerceError) {
    const { mainMessage, details } = parseErrorDetails(wooCommerceError);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-red-700">WooCommerce接続エラー</h3>
              <button
                onClick={onRetryWooCommerce}
                className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                <RefreshCw className="h-4 w-4" />
                再試行
              </button>
            </div>
            <p className="mt-2 text-red-700">{mainMessage}</p>
            {details && (
              <div className="mt-4">
                <button
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                >
                  {showErrorDetails ? '詳細を隠す' : '詳細を表示'}
                  <span className="text-xs">▼</span>
                </button>
                {showErrorDetails && (
                  <pre className="mt-2 p-4 bg-red-100 rounded-md text-sm text-red-800 whitespace-pre-wrap">
                    {details}
                  </pre>
                )}
              </div>
            )}
            <div className="mt-4 text-sm text-red-600">
              <p>以下の項目を確認してください：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>WooCommerceサイトのURLが正しく設定されているか</li>
                <li>APIキーとシークレットが正しく設定されているか</li>
                <li>WooCommerceのREST APIが有効になっているか</li>
                <li>サイトのSSL証明書が有効か</li>
                <li>CORSの設定が適切か</li>
                <li>ネットワーク接続に問題がないか</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 残りのコンポーネントコードは変更なし
  // ...（既存のコード）
}