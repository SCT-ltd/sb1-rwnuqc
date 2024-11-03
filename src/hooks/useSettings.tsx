import { createContext, useContext, useState, useEffect } from 'react';

interface PriceRange {
  minPrice: number;
  maxPrice: number;
  multiplier: number;
  correctionPrice: number;
}

interface Settings {
  netseaApiKey: string;
  baseApiKey: string;
  woocommerceApiKey: string;
  woocommerceApiSecret: string;
  woocommerceSiteUrl: string;
  replaceWords: Array<{ from: string; to: string }>;
  excludeWords: string[];
  additionalDescription: string;
  autoUpdateInterval: number;
  priceRanges: PriceRange[];
  minProfitAmount: number;
  stockThreshold: number;
  categoryMapping: Array<{ netseaCategory: string; baseCategory: string }>;
  notificationEmail: string;
  autoSync: boolean;
}

const defaultSettings: Settings = {
  netseaApiKey: '',
  baseApiKey: '',
  woocommerceApiKey: '',
  woocommerceApiSecret: '',
  woocommerceSiteUrl: 'https://test1211.com/luxe', // デフォルトのサイトURL
  replaceWords: [],
  excludeWords: [],
  additionalDescription: '',
  autoUpdateInterval: 60,
  priceRanges: [
    { minPrice: 0, maxPrice: 1000, multiplier: 1.3, correctionPrice: 0 },
    { minPrice: 1001, maxPrice: 3000, multiplier: 1.25, correctionPrice: 0 },
    { minPrice: 3001, maxPrice: Infinity, multiplier: 1.2, correctionPrice: 0 }
  ],
  minProfitAmount: 500,
  stockThreshold: 3,
  categoryMapping: [],
  notificationEmail: '',
  autoSync: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  saveSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // 既存の設定とデフォルト値をマージ
      return {
        ...defaultSettings,
        ...parsed,
        // woocommerceSiteUrlが空の場合はデフォルト値を使用
        woocommerceSiteUrl: parsed.woocommerceSiteUrl || defaultSettings.woocommerceSiteUrl
      };
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // 設定を更新するたびにローカルストレージに保存
      localStorage.setItem('app_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // 設定が変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { SettingsContext };
export type { Settings, PriceRange, SettingsContextType };