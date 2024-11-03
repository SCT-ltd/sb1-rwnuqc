import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-full">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
      <div className="mt-4">
        <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <span className="font-medium">
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
          <span className="ml-2 text-gray-600">from last month</span>
        </div>
      </div>
    </div>
  );
}