import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { WooCommerceProvider } from './hooks/useWooCommerce';
import { CategoriesProvider } from './hooks/useCategories';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Inventory } from './pages/Inventory';
import { Pricing } from './pages/Pricing';
import { Logs } from './pages/Logs';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <WooCommerceProvider>
          <CategoriesProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/products" element={
                  <PrivateRoute>
                    <Layout>
                      <Products />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/products/:id" element={
                  <PrivateRoute>
                    <Layout>
                      <ProductDetail />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/inventory" element={
                  <PrivateRoute>
                    <Layout>
                      <Inventory />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/pricing" element={
                  <PrivateRoute>
                    <Layout>
                      <Pricing />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/logs" element={
                  <PrivateRoute>
                    <Layout>
                      <Logs />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/users" element={
                  <PrivateRoute requiredRole={['master_admin']}>
                    <Layout>
                      <Users />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </PrivateRoute>
                } />
              </Routes>
            </Router>
          </CategoriesProvider>
        </WooCommerceProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;