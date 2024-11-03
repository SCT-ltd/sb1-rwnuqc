import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, Download, AlertCircle, CheckCircle, Info, Clock, X } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  category: 'sync' | 'product' | 'price' | 'stock' | 'system';
  message: string;
  details?: string;
}

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['info', 'success', 'error']));
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['sync', 'product', 'price', 'stock', 'system']));
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());

  // サンプルログデータ
  useEffect(() => {
    const sampleLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'success',
        category: 'sync',
        message: 'NETSEAとの同期が完了しました',
        details: '更新された商品: 15件\n新規商品: 5件\n削除された商品: 2件'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'error',
        category: 'price',
        message: '価格更新に失敗しました',
        details: 'エラーコード: E1234\n対象商品ID: PRD-001'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'info',
        category: 'stock',
        message: '在庫数が閾値を下回りました',
        details: '商品ID: PRD-002\n現在の在庫数: 2個\n設定された閾値: 3個'
      }
    ];
    setLogs(sampleLogs);
  }, []);

  // 自動更新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshLogs();
      }, 30000); // 30秒ごとに更新
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const refreshLogs = async () => {
    setIsLoading(true);
    try {
      // 実際のAPIコールをここに実装
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleDetails = (logId: string) => {
    const newDetails = new Set(showDetails);
    if (newDetails.has(logId)) {
      newDetails.delete(logId);
    } else {
      newDetails.add(logId);
    }
    setShowDetails(newDetails);
  };

  const exportLogs = () => {
    const exportData = filteredLogs.map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      type: log.type,
      category: log.category,
      message: log.message,
      details: log.details
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredLogs = logs
    .filter(log => 
      (selectedTypes.has(log.type) && selectedCategories.has(log.category)) &&
      (log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.details?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">システムログ</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              autoRefresh ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            } hover:bg-opacity-80`}
          >
            <RefreshCcw className={`h-5 w-5 ${autoRefresh ? 'animate-spin' : ''}`} />
            自動更新
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Download className="h-5 w-5" />
            エクスポート
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ログメッセージを検索..."
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
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2">
            {['info', 'success', 'error'].map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedTypes.has(type)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="border-l pl-2 flex gap-2">
            {['sync', 'product', 'price', 'stock', 'system'].map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedCategories.has(category)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        log.category === 'sync' ? 'bg-purple-100 text-purple-700' :
                        log.category === 'product' ? 'bg-green-100 text-green-700' :
                        log.category === 'price' ? 'bg-blue-100 text-blue-700' :
                        log.category === 'stock' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.category}
                      </span>
                    </div>
                  </div>
                  {log.details && (
                    <button
                      onClick={() => toggleDetails(log.id)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showDetails.has(log.id) ? '詳細を隠す' : '詳細を表示'}
                    </button>
                  )}
                  {showDetails.has(log.id) && log.details && (
                    <pre className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                      {log.details}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}