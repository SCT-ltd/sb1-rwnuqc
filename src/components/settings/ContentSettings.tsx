import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

export function ContentSettings() {
  const { settings, updateSettings } = useSettings();

  const addReplaceWord = () => {
    updateSettings({
      replaceWords: [...settings.replaceWords, { from: '', to: '' }]
    });
  };

  const updateReplaceWord = (index: number, field: 'from' | 'to', value: string) => {
    const newReplaceWords = settings.replaceWords.map((word, i) => 
      i === index ? { ...word, [field]: value } : word
    );
    updateSettings({ replaceWords: newReplaceWords });
  };

  const removeReplaceWord = (index: number) => {
    const newReplaceWords = settings.replaceWords.filter((_, i) => i !== index);
    updateSettings({ replaceWords: newReplaceWords });
  };

  const addExcludeWord = () => {
    updateSettings({
      excludeWords: [...settings.excludeWords, '']
    });
  };

  const updateExcludeWord = (index: number, value: string) => {
    const newExcludeWords = settings.excludeWords.map((word, i) => 
      i === index ? value : word
    );
    updateSettings({ excludeWords: newExcludeWords });
  };

  const removeExcludeWord = (index: number) => {
    const newExcludeWords = settings.excludeWords.filter((_, i) => i !== index);
    updateSettings({ excludeWords: newExcludeWords });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">置換ワード設定</h2>
          <button
            onClick={addReplaceWord}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            置換ワードを追加
          </button>
        </div>
        <div className="space-y-4">
          {settings.replaceWords.map((word, index) => (
            <div key={index} className="flex items-center gap-4">
              <input
                type="text"
                value={word.from}
                onChange={(e) => updateReplaceWord(index, 'from', e.target.value)}
                placeholder="置換前"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <span className="text-gray-500">→</span>
              <input
                type="text"
                value={word.to}
                onChange={(e) => updateReplaceWord(index, 'to', e.target.value)}
                placeholder="置換後"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={() => removeReplaceWord(index)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">除外ワード設定</h2>
          <button
            onClick={addExcludeWord}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            除外ワードを追加
          </button>
        </div>
        <div className="space-y-4">
          {settings.excludeWords.map((word, index) => (
            <div key={index} className="flex items-center gap-4">
              <input
                type="text"
                value={word}
                onChange={(e) => updateExcludeWord(index, e.target.value)}
                placeholder="除外ワード"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={() => removeExcludeWord(index)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}