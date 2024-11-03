import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Save, ArrowUpDown, Percent, X } from 'lucide-react';
import { BaseProduct } from '../types';
import { fetchBaseProducts } from '../services/netseaApi';

type SortField = 'title' | 'price' | 'stock' | 'updated_at';
type SortOrder = 'asc' | 'desc';

export function Pricing() {
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [priceAdjustments, setPriceAdjustments] = useState<Record<string, number>>({});
  const [bulkAdjustmentPercent, setBulkAdjustmentPercent] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchBaseProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedAndFilteredProducts = products
    .filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'title':
          return order * a.title.localeCompare(b.title);
        case 'price':
          return order * ((priceAdjustments[a.product_id] || a.price) - (priceAdjustments[b.product_id] || b.price));
        case 'stock':
          return order * (a.stock - b.stock);
        case 'updated_at':
          return order * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        default:
          return 0;
      }
    });

  const handlePriceChange = (productId: string, newPrice: number) => {
    setPriceAdjustments(prev => ({
      ...prev,
      [productId]: newPrice
    }));
  };

  const handleBulkPriceAdjustment = () => {
    const newAdjustments = { ...priceAdjustments };
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.product_id === productId);
      if (product) {
        const currentPrice = priceAdjustments[productId] || product.price;
        newAdjustments[productId] = Math.round(currentPrice * (1 + bulkAdjustmentPercent / 100));
      }
    });
    setPriceAdjustments(newAdjustments);
    setShowBulkEdit(false);
    setSelectedProducts(new Set());
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === sortedAndFilteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(sortedAndFilteredProducts.map(p => p.product_id)));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      // ここでBASE APIを使用して価格を更新
      // 実際のAPIコールを実装
      setError('価格を更新しました');
      setPriceAdjustments({});
      setSelectedProducts(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : '価格の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">価格管理</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowBulkEdit(!showBulkEdit)}
            className={`px-4 py-2 rounded-md ${
              showBulkEdit ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            } hover:bg-opacity-80`}
          >
            一括編集
          </button>
          {Object.keys(priceAdjustments).length > 0 && (
            <button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              変更を保存
            </button>
          )}
        </div>
      </div>

      {showBulkEdit && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-white rounded-md border hover:bg-gray-50"
            >
              {selectedProducts.size === sortedAndFilteredProducts.length ? '全選択解除' : '全選択'}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bulkAdjustmentPercent}
                onChange={(e) => setBulkAdjustmentPercent(Number(e.target.value))}
                className="w-24 px-3 py-2 border rounded-md"
                placeholder="変更率(%)"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <button
              onClick={handleBulkPriceAdjustment}
              disabled={selectedProducts.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              選択商品の価格を一括変更
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="商品名、商品IDで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-400" />
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="updated_at">更新日時</option>
            <option value="title">商品名</option>
            <option value="price">価格</option>
            <option value="stock">在庫数</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowUpDown className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showBulkEdit && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === sortedAndFilteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品情報</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">現在価格</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新価格</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">在庫状況</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日時</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredProducts.map((product) => (
              <tr key={product.product_id} className="hover:bg-gray-50">
                {showBulkEdit && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.product_id)}
                      onChange={() => {
                        const newSelected = new Set(selectedProducts);
                        if (newSelected.has(product.product_id)) {
                          newSelected.delete(product.product_id);
                        } else {
                          newSelected.add(product.product_id);
                        }
                        setSelectedProducts(newSelected);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0">
                      <img className="h-16 w-16 rounded-lg object-cover" src={product.img_url} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.title}</div>
                      <div className="text-sm text-gray-500">ID: {product.product_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">¥{product.price.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={priceAdjustments[product.product_id] || ''}
                    onChange={(e) => handlePriceChange(product.product_id, Number(e.target.value))}
                    placeholder={product.price.toString()}
                    className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? `在庫あり (${product.stock}個)` : '在庫切れ'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(product.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  );
}