import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../../firebase/products.jsx';
import { getUserById } from '../../firebase/users.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Scan, 
  MapPin, 
  Calendar, 
  Clock, 
  Info, 
  Leaf,
  Badge,
  CheckCircle
} from 'lucide-react';

const ProductTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scanTime = new Date(); // Now it's a constant, not a state

  useEffect(() => {
    const fetchProductInfo = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        console.log('Fetched product:', productData);
        setProduct(productData);
        
        if (productData.rolnikId) {
          const farmerData = await getUserById(productData.rolnikId);
          console.log('Fetched farmer:', farmerData);
          setFarmer(farmerData);
        }
      } catch (err) {
        console.error('Error fetching product info:', err);
        setError('Failed to load product information. The QR code might be invalid or the product may have been removed.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductInfo();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <h1 className="text-2xl font-bold">Product Verification</h1>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Scan className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid QR Code</h2>
              <p className="text-gray-600 mb-6">
                This product could not be found or has been removed from our system.
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
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
        <h1 className="text-2xl font-bold">Product Verification</h1>
      </div>
      
      <div className="mb-6">
        <Card className="overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-bold">Verified Farm Direct Product</h2>
            </div>
            <p className="text-sm opacity-90 mt-1">
              This product comes directly from a verified local farmer
            </p>
          </div>
          
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-auto rounded-md"
                  />
                ) : (
                  <div className="bg-gray-100 w-full h-40 rounded-md flex items-center justify-center">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>
              
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {product.category}
                  </span>
                  
                  {product.isOrganic && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                      <Leaf className="h-3 w-3 mr-1" /> Organic
                    </span>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4">{product.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-semibold text-lg">${product.price?.toFixed(2)} / {product.unit}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Quantity Available</p>
                    <p className="font-semibold">
                      {product.stockQuantity > 0 
                        ? `${product.stockQuantity} ${product.unit}` 
                        : 'Out of stock'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="mr-2 h-5 w-5" /> 
              Farmer Information
            </CardTitle>
            <CardDescription>
              This product comes directly from:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {farmer?.firstName} {farmer?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{product.rolnikName}</p>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600">
                    {farmer?.postalCode || product.postalCode || 'Location not available'}
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-md p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700">Sourcing Information</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This product is part of our Farm Direct initiative, connecting you directly with 
                      local farmers to ensure freshness and support local agriculture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="mr-2 h-5 w-5" />
              Verification Details
            </CardTitle>
            <CardDescription>
              QR code scan information
            </CardDescription>
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
                  <p className="font-medium">Product ID</p>
                  <p className="text-sm text-gray-600">
                    {product.id}
                  </p>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-2">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Authentic Product Verified</p>
                    <p className="text-sm text-green-700 mt-1">
                      This QR code confirms this is an authentic Farm Direct product from {product.rolnikName}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default ProductTracker;
