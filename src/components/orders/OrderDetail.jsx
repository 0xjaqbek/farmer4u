import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrderById, updateOrderStatus, ORDER_STATUSES } from '../../firebase/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OrderStatus from '@/components/orders/OrderStatus';
import OrderTimeline from '@/components/orders/OrderTimeline';
import OrderQR from '@/components/orders/OrderQR';
import { QrCode, ArrowLeft, Truck, Package, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const isRolnik = userProfile?.role === 'rolnik';
  const isAdmin = userProfile?.role === 'admin';
  const canChangeStatus = isRolnik || isAdmin;
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching order with ID:', id);
        const orderData = await getOrderById(id);
        console.log('Order data received:', orderData);
        
        if (!orderData) {
          throw new Error('Order not found');
        }
        
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrder();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [id]);

  const handlePrintQR = () => {
    setIsQrModalOpen(true);
  };
  
  const handleUpdateStatus = async (newStatus, note = '') => {
    console.log('handleUpdateStatus called with:', { newStatus, note, orderId: id });
    
    if (!canChangeStatus) {
      const errorMsg = 'You do not have permission to update this order status';
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    if (!order) {
      const errorMsg = 'Order data not available';
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    // Only allow the farmer who owns the order (or admin) to update status
    if (!isAdmin && order.rolnikId !== userProfile?.uid) {
      const errorMsg = 'You can only update orders for your own products';
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    // Check if this is a valid status transition
    const currentStatus = order.status;
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['in_transit', 'delivered', 'completed', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };
    
    const allowedStatuses = statusFlow[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      const errorMsg = `Cannot change status from ${currentStatus} to ${newStatus}`;
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    try {
      setStatusUpdating(true);
      setError('');
      setSuccess('');
      
      console.log('Calling updateOrderStatus...');
      await updateOrderStatus(id, newStatus, note || statusNote);
      console.log('Status update successful');
      
      // Refresh order data
      console.log('Refreshing order data...');
      const updatedOrder = await getOrderById(id);
      console.log('Updated order data:', updatedOrder);
      setOrder(updatedOrder);
      
      setSuccess(`Order status updated to ${ORDER_STATUSES[newStatus].label}`);
      setStatusNote('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMsg = `Failed to update order status: ${error.message}`;
      setError(errorMsg);
      return Promise.reject(error);
    } finally {
      setStatusUpdating(false);
    }
  };
  
  const getNextAvailableStatuses = () => {
    if (!order) return [];
    
    const currentStatus = order.status;
    
    // Define status flow
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['in_transit', 'delivered', 'completed', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };
    
    return statusFlow[currentStatus] || [];
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !order) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Button asChild>
          <Link to="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/orders')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-500">Order #{order.trackingId || order.id}</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <OrderStatus 
                  status={order.status} 
                  showDescription={true} 
                  size="large"
                  clickable={true}
                  canChangeStatus={canChangeStatus && (isAdmin || order.rolnikId === userProfile?.uid)}
                  onStatusChange={handleUpdateStatus}
                  statusHistory={order.statusHistory}
                  orderId={order.id}
                  userRole={userProfile?.role}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Product details */}
                <div>
                  <h3 className="font-medium mb-3">Items</h3>
                  {Array.isArray(order.items) ? (
                    <ul className="divide-y">
                      {order.items.map((item, index) => (
                        <li key={index} className="py-3 first:pt-0 last:pb-0 flex">
                          <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-100 mr-4">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-gray-500">
                              {item.quantity} {item.unit} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                            {item.productId && (
                              <Button variant="ghost" size="sm" asChild className="text-xs">
                                <Link to={`/products/${item.productId}`}>
                                  View Product
                                </Link>
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Fallback for old order structure
                    <div className="flex items-start">
                      <div className="h-20 w-20 overflow-hidden rounded-md mr-4 bg-gray-100">
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{order.productName}</h4>
                        <div className="mt-1">
                          <p>
                            <span className="text-sm text-gray-500">Quantity:</span> {order.quantity} {order.unit}
                          </p>
                          <p>
                            <span className="text-sm text-gray-500">Price:</span> ${order.price?.toFixed(2)} / {order.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Order total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${order.subtotal?.toFixed(2) || order.totalPrice?.toFixed(2)}</span>
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span>${order.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Customer/Farmer info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  {isRolnik ? (
                    <div>
                      <h3 className="font-medium mb-2">Customer Information</h3>
                      <p>{order.clientName}</p>
                      {order.customerInfo && (
                        <>
                          <p className="text-sm text-gray-600">
                            {order.customerInfo.address}, {order.customerInfo.city}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customerInfo.postalCode}
                          </p>
                          {order.customerInfo.phone && (
                            <p className="text-sm text-gray-600">
                              {order.customerInfo.phone}
                            </p>
                          )}
                          {order.customerInfo.email && (
                            <p className="text-sm text-gray-600">
                              {order.customerInfo.email}
                            </p>
                          )}
                        </>
                      )}
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/chat/${order.clientId}`}>
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Message Customer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium mb-2">Seller Information</h3>
                      <p>{order.rolnikName}</p>
                      <p className="text-sm text-gray-600">
                        Location: {order.rolnikPostalCode || 'Not available'}
                      </p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/chat/${order.rolnikId}`}>
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Message Farmer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium mb-2">Payment & Delivery</h3>
                    <p className="mb-1">
                      <span className="text-sm text-gray-600">Payment Method:</span>{' '}
                      {order.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}
                    </p>
                    <p>
                      <span className="text-sm text-gray-600">Delivery Method:</span>{' '}
                      {order.deliveryMethod || 'Standard Delivery'}
                    </p>
                  </div>
                </div>
                
                {/* Order notes */}
                {order.notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Order Notes</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{order.notes}</p>
                  </div>
                )}
                
                {/* Order tracking */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Order Timeline</h3>
                  <OrderTimeline statusHistory={order.statusHistory || []} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          {/* QR Tracking Code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Customers can track this order using the tracking ID or by scanning the QR code.
              </p>
              
              <div className="mb-4">
                <p className="font-semibold">Tracking ID:</p>
                <div className="flex items-center mt-1">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm flex-1 text-center">
                    {order.trackingId || id.substring(0, 8)}
                  </code>
                </div>
              </div>
              
              <div className="text-center">
                <Button variant="outline" className="w-full mb-2" asChild>
                  <Link to={`/track/product/${order.trackingId || order.id}`} target="_blank">
                    <Truck className="mr-2 h-4 w-4" />
                    Track Order
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={handlePrintQR}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Print QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Status Management for Farmers */}
          {canChangeStatus && (order.rolnikId === userProfile?.uid || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Status Update</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">
                    Current Status: <OrderStatus status={order.status} size="badge" clickable={false} />
                  </p>
                  
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Note (Optional)
                        </label>
                        <Textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Add details about this status update..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        {getNextAvailableStatuses().map(status => {
                          const statusInfo = ORDER_STATUSES[status];
                          let ButtonIcon;
                          
                          switch (status) {
                            case 'confirmed':
                              ButtonIcon = CheckCircle;
                              break;
                            case 'preparing':
                              ButtonIcon = Package;
                              break;
                            case 'ready':
                            case 'completed':
                              ButtonIcon = CheckCircle;
                              break;
                            case 'in_transit':
                            case 'delivered':
                              ButtonIcon = Truck;
                              break;
                            case 'cancelled':
                              ButtonIcon = XCircle;
                              break;
                            default:
                              ButtonIcon = null;
                          }
                          
                          return (
                            <Button
                              key={status}
                              className="w-full"
                              variant={status === 'cancelled' ? 'destructive' : 'default'}
                              disabled={statusUpdating}
                              onClick={() => handleUpdateStatus(status)}
                            >
                              {ButtonIcon && <ButtonIcon className="mr-2 h-4 w-4" />}
                              Mark as {statusInfo.label}
                            </Button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <Alert className={order.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                      <AlertDescription className={order.status === 'completed' ? 'text-green-700' : 'text-red-700'}>
                        This order is {order.status}. No further status updates are possible.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* QR Code Modal */}
      <OrderQR 
        order={order} 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
      />
    </div>
  );
};

export default OrderDetail;