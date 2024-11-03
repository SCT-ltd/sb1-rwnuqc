import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, AlertCircle, CheckCircle2, Percent, Eye, X, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { useSettings } from '../hooks/useSettings';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  hasMore: boolean;
  searchTerm: string;
  hasStock: boolean;
  selectedProduct: Product | null;
  publishedProducts: Set<string>;
  onSearchChange: (value: string) => void;
  onStockFilterChange: (hasStock: boolean) => void;
  onProductClick: (product: Product) => void;
  onLoadMore: () => void;
  onTogglePublish: (product: Product) => void;
  onPriceAdjustment: (productId: string, newPrice: number) => void;
  priceAdjustments: Record<string, number>;
  isPublishedToWooCommerce: (productId: string) => boolean;
}

function highlightReplacedWords(text: string, replaceWords: Array<{ from: string; to: string }>) {
  let result = text;
  replaceWords.forEach(({ from, to }) => {
    const regex = new RegExp(from, 'gi');
    result = result.replace(regex, `<span class="replaced-word" data-tooltip="元の表記: ${from}">${to}</span>`);
  });
  return result;
}

function checkExcludedWords(text: string, excludeWords: string[]): { isExcluded: boolean; matchedWords: string[] } {
  const matchedWords = excludeWords.filter(word => 
    text.toLowerCase().includes(word.toLowerCase())
  );
  return {
    isExcluded: matchedWords.length > 0,
    matchedWords
  };
}

