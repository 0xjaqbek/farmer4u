import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProductById } from '../../firebase/products.jsx';
import { getUserById } from '../../firebase/users.jsx';
import { findOrderByTrackingCode } from '../../firebase/orders.jsx'; // Import the new enhanced function
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OrderStatus from '@/components/orders/OrderStatus';
import OrderTimeline from '@/components/orders/OrderTimeline';
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Info, 
  Leaf,
  Badge,
  CheckCircle,
  Package,
  Truck
} from 'lucide-react';

const ProductTracker = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [order, setOrder] = useState(null);
  const [trackingId, setTrackingId] = useState(searchParams.get('tracking') || id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scanTime = new Date();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Tracking ID to search:', trackingId);
        
        let orderData = null;
        
        // Use the enhanced order lookup function
        try {
          console.log('Searching for order with enhanced lookup...');
          orderData = await findOrderByTrackingCode(trackingId);
          console.log('Found order:', orderData);
        } catch (orderError) {
          console.log('No order found with tracking code:', trackingId);
          console.log('Error:', orderError.message);
        }
        
        if (orderData) {
          console.log('Order found:', orderData);
          setOrder(orderData);
          
          // Get product and farmer details from the order
          let productData = null;
          
          if (orderData.items && orderData.items.length > 0) {
            // Get first product from items array
            if (orderData.items[0].productId) {
              try {
                productData = await getProductById(orderData.items[0].productId);
              } catch (prodError) {
                console.log('Could not fetch product details:', prodError);
              }
            }
          } else if (orderData.productId) {
            // Get product from direct reference (older order structure)
            try {
              productData = await getProductById(orderData.productId);
            } catch (prodError) {
              console.log('Could not fetch product details:', prodError);
            }
          }
          
          if (productData) {
            setProduct(productData);
          }
          
          // Get farmer details
          if (orderData.rolnikId) {
            try {
              const farmerData = await getUserById(orderData.rolnikId);
              setFarmer(farmerData);
            } catch (farmerError) {
              console.log('Could not fetch farmer details:', farmerError);
            }
          }
        } else {
          // If no order found, try to get product directly (for product QR codes)
          try {
            console.log('No order found, trying to get product directly...');
            const productData = await getProductById(trackingId);
            setProduct(productData);
            
            if (productData.rolnikId) {
              const farmerData = await getUserById(productData.rolnikId);
              setFarmer(farmerData);
            }
          } catch (productError) {
            console.error('No product found either:', productError);
            setError('Unable to find order or product. Please verify your tracking code.');
          }
        }
      } catch (err) {
        console.error('Error in data fetching:', err);
        setError('Failed to load tracking information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (trackingId) {
      fetchData();
    } else {
      setLoading(false);
      setError('No tracking ID provided');
    }
  }, [trackingId]);
  
  const handleTrackingSearch = (e) => {
    e.preventDefault();
    
    if (trackingId.trim()) {
      navigate(`/track/product/${trackingId}`);
      window.location.reload(); // Simple reload to refresh with new tracking ID
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tracking information...</p>
            <p className="mt-2 text-sm text-gray-500">Searching for: {trackingId}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Order Tracking</h1>
      </div>
      
      {/* Tracking Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleTrackingSearch} className="flex gap-2">
            <Input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking code..."
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Track
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Current search: {trackingId}
          </p>
        </CardContent>
      </Card>
      
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
            <br />
            <strong>Debug info:</strong> Searched for tracking ID "{trackingId}"
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Order Status */}
          {order && (
            <Card className="mb-6 overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Order #{order.trackingId || order.id.substring(0, 8)}
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <OrderStatus status={order.status} size="large" />
                </div>
              </div>
              
              <CardContent className="p-6">
                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                  {Array.isArray(order.items) ? (
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-100 mr-3">
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
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} {item.unit} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-100 mr-3">
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{order.productName}</p>
                        <p className="text-sm text-gray-500">
                          {order.quantity} {order.unit} × ${order.price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Order Total */}
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Shipping Status Timeline */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Order Status Timeline</h3>
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <OrderTimeline statusHistory={order.statusHistory} />
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-700">
                            Current Status: {order.status}
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Detailed tracking timeline will appear here as your order progresses.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Delivery Info */}
                {order.customerInfo && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Delivery Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Shipping Address</p>
                          <p className="text-sm text-gray-600">
                            {order.customerInfo.address && `${order.customerInfo.address}, `}
                            {order.customerInfo.city && `${order.customerInfo.city}, `}
                            {order.customerInfo.postalCode}
                          </p>
                        </div>
                      </div>
                      {order.status === 'in_transit' && (
                        <div className="flex items-start mt-3">
                          <Truck className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-700">In Transit</p>
                            <p className="text-sm text-blue-600">
                              Your order is on the way to your delivery address
                            </p>
                          </div>
                        </div>
                      )}
                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <div className="flex items-start mt-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-700">Delivered</p>
                            <p className="text-sm text-green-600">
                              Your order has been delivered successfully
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Product Information */}
          {product && (
            <Card className={order ? 'mb-6' : 'mb-6 overflow-hidden'}>
              {!order && (
                <div className="bg-green-600 text-white p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    <h2 className="text-xl font-bold">Verified Farm Direct Product</h2>
                  </div>
                  <p className="text-sm opacity-90 mt-1">
                    This product comes directly from a verified local farmer
                  </p>
                </div>
              )}
              
              <CardHeader className={order ? '' : 'pt-2'}>
                <CardTitle>Product Information</CardTitle>
                {!order && (
                  <CardDescription>
                    Authentic product verification
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-start mb-4">
                  <div className="h-20 w-20 overflow-hidden rounded-md border bg-gray-100 mr-4">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">${product.price?.toFixed(2)} / {product.unit}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      {product.isOrganic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Leaf className="h-3 w-3 mr-1" />
                          Organic
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-start">
                    <Badge className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Source Information</p>
                      <p className="text-sm text-gray-600 mt-1">
                        This product comes from {farmer?.firstName} {farmer?.lastName} ({product.rolnikName})
                      </p>
                      <p className="text-sm text-gray-600">
                        Located in {product.postalCode || farmer?.postalCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Verification Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Verification Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Scan Date</p>
                    <p className="text-sm text-gray-600">
                      {scanTime.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Scan Time</p>
                    <p className="text-sm text-gray-600">
                      {scanTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Tracking ID</p>
                    <p className="text-sm text-gray-600">
                      {order?.trackingId || trackingId}
                    </p>
                    {order && (
                      <p className="text-xs text-gray-500 mt-1">
                        Database ID: {order.id}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">
                        {order ? 'Authentic Order Verified' : 'Authentic Product Verified'}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {order 
                          ? `This tracking code confirms this is an authentic order from ${order.rolnikName}.`
                          : `This QR code confirms this is an authentic Farm Direct product from ${product?.rolnikName || 'a verified farmer'}.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <a href="/" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
            Return to Previous Page
          </a>
        </Button>
      </div>
    </div>
  );
};

export default ProductTracker;