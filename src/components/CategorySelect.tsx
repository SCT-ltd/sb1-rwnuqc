import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface CategorySelectProps {
  selectedCategoryId: number | null;
  onChange: (categoryId: number) => void;
  className?: string;
  netseaCategoryId?: string;
}

export function CategorySelect({ selectedCategoryId, onChange, className = '', netseaCategoryId }: CategorySelectProps) {
  const { wooCommerceCategories, categoryMappings, isLoading } = useCategories();

  // NETSEAカテゴリIDに対応するWooCommerceカテゴリIDを取得
  const mappedCategoryId = netseaCategoryId
    ? categoryMappings.find(mapping => mapping.netseaId === netseaCategoryId)?.wooCommerceId
    : null;

  // コンポーネントマウント時に対応するカテゴリを自動選択
  React.useEffect(() => {
    if (mappedCategoryId && !selectedCategoryId) {
      onChange(mappedCategoryId);
    }
  }, [mappedCategoryId, selectedCategoryId, onChange]);

  if (isLoading) {
    return (
      <select disabled className={`${className} opacity-50`}>
        <option>カテゴリを読み込み中...</option>
      </select>
    );
  }

  return (
    <select
      value={selectedCategoryId || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
    >
      <option value="">カテゴリを選択</option>
      {wooCommerceCategories.map((category) => (
        <option 
          key={category.id} 
          value={category.id}
          className={mappedCategoryId === category.id ? 'font-bold' : ''}
        >
          {category.name}
          {mappedCategoryId === category.id ? ' (推奨)' : ''}
        </option>
      ))}
    </select>
  );
}