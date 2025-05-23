// src/components/layout/MainLayout.jsx - Main layout with navigation
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import CartIcon from '@/components/cart/CartIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Blockchain } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  Package, 
  MessageSquare, 
  LogOut,
  Carrot,
  Users,
  BarChart,
  ShoppingBag
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdmin = userProfile?.role === 'admin';
  const isRolnik = userProfile?.role === 'rolnik';
  const isKlient = userProfile?.role === 'klient';
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const getInitials = () => {
    if (!currentUser) return 'U';
    const name = currentUser.displayName || currentUser.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-green-600 flex items-center">
            <Carrot className="mr-2" />
            Farm Direct
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                {isKlient && (
                  <CartIcon />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
          
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 px-4 rounded hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {isKlient && (
                  <Link
                    to="/cart"
                    className="block py-2 px-4 rounded hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Shopping Cart
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block py-2 px-4 rounded hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-4 rounded hover:bg-gray-100 text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 px-4 rounded hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 px-4 rounded hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Main content with sidebar */}
      {currentUser ? (
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-64 mb-8 md:mb-0 md:mr-8">
            <div className="bg-white rounded-lg shadow p-4">
              <nav className="space-y-2">
                <Link
                  to="/dashboard"
                  className={`flex items-center p-2 rounded-md w-full ${
                    location.pathname === '/dashboard'
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Home className="mr-2 h-5 w-5" />
                  Dashboard
                </Link>
                
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/users"
                      className={`flex items-center p-2 rounded-md w-full ${
                        location.pathname.startsWith('/admin/users')
                          ? 'bg-green-50 text-green-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Manage Users
                    </Link>
                    
                    <Link
                      to="/admin/stats"
                      className={`flex items-center p-2 rounded-md w-full ${
                        location.pathname.startsWith('/admin/stats')
                          ? 'bg-green-50 text-green-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <BarChart className="mr-2 h-5 w-5" />
                      Statistics
                    </Link>
                  </>
                )}
                
                {isRolnik && (
                  <>
                    <Link
                      to="/products/manage"
                      className={`flex items-center p-2 rounded-md w-full ${
                        location.pathname.startsWith('/products/manage')
                          ? 'bg-green-50 text-green-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Package className="mr-2 h-5 w-5" />
                      Manage Products
                    </Link>
                    <Link
                      to="/blockchain"
                      className={`flex items-center p-2 rounded-md w-full ${
                        location.pathname.startsWith('/blockchain')
                          ? 'bg-green-50 text-green-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Blockchain className="mr-2 h-5 w-5" />
                      Blockchain
                    </Link>
                  </>
                )}
                
                {isKlient && (
                  <>
                    <Link
                      to="/browse"
                      className={`flex items-center p-2 rounded-md w-full ${
                        location.pathname.startsWith('/browse')
                          ? 'bg-green-50 text-green-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Carrot className="mr-2 h-5 w-5" />
                      Browse Products
                    </Link>

                    <Link
                      to="/cart"
                      className={`flex items-center p-2 rounded-md w-full ${
                        location.pathname.startsWith('/cart')
                          ? 'bg-green-50 text-green-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Shopping Cart
                    </Link>
                  </>
                )}
                
                <Link
                  to="/orders"
                  className={`flex items-center p-2 rounded-md w-full ${
                    location.pathname.startsWith('/orders')
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Orders
                </Link>
                
                <Link
                  to="/chat"
                  className={`flex items-center p-2 rounded-md w-full ${
                    location.pathname.startsWith('/chat')
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Messages
                </Link>
                
                <Link
                  to="/profile"
                  className={`flex items-center p-2 rounded-md w-full ${
                    location.pathname.startsWith('/profile')
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center p-2 rounded-md w-full text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </button>
              </nav>
            </div>
          </aside>
          
          {/* Main content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      )}
      
      {/* Footer */}
      <footer className="bg-white shadow-inner mt-8">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600">
            © {new Date().getFullYear()} Farm Direct - Connecting Farmers and Customers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;