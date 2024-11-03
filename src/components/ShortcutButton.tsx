import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ShortcutButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function ShortcutButton({ icon: Icon, label, onClick }: ShortcutButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
    >
      <Icon className="h-6 w-6 text-gray-600" />
      <span className="mt-2 text-sm font-medium text-gray-900">{label}</span>
    </button>
  );
}