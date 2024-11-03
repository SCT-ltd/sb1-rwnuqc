import { Settings } from '../hooks/useSettings';

export function calculatePrice(originalPrice: number, settings: Settings): number {
  // 価格帯に基づいて掛け率を決定
  const priceRange = settings.priceRanges.find(
    range => originalPrice >= range.minPrice && originalPrice <= (range.maxPrice || Infinity)
  );

  if (!priceRange) {
    // デフォルトの掛け率を使用
    return Math.ceil(originalPrice * 1.3);
  }

  // 価格計算（掛け率 × 原価 + 矯正価格）
  const calculatedPrice = Math.ceil(originalPrice * priceRange.multiplier + priceRange.correctionPrice);

  // 最低利益額のチェック
  const profit = calculatedPrice - originalPrice;
  if (profit < settings.minProfitAmount) {
    return originalPrice + settings.minProfitAmount;
  }

  return calculatedPrice;
}