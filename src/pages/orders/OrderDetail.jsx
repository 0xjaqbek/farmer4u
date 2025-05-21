import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OrderDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Here we'll fetch the order details
    // For now, just set dummy data
    setOrder({
      id,
      productName: 'Fresh Apples',
      productImage: 'https://via.placeholder.com/100',
      quantity: 3,
      unit: 'kg',
      price: 2.99,
      totalPrice: 8.97,
      status: 'pending',
      notes: 'Please pick the ripest ones.',
      clientName: 'John Doe',
      rolnikName: 'Farm Fresh',
      createdAt: new Date().toISOString()
    });
    setLoading(false);
  }, [id]);
  
  if (loading) {
    return <div>Loading order details...</div>;
  }
  
  if (!order) {
    return <div>Order not found.</div>;
  }
  
  return (
    <div>
      <div className="mb-4">
        <Link 
          to="/orders" 
          className="text-green-600 hover:underline flex items-center"
        >
          &larr; Back to Orders
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order #{order.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-md">
              <img
                src={order.productImage}
                alt={order.productName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{order.productName}</h2>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="font-medium">Quantity:</span> {order.quantity} {order.unit}
                </p>
                <p>
                  <span className="font-medium">Price:</span> ${order.price.toFixed(2)} / {order.unit}
                </p>
                <p>
                  <span className="font-medium">Total:</span> ${order.totalPrice.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {" "}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          {order.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Order Notes:</p>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Customer:</p>
              <p>{order.clientName}</p>
            </div>
            <div>
              <p className="font-medium">Farmer:</p>
              <p>{order.rolnikName}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {userProfile?.role === 'rolnik' && (
        <Card>
          <CardHeader>
            <CardTitle>Update Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button variant={order.status === 'pending' ? 'default' : 'outline'}>
                Pending
              </Button>
              <Button variant={order.status === 'processing' ? 'default' : 'outline'}>
                Processing
              </Button>
              <Button variant={order.status === 'completed' ? 'default' : 'outline'}>
                Completed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetail;