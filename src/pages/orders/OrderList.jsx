import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByClient, getOrdersByRolnik } from '../../firebase/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Loader2 } from 'lucide-react';
import OrderStatus from '@/components/orders/OrderStatus';

const OrderList = () => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        setError('');
        
        let fetchedOrders = [];
        
        if (userProfile.role === 'klient') {
          fetchedOrders = await getOrdersByClient(userProfile.uid);
        } else if (userProfile.role === 'rolnik') {
          fetchedOrders = await getOrdersByRolnik(userProfile.uid);
        } else if (userProfile.role === 'admin') {
          // Admin could fetch all orders, but not implemented yet
          fetchedOrders = [];
        }
        
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try refreshing the page.');
        // Set empty array to prevent UI errors
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [userProfile]);
  
  // Filter orders by status for tabs
  const getFilteredOrders = (status) => {
    if (status === 'all') return orders;
    if (status === 'active') {
      return orders.filter(order => 
        !['completed', 'cancelled'].includes(order.status)
      );
    }
    if (status === 'completed') {
      return orders.filter(order => 
        ['completed', 'delivered'].includes(order.status)
      );
    }
    if (status === 'cancelled') {
      return orders.filter(order => order.status === 'cancelled');
    }
    return orders;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({getFilteredOrders('active').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getFilteredOrders('completed').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({getFilteredOrders('cancelled').length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          <OrdersTable orders={getFilteredOrders('all')} userRole={userProfile?.role} />
        </TabsContent>
        
        <TabsContent value="active" className="pt-4">
          <OrdersTable orders={getFilteredOrders('active')} userRole={userProfile?.role} />
        </TabsContent>
        
        <TabsContent value="completed" className="pt-4">
          <OrdersTable orders={getFilteredOrders('completed')} userRole={userProfile?.role} />
        </TabsContent>
        
        <TabsContent value="cancelled" className="pt-4">
          <OrdersTable orders={getFilteredOrders('cancelled')} userRole={userProfile?.role} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Extracted order table component for reuse across tabs
const OrdersTable = ({ orders, userRole }) => {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">No orders found in this category.</p>
          {userRole === 'klient' && (
            <Button asChild>
              <Link to="/browse">Browse Products</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-16 w-16 overflow-hidden rounded-md mr-4 bg-gray-100 flex-shrink-0">
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
                  <div className="flex items-center">
                    <h3 className="font-medium">
                      Order #{order.trackingId || order.id.substring(0, 8)}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mt-1">
                    <span className="font-medium">
                      {order.items?.[0]?.productName || order.productName}
                    </span>
                    {order.items && order.items.length > 1 && 
                      ` +${order.items.length - 1} more items`
                    }
                  </p>
                  
                  <div className="flex items-center mt-1">
                    <OrderStatus status={order.status} size="badge" />
                    <span className="text-sm font-medium ml-4">
                      ${order.totalPrice.toFixed(2)}
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
    </div>
  );
};

export default OrderList;