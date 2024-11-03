import React, { useState } from 'react';
import { Edit2, Save, X, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BaseProduct } from '../types';

interface BaseProductListProps {
  products: BaseProduct[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPriceAdjustment: (productId: string, newPrice: number) => void;
  priceAdjustments: Record<string, number>;
}

export function BaseProductList({
  products,
  searchTerm,
  onSearchChange,
  onPriceAdjustment,
  priceAdjustments,
}: BaseProductListProps) {
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  const handleEditPrice = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setTempPrice(currentPrice);
  };

  const handleSavePrice = (productId: string) => {
    onPriceAdjustment(productId, tempPrice);
    setEditingPrice(null);
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold">BASE商品一覧</h2>
        <span className="text-sm text-gray-500">
          {products.length}件
        </span>
      </div>

      <div className="overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品情報</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">在庫状況</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.product_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0">
                      <img className="h-16 w-16 rounded-lg object-cover" src={product.img_url} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.title}</div>
                      <div className="text-sm text-gray-500">ID: {product.product_id}</div>
                      <div className="text-xs text-gray-400">更新: {new Date(product.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingPrice === product.product_id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(Number(e.target.value))}
                        className="w-24 px-2 py-1 text-sm border rounded"
                        min="0"
                      />
                      <button
                        onClick={() => handleSavePrice(product.product_id)}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ¥{(priceAdjustments[product.product_id] || product.price).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleEditPrice(product.product_id, product.price)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      在庫あり ({product.stock}個)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      在庫切れ
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    商品ページ
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}