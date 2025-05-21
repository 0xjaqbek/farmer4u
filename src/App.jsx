import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/use-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Product Pages
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import ProductAdd from './pages/products/ProductAdd';
import ProductManage from './pages/products/ProductManage';
import ProductEdit from './pages/products/ProductEdit';
import ProductImages from './pages/products/ProductImages';
import ProductQR from './pages/products/ProductQR';
import ProductTracker from './pages/products/ProductTracker';

// Order Pages
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderCreate from './pages/orders/OrderCreate';

// Protected route component
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
            
            {/* Redirect root to dashboard if logged in, otherwise to login */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Routes>
        </MainLayout>
        <Toaster />
      </Router>
    </AuthProvider>
  );
};

export default App;
