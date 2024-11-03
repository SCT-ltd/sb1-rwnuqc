import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Package, Tag, Calendar, Info } from 'lucide-react';
import { Product } from '../types';
import { CategorySelect } from './CategorySelect';

interface ProductDetailProps {
  product: Product;
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number) => void;
}

export function ProductDetail({ 
  product, 
  currentImageIndex, 
  onImageIndexChange,
  selectedCategoryId,
  onCategoryChange
}: ProductDetailProps) {
  const productImages = [
    product.image_url_1,
    product.image_url_2,
    product.image_url_3,
    product.image_url_4,
    product.image_url_5,
  ].filter(Boolean);

  return (
    <div className="w-96 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-bold">商品詳細</h2>
      </div>
      <div className="overflow-y-auto flex-1">
        <div className="relative aspect-square bg-gray-100">
          <img
            src={productImages[currentImageIndex]}
            alt="商品画像"
            className="w-full h-full object-contain"
          />
          {productImages.length > 1 && (
            <>
              <button
                onClick={() => onImageIndexChange(
                  currentImageIndex > 0 ? currentImageIndex - 1 : productImages.length - 1
                )}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => onImageIndexChange(
                  currentImageIndex < productImages.length - 1 ? currentImageIndex + 1 : 0
                )}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {productImages.length}
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="font-bold text-xl mb-2">{product.product_name}</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                <Package className="h-4 w-4" />
                {product.set.length}種類
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                <Tag className="h-4 w-4" />
                {product.category_id}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                <Calendar className="h-4 w-4" />
                {new Date(product.update_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出品カテゴリ
            </label>
            <CategorySelect
              selectedCategoryId={selectedCategoryId}
              onChange={onCategoryChange}
              netseaCategoryId={product.category_id}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {product.description && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Info className="h-4 w-4" />
                商品説明
              </div>
              <p className="text-sm">{product.description}</p>
            </div>
          )}

          <div>
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              バリエーション
            </h4>
            <div className="space-y-3">
              {product.set.map((variation) => (
                <div
                  key={variation.label}
                  className="p-4 border rounded-lg hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{variation.label}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        数量: {variation.set_num}個
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ¥{variation.price.toLocaleString()}
                      </div>
                      <div className={`text-sm mt-1 ${
                        variation.sold_out_flag === 'Y'
                          ? 'text-red-500'
                          : 'text-green-500'
                      }`}>
                        {variation.sold_out_flag === 'Y' ? '在庫切れ' : '在庫あり'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}