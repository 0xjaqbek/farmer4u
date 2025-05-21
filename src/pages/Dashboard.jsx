// src/pages/Dashboard.jsx - Dashboard page
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrdersByClient, getOrdersByRolnik } from '../firebase/orders';
import { getProductsByRolnik } from '../firebase/products';
import { getAllRolniks, findNearbyRolniks } from '../firebase/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, Users, Activity } from 'lucide-react';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [nearbyRolniks, setNearbyRolniks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userProfile) {
          // Fetch data based on user role
          if (userProfile.role === 'klient') {
            // Fetch orders for client
            const clientOrders = await getOrdersByClient(userProfile.uid);
            setOrders(clientOrders);
            
            // Fetch nearby rolniks
            const nearby = await findNearbyRolniks(userProfile.postalCode);
            setNearbyRolniks(nearby);
          } else if (userProfile.role === 'rolnik') {
            // Fetch orders for rolnik
            const rolnikOrders = await getOrdersByRolnik(userProfile.uid);
            setOrders(rolnikOrders);
            
            // Fetch products for rolnik
            const rolnikProducts = await getProductsByRolnik(userProfile.uid);
            setProducts(rolnikProducts);
          } else if (userProfile.role === 'admin') {
            // Fetch all rolniks for admin
            const allRolniks = await getAllRolniks();
            setNearbyRolniks(allRolniks);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome, {userProfile?.firstName}!</h1>
      
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
                <div className="flex items-center">
                  <div className="h-12 w-12 overflow-hidden rounded-md mr-4">
                    {order.productImage && (
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{order.productName}</h3>
                    <p className="text-sm text-gray-600">
                      {order.quantity} {order.unit} - ${order.totalPrice.toFixed(2)}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>View</Link>
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