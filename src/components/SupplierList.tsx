import React from 'react';
import { Supplier } from '../types';

interface SupplierListProps {
  suppliers: Supplier[];
  selectedSupplierId: number | null;
  onSupplierClick: (supplierId: number) => void;
}

export function SupplierList({ suppliers, selectedSupplierId, onSupplierClick }: SupplierListProps) {
  return (
    <div className="w-72 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-bold">サプライヤー一覧</h2>
      </div>
      <div className="overflow-y-auto flex-1">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className={`p-4 cursor-pointer border-b hover:bg-gray-50 ${
              selectedSupplierId === supplier.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSupplierClick(supplier.id)}
          >
            <div className="font-medium">{supplier.corp_name}</div>
            <div className="text-sm text-gray-500">ID: {supplier.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}