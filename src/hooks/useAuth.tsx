import { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, Company } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  company: Company | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 開発環境用のモックデータ
const MOCK_USERS = {
  'admin@example.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@example.com',
      username: '管理者',
      role: 'master_admin',
      companyId: '1',
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedBy: 'system'
    } as AuthUser,
    company: {
      id: '1',
      name: 'デモ企業',
      plan: 'enterprise',
      status: 'active',
      maxUsers: 10,
      createdAt: '2024-01-01T00:00:00.000Z'
    } as Company
  },
  'user@example.com': {
    password: 'user123',
    user: {
      id: '2',
      email: 'user@example.com',
      username: '利用者',
      role: 'user',
      companyId: '1',
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedBy: 'system'
    } as AuthUser,
    company: {
      id: '1',
      name: 'デモ企業',
      plan: 'enterprise',
      status: 'active',
      maxUsers: 10,
      createdAt: '2024-01-01T00:00:00.000Z'
    } as Company
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // セッションの復元
    const savedUser = localStorage.getItem('auth_user');
    const savedCompany = localStorage.getItem('auth_company');
    
    if (savedUser && savedCompany) {
      setUser(JSON.parse(savedUser));
      setCompany(JSON.parse(savedCompany));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // 開発環境用の認証ロジック
    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];
    
    if (!mockUser || mockUser.password !== password) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // ログイン成功
    setUser(mockUser.user);
    setCompany(mockUser.company);
    
    // ローカルストレージに保存
    localStorage.setItem('auth_user', JSON.stringify(mockUser.user));
    localStorage.setItem('auth_company', JSON.stringify(mockUser.company));
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_company');
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}