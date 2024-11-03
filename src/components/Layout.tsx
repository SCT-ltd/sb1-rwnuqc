import React from 'react';
import { Package, Settings, BarChart3, Users, Box, LineChart, History, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const navigation = [
    { name: 'ダッシュボード', href: '/', icon: BarChart3 },
    { name: '商品管理', href: '/products', icon: Package },
    { name: '在庫管理', href: '/inventory', icon: Box },
    { name: '価格管理', href: '/pricing', icon: LineChart },
    { name: 'システムログ', href: '/logs', icon: History },
    // ユーザー管理は管理者のみ表示
    ...(user?.role === 'master_admin' ? [{ name: 'ユーザー管理', href: '/users', icon: Users }] : []),
    { name: '設定', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold">在庫管理システム</h1>
            </div>

            {/* User info */}
            <div className="px-4 py-4 mt-2 border-b">
              <div className="text-sm font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>

            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <Icon
                        className={`${
                          isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5`}
                      />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-600 hover:bg-red-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <LogOut className="text-red-400 group-hover:text-red-500 mr-3 h-5 w-5" />
                  ログアウト
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}