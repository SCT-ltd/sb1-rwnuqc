import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export function NotificationSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">通知設定</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            通知用メールアドレス
          </label>
          <input
            type="email"
            value={settings.notificationEmail}
            onChange={(e) => updateSettings({ notificationEmail: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            在庫アラート閾値
          </label>
          <input
            type="number"
            value={settings.stockThreshold}
            onChange={(e) => updateSettings({ stockThreshold: Number(e.target.value) })}
            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}