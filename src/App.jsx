// src/App.jsx - Updated with Blockchain Integration
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/use-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { BlockchainProvider } from './components/blockchain/WalletProvider';
import MainLayout from './components/layout/MainLayout';

// Existing imports
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import ProductAdd from './pages/products/ProductAdd';
import ProductManage from './pages/products/ProductManage';
import ProductEdit from './pages/products/ProductEdit';
import ProductImages from './pages/products/ProductImages';
import ProductQR from './pages/products/ProductQR';
import ProductTracker from './pages/products/ProductTracker';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderCreate from './pages/orders/OrderCreate';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ChatList from './pages/chat/ChatList';
import ChatDetail from './pages/chat/ChatDetail';

// New Blockchain imports
import { BlockchainDashboard } from './pages/blockchain/BlockchainDashboard';
import { ProductGrowthTracker } from './components/blockchain/ProductGrowthTracker';

// Protected route component (updated)
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <CartProvider>
          <Router>
            <MainLayout>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Main Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Blockchain Routes */}
                <Route 
                  path="/blockchain" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <BlockchainDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Product Routes */}
                <Route 
                  path="/browse" 
                  element={
                    <ProtectedRoute allowedRoles={['klient', 'admin']}>
                      <ProductList />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/:id" 
                  element={
                    <ProtectedRoute>
                      <ProductDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/add" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <ProductAdd />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/manage" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <ProductManage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/edit/:id" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <ProductEdit />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/images/:id" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <ProductImages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/qr/:id" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <ProductQR />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Growth Tracking */}
                <Route 
                  path="/products/growth/:id" 
                  element={
                    <ProtectedRoute allowedRoles={['rolnik', 'admin']}>
                      <ProductGrowthTracker />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Public tracking */}
                <Route 
                  path="/track/product/:id" 
                  element={<ProductTracker />} 
                />
                
                {/* Order Routes */}
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <OrderList />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders/:id" 
                  element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products/:id/order" 
                  element={
                    <ProtectedRoute allowedRoles={['klient']}>
                      <OrderCreate />
                    </ProtectedRoute>
                  } 
                />

                {/* Cart Routes */}
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute allowedRoles={['klient']}>
                      <Cart />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute allowedRoles={['klient']}>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />

                {/* Chat Routes */}
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <ChatList />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat/:id" 
                  element={
                    <ProtectedRoute>
                      <ChatDetail />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirect root to dashboard if logged in, otherwise to login */}
                <Route 
                  path="/" 
                  element={<Navigate to="/dashboard" replace />} 
                />
              </Routes>
            </MainLayout>
            <Toaster />
          </Router>
        </CartProvider>
      </BlockchainProvider>
    </AuthProvider>
  );
};

export default App;