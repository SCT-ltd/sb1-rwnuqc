import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useSettings } from '../../hooks/useSettings';
import { RefreshCw, AlertCircle, CheckCircle2, Settings } from 'lucide-react';

interface SyncProgress {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  detail?: string;
  progress: number;
  total: number;
}

export function CategorySettings() {
  const { settings } = useSettings();
  const { netseaCategories, wooCommerceCategories, categoryMappings, isLoading, error, syncCategories } = useCategories();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    message: '',
    progress: 0,
    total: 0
  });

  // WooCommerce設定のバリデーション
  const isWooCommerceConfigured = Boolean(
    settings.woocommerceSiteUrl &&
    settings.woocommerceApiKey &&
    settings.woocommerceApiSecret
  );

  const handleSync = async () => {
    if (!isWooCommerceConfigured) {
      setSyncProgress({
        status: 'error',
        message: 'WooCommerce設定が不完全です',
        detail: '設定画面でWooCommerceの設定を完了してください',
        progress: 0,
        total: 100
      });
      return;
    }

    setSyncProgress({
      status: 'syncing',
      message: 'NETSEAからカテゴリを取得中...',
      progress: 0,
      total: 100
    });

    try {
      // カテゴリ同期の進捗をモニタリング
      const onProgress = (progress: number, total: number, message: string, detail?: string) => {
        setSyncProgress({
          status: 'syncing',
          message,
          detail,
          progress,
          total
        });
      };

      await syncCategories(onProgress);

      setSyncProgress({
        status: 'success',
        message: 'カテゴリの同期が完了しました',
        progress: 100,
        total: 100
      });

      // 3秒後に進捗表示をクリア
      setTimeout(() => {
        setSyncProgress({
          status: 'idle',
          message: '',
          progress: 0,
          total: 0
        });
      }, 3000);

    } catch (err) {
      setSyncProgress({
        status: 'error',
        message: 'カテゴリの同期に失敗しました',
        detail: err instanceof Error ? err.message : '不明なエラー',
        progress: 0,
        total: 100
      });
    }
  };

  // WooCommerce設定が不完全な場合の警告表示
  if (!isWooCommerceConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">カテゴリ設定</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">WooCommerce設定が必要です</h3>
              <p className="mt-2 text-sm text-yellow-700">
                カテゴリ同期を使用するには、以下のWooCommerce設定を完了してください：
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>WooCommerceサイトURL</li>
                <li>APIキー</li>
                <li>APIシークレット</li>
              </ul>
              <div className="mt-4">
                <a
                  href="#/settings?tab=api"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  API設定画面へ移動
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">カテゴリ設定</h2>
        <button
          onClick={handleSync}
          disabled={isLoading || syncProgress.status === 'syncing'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncProgress.status === 'syncing' ? 'animate-spin' : ''}`} />
          {syncProgress.status === 'syncing' ? 'カテゴリ同期中...' : 'カテゴリを同期'}
        </button>
      </div>

      {/* 進捗状況の表示 */}
      {syncProgress.status !== 'idle' && (
        <div className={`p-4 rounded-lg ${
          syncProgress.status === 'success' ? 'bg-green-50' :
          syncProgress.status === 'error' ? 'bg-red-50' :
          'bg-blue-50'
        }`}>
          <div className="flex items-start gap-3">
            {syncProgress.status === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : syncProgress.status === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                syncProgress.status === 'success' ? 'text-green-700' :
                syncProgress.status === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {syncProgress.message}
              </p>
              {syncProgress.detail && (
                <p className="text-sm mt-1 text-gray-600">{syncProgress.detail}</p>
              )}
              {syncProgress.status === 'syncing' && (
                <div className="mt-2">
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(syncProgress.progress / syncProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {syncProgress.progress} / {syncProgress.total}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">NETSEAカテゴリ</h3>
          <div className="bg-gray-50 rounded-lg p-4 h-[400px] overflow-y-auto">
            <ul className="space-y-2">
              {netseaCategories.map(category => (
                <li key={category.id} className="text-sm">
                  {category.name}
                  <span className="text-gray-500 text-xs ml-2">
                    (ID: {category.id})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">WooCommerceカテゴリ</h3>
          <div className="bg-gray-50 rounded-lg p-4 h-[400px] overflow-y-auto">
            <ul className="space-y-2">
              {wooCommerceCategories.map(category => (
                <li key={category.id} className="text-sm">
                  {category.name}
                  <span className="text-gray-500 text-xs ml-2">
                    (ID: {category.id})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">カテゴリマッピング</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase">NETSEAカテゴリ</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase">WooCommerceカテゴリ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoryMappings.map(mapping => (
                <tr key={mapping.netseaId}>
                  <td className="py-2 text-sm">
                    {netseaCategories.find(c => c.id === mapping.netseaId)?.name}
                  </td>
                  <td className="py-2 text-sm">
                    {wooCommerceCategories.find(c => c.id === mapping.wooCommerceId)?.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}