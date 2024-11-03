export type UserRole = 'master_admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  companyId: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  updatedBy: string;
}

export interface Company {
  id: string;
  name: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'trial' | 'suspended';
  maxUsers: number;
  createdAt: string;
  trialEndsAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  company: Company;
}