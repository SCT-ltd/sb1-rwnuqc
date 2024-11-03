import React, { useState } from 'react';
import { Save, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { 
  PriceSettings,
  ContentSettings,
  ApiSettings,
  SyncSettings,
  NotificationSettings,
  CategorySettings
} from '../components/settings';

export function Settings() {
  const { settings, saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('api');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await saveSettings();
      setSuccessMessage('設定を保存しました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'api', label: 'API設定', icon: SettingsIcon, component: ApiSettings },
    { id: 'content', label: '商品設定', icon: SettingsIcon, component: ContentSettings },
    { id: 'price', label: '価格設定', icon: SettingsIcon, component: PriceSettings },
    { id: 'category', label: 'カテゴリ設定', icon: SettingsIcon, component: CategorySettings },
    { id: 'sync', label: '同期設定', icon: SettingsIcon, component: SyncSettings },
    { id: 'notification', label: '通知設定', icon: SettingsIcon, component: NotificationSettings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || tabs[0].component;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">システム設定</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? '保存中...' : '設定を保存'}
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <div className="w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md text-left ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}