export function ProductList({
  products,
  isLoading,
  hasMore,
  searchTerm,
  hasStock,
  selectedProduct,
  publishedProducts,
  onSearchChange,
  onStockFilterChange,
  onProductClick,
  onLoadMore,
  onTogglePublish,
  onPriceAdjustment,
  priceAdjustments,
  isPublishedToWooCommerce,
}: ProductListProps) {
  const { settings } = useSettings();
  const [marginRate, setMarginRate] = useState<number>(20);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [monitoredProducts, setMonitoredProducts] = useState<Set<string>>(new Set());
  const [showPriceCalculator, setShowPriceCalculator] = useState(false);

  const processedProducts = useMemo(() => {
    return products.map(product => {
      const { isExcluded, matchedWords } = checkExcludedWords(
        product.product_name,
        settings.excludeWords
      );
      
      const processedName = highlightReplacedWords(product.product_name, settings.replaceWords);
      
      return {
        ...product,
        isExcluded,
        matchedWords,
        processedName
      };
    });
  }, [products, settings.excludeWords, settings.replaceWords]);

  const filteredProducts = useMemo(() => {
    return processedProducts.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStock = !hasStock || product.set.some(s => s.sold_out_flag === 'N');
      return matchesSearch && matchesStock;
    });
  }, [processedProducts, searchTerm, hasStock]);

  const handleSelectAll = () => {
    const availableProducts = filteredProducts.filter(p => !p.isExcluded && !isPublishedToWooCommerce(p.product_id));
    if (selectedProducts.size === availableProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(availableProducts.map(p => p.product_id)));
    }
  };

  const handleBulkPublish = () => {
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.product_id === productId);
      if (product && !product.isExcluded) {
        onTogglePublish(product);
      }
    });
    setSelectedProducts(new Set());
  };

  const toggleMonitoring = (productId: string) => {
    const newMonitored = new Set(monitoredProducts);
    if (newMonitored.has(productId)) {
      newMonitored.delete(productId);
    } else {
      newMonitored.add(productId);
    }
    setMonitoredProducts(newMonitored);
  };

  const calculateMarginPrice = (originalPrice: number) => {
    return Math.ceil((originalPrice * (100 + marginRate)) / 100);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
            <input
              type="radio"
              id="hasStock"
              checked={hasStock}
              onChange={() => onStockFilterChange(true)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hasStock" className="text-sm font-medium cursor-pointer">
              在庫あり
            </label>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
            <input
              type="radio"
              id="noStock"
              checked={!hasStock}
              onChange={() => onStockFilterChange(false)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="noStock" className="text-sm font-medium cursor-pointer">
              全商品
            </label>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="商品名、SKU、カテゴリで検索..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            {selectedProducts.size === filteredProducts.filter(p => !p.isExcluded && !isPublishedToWooCommerce(p.product_id)).length
              ? '全選択解除'
              : '全選択'}
          </button>
          
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkPublish}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              選択商品を出品 ({selectedProducts.size}件)
            </button>
          )}

          <button
            onClick={() => setShowPriceCalculator(!showPriceCalculator)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            <Percent className="h-4 w-4" />
            利益率計算
          </button>
        </div>

        {showPriceCalculator && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium">利益率:</label>
            <input
              type="number"
              value={marginRate}
              onChange={(e) => setMarginRate(Number(e.target.value))}
              className="w-24 px-3 py-2 border rounded-lg"
              min="0"
              max="1000"
            />
            <span className="text-sm">%</span>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-y-auto h-full">
          {isLoading && products.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {filteredProducts.map((product) => {
                const isPublished = isPublishedToWooCommerce(product.product_id);
                return (
                  <div
                    key={product.product_id}
                    className={`group p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                      selectedProduct?.product_id === product.product_id ? 'bg-blue-50' : ''
                    } ${product.isExcluded ? 'bg-red-50' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1" onClick={() => !product.isExcluded && onProductClick(product)}>
                        <div className="flex items-start gap-2">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.image_url_1}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div 
                              className={`font-medium group-hover:text-blue-600 transition-colors ${
                                product.isExcluded ? 'text-red-600' : ''
                              }`}
                            >
                              <div className="[&_.replaced-word]:relative [&_.replaced-word]:bg-yellow-100/20 [&_.replaced-word]:px-0.5 [&_.replaced-word]:rounded [&_.replaced-word]:cursor-help [&_.replaced-word:hover::after]:content-[attr(data-tooltip)] [&_.replaced-word:hover::after]:absolute [&_.replaced-word:hover::after]:bottom-full [&_.replaced-word:hover::after]:left-1/2 [&_.replaced-word:hover::after]:-translate-x-1/2 [&_.replaced-word:hover::after]:bg-black/80 [&_.replaced-word:hover::after]:text-white [&_.replaced-word:hover::after]:px-2 [&_.replaced-word:hover::after]:py-1 [&_.replaced-word:hover::after]:rounded [&_.replaced-word:hover::after]:text-xs [&_.replaced-word:hover::after]:whitespace-nowrap [&_.replaced-word:hover::after]:z-10"
                                dangerouslySetInnerHTML={{ __html: product.processedName }}
                              />
                            </div>
                            {product.isExcluded && (
                              <div className="text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                商品名に除外ワード「{product.matchedWords.join('」「')}」が含まれているため出品できません
                              </div>
                            )}
                            <div className="text-sm text-gray-500 mt-1">
                              {product.set.some(s => s.sold_out_flag === 'N') ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4" />
                                  在庫あり
                                </span>
                              ) : (
                                <span className="text-red-500 flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" />
                                  在庫切れ
                                </span>
                              )}
                            </div>
                            {isPublished && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-blue-600">
                                <ShoppingBag className="h-4 w-4" />
                                <span>WooCommerce出品済み</span>
                              </div>
                            )}
                            {showPriceCalculator && product.set[0] && (
                              <div className="text-sm font-medium mt-1">
                                販売価格: ¥{calculateMarginPrice(product.set[0].price).toLocaleString()}
                                <span className="text-gray-500 ml-2">
                                  (仕入: ¥{product.set[0].price.toLocaleString()})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMonitoring(product.product_id)}
                          className={`p-2 rounded-lg transition-colors ${
                            monitoredProducts.has(product.product_id)
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="在庫・価格監視"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!isPublished && !product.isExcluded && (
                          <button
                            onClick={() => {
                              onTogglePublish(product);
                              const newSelected = new Set(selectedProducts);
                              if (newSelected.has(product.product_id)) {
                                newSelected.delete(product.product_id);
                              } else {
                                newSelected.add(product.product_id);
                              }
                              setSelectedProducts(newSelected);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              selectedProducts.has(product.product_id)
                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={selectedProducts.has(product.product_id) ? '出品を取り消す' : '出品する'}
                          >
                            <ShoppingBag className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                        読み込み中...
                      </span>
                    ) : (
                      'さらに読み込む'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}