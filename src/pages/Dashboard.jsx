// src/pages/Dashboard.jsx - Dashboard page
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrdersByClient, getOrdersByRolnik } from '../firebase/orders';
import { getProductsByRolnik } from '../firebase/products';
import { getAllRolniks, findNearbyRolniks } from '../firebase/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Package, Users, Activity, Loader2 } from 'lucide-react';
import OrderStatus from '@/components/orders/OrderStatus';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [nearbyRolniks, setNearbyRolniks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch data based on user role
        if (userProfile.role === 'klient') {
          try {
            // Fetch orders for client
            const clientOrders = await getOrdersByClient(userProfile.uid);
            setOrders(clientOrders);
          } catch (orderErr) {
            console.error('Error fetching client orders:', orderErr);
            // Set empty array to prevent UI errors
            setOrders([]);
          }
          
          try {
            // Fetch nearby rolniks
            const nearby = await findNearbyRolniks(userProfile.postalCode);
            setNearbyRolniks(nearby);
          } catch (rolnikErr) {
            console.error('Error fetching nearby rolniks:', rolnikErr);
            setNearbyRolniks([]);
          }
        } else if (userProfile.role === 'rolnik') {
          try {
            // Fetch orders for rolnik
            const rolnikOrders = await getOrdersByRolnik(userProfile.uid);
            setOrders(rolnikOrders);
          } catch (orderErr) {
            console.error('Error fetching rolnik orders:', orderErr);
            setOrders([]);
          }
          
          try {
            // Fetch products for rolnik
            const rolnikProducts = await getProductsByRolnik(userProfile.uid);
            setProducts(rolnikProducts);
          } catch (productErr) {
            console.error('Error fetching rolnik products:', productErr);
            setProducts([]);
          }
        } else if (userProfile.role === 'admin') {
          try {
            // Fetch all rolniks for admin
            const allRolniks = await getAllRolniks();
            setNearbyRolniks(allRolniks);
          } catch (adminErr) {
            console.error('Error fetching rolniks for admin:', adminErr);
            setNearbyRolniks([]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load some dashboard data. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome, {userProfile?.firstName}!</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {userProfile?.role === 'klient' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingCart className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{orders.length}</p>
                    <p className="text-gray-500">Total Orders</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/orders">View All Orders</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Nearby Farmers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{nearbyRolniks.length}</p>
                    <p className="text-gray-500">Farmers Near You</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/browse">Browse Products</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        
        {userProfile?.role === 'rolnik' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{products.length}</p>
                    <p className="text-gray-500">Listed Products</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/products/manage">Manage Products</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Orders Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingCart className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{orders.length}</p>
                    <p className="text-gray-500">Total Orders</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/orders">View All Orders</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        
        {userProfile?.role === 'admin' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Registered Farmers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{nearbyRolniks.length}</p>
                    <p className="text-gray-500">Active Farmers</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/admin/users">Manage Users</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Activity className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">Dashboard</p>
                    <p className="text-gray-500">View All Stats</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/admin/stats">View Statistics</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Recent Activity Section */}
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.slice(0, 3).map(order => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-12 w-12 overflow-hidden rounded-md mr-4 bg-gray-100 flex-shrink-0">
                      {(order.items?.[0]?.productImage || order.productImage) ? (
                        <img
                          src={order.items?.[0]?.productImage || order.productImage}
                          alt={order.items?.[0]?.productName || order.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {order.items?.[0]?.productName || order.productName}
                        {order.items && order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.items?.[0]?.quantity || order.quantity} {order.items?.[0]?.unit || order.unit} - 
                        ${order.totalPrice.toFixed(2)}
                      </p>
                      <div className="flex items-center mt-1">
                        <OrderStatus status={order.status} size="badge" />
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="text-center mt-4">
            <Button variant="outline" asChild>
              <Link to="/orders">View All Activity</Link>
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">No recent activity found.</p>
            {userProfile?.role === 'klient' && (
              <Button asChild>
                <Link to="/browse">Browse Products</Link>
              </Button>
            )}
            {userProfile?.role === 'rolnik' && (
              <Button asChild>
                <Link to="/products/add">Add Your First Product</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;