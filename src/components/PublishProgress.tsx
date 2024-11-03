import React from 'react';
import { Loader2 } from 'lucide-react';

interface PublishProgress {
  currentProduct: string;
  currentStep: string;
  progress: number;
  total: number;
}

interface PublishProgressProps {
  isOpen: boolean;
  progress: PublishProgress;
}

export function PublishProgress({ isOpen, progress }: PublishProgressProps) {
  if (!isOpen) return null;

  const percentage = Math.round((progress.progress / progress.total) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <h3 className="text-lg font-medium">商品を出品中...</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{progress.currentProduct}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>処理内容: {progress.currentStep}</p>
            <p className="mt-1">
              {progress.progress} / {progress.total} 商品
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}