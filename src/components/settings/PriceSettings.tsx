import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

export function PriceSettings() {
  const { settings, updateSettings } = useSettings();

  const addPriceRange = () => {
    const lastRange = settings.priceRanges[settings.priceRanges.length - 1];
    const newRange = {
      minPrice: lastRange ? lastRange.maxPrice + 1 : 0,
      maxPrice: lastRange ? lastRange.maxPrice + 5000 : 5000,
      multiplier: 1.2,
      correctionPrice: 0
    };
    updateSettings({
      priceRanges: [...settings.priceRanges, newRange]
    });
  };

  const removePriceRange = (index: number) => {
    const newRanges = settings.priceRanges.filter((_, i) => i !== index);
    updateSettings({ priceRanges: newRanges });
  };

  const updatePriceRange = (index: number, field: keyof typeof settings.priceRanges[0], value: number) => {
    const newRanges = settings.priceRanges.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    );
    updateSettings({ priceRanges: newRanges });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">価格設定</h2>
        <button
          onClick={addPriceRange}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
        >
          <Plus className="h-4 w-4" />
          価格帯を追加
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最小価格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最大価格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">掛け率</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">矯正価格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {settings.priceRanges.map((range, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={range.minPrice ?? ''}
                    onChange={(e) => updatePriceRange(index, 'minPrice', Number(e.target.value))}
                    className="w-32 px-3 py-2 border rounded-md"
                    min="0"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={range.maxPrice ?? ''}
                    onChange={(e) => updatePriceRange(index, 'maxPrice', Number(e.target.value))}
                    className="w-32 px-3 py-2 border rounded-md"
                    min="0"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={range.multiplier ?? ''}
                      onChange={(e) => updatePriceRange(index, 'multiplier', Number(e.target.value))}
                      className="w-24 px-3 py-2 border rounded-md"
                      min="1"
                      step="0.01"
                    />
                    <span className="text-gray-500">倍</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">¥</span>
                    <input
                      type="number"
                      value={range.correctionPrice ?? ''}
                      onChange={(e) => updatePriceRange(index, 'correctionPrice', Number(e.target.value))}
                      className="w-24 px-3 py-2 border rounded-md"
                      min="0"
                      step="1"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => removePriceRange(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">価格設定例</h3>
        <div className="space-y-2 text-sm text-gray-600">
          {settings.priceRanges.map((range, index) => {
            const minPrice = range.minPrice?.toLocaleString() ?? '0';
            const maxPrice = range.maxPrice?.toLocaleString() ?? '∞';
            const multiplier = range.multiplier ?? 1;
            const correctionPrice = range.correctionPrice?.toLocaleString() ?? '0';
            const examplePrice = 1000; // サンプル価格
            const calculatedPrice = Math.ceil(examplePrice * multiplier + range.correctionPrice);
            
            return (
              <div key={index} className="p-2 border-b border-gray-200 last:border-0">
                <div>¥{minPrice} ～ ¥{maxPrice}:</div>
                <div className="ml-4 text-gray-500">
                  <div>掛け率: {multiplier}倍</div>
                  <div>矯正価格: +¥{correctionPrice}</div>
                  <div className="mt-1 text-blue-600">
                    例) 仕入価格¥{examplePrice.toLocaleString()} →
                    販売価格¥{calculatedPrice.toLocaleString()}
                    <span className="text-gray-500 text-xs ml-2">
                      (¥{examplePrice} × {multiplier} + ¥{correctionPrice})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}