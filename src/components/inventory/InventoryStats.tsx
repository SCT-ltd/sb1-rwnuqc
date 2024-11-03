import React from 'react';
import { Package, AlertTriangle, TrendingDown, ArrowDownUp } from 'lucide-react';
import { WooCommerceProduct } from '../../types';

interface InventoryStatsProps {
  products: WooCommerceProduct[];
}

export function InventoryStats({ products }: InventoryStatsProps) {
  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;

  const stats = [
    {
      label: '総商品数',
      value: totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: '在庫切れ',
      value: outOfStock,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: '在庫残りわずか',
      value: lowStock,
      icon: TrendingDown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: '在庫変動',
      value: '24h',
      icon: ArrowDownUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}