import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export function SyncSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">同期設定</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            自動同期
          </label>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">自動同期を有効にする</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            同期間隔（分）
          </label>
          <input
            type="number"
            value={settings.autoUpdateInterval}
            onChange={(e) => updateSettings({ autoUpdateInterval: Number(e.target.value) })}
            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="1"
          />
        </div>
      </div>
    </div>
  );
}