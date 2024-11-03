interface LogEntry {
  type: 'info' | 'success' | 'error';
  category: 'sync' | 'product' | 'price' | 'stock' | 'system';
  message: string;
  details?: string;
}

export async function addLogEntry(entry: LogEntry): Promise<void> {
  const logs = JSON.parse(localStorage.getItem('system_logs') || '[]');
  
  const newLog = {
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  };

  logs.unshift(newLog);

  // 最大1000件まで保存
  if (logs.length > 1000) {
    logs.pop();
  }

  localStorage.setItem('system_logs', JSON.stringify(logs));
}