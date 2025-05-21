import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const OrderList = () => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Here we'll fetch orders for the user
    // For now, just set dummy data
    setOrders([
      {
        id: '1',
        productName: 'Fresh Apples',
        quantity: 3,
        unit: 'kg',
        totalPrice: 8.97,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        productName: 'Organic Carrots',
        quantity: 2,
        unit: 'bunch',
        totalPrice: 3.98,
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ]);
    setLoading(false);
  }, [userProfile]);
  
  if (loading) {
    return <div>Loading orders...</div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{order.productName}</h3>
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
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">You don't have any orders yet.</p>
            <Button asChild>
              <Link to="/browse">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderList;