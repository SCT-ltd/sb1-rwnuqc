import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export function ApiSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">API設定</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            NETSEA APIキー
          </label>
          <input
            type="password"
            value={settings.netseaApiKey}
            onChange={(e) => updateSettings({ netseaApiKey: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">WooCommerce設定</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                サイトURL
              </label>
              <input
                type="url"
                value={settings.woocommerceSiteUrl}
                onChange={(e) => updateSettings({ woocommerceSiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                例: https://example.com (末尾のスラッシュは不要)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                APIキー
              </label>
              <input
                type="password"
                value={settings.woocommerceApiKey}
                onChange={(e) => updateSettings({ woocommerceApiKey: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                APIシークレット
              </label>
              <input
                type="password"
                value={settings.woocommerceApiSecret}
                onChange={(e) => updateSettings({ woocommerceApiSecret: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}