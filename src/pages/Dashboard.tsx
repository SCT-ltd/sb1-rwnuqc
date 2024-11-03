import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  DollarSign, 
  PackageCheck, 
  AlertTriangle,
  Plus,
  History,
  Settings,
  BarChart
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ActivityLog } from '../components/ActivityLog';
import { ShortcutButton } from '../components/ShortcutButton';

export function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: '総商品数', value: '1,234', icon: Package, trend: { value: 12, isPositive: true } },
    { title: '総売上', value: '¥2.4M', icon: DollarSign, trend: { value: 8, isPositive: true } },
    { title: '在庫切れ商品', value: '23', icon: AlertTriangle, trend: { value: 5, isPositive: false } },
    { title: '価格変更履歴', value: '156', icon: History, trend: { value: 2, isPositive: true } },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'product',
      message: '新商品「ワイヤレスイヤホン」が在庫に追加されました',
      timestamp: '2分前'
    },
    {
      id: '2',
      type: 'price',
      message: '15商品の価格が自動調整されました',
      timestamp: '15分前'
    },
    {
      id: '3',
      type: 'inventory',
      message: '在庫切れ警告: 5商品の確認が必要です',
      timestamp: '1時間前'
    },
    {
      id: '4',
      type: 'system',
      message: 'NETSEAとの同期が完了しました',
      timestamp: '2時間前'
    }
  ];

  const shortcuts = [
    { icon: Plus, label: '商品追加', onClick: () => navigate('/products/new') },
    { icon: PackageCheck, label: '在庫管理', onClick: () => navigate('/inventory') },
    { icon: Settings, label: '価格設定', onClick: () => navigate('/pricing') },
    { icon: BarChart, label: '分析', onClick: () => navigate('/analytics') }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shortcuts */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-4">
            {shortcuts.map((shortcut) => (
              <ShortcutButton key={shortcut.label} {...shortcut} />
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2">
          <ActivityLog activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}