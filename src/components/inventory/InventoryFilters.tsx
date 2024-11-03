import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface InventoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stockFilter: 'all' | 'low' | 'out';
  onStockFilterChange: (value: 'all' | 'low' | 'out') => void;
  sortBy: 'name' | 'stock' | 'updated';
  onSortChange: (value: 'name' | 'stock' | 'updated') => void;
}

export function InventoryFilters({
  searchTerm,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  sortBy,
  onSortChange,
}: InventoryFiltersProps) {
  return (
    <div className="p-4 border-b space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="商品名、SKU、カテゴリで検索..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-400" />
          <select
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value as 'all' | 'low' | 'out')}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全ての在庫</option>
            <option value="low">残りわずか</option>
            <option value="out">在庫切れ</option>
          </select>
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'name' | 'stock' | 'updated')}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="updated">更新日時</option>
          <option value="name">商品名</option>
          <option value="stock">在庫数</option>
        </select>
      </div>
    </div>
  );
